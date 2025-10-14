const grid = document.getElementById('grid');
const loginBtn = document.getElementById('loginBtn');
const showCompleted = document.getElementById('showCompleted');

loginBtn.addEventListener('click', () => {
  window.location.href = '/auth/start';
});

showCompleted.addEventListener('change', () => {
  loadTasks();
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
  const imgSrc = `/icons/${key}.svg`
  const cls = `card ${task.status === 'completed' ? 'completed' : ''}`;
  return `
    <div class="${cls}" data-id="${task.id}">
      <img class="picto" src="${imgSrc}" alt="${key}" onerror="this.src='/icons/generiek.svg'"/>
      <div class="title">${task.title || '(zonder titel)'}</div>
    </div>
  `;
}

async function loadTasks() {
  grid.innerHTML = `<div class="empty">Laden…</div>`;
  try {
    const url = `/api/tasks?completed=${showCompleted.checked ? 'true' : 'false'}`;
    const res = await fetch(url);
    if (res.status === 401) {
      grid.innerHTML = `<div class="empty">Niet ingelogd. Klik boven op <b>Inloggen met Google</b>.</div>`;
      return;
    }
    const data = await res.json();
    const tasks = data.tasks || [];
    if (!tasks.length) {
      grid.innerHTML = `<div class="empty">Geen taken gevonden</div>`;
      return;
    }
    grid.innerHTML = tasks.map(cardTemplate).join('');
    bindCardClicks();
  } catch (e) {
    console.error(e);
    grid.innerHTML = `<div class="empty">Fout bij laden van taken</div>`;
  }
}

function bindCardClicks() {
  grid.querySelectorAll('.card').forEach(el => {
    el.addEventListener('click', async () => {
      const id = el.getAttribute('data-id');
      const wasCompleted = el.classList.contains('completed');
      // Optimistische toggle
      el.classList.toggle('completed');
      try {
        const res = await fetch(`/api/tasks/${id}/toggle`, { method: 'POST' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Update mislukt');
        await loadTasks();
      } catch (e) {
        console.error(e);
        alert('Bijwerken van de taak is mislukt. Controleer je login en probeer opnieuw.');
        // revert als mislukt
        if (el.classList.contains('completed') === wasCompleted) {
          // niets te doen
        } else {
          el.classList.toggle('completed');
        }
      }
    });
  });
}

loadTasks();
