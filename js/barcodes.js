import { code39 } from './code39.js'
import { localize } from './l10n.js'
import { ripple } from './material.js'
import { cookie } from './utils.js'

export function initBarcodes () {
  const DEFAULT_BARCODE = '95000000' // more obvious that this is the default since it looks funny

  const barcodeul = document.querySelector('#barcode')
  const add = document.querySelector('#addbarcode')
  let barcodes = [[localize('you'), DEFAULT_BARCODE]]
  const barcodeelems = []
  const code = cookie.getItem('[gunn-web-app] barcode.ids')
  if (code) {
    if (code[0] === 'A') barcodes = JSON.parse(code.slice(1))
    else
      barcodes = code
        .split(',')
        .map((a, i) => [
          localize('barcode-legacy-default').replace('{N}', i),
          a
        ])
  }
  const showingBarcodeParam = /(?:\?|&)barcode=([^&]+)/.exec(
    window.location.search
  )
  const showingBarcode =
    showingBarcodeParam && decodeURIComponent(showingBarcodeParam[1])
  function updateSave () {
    cookie.setItem(
      '[gunn-web-app] barcode.ids',
      'A' + JSON.stringify(barcodeelems.map(([a, b]) => [a.value, b.value]))
    )
  }
  function newBarcodeLi ([
    name = localize('barcode-default'),
    code = DEFAULT_BARCODE
  ] = []) {
    let li = document.createElement('li')
    let divcanvas = document.createElement('div')
    let input = document.createElement('input')
    let canvas = document.createElement('canvas')
    let closeInstructions = document.createElement('div')
    let divbtn = document.createElement('div')
    let removebtn = document.createElement('button')
    let viewbtn = document.createElement('button')
    divcanvas.classList.add('canvas')
    const studentNameInput = document.createElement('input')
    studentNameInput.value = name
    studentNameInput.placeholder = localize('barcode-student-placeholder')
    studentNameInput.classList.add('barcode-student-name')
    studentNameInput.addEventListener(
      'input',
      e => {
        updateSave()
      },
      false
    )
    divcanvas.appendChild(studentNameInput)
    // input.type = 'number'
    input.value = code
    input.classList.add('barcode-student-id')
    input.addEventListener(
      'input',
      e => {
        code39(input.value, canvas)
        updateSave()
      },
      false
    )
    divcanvas.appendChild(input)
    code39(code, canvas)
    canvas.addEventListener(
      'click',
      e => {
        li.classList.remove('viewbarcode')
        window.history.replaceState({}, '', window.location.pathname)
      },
      false
    )
    divcanvas.appendChild(canvas)
    closeInstructions.className = 'barcode-instructions'
    closeInstructions.textContent = localize('barcode-close-instructions')
    divcanvas.appendChild(closeInstructions)
    li.appendChild(divcanvas)
    removebtn.classList.add('material')
    removebtn.classList.add('icon')
    ripple(removebtn)
    removebtn.addEventListener(
      'click',
      e => {
        barcodeelems.splice(barcodeelems.indexOf(input), 1)
        barcodeul.removeChild(li)
        li = divcanvas = input = canvas = divbtn = removebtn = viewbtn = closeInstructions = null
        updateSave()
      },
      false
    )
    removebtn.innerHTML = `<i class="material-icons">&#xE15B;</i>`
    divbtn.appendChild(removebtn)
    viewbtn.classList.add('material')
    viewbtn.classList.add('icon')
    ripple(viewbtn)
    viewbtn.addEventListener(
      'click',
      e => {
        li.classList.add('viewbarcode')
        window.history.replaceState(
          {},
          '',
          '?barcode=' + encodeURIComponent(code)
        )
      },
      false
    )
    if (code === showingBarcode) li.classList.add('viewbarcode')
    viewbtn.innerHTML = `<i class="material-icons">&#xE8F4;</i>`
    divbtn.appendChild(viewbtn)
    li.appendChild(divbtn)
    barcodeelems.push([studentNameInput, input])
    return li
  }
  const t = document.createDocumentFragment()
  for (let i = 0; i < barcodes.length; i++) {
    t.appendChild(newBarcodeLi(barcodes[i]))
  }
  barcodeul.insertBefore(t, add.parentNode)
  add.addEventListener(
    'click',
    e => {
      barcodeul.insertBefore(newBarcodeLi(), add.parentNode)
      updateSave()
    },
    false
  )
  updateSave()
}
