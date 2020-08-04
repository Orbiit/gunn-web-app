import fs from 'fs/promises'
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function main () {
  const example = JSON.parse(await fs.readFile(resolve(__dirname, './example.json'), 'utf8'))
  const files = await fs.readdir(__dirname)
  for (const file of files) {
    if (file.endsWith('.js') && !file.endsWith('check-l10n.js')) {
      const { default: language } = await import(`./${file}`)
      console.log(new Set(Object.keys(language)));
    }
  }
}

main()
