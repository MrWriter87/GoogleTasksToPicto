import { sortTasksByDue } from './sorting.js';

const grid = document.getElementById('grid');
const loginBtn = document.getElementById('loginBtn');

let tasks = [];
const pendingToggleIds = new Set();

const params = new URLSearchParams(window.location.search);
const kioskParam = params.get('kiosk');
const labelsParam = params.get('labels');

function isTruthyParam(value) {
  if (!value) return false;
  const normalized = value.toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
}

const kioskMode =
  kioskParam === '1' ||
  kioskParam === 'true' ||
  kioskParam === 'yes' ||
  window.self !== window.top;

if (kioskMode) {
  document.body.classList.add('kiosk');
  if (!isTruthyParam(labelsParam)) {
    document.body.classList.add('hide-titles');
  }
}

loginBtn.addEventListener('click', () => {
  window.location.href = '/auth/start';
});

function parsePictoKey(task) {
  const hay = `${task.title} ${task.notes || ''}`.toLowerCase();
  const m = hay.match(/picto:([a-z0-9_-]+)/i);
  if (m) return m[1];
  // eenvoudige fallback op keywords/emoji
  if (hay.includes('tand') || hay.includes('🦷')) return 'tandenpoetsen';
  if (hay.includes('aankleed') || hay.includes('👕')) return 'aankleden';
  if (hay.includes('ontbijt') || hay.includes('🍽') || hay.includes('🍳')) return 'ontbijt';
  if (hay.includes('jas') || hay.includes('🧥')) return 'jas';
  if (hay.includes('school') || hay.includes('🎒')) return 'school';
  if (hay.includes('douche') || hay.includes('🚿')) return 'douche';
  if (hay.includes('toilet') || hay.includes('🚽')) return 'toilet';
  if (hay.includes('handen') || hay.includes('wassen') || hay.includes('🧼')) return 'handenwassen';
  if (hay.includes('slapen') || hay.includes('🛏')) return 'slapen';
  if (hay.includes('bus') || hay.includes('🚌')) return 'bus';
  return 'generiek';
}

function cardTemplate(task) {
  const key = parsePictoKey(task);
  const imgSrc = `/icons/${key}.png`
  const cls = [
    'card',
    task.status === 'completed' ? 'completed' : '',
    pendingToggleIds.has(task.id) ? 'pending' : ''
  ]
    .filter(Boolean)
    .join(' ');
  return `
    <div class="${cls}" data-id="${task.id}">
      <div class="picto-wrapper">
        <img class="picto" src="${imgSrc}" alt="${key}" onerror="this.src='/icons/generiek.png'"/>
      </div>
      <div class="title">${task.title || '(zonder titel)'}</div>
    </div>
  `;
}

function setGridMessage(message) {
  grid.innerHTML = `<div class="empty">${message}</div>`;
}

function renderTasks() {
  if (!tasks.length) {
    setGridMessage('Geen taken gevonden');
    return;
  }

  grid.innerHTML = tasks.map(cardTemplate).join('');
  bindCardClicks();
}

async function loadTasks() {
  setGridMessage('Laden…');
  try {
    const res = await fetch('/api/tasks');
    if (res.status === 401) {
      const kioskHint = document.body.classList.contains('kiosk')
        ? 'Log in via de hoofdweergave buiten de kiosk-modus.'
        : 'Klik boven op <b>Inloggen met Google</b>.';
      setGridMessage(`Niet ingelogd. ${kioskHint}`);
      return;
    }
    const data = await res.json();
    tasks = sortTasksByDue(data.tasks || []);
    renderTasks();
  } catch (e) {
    console.error(e);
    setGridMessage('Fout bij laden van taken');
  }
}

function bindCardClicks() {
  grid.querySelectorAll('.card').forEach(el => {
    el.addEventListener('click', () => handleCardToggle(el));
  });
}

async function handleCardToggle(el) {
  const id = el.getAttribute('data-id');
  if (!id || pendingToggleIds.has(id)) return;

  const originalTask = tasks.find(task => task.id === id);
  if (!originalTask) return;
  const original = { ...originalTask };

  const optimisticStatus = original.status === 'completed' ? 'needsAction' : 'completed';

  pendingToggleIds.add(id);
  tasks = tasks.map(task =>
    task.id === id ? { ...task, status: optimisticStatus } : task
  );
  renderTasks();

  try {
    const res = await fetch(`/api/tasks/${id}/toggle`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Update mislukt');
    tasks = tasks.map(task =>
      task.id === id ? { ...task, ...data.task } : task
    );
  } catch (e) {
    console.error(e);
    tasks = tasks.some(task => task.id === id)
      ? tasks.map(task => (task.id === id ? { ...original } : task))
      : [...tasks, original];
    alert('Bijwerken van de taak is mislukt. Controleer je login en probeer opnieuw.');
  } finally {
    pendingToggleIds.delete(id);
    renderTasks();
  }
}

loadTasks();
