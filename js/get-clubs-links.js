/**
 * https://docs.google.com/document/d/1WpmgjcuRaHqc1jOL19pTNlHNJM3pwsEYxjYU0fy511Q/
 * Tools > Review suggested edits
 * Preview "Accept all" (if there are any suggestions)
 * Select all and copy to data:text/html;charset=UTF-8,<body contenteditable>
 * Run the following in the console
 * Put the JSON output in json/clubs-links.json
 */

// NOTE: I've been saving past clubs-links.json versions as clubs-links-N.json,
// where N is a manually incremented number. This way, I can compare changes
// using this command:
// diff json/clubs-links-N.json json/clubs-links.json --color=always

JSON.stringify(
  (() => {
    const arr = [].concat(
      ...Array.from(document.querySelectorAll('table > tbody'), table => {
        return Array.from(table.children, tr => {
          return Array.from(tr.children, td => {
            return [
              // Replace nbsp with space
              td.textContent.trim().replace(/\xa0/g, ' ') || undefined,
              td.querySelector('a')?.href || undefined
            ]
          })
        }).slice(1)
      })
    )
    const clubs = {}
    for (const [
      [name, video],
      [zoom],
      [time],
      [presidentEmail],
      [signup]
    ] of arr) {
      const [president, email] = presidentEmail
        ? presidentEmail.split(/:\s*/)
        : []
      clubs[name] = { video, zoom, time, president, email, signup }
    }
    console.log(arr, clubs)
    return clubs
  })(),
  null,
  '\t'
)
