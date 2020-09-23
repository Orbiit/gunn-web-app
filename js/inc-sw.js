import { readFile, writeFile } from 'fs/promises'
import { fileURLToPath } from 'url'

async function main () {
  const swPath = fileURLToPath(new URL('../sw.js', import.meta.url))
  const sw = await readFile(swPath, 'utf8')
  await writeFile(swPath, sw.replace(/ugwa-sw-\d+/, 'ugwa-sw-' + Date.now()))
}
main()
