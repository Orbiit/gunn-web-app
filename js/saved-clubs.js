import { cookie, logError } from './utils.js'

export let savedClubs = {}
let onSavedClubsUpdate = null
export function setOnSavedClubsUpdate (fn) {
  onSavedClubsUpdate = fn
}
if (cookie.getItem('[gunn-web-app] club-list.spring18-19')) {
  try {
    savedClubs = JSON.parse(
      cookie.getItem('[gunn-web-app] club-list.spring18-19')
    )
  } catch (e) {
    logError(e)
  }
}
export function saveSavedClubs () {
  cookie.setItem(
    '[gunn-web-app] club-list.spring18-19',
    JSON.stringify(savedClubs)
  )
  if (onSavedClubsUpdate) onSavedClubsUpdate()
}
