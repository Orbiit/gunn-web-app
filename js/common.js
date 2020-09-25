// Values needed by both Node and browser scripts

/**
 * Google API key. If you're forking UGWA, please use your own API key. I might
 * change it so that it only works for orbiit.github.io one day.
 * @type {string}
 */
export const apiKey = 'AIzaSyDBYs4DdIaTjYx5WDz6nfdEAftXuctZV0o'

const isGDriveRegex = /https?:\/\/drive\.google\.com\/file\/d\/([\w-]+)\/view/
export function getGDriveFileId (link) {
  const match = isGDriveRegex.exec(link)
  if (match) {
    return match[1]
  } else {
    return null
  }
}
