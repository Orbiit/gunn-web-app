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
import { apiKey } from './common.js'

const isGDriveRegex = /https?:\/\/drive\.google\.com\/file\/d\/([\w-]+)\/view/

export function getGDriveFileId (link) {
  const match = isGDriveRegex.exec(link)
  if (match) {
    return match[1]
  } else {
    return null
  }
}

const apiBase = 'https://www.googleapis.com/drive/v3/files/'

const imgurApiPath = fileURLToPath(
  new URL('../imgur-api.json', import.meta.url)
)

class GDriveToImgur {
  clientId = this.getClientId()

  loud = true

  async getClientId () {
    const { clientId } = JSON.parse(await readFile(imgurApiPath, 'utf8'))
    return clientId
  }

  async uploadImage (imageUrl, { name = '' } = {}) {
    const form = new URLSearchParams()
    form.append('image', imageUrl)
    form.append('type', 'url')
    if (name) form.append('name', name)
    const {
      data: { link }
    } = await fetch('https://api.imgur.com/3/upload', {
      method: 'POST',
      headers: {
        Authorization: `Client-ID ${await this.clientId}`
      },
      body: form
    }).then(r =>
      r.ok ? r.json() : r.text().then(data => Promise.reject(new Error(data)))
    )
    return link
  }

  async getImgurFromGDrive (fileId) {
    const { loud } = this
    if (fileId) {
      const params = new URLSearchParams()
      params.set('fields', 'thumbnailLink')
      params.set('key', apiKey)
      const { thumbnailLink } = await fetch(
        apiBase + fileId + '/?' + params
      ).then(r => (r.ok ? r.json() : {}))
      if (thumbnailLink) {
        if (loud) console.log('[:D] public!', thumbnailLink)
        const imgur = await this.uploadImage(thumbnailLink)
        if (loud) console.log('[^^] imgur', imgur)
        return imgur
      } else {
        if (loud) console.log('[:(] not public', fileId)
      }
    }
    return null
  }

  async applyThumbnail (club) {
    if (club.video && !club.thumbnail) {
      const fileId = getGDriveFileId(club.video)
      if (fileId) {
        const imgur = await this.getImgurFromGDrive(fileId)
        if (imgur) club.thumbnail = imgur
      }
    }
  }
}

const imgurUrlsPath = fileURLToPath(
  new URL('../json/imgur-urls.json', import.meta.url)
)

export class ImgurUrlManager {
  gDriveToImgur = new GDriveToImgur()

  imgurUrls = readFile(imgurUrlsPath, 'utf8').then(JSON.parse)

  /**
   * Resolves with the imgur URL or null if it is private
   */
  async getImgurFromFileId (fileId) {
    const imgurUrls = await this.imgurUrls
    if (Object.prototype.hasOwnProperty.call(imgurUrls, fileId)) {
      return imgurUrls[fileId]
    } else {
      const imgurUrl = await this.gDriveToImgur.getImgurFromGDrive(fileId)
      imgurUrls[fileId] = imgurUrl
      return imgurUrl
    }
  }

  async setThumbnailIfNeeded (club) {
    const fileId = getGDriveFileId(club.video)
    if (fileId) {
      club.thumbnail = await this.getImgurFromFileId(fileId)
    }
  }

  async save () {
    await writeFile(
      imgurUrlsPath,
      JSON.stringify(await this.imgurUrls, null, '\t')
    )
  }
}

const clubsPath = fileURLToPath(new URL('../json/clubs.json', import.meta.url))

async function main () {
  const imgurUrls = new ImgurUrlManager()
  const clubs = JSON.parse(await readFile(clubsPath, 'utf8'))
  for (const club of Object.values(clubs)) {
    await imgurUrls.setThumbnailIfNeeded(club)
  }
  await writeFile(clubsPath, JSON.stringify(clubs, null, '\t'))
  await imgurUrls.save()
}

// I did something poorly the first round and do not want to annoy Imgur too
// much so am doing this hacky thing
// This will not be run again.
export async function main2 () {
  const clubs = JSON.parse(await readFile(clubsPath, 'utf8'))
  const imgurUrls = {}
  for (const club of Object.values(clubs)) {
    const fileId = getGDriveFileId(club.video)
    if (fileId && club.thumbnail) {
      imgurUrls[fileId] = club.thumbnail
    }
  }
  await writeFile(imgurUrlsPath, JSON.stringify(imgurUrls, null, '\t'))
}

export async function main3 () {
  const clubs = JSON.parse(await readFile(clubsPath, 'utf8'))
  const counts = {
    youtube: 0,
    drive: 0,
    drivePrivate: 0,
    neither: 0,
    noVideo: 0
  }
  for (const [name, { video, thumbnail }] of Object.entries(clubs)) {
    if (
      video &&
      (video.includes('youtube.com') || video.includes('youtu.be'))
    ) {
      counts.youtube++
    } else if (video && video.includes('google.com')) {
      counts.drive++
      if (!thumbnail) {
        counts.drivePrivate++
        if (thumbnail !== null) {
          console.log('[!] thumbnail undefined', { name, video })
        }
      }
    } else {
      counts.neither++
      if (video) {
        console.log('[!] neither youtube nor drive', { name, video })
      } else {
        counts.noVideo++
        console.log('[?] no video', { name, video })
      }
    }
  }
  console.log(counts)
}

// node js/....js please run main
//                ^^^^^^
if (process.argv[2]) {
  main()
}
