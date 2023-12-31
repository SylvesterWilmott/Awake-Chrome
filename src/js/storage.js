'use strict'

/* global chrome */

export const preferenceDefaults = {
  sounds: {
    title: chrome.i18n.getMessage('MENU_SOUNDS'),
    status: true,
    type: 'checkbox'
  },
  autoDownloads: {
    title: chrome.i18n.getMessage('MENU_DOWNLOADS'),
    status: true,
    type: 'checkbox'
  }
}

export function saveSession (key, value) {
  return new Promise((resolve, reject) => {
    chrome.storage.session.set(
      {
        [key]: value
      },
      function () {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError.message)
        }
        resolve()
      }
    )
  })
}

export function loadSession (key, defaults) {
  return new Promise((resolve, reject) => {
    chrome.storage.session.get(
      {
        [key]: defaults
      },
      function (value) {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError.message)
        }
        resolve(value[key])
      }
    )
  })
}

export function save (key, value) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set(
      {
        [key]: value
      },
      function () {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError.message)
        }
        resolve()
      }
    )
  })
}

export function load (key, defaults) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(
      {
        [key]: defaults
      },
      function (value) {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError.message)
        }
        resolve(value[key])
      }
    )
  })
}

export function clear (key) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.remove(key, function () {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError.message)
      }
      resolve()
    })
  })
}
