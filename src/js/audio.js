'use strict'

/* global chrome, Audio */

chrome.runtime.onMessage.addListener(onMessageReceived)

function onMessageReceived (message) {
  if (message.target !== 'offscreen') {
    return
  }

  if (message.type === 'play-sound') {
    playSound(message.sound)
  }
}

function playSound (sound) {
  const playable = new Audio(chrome.runtime.getURL(`audio/${sound}.mp3`))
  playable.play()
}
