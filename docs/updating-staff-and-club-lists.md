# Updating the staff/club lists

This is done manually since they generally don't update that often, and there's
no easy API for accessing the info. However, scraping things like this,
especially the constantly-redesigning Gunn website, is unreliable so these
probably won't work in the future.

## Updating the staff directory

```sh
npm run update-staff
```

## Updating the club list

Go to the [chartered club
list](https://docs.google.com/spreadsheets/d/1HUaNWegOIk972lGweoSuNcXtfX7XuGBTQU-gcTsvD9s/),
select all, copy, and paste into `data:text/html;charset=UTF-8,<body contenteditable>`
(open that URL in your browser). Run the following JavaScript in the console,
and copypaste the output into **json/clubs.json**.

```js
r = {}
for (var s of document.querySelectorAll('table tr')) {
  var boop = s.querySelectorAll('td')
  var i = boop.length === 9
  r[boop[1].textContent] = {
    desc: boop[2].textContent,
    donation:
      (boop[3].textContent.slice(0, 1).toLowerCase() === 'n' ||
      boop[3].textContent === '0' ||
      boop[3].textContent.slice(0, 2) === '$0'
        ? undefined
        : boop[3].textContent) || undefined,
    day: boop[4 - i].textContent,
    time: boop[5 - i].textContent,
    room: boop[6 - i].textContent,
    president: boop[7 - i].textContent,
    teacher: boop[8 - i].textContent,
    email: boop[9 - i].textContent
  }
}
delete r['Club Name']
JSON.stringify(r, null, '\t')
```

You might want to update the last updated date in **js/l10n.js** in
`clubs-disclaimer-link`.

## Old scripts

**You can ignore this section.** Some of these require top level `await`; if
\*\*your console doesn't support it, wrap the code in

```js
;(async () => {
  // ...
})()
```

Go to the [staff directory on the Gunn
website](https://gunn.pausd.org/connecting/staff-directory), run the following
JavaScript in the console, and copypaste the output into **json/clubs.json**.

```js
pages = +$('.fsLastPageLink').attr('data-page')
r = {}
insertEmail = (_, domain, email) =>
  `${[...email].reverse().join('')}@${[...domain].reverse().join('')}`
setTimeoute = f => f()
for (let i = 1; i <= pages; i++) {
  const html = $(
    $.parseHTML(
      await fetch(
        'https://gunn.pausd.org/fs/elements/11437?const_page=' + i
      ).then(r => r.text()),
      document,
      true
    )
  )
  Object.assign(
    r,
    Object.fromEntries(
      Array.from(html.find('.fsConstituentItem'), teach => [
        teach.querySelector('.fsConstituentProfileLink').textContent.trim(),
        {
          jobTitle: teach.querySelector('.fsTitles').textContent.trim(),
          email: eval(
            teach
              .querySelector('.fsEmail > div > script')
              .innerHTML.replace('setTimeout', 'setTimeoute')
              .replace('FS.util.', 'return ')
          )
        }
      ])
    )
  )
}
JSON.stringify(r, null, '\t')
```

You might want to update the last updated date in **js/l10n.js** in
`staff-disclaimer-link`.

[Older site](https://gunn.pausd.org/connect/staff-directory):

```js
r = {}
document.querySelectorAll('tbody tr').forEach(tr => {
  const [name, position, department, email, phone] = Array.from(
    tr.children
  ).map(td => td.textContent.trim())
  r[name] = {
    jobTitle: position,
    department: department,
    phone: phone,
    email: email
  }
})
JSON.stringify(r)
```

Club list v1 (where [`sela` is an alias of
`document.querySelectorAll`](https://github.com/Orbiit/gunn-web-app/issues/24#issuecomment-333270456))

```js
for (var s of sela('table tr')) {
  var boop = s.querySelectorAll('td')
  var i = boop.length === 9
  r[boop[1].textContent] = {
    desc: boop[2].textContent,
    day: boop[4 - i].textContent,
    time: boop[5 - i].textContent,
    room: boop[6 - i].textContent,
    president: boop[7 - i].textContent,
    teacher: boop[8 - i].textContent,
    email: boop[9 - i].textContent
  }
}
```

[Older site](http://gunn.pausd.org/people):

```js
var r = {}
jQuery('.views-table.cols-6 tbody tr').each(function () {
  var c = jQuery(this).children()
  r[
    c
      .eq(0)
      .find('a')
      .html()
      .trim()
  ] = {
    jobTitle: c
      .eq(1)
      .html()
      .trim(),
    department: c
      .eq(2)
      .find('a')
      .html()
      ? c
          .eq(2)
          .find('a')
          .html()
          .trim()
      : null,
    phone: c
      .eq(3)
      .html()
      .trim(),
    email: c
      .eq(4)
      .html()
      .trim(),
    webpage: c.eq(5).find('a').length
      ? c
          .eq(5)
          .find('a')
          .attr('href')
      : null
  }
})
JSON.stringify(r)
```
