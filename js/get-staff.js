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
  return `https://gunn.pausd.org/fs/elements/11437?const_page=${page}`
}

const icSectionData =
  'https://sheeptester.github.io/hello-world/sections-simplified.json'

// https://github.com/SheepTester/hello-world/blob/master/teacher-periods.js
function getTeacherSchedules (sections, teacherData) {
  const teachers = {}

  function noteTeacher (teacher, period, course, semester) {
    // Not all teachers (Ames, Matchett) have an email on IC
    const teacherId = `${teacher.lastName}/${teacher.firstName}`
    if (!teachers[teacherId]) {
      teachers[teacherId] = {
        ...teacher,
        semester1: {},
        semester2: {}
      }
    }
    if (semester & 0b01) {
      teachers[teacherId].semester1[period] = course
    }
    if (semester & 0b10) {
      teachers[teacherId].semester2[period] = course
    }
  }

  for (const {
    teachers: teacherDisplay,
    periods: [periodStr],
    name: course,
    semester
  } of sections) {
    const [period] = periodStr.split(' / ')
    const { teacher, coteacher } = teacherData[teacherDisplay] || {}
    const sem =
      (semester.includes('S1') ? 0b01 : 0) |
      (semester.includes('S2') ? 0b10 : 0)
    if (teacher) noteTeacher(teacher, period, course, sem)
    if (coteacher) noteTeacher(coteacher, period, course, sem)
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

  let page = 1
  while (true) {
    const html = await fetch(pageUrl(page)).then(r => r.text())
    const $ = cheerio.load(html, { xmlMode: false })
    if (!$('.fsPaginationLabel').length) break
    $('.fsConstituentItem').each(function () {
      const teacher = $(this)
      const name = teacher
        .find('.fsConstituentProfileLink')
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
        const [[, { semester1, semester2 }]] = matches
        const periodNames = [
          ...new Set([...Object.keys(semester1), ...Object.keys(semester2)])
        ]
        periods = Object.fromEntries(
          periodNames.map(period => [
            period,
            `${semester1[period] || ''}|${semester2[period] || ''}`
          ])
        )
      }
      staff[name] = {
        jobTitle: teacher
          .find('.fsTitles')
          .text()
          .trim(),
        email: getEmail(teacher.find('.fsEmail > div > script').html()),
        periods
      }
    })
    console.log(`Page ${page} done.`)
    page++
  }

  const output = fileURLToPath(new URL('../json/staff.json', import.meta.url))
  await fs.writeFile(output, JSON.stringify(staff, null, '\t'))
}

main()
