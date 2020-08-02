/* global XMLHttpRequest */
/* exported sel, cre, ajax, ready, load */

class Elem extends Array {
  constructor (elems) {
    if (!Array.isArray(elems)) elems = [elems]
    elems = elems.filter(a => a !== null && a !== undefined)
    super(...elems)
  }

  each (fn) {
    for (let i = 0; i < this.length; i++) fn(this[i])
  }

  click (fn) {
    this.each(e => {
      e.addEventListener(
        'click',
        ev => {
          fn(ev, new Elem(e))
        },
        false
      )
      // if (!e.hasKey) e.addEventListener("keydown",e=>{
      //   if (e.keyCode===13||e.keyCode===32) fn(e);
      // },false);
    })
    return this
  }

  on (listeners, fn, touch = false) {
    if (!Array.isArray(listeners)) listeners = [listeners]
    this.each(e => {
      if (~listeners.indexOf('keydown') || ~listeners.indexOf('keypress'))
        e.hasKey = true
      for (let i = 0; i < listeners.length; i++) {
        e.addEventListener(
          listeners[i],
          ev => {
            fn(ev, new Elem(e))
          },
          touch ? { passive: false } : false
        )
      }
    })
    return this
  }

  sel (selector) {
    const t = []
    this.each(e => {
      const s = e.querySelectorAll(selector)
      for (let i = 0; i < s.length; i++) t.push(s[i])
    })
    return new Elem(t)
  }

  prop (prop, newval) {
    if (newval !== undefined) {
      this.each(e => {
        e[prop] = newval
      })
      return this
    } else {
      const t = []
      this.each(e => {
        t.push(e[prop])
      })
      return t
    }
  }

  attr (attr, newval) {
    if (newval !== undefined) {
      this.each(e => {
        e.setAttribute(attr, newval)
      })
      return this
    } else {
      const t = []
      this.each(e => {
        t.push(e.getAttribute(attr))
      })
      return t
    }
  }

  html (newhtml) {
    if (newhtml !== undefined) {
      this.each(e => {
        e.innerHTML = newhtml
      })
      return this
    } else {
      const t = []
      this.each(e => {
        t.push(e.innerHTML)
      })
      return t
    }
  }

  child (n) {
    const t = []
    this.each(e => {
      t.push(e.children[n])
    })
    return new Elem(t)
  }

  parent () {
    const t = []
    this.each(e => {
      if (!~t.indexOf(e.parentNode)) t.push(e.parentNode)
    })
    return new Elem(t)
  }

  add (elems, pos = -1) {
    const t = document.createDocumentFragment()
    elems.each(e => {
      t.appendChild(e)
    })
    if (pos === -1) this[0].appendChild(t)
    else if (pos < 0)
      this[0].insertBefore(
        t,
        this[0].children[this[0].children.length + pos + 1]
      )
    else this[0].insertBefore(t, this[0].children[pos])
    return this
  }

  addClass (...classes) {
    this.each(e => {
      for (let i = 0; i < classes.length; i++) e.classList.add(classes[i])
    })
    return this
  }

  removeClass (...classes) {
    this.each(e => {
      for (let i = 0; i < classes.length; i++) e.classList.remove(classes[i])
    })
    return this
  }

  toggleClass (...classes) {
    this.each(e => {
      for (let i = 0; i < classes.length; i++) e.classList.toggle(classes[i])
    })
    return this
  }

  hasClass (theClass) {
    const t = []
    this.each(e => {
      t.push(e.classList.contains(theClass))
    })
    return t
  }
}
function sel (selector) {
  const t = []
  const s = document.querySelectorAll(selector)
  for (let i = 0; i < s.length; i++) t.push(s[i])
  return new Elem(t)
}
function cre (tag, times = 1) {
  const t = []
  for (let i = 0; i < times; i++) t.push(document.createElement(tag))
  return new Elem(t)
}
function ajax (url, callback, error) {
  const xmlHttp = new XMLHttpRequest()
  xmlHttp.onreadystatechange = () => {
    if (xmlHttp.readyState === 4) {
      if (xmlHttp.status === 200) callback(xmlHttp.responseText)
      else if (error)
        error(xmlHttp.responseText, xmlHttp.readyState, xmlHttp.status)
    }
  }
  xmlHttp.open('GET', url, true)
  xmlHttp.send(null)
}
function ready (fn) {
  document.addEventListener('DOMContentLoaded', fn, false)
}
function load (fn) {
  window.addEventListener('load', fn, false)
}
ready(e => {
  window.DH = new Elem(document.head)
  window.DB = new Elem(document.body)
})

Object.assign(window, { sel, cre, ajax, ready, load })
