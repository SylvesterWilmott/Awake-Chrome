'use strict'

/* global chrome */

import * as action from './js/action.js'
import * as downloads from './js/downloads.js'
import * as message from './js/message.js'
import * as menu from './js/menu.js'
import * as offscreen from './js/offscreen.js'
import * as power from './js/power.js'
import * as storage from './js/storage.js'
import * as tabs from './js/tabs.js'

chrome.idle.setDetectionInterval(60)

chrome.runtime.onStartup.addListener(init)
chrome.runtime.onInstalled.addListener(init)
chrome.idle.onStateChanged.addListener(onIdleStateChanged)
chrome.downloads.onCreated.addListener(onDownloadCreated)
chrome.downloads.onChanged.addListener(onDownloadsChanged)
chrome.action.onClicked.addListener(onActionClicked)
chrome.contextMenus.onClicked.addListener(onMenuClicked)

const throttledplaySound = throttle(playSound, 100)

async function init (info) {
  try {
    await setupContextMenu()
    await loadPreferences()
    await updateTitle()

    if ('reason' in info && info.reason === 'install') {
      await showOnboarding()
    }
  } catch (error) {
    handleError(error)
  }
}

async function showOnboarding () {
  try {
    const path = 'onboarding/html/welcome.html'
    const relativeUrl = chrome.runtime.getURL(path)

    await tabs.create(relativeUrl)
  } catch (error) {
    handleError(error)
  }
}

async function updateTitle () {
  try {
    const platformInfo = await getPlatformInfo()
    const extensionTitle = chrome.i18n.getMessage('EXT_NAME_SHORT')
    let shortcut

    if (platformInfo.os === 'mac') {
      shortcut = chrome.i18n.getMessage('SHORTCUT_MAC')
    } else {
      shortcut = chrome.i18n.getMessage('SHORTCUT')
    }

    await action.setTitle(`${extensionTitle} (${shortcut})`)
  } catch (error) {
    handleError(error)
  }
}

function getPlatformInfo () {
  return new Promise((resolve, reject) => {
    chrome.runtime.getPlatformInfo(function (info) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError.message)
      }
      resolve(info)
    })
  })
}

async function setupContextMenu () {
  try {
    const storedPreferences = await storage.load(
      'preferences',
      storage.preferenceDefaults
    )

    const menuItems = buildMenuStructure(storedPreferences)

    await menu.create(menuItems)
  } catch (error) {
    handleError(error)
  }
}

function buildMenuStructure (preferences) {
  const menuStructure = []

  Object.entries(preferences).forEach(([key, preference]) => {
    if (preference.type === 'checkbox') {
      const menuItem = {
        title: preference.title,
        contexts: ['action'],
        id: key,
        type: 'checkbox'
      }
      menuStructure.push(menuItem)
    }
  })

  return menuStructure
}

async function loadPreferences () {
  try {
    const storedPreferences = await storage.load(
      'preferences',
      storage.preferenceDefaults
    )

    for (const [preferenceName, preferenceObj] of Object.entries(
      storedPreferences
    )) {
      if (preferenceObj.type === 'checkbox') {
        await menu.update(preferenceName, preferenceObj.status)
      }
    }
  } catch (error) {
    handleError(error)
  }
}

async function onMenuClicked (info) {
  const { menuItemId } = info

  try {
    const storedPreferences = await storage.load(
      'preferences',
      storage.preferenceDefaults
    )

    const preference = storedPreferences[menuItemId]

    if (!preference) {
      return
    }

    if (preference.type === 'checkbox') {
      preference.status = info.checked
    }

    await storage.save('preferences', storedPreferences)
  } catch (error) {
    handleError(error)
  }
}

async function onIdleStateChanged (state) {
  if (state !== 'locked') return

  try {
    const currentStatus = await storage.loadSession('status', false)

    if (currentStatus === true) {
      await turnOff()
    }
  } catch (error) {
    console.error('An error occurred:', error)
  }
}

async function onActionClicked () {
  try {
    const currentStatus = await storage.loadSession('status', false)

    if (currentStatus === true) {
      await turnOff()
    } else {
      await turnOn()
    }
  } catch (error) {
    console.error('An error occurred:', error)
  }
}

async function onDownloadCreated () {
  try {
    const storedPreferences = await storage.load(
      'preferences',
      storage.preferenceDefaults
    )

    if (storedPreferences.autoDownloads.status === false) {
      return
    }

    const allDownloads = await downloads.search('in_progress')
    const hasInProgressDownloads = allDownloads.some(
      (download) => download.state === 'in_progress'
    )

    if (!hasInProgressDownloads) return

    const currentStatus = await storage.loadSession('status', false)

    if (hasInProgressDownloads && !currentStatus) {
      await Promise.all([turnOn(), saveDownloadInProgressFlag(true)])
    }
  } catch (error) {
    handleError(error)
  }
}

async function onDownloadsChanged () {
  try {
    const storedPreferences = await storage.load(
      'preferences',
      storage.preferenceDefaults
    )

    if (storedPreferences.autoDownloads.status === false) {
      return
    }

    const allDownloads = await downloads.search('in_progress')
    const hasInProgressDownloads = allDownloads.some(
      (download) => download.state === 'in_progress'
    )

    if (hasInProgressDownloads) return

    const currentStatus = await storage.loadSession('status', false)
    const wasActivatedByDownload = await storage.loadSession(
      'downloadInProgress',
      false
    )

    if (
      wasActivatedByDownload &&
      !hasInProgressDownloads &&
      currentStatus &&
      storedPreferences.autoDownloads.status === true
    ) {
      await turnOff()
    }
  } catch (error) {
    handleError(error)
  }
}

async function turnOn () {
  try {
    const storedPreferences = await storage.load(
      'preferences',
      storage.preferenceDefaults
    )

    if (storedPreferences.sounds.status) {
      throttledplaySound('on')
    }

    power.keepAwake('display')

    await Promise.all([updateIcon(true), saveState(true)])
  } catch (error) {
    handleError(error)
  }
}

async function turnOff () {
  try {
    const storedPreferences = await storage.load(
      'preferences',
      storage.preferenceDefaults
    )

    if (storedPreferences.sounds.status) {
      throttledplaySound('off')
    }

    power.releaseKeepAwake()

    await Promise.all([
      updateIcon(false),
      saveState(false),
      saveDownloadInProgressFlag(false)
    ])
  } catch (error) {
    handleError(error)
  }
}

async function updateIcon (state) {
  try {
    const path = chrome.runtime.getURL(
      `images/icon32${state ? '_active' : ''}.png`
    )
    await action.setIcon(path)
  } catch (error) {
    handleError(error)
  }
}

async function saveState (state) {
  try {
    await storage.saveSession('status', state)
  } catch (error) {
    handleError(error)
  }
}

async function saveDownloadInProgressFlag (state) {
  try {
    await storage.saveSession('downloadInProgress', state)
  } catch (error) {
    handleError(error)
  }
}

async function playSound (sound) {
  try {
    const documentPath = 'offscreen.html'
    const hasDocument = await offscreen.hasDocument(documentPath)

    if (!hasDocument) {
      await offscreen.create(documentPath)
    }

    message.sendSync({ type: 'play-sound', target: 'offscreen', sound })
  } catch (error) {
    handleError(error)
  }
}

function throttle (func, delay) {
  let lastExecTime = 0
  return function () {
    const context = this
    const args = arguments
    const now = Date.now()
    if (now - lastExecTime >= delay) {
      lastExecTime = now
      func.apply(context, args)
    }
  }
}

function handleError (error) {
  console.error('An error occurred:', error)
}
