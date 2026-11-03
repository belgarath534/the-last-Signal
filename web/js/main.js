// Entry point: builds the services and starts the app.

import { createEventBus } from './core/events.js';
import { createGame } from './core/game.js';
import { createSaveManager } from './core/save.js';
import { createSettings } from './core/settings.js';
import { createAnnouncer } from './a11y/announcer.js';
import { createAudio } from './audio/audio-engine.js';
import { createApp } from './ui/app.js';
import { content } from './content/index.js';
import { gameScreen } from './ui/screens/game.js';
import {
  firstRunScreen, titleScreen, confirmScreen, pauseScreen, savesScreen, historyScreen, helpScreen,
} from './ui/screens/menus.js';
import { journalScreen, readerScreen, inventoryScreen } from './ui/screens/journal.js';
import { settingsScreen } from './ui/screens/settings.js';

function safeStorage() {
  try {
    const k = '__tls_probe__';
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
    return window.localStorage;
  } catch {
    // Private browsing or blocked storage: keep progress for this session only.
    const mem = new Map();
    return {
      getItem: (k) => (mem.has(k) ? mem.get(k) : null),
      setItem: (k, v) => mem.set(k, String(v)),
      removeItem: (k) => mem.delete(k),
    };
  }
}

const storage = safeStorage();
const bus = createEventBus();
const settings = createSettings(storage);
const saves = createSaveManager(storage);
const game = createGame({ content, bus });
const announcer = createAnnouncer({
  settings,
  politeEl: document.getElementById('live-polite'),
  assertiveEl: document.getElementById('live-assertive'),
});
const audio = createAudio({ settings });

function applyDisplay() {
  const root = document.documentElement;
  root.dataset.textSize = settings.get('textSize');
  root.dataset.contrast = settings.get('highContrast') ? 'high' : 'normal';
}
applyDisplay();
settings.onChange(applyDisplay);

const app = createApp({
  root: document.getElementById('screen'),
  game,
  saves,
  settings,
  announcer,
  audio,
  bus,
  screens: {
    firstRun: firstRunScreen,
    title: titleScreen,
    confirm: confirmScreen,
    pause: pauseScreen,
    saves: savesScreen,
    history: historyScreen,
    help: helpScreen,
    game: gameScreen,
    journal: journalScreen,
    reader: readerScreen,
    inventory: inventoryScreen,
    settings: settingsScreen,
  },
});

// Exposed for debugging and automated tests only.
window.__tls = { app, game, settings, saves };

app.show(settings.get('firstRunDone') ? 'title' : 'firstRun');
