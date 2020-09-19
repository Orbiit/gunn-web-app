// This is only going to work for the 2020-2021 school year, probably

import fetch from 'node-fetch'
import cheerio from 'cheerio'
import fs from 'fs/promises'
import { fileURLToPath } from 'url'

const spreadsheetUrl =
  'https://docs.google.com/spreadsheets/u/1/d/1HUaNWegOIk972lGweoSuNcXtfX7XuGBTQU-gcTsvD9s/pub'

async function main () {
  const html = await fetch(spreadsheetUrl).then(r => r.text())
  const $ = cheerio.load(html, { xmlMode: false })

  const clubs = {}

  $('table tbody tr:not(:first-child)').each(function () {
    // The first <td> is invisible for some reason
    const [
      ,
      ,
      name,
      tierText,
      desc,
      day,
      time,
      link,
      president,
      teacher,
      email,
      coteacher,
      coemail
    ] = $(this)
      .children()
      .map(function () {
        return $(this)
          .text()
          .trim()
      })
      .get()
      // If it's empty, return `undefined` so that it's omitted from the JSON
      .map(str => str || undefined)

    const tierMatch = /TIER ([123]) CLUB/.exec(tierText)
    if (!tierMatch) {
      console.warn('Could not determine tier from', tierText, name)
    }
    const tier = tierMatch ? +tierMatch[1] : undefined

    if (name) {
      clubs[name] = {
        desc,
        day,
        time,
        link,
        tier,
        president,
        coteacher,
        coemail,
        teacher,
        email
      }
    }
  })

  const output = fileURLToPath(new URL('../json/clubs.json', import.meta.url))
  await fs.writeFile(output, JSON.stringify(clubs, null, '\t'))
}
main()
