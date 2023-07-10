'use strict'

/* global chrome */

export function setIcon (path) {
  return new Promise((resolve, reject) => {
    chrome.action.setIcon(
      {
        path
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

export function setTitle (str) {
  return new Promise((resolve, reject) => {
    chrome.action.setTitle(
      {
        title: str
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
