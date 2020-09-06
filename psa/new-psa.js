import { promises as fs } from 'fs'
import { fileURLToPath } from 'url'

function relPath (path) {
  return fileURLToPath(new URL(path, import.meta.url))
}

async function main () {
  const today = new Date()
  const date = [today.getFullYear(), today.getMonth() + 1, today.getDate()]
    .map(n => n.toString().padStart(2, '0'))
    .join('-')

  await fs.writeFile(relPath(`./${date}.html`), '<p>Ergonomics</p>\n')

  const psasLines = (await fs.readFile(relPath('./psas.json'), 'utf-8')).split(
    /\r?\n/
  )
  psasLines.splice(psasLines.indexOf(']'), 0, `  ,"${date}"`)
  await fs.writeFile(relPath(`./psas.json`), psasLines.join('\n'))

  console.log(date + '.html')
}
main()
