const getShortcutKeysMap = () => {
  return {
    Control: 'Ctrl',
    ArrowLeft: 'Left',
    ArrowRight: 'Right',
    ArrowDown: 'Down',
    ArrowUp: 'Up'
  }
}

const getControlShortcutKeys = () => {
  return ['Ctrl', 'Alt', 'Shift']
}

export const getShortcutKeysBlocklist = () => {
  return ['Meta']
}

export const handleDownShortcutKeys = (shortcutKeysListenTemp, shortcutKeysListen, keysEvent) => {
  let k = keysEvent.key
  if (getShortcutKeysMap()[keysEvent.key]) {
    k = getShortcutKeysMap()[keysEvent.key]
  } else {
    if (/[a-zA-Z]/.test(k) && k.length === 1) {
      k = k.toUpperCase()
    }
  }
  if (!shortcutKeysListenTemp.includes(k)) {
    if (!getShortcutKeysBlocklist().includes(k)) {
      if (getControlShortcutKeys().includes(k)) {
        if (k === 'Ctrl') {
          shortcutKeysListenTemp.unshift(k)
        } else {
          let index = 0
          shortcutKeysListenTemp.forEach(item => {
            if (getControlShortcutKeys().includes(item)) {
              index += 1
            }
          })
          shortcutKeysListenTemp.splice(index, 0, k)
        }
      } else {
        let index = 0
        shortcutKeysListenTemp.forEach(item => {
          if (getControlShortcutKeys().includes(item)) {
            index += 1
          }
        })
        shortcutKeysListenTemp.splice(index, 1, k)
      }
      shortcutKeysListenTemp.forEach((item, index) => {
        if (index === 0) {
          shortcutKeysListen = item
        } else {
          shortcutKeysListen += '+' + item
        }
      })
    }
  }
  return {
    shortcutKeysListenTemp: shortcutKeysListenTemp,
    shortcutKeysListen: shortcutKeysListen
  }
}

export const handleUpShortcutKeys = (shortcutKeysListenTemp, shortcutKeysListen, keysEvent) => {
  let k = keysEvent.key
  if (getShortcutKeysMap()[keysEvent.key]) {
    k = getShortcutKeysMap()[keysEvent.key]
  } else {
    if (/[a-zA-Z]/.test(k) && k.length === 1) {
      k = k.toUpperCase()
    }
  }
  if (shortcutKeysListenTemp.includes(k)) {
    shortcutKeysListenTemp.splice(shortcutKeysListenTemp.indexOf(k), 1)
  }
  return {
    shortcutKeysListenTemp: shortcutKeysListenTemp,
    shortcutKeysListen: shortcutKeysListen
  }
}
