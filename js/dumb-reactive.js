import { identity } from '../js/utils.js'

const l10nArgFinder = /\{(\w+)\}/g
export function createL10nApplier (l10n, l10nArgs) {
  const fragmentRaw = ['fragment']
  let exec
  let lastIndex = 0
  while ((exec = l10nArgFinder.exec(l10n))) {
    fragmentRaw.push(l10n.slice(lastIndex, exec.index))
    const argName = exec[1]
    if (l10nArgs[argName] !== undefined) {
      fragmentRaw.push([l10nArgs[argName], argName])
    } else {
      throw new Error(`l10nArgs is missing argument ${argName} in "${l10n}"`)
    }
    lastIndex = exec.index + exec[0].length
  }
  fragmentRaw.push(l10n.slice(lastIndex))
  const fragmentBase = fragmentRaw.filter(identity)
  return values =>
    fragmentBase.map(part => {
      if (typeof part === 'string') {
        return part
      } else {
        const [argElem, argName] = part
        const value = values[argName]
        return argElem ? [argElem, value] : value
      }
    })
}

function processState ([type, ...children]) {
  if (typeof type === 'string') {
    type = { type }
  }
  const [tag, classes] = type.type
  const elem = {
    tag,
    classes,
    properties: {},
    dataset: {},
    children: children.filter(identity).map(child => {
      if (typeof child === 'string') {
        return [child]
      } else {
        const processed = processState(child)
        return processed.tag === 'fragment'
          ? processed // Merge children of fragment
          : [processed]
      }
    })
  }
  if (type.classes) elem.classes.push(...type.classes.filter(identity))
  if (type.properties) Object.assign(elem.properties, type.properties)
  if (type.dataset) Object.assign(elem.dataset, type.dataset)
  // Merge adjacent strings
  for (let i = 1; i < elem.children.length; i++) {
    if (
      typeof elem.children[i] === 'string' &&
      typeof elem.children[i - 1] === 'string'
    ) {
      elem.children[i - 1] += elem.children[i]
      elem.children.splice(i, 1)
      i--
    }
  }
  return elem
}

function updateRecordFromState (record, newState) {
  if (typeof newState === 'string') {
    if (record.state !== newState) {
      record.node.nodeValue = newState
    }
  } else {
    // TODO: diff properties, etc
    applyChildChanges(
      record.node,
      record.state ? record.state.children : [],
      newState.children
    )
  }
  record.state = newState
}

function newRecordFromState (parentNode, fromState, recordTarget = {}) {
  if (typeof fromState === 'string') {
    recordTarget.node = document.createTextNode(fromState)
  } else {
    recordTarget.node = document.createElement(fromState.tag)
  }
  updateRecordFromState(recordTarget, fromState)
  recordTarget.state = fromState
  return recordTarget
}

function deleteRecord (parentNode, oldChildRecord) {
  parentNode.removeChild(oldChildRecord.node)
  oldChildRecord.node = null
  oldChildRecord.state = null
}

function applyChildChanges (parentNode, records, newState) {
  for (let i = 0; i < newState.length; i++) {
    const newChildState = newState[i]
    // If the state changed between text/element node or the tag changed, delete
    // and recreate
    if (
      typeof records[i] !== typeof newChildState ||
      (typeof newChildState !== 'string' &&
        records[i].state.tag !== newChildState.tag)
    ) {
      deleteRecord(records[i])
    }
    if (!records[i]) {
      records[i] = {}
    }
    if (records[i]) {
      updateRecordFromState(records[i], newChildState)
    } else {
      newRecordFromState(parentNode, newChildState, records[i])
    }
  }
  // TODO: remove extra records
}

export function createReactive (wrapper) {
  const records = []
  return newStateUnprocessed => {
    const newState = processState(newStateUnprocessed)
    applyChildChanges(wrapper, records, newState)
  }
}
