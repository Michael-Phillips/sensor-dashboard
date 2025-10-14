import { getLatestPerDevice } from './utils.js';
import { renderCards } from './renderCards.js';
import { getCardSettings, createGearModal, closeModal } from './modal.js';

export const BASE_PATH = 'https://michael-phillips.github.io/sensor-dashboard/';

const supabase = window.supabase;
const supabaseUrl = window.supabaseUrl;
const supabaseKey = window.supabaseKey;
const table = 'readings';

let sensorData = [];

const THEME_STORAGE_KEY = 'sensorDashboardTheme';
const THEME_TRANSITION_MS = 450;
const TOGGLE_PULSE_MS = 320;

let themeTransitionTimeoutId = null;
let togglePulseTimeoutId = null;
let prefersReducedMotion = false;

const reduceMotionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

if (reduceMotionQuery) {
  const handleMotionPreference = (event) => {
    prefersReducedMotion = event.matches;
  };

  prefersReducedMotion = reduceMotionQuery.matches;

  if (typeof reduceMotionQuery.addEventListener === 'function') {
    reduceMotionQuery.addEventListener('change', handleMotionPreference);
  } else if (typeof reduceMotionQuery.addListener === 'function') {
    reduceMotionQuery.addListener(handleMotionPreference);
  }
}

function applyTheme(theme) {
  const resolvedTheme = theme === 'dark' ? 'dark' : 'light';
  const isDark = resolvedTheme === 'dark';

  document.body.classList.toggle('dark-theme', isDark);

  const toggle = document.getElementById('themeToggle');
  if (toggle) {
    toggle.setAttribute('aria-pressed', String(isDark));
    const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';
    toggle.setAttribute('aria-label', label);
    toggle.setAttribute('title', label);
  }
}

function readStoredTheme() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch (error) {
    console.warn('Unable to access localStorage for theme', error);
    return null;
  }
}

function storeTheme(theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    console.warn('Unable to store theme preference', error);
  }
}

function resolveInitialTheme() {
  const stored = readStoredTheme();
  if (stored === 'dark' || stored === 'light') {
    return stored;
  }

  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return 'light';
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function triggerThemeTransition(toggle) {
  if (!toggle || prefersReducedMotion) {
    return;
  }

  const rect = toggle.getBoundingClientRect();
  const xPercent = clamp(((rect.left + rect.width / 2) / window.innerWidth) * 100, 0, 100);
  const yPercent = clamp(((rect.top + rect.height / 2) / window.innerHeight) * 100, 0, 100);

  document.body.style.setProperty('--transition-origin-x', `${xPercent}%`);
  document.body.style.setProperty('--transition-origin-y', `${yPercent}%`);

  document.body.classList.remove('theme-transition');
  void document.body.offsetWidth;
  document.body.classList.add('theme-transition');

  if (themeTransitionTimeoutId) {
    clearTimeout(themeTransitionTimeoutId);
  }

  themeTransitionTimeoutId = setTimeout(() => {
    document.body.classList.remove('theme-transition');
    themeTransitionTimeoutId = null;
  }, THEME_TRANSITION_MS);

  toggle.classList.remove('theme-toggle--pulse');
  void toggle.offsetWidth;
  toggle.classList.add('theme-toggle--pulse');

  if (togglePulseTimeoutId) {
    clearTimeout(togglePulseTimeoutId);
  }

  togglePulseTimeoutId = setTimeout(() => {
    toggle.classList.remove('theme-toggle--pulse');
    togglePulseTimeoutId = null;
  }, TOGGLE_PULSE_MS);
}

function initThemeToggle() {
  const toggle = document.getElementById('themeToggle');
  if (!toggle) {
    return;
  }

  toggle.addEventListener('click', () => {
    const nextTheme = document.body.classList.contains('dark-theme') ? 'light' : 'dark';
    triggerThemeTransition(toggle);
    applyTheme(nextTheme);
    storeTheme(nextTheme);
  });
}

export async function saveCardSettings(cardId, updatedMetadata) {
  const supabase = window.supabase;

  console.log('💾 Saving metadata for', cardId, updatedMetadata);

  const { data, error } = await supabase
    .from('readings')
    .update({ metadata: updatedMetadata })
    .eq('device_id', String(cardId).trim());

  if (error) {
    console.error('❌ Supabase update failed:', error);
  } else {
    console.log('✅ Supabase update succeeded:', data);
  }
}

function updateLocalCardSettings(cardId, updatedMetadata) {
  // Clone and update sensorData safely
  const updatedSensorData = sensorData.map(row =>
    row.device_id === cardId
      ? { ...row, metadata: { ...row.metadata, ...updatedMetadata } }
      : row
  );
console.log('📦 Updating local card for:', cardId);
console.log('📦 Metadata being applied:', updatedMetadata);

  sensorData = updatedSensorData; // ✅ update global reference
  
  console.log('🔄 Updated metadata for', cardId, updatedMetadata);

  renderCards(sensorData, document.getElementById('cardContainer'), updateLocalCardSettings, deleteCard);
}

function deleteCard(cardId) {
  const index = sensorData.findIndex(r => r.device_id === cardId);
  if (index !== -1) {
    sensorData.splice(index, 1);
    //renderCards(sensorData, document.getElementById('cardContainer'), saveCardSettings, deleteCard);
renderCards(sensorData, document.getElementById('cardContainer'), updateLocalCardSettings, deleteCard);

  }
}

async function fetchReadings() {
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*&order=timestamp.desc`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    }
  });

  const data = await response.json();
  if (!Array.isArray(data)) {
    document.getElementById('cardContainer').innerHTML = `<div class="card"><h3>API Error</h3><p>${data.message}</p></div>`;
    return;
  }

  sensorData = getLatestPerDevice(data);
  renderCards(sensorData, document.getElementById('cardContainer'), saveCardSettings, deleteCard);
}

const initialTheme = resolveInitialTheme();
applyTheme(initialTheme);

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  fetchReadings();
});
