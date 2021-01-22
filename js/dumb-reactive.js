function exists (value) {
  // Allows 0 and 0n to be "truthy"
  return (
    value !== undefined && value !== null && value !== false && value !== ''
  )
}

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
  const fragmentBase = fragmentRaw.filter(exists)
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

function diffArray (oldArr, newArr) {
  return {
    removed: oldArr.filter(item => !newArr.includes(item)),
    added: newArr.filter(item => !oldArr.includes(item))
  }
}
function diffObject (oldObj, newObj) {
  return {
    removed: Object.keys(oldObj).filter(key => !exists(newObj[key])),
    changed: Object.entries(newObj).filter(
      ([key, value]) => exists(value) && oldObj[key] !== value
    )
  }
}

function processStateArray (states) {
  // Merge adjacent strings
  const processed = []
  for (let i = 0; i < states.length; i++) {
    const state =
      typeof states[i] === 'number' ? states[i].toString() : states[i]
    if (!exists(state)) continue
    if (typeof state === 'string') {
      if (i > 0 && typeof processed[processed.length - 1] === 'string') {
        processed[processed.length - 1] += state
      } else {
        processed.push(state)
      }
    } else if (Array.isArray(state)) {
      const processedChild = processState(state)
      if (processedChild.tag === 'fragment') {
        processed.push(...processedChild.children)
      } else {
        processed.push(processedChild)
      }
    } else {
      console.error(state)
      throw new Error('State is neither a string, number, nor array')
    }
  }
  return processed
}
function processState ([type, ...children]) {
  if (typeof type === 'string') {
    type = { type }
  }
  const [tag, ...classes] = type.type.split('.')
  const elem = {
    tag,
    classes,
    properties: {},
    style: {},
    dataset: {},
    options: {}, // For custom elements
    children: processStateArray(children)
  }
  if (type.classes) elem.classes.push(...type.classes.filter(exists))
  if (type.properties) Object.assign(elem.properties, type.properties)
  if (type.style) Object.assign(elem.style, type.style)
  if (type.dataset) Object.assign(elem.dataset, type.dataset)
  if (type.options) Object.assign(elem.options, type.options)
  return elem
}

function updateRecordFromState (settings, record, newState) {
  if (typeof newState === 'string') {
    if (record.state !== newState) {
      record.node.nodeValue = newState
    }
  } else {
    const oldState = record.state || {
      classes: [],
      dataset: {},
      properties: {},
      style: {}
    }
    const { removed: removedClasses, added: addedClasses } = diffArray(
      oldState.classes,
      newState.classes
    )
    if (removedClasses.length) {
      record.node.classList.remove(...removedClasses)
    }
    if (addedClasses.length) {
      record.node.classList.add(...addedClasses)
    }

    const {
      removed: removedProperties,
      changed: changedProperties
    } = diffObject(oldState.properties, newState.properties)
    for (const key of removedProperties) {
      delete record.node[key]
    }
    for (const [key, value] of changedProperties) {
      record.node[key] = value
    }

    const { removed: removedStyles, changed: changedStyles } = diffObject(
      oldState.style,
      newState.style
    )
    for (const property of removedStyles) {
      if (property.includes('-')) {
        record.node.style.removeProperty(property)
      } else {
        record.node.style[property] = null
      }
    }
    for (const [property, value] of changedStyles) {
      if (property.includes('-')) {
        record.node.style.setProperty(property, value)
      } else {
        record.node.style[property] = value
      }
    }

    const { removed: removedDataset, changed: changedDataset } = diffObject(
      oldState.dataset,
      newState.dataset
    )
    for (const key of removedDataset) {
      delete record.node.dataset[key]
    }
    for (const [key, value] of changedDataset) {
      record.node.dataset[key] = value
    }

    applyChildChanges(settings, record.node, record.records, newState.children)
  }
  record.state = newState
}

function newRecordFromState (
  settings,
  parentNode,
  fromState,
  recordTarget = { records: [] },
  replaceNode = null
) {
  if (typeof fromState === 'string') {
    recordTarget.node = document.createTextNode(fromState)
  } else if (settings.customElems[fromState.tag]) {
    recordTarget.node = settings.customElems[fromState.tag](
      fromState,
      recordTarget
    )
  } else {
    recordTarget.node = document.createElement(fromState.tag)
  }
  if (replaceNode) {
    if (replaceNode.parentNode) {
      replaceNode.parentNode.replaceChild(recordTarget.node, replaceNode)
    } else {
      console.warn(
        new Error('Weird, no parent node to replace in?'),
        replaceNode
      )
    }
  } else {
    parentNode.appendChild(recordTarget.node)
  }
  updateRecordFromState(settings, recordTarget, fromState)
  recordTarget.state = fromState
  return recordTarget
}

function deleteRecord (oldChildRecord, willReplace = false) {
  if (!willReplace) {
    if (oldChildRecord.node.parentNode) {
      oldChildRecord.node.parentNode.removeChild(oldChildRecord.node)
    } else {
      console.warn(
        new Error('Weird, no parent node to remove from?'),
        oldChildRecord.node
      )
    }
    oldChildRecord.node = null
  }
  oldChildRecord.state = null
  oldChildRecord.records.splice(0, oldChildRecord.records.length)
}

function applyChildChanges (settings, parentNode, records, newState) {
  for (let i = 0; i < newState.length; i++) {
    const newChildState = newState[i]
    if (records[i]) {
      // If the state changed between text/element node or the tag changed, delete
      // and recreate
      if (
        typeof records[i].state !== typeof newChildState ||
        (typeof newChildState !== 'string' &&
          records[i].state.tag !== newChildState.tag)
      ) {
        deleteRecord(records[i], true)
      }
    } else {
      records[i] = { records: [] }
    }
    if (records[i].state) {
      updateRecordFromState(settings, records[i], newChildState)
    } else {
      newRecordFromState(
        settings,
        parentNode,
        newChildState,
        records[i],
        records[i].node
      )
    }
  }
  if (newState.length < records.length) {
    const removed = records.splice(
      newState.length,
      records.length - newState.length
    )
    for (const record of removed) {
      deleteRecord(record)
    }
  }
}

export function createReactive (wrapper, { customElems = {} } = {}) {
  const records = []
  return newStateUnprocessed => {
    const newState = processStateArray(newStateUnprocessed)
    applyChildChanges({ customElems }, wrapper, records, newState)
  }
}
