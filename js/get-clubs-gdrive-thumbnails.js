// node js/get-clubs-gdrive-thumbnails.js please run main

import { readFile, writeFile } from 'fs/promises'
import { fileURLToPath } from 'url'
import fetch from 'node-fetch'

/**
 * {@link https://developers.google.com/drive/api/v3/enable-drive-api}
 * 1. Google API Console
 * 2. Select project
 * 3. "Enable APIs and services"
 * 4. Search for and select "Google Drive API"
 * 5. Click "Enable"
 */
import { apiKey, getGDriveFileId } from './common.js'

const apiBase = 'https://www.googleapis.com/drive/v3/files/'

class GDriveToImgur {
  clientId = this.getClientId()

  async getClientId () {
    const imgurApiPath = fileURLToPath(
      new URL('../imgur-api.json', import.meta.url)
    )
    const { clientId } = JSON.parse(await readFile(imgurApiPath, 'utf8'))
    return clientId
  }

  async uploadImage (imageUrl, { name = '' } = {}) {
    const form = new URLSearchParams()
    form.append('image', imageUrl)
    form.append('type', 'url')
    if (name) form.append('name', name)
    const { data: { link } } = await fetch('https://api.imgur.com/3/upload', {
      method: 'POST',
      headers: {
        Authorization: `Client-ID ${await this.clientId}`
      },
      body: form
    })
      .then(r => r.ok ? r.json() : r.text().then(data => Promise.reject(new Error(data))))
    return link
  }

  async applyThumbnail (club) {
    if (club.video && !club.thumbnail) {
      const fileId = getGDriveFileId(club.video)
      if (fileId) {
        const params = new URLSearchParams()
        params.set('fields', 'thumbnailLink')
        params.set('key', apiKey)
        const { thumbnailLink } = await fetch(apiBase + fileId + '/?' + params)
          .then(r => r.ok ? r.json() : {})
        if (thumbnailLink) {
          console.log('[:D] public!', thumbnailLink)
          club.thumbnail = await this.uploadImage(thumbnailLink)
          console.log('[^^] imgur', club.thumbnail)
        } else {
          console.log('[:(] not public', club.video)
        }
      }
    }
  }
}

const jsonPath = fileURLToPath(
  new URL('../json/clubs.json', import.meta.url)
)

async function main () {
  const gDriveToImgur = new GDriveToImgur()

  const clubs = JSON.parse(await readFile(jsonPath, 'utf8'))
  for (const club of Object.values(clubs)) {
    await gDriveToImgur.applyThumbnail(club)
  }
  await writeFile(jsonPath, JSON.stringify(clubs, null, '\t'))
}

// node js/....js please run main
//                ^^^^^^
if (process.argv[2]) {
  main()
}
