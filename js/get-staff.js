import fetch from 'node-fetch'
import cheerio from 'cheerio'
import fs from 'fs/promises'
import { fileURLToPath } from 'url'

const getEmailRegex = /insertEmail\("[^"]*", "([^"]*)", "([^"]*)"/
function getEmail (script) {
  const match = getEmailRegex.exec(script)
  if (match) {
    const [, domain, username] = match
    return [...domain, '@', ...username].reverse().join('')
  } else {
    return null
  }
}

function pageUrl (page) {
  return `https://gunn.pausd.org/fs/elements/11437?const_page=${page}&const_search_group_ids=&const_search_role_ids=`
}

const icSectionData =
  'https://sheeptester.github.io/hello-world/sections-simplified.json'

// https://github.com/SheepTester/hello-world/blob/master/teacher-periods.js
function getTeacherSchedules (sections, teacherData) {
  const teachers = {}

  function noteTeacher (teacher, period, room, course, semester) {
    // Not all teachers (Ames, Matchett) have an email on IC
    const teacherId = `${teacher.lastName}/${teacher.firstName}`
    if (!teachers[teacherId]) {
      teachers[teacherId] = {
        ...teacher,
        periods: {}
      }
    }
    const { periods } = teachers[teacherId]
    if (periods[period]) {
      if (semester === periods[period].semester) {
        course = periods[period].semester1 + ', ' + course
      }
    }
    if (periods[period]) {
      if (periods[period].yearlong && semester !== 'S1S2') {
        periods[period].yearlong = false
      }
    } else {
      periods[period] = { semester1: [], semester2: [], yearlong: null }
    }
    if (semester === 'S1S2') {
      periods[period].semester1.push([course, room])
      periods[period].semester2.push([course, room])
      if (periods[period].yearlong === null) {
        periods[period].yearlong = true
      }
    } else if (semester === 'S1') {
      periods[period].semester1.push([course, room])
      periods[period].yearlong = false
    } else if (semester === 'S2') {
      periods[period].semester2.push([course, room])
      periods[period].yearlong = false
    } else {
      throw new Error(`\`semester\` ${semester} is not one of: S1S2, S1, S2.`)
    }
  }

  for (const {
    teachers: teacherDisplay,
    room,
    periods: periodStr,
    name: course,
    semester
  } of sections) {
    const [period] = periodStr.split(' / ')
    if (!period) {
      continue
    }
    const { teacher, coteacher } = teacherData[teacherDisplay] || {}
    if (teacher) noteTeacher(teacher, period, room, course, semester)
    if (coteacher) noteTeacher(coteacher, period, room, course, semester)
  }

  return teachers
}

async function main () {
  const staff = {}

  const [{ teachers }, ...sections] = await fetch(icSectionData).then(r =>
    r.json()
  )
  const schedules = Object.entries(getTeacherSchedules(sections, teachers)).map(
    ([name, value]) => [name.split('/'), value]
  )

  // Dumb hack so that some things aren't prettified
  const substitutions = new Map()
  function substitute (value) {
    const id = 'eeee_' + Math.random().toString(36).slice(2)
    substitutions.set(id, value)
    return id
  }

  let page = 1
  while (true) {
    const html = await fetch(pageUrl(page)).then(r => r.text())
    const $ = cheerio.load(html, { xmlMode: false })
    if (!$('.fsPaginationLabel').length) break
    $('.fsConstituentItem').each(function () {
      const teacher = $(this)
      const name = teacher
        .find('.fsFullName')
        .text()
        .trim()
      let matches = schedules.filter(([[last]]) => name.includes(last))
      let periods
      if (matches.length === 0) {
        console.warn(`[!] No schedule for ${name}`)
      } else if (matches.length > 1) {
        matches = matches.filter(([[, first]]) => name.includes(first))
        if (matches.length > 1) {
          console.warn(`[!] More than one schedule found for ${name}`, matches)
        }
      }
      if (matches.length === 1) {
        const [[, teacher]] = matches
        periods = Object.fromEntries(
          Object.entries(teacher.periods).map(
            ([period, { semester1, semester2, yearlong }]) => {
              const sem1Courses = semester1.sort(([a], [b]) => a.localeCompare(b))
              const sem2Courses = semester2.sort(([a], [b]) => a.localeCompare(b))
              return [
                period,
                substitute(yearlong ? [sem1Courses, null] : [sem1Courses, sem2Courses])
              ]
            }
          )
        )
      }
      staff[name] = {
        jobTitle: teacher
          .find('.fsTitles')
          .text()
          .trim(),
        department:
          teacher
            .find('.fsDepartments')
            .text()
            .trim() || undefined,
        phone:
          teacher
            .find('.fsPhones > a')
            .text()
            .trim() || undefined,
        email: getEmail(teacher.find('.fsEmail > div > script').html()),
        periods
      }
    })
    console.log(`Page ${page} done.`)
    page++
  }

  const output = fileURLToPath(new URL('../json/staff.json', import.meta.url))
  let json = JSON.stringify(staff, null, '\t')
  for (const [id, value] of substitutions) {
    json = json.replace(`"${id}"`, JSON.stringify(value))
  }
  await fs.writeFile(output, json)
}

main()
