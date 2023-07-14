'use strict'

/* global chrome */

document.addEventListener('DOMContentLoaded', init)

async function init () {
  localize()
  registerListeners()
  ready()
}

async function localize () {
  const strings = document.querySelectorAll('[data-localize]')

  if (strings) {
    for (const s of strings) {
      s.innerHTML = chrome.i18n.getMessage(s.dataset.localize)
    }
  }

  const conditionalStrings = document.querySelectorAll('[data-localizeConditional]')

  if (conditionalStrings) {
    try {
      const platformInfo = await getPlatformInfo()

      for (const s of conditionalStrings) {
        let shortcut

        if (platformInfo.os === 'mac') {
          shortcut = chrome.i18n.getMessage(`${s.dataset.platform}_MAC`)
        } else {
          shortcut = chrome.i18n.getMessage(`${s.dataset.platform}`)
        }

        s.innerHTML = chrome.i18n.getMessage(s.dataset.localizeconditional, shortcut)
      }
    } catch (error) {
      handleError(error)
    }
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

function registerListeners () {
  document.getElementById('dismiss').addEventListener('click', onDissmissClicked, false)
}

function onDissmissClicked () {
  window.close()
}

function ready () {
  document.title = chrome.i18n.getMessage('WELCOME')
  document.getElementById('version').innerText = `v${chrome.runtime.getManifest().version}`
  document.getElementById('container').classList.remove('hidden')
}

function handleError (error) {
  console.error('An error occurred:', error)
}
