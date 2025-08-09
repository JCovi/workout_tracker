// Helpers
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

// Determine API base (local vs. production)
// Replace the URL below with your actual Render backend URL.
const API_BASE =
  window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : 'https://YOUR-RENDER-SERVICE.onrender.com';

// API
const api = {
  days: () => fetch(`${API_BASE}/days`).then(r => r.json()),
  exercises: (day_id) => fetch(`${API_BASE}/exercises?day_id=${day_id}`).then(r => r.json()),
  addExercise: (payload) =>
    fetch(`${API_BASE}/exercises`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(r => r.json())
};

// Options for selects
const setsOptions = Array.from({ length: 10 }, (_, i) => i + 1);
const repsOptions = Array.from({ length: 20 }, (_, i) => i + 1);

// (kept for future use; not required right now)
function makeSelect(options, value) {
  const s = document.createElement('select');
  for (const o of options) {
    const opt = document.createElement('option');
    opt.value = o; opt.textContent = o;
    if (o === value) opt.selected = true;
    s.appendChild(opt);
  }
  return s;
}

// Build one day card
function dayCard(day) {
  const wrap = document.createElement('section');
  wrap.className = 'day';
  wrap.dataset.dayId = day.id;

  wrap.innerHTML = `
    <div class="day-header" role="button" aria-expanded="false">
      <h2>${day.name}</h2>
      <span class="chev">▶</span>
    </div>

    <div class="day-body">
      <div class="row" style="font-weight:600;color:#444;">
        <div>Exercise</div><div>Sets</div><div>Reps</div><div>Weight (lb)</div><div>Rest (sec)</div><div></div>
      </div>

      <div class="rows"></div>

      <!-- ADD controls -->
      <div class="add-controls" style="margin-top:8px;">
        <!-- Visible trigger -->
        <button class="show-add" type="button">Add</button>

        <!-- Hidden input row -->
        <div class="add-row hidden" style="display:flex; gap:8px; align-items:center; margin-top:8px;">
          <input type="text" placeholder="Exercise name" class="name" />
          <select class="sets"></select>
          <select class="reps"></select>
          <input type="number" class="weight" min="0" step="1" value="0" />
          <input type="number" class="rest"   min="0" step="5" value="90" />

          <div class="form-actions">
            <button class="save-add" type="button">Save</button>
            <button class="cancel-add" type="button">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Fill selects (1..10 and 1..20)
  const setsSel = $('.sets', wrap); setsOptions.forEach(v => setsSel.append(new Option(v, v)));
  const repsSel = $('.reps', wrap); repsOptions.forEach(v => repsSel.append(new Option(v, v)));

  // Expand/collapse + first-load-on-open
  let exercisesLoaded = false;
  $('.day-header', wrap).addEventListener('click', async () => {
    const open = wrap.classList.toggle('open');
    $('.day-header', wrap).setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open && !exercisesLoaded) {
      await loadExercisesInto(wrap, day.id);
      exercisesLoaded = true;
    }
  });

  // Show/Hide/Save wiring
  const showBtn   = $('.show-add',   wrap);
  const addRow    = $('.add-row',    wrap);
  const saveBtn   = $('.save-add',   wrap);
  const cancelBtn = $('.cancel-add', wrap);

  const nameEl   = $('.name',   wrap);
  const setsEl   = $('.sets',   wrap);
  const repsEl   = $('.reps',   wrap);
  const weightEl = $('.weight', wrap);
  const restEl   = $('.rest',   wrap);

  // Show inputs
  showBtn.addEventListener('click', () => {
    addRow.classList.remove('hidden');
    showBtn.classList.add('hidden');
    nameEl.focus();
  });

  // Cancel and hide again
  cancelBtn.addEventListener('click', () => {
    addRow.classList.add('hidden');
    showBtn.classList.remove('hidden');
  });

  // Save (POST)
  saveBtn.addEventListener('click', async () => {
    const payload = {
      day_id: day.id,
      name:  nameEl.value.trim(),
      sets:  Number(setsEl.value),
      reps:  Number(repsEl.value),
      weight_lbs:   Number(weightEl.value || 0),
      rest_seconds: Number(restEl.value || 0),
      position: 0
    };

    // Validation
    if (!payload.name) { alert('Enter exercise name'); return; }
    if (!(payload.sets >= 1 && payload.sets <= 10)) { alert('Sets must be 1–10'); return; }
    if (!(payload.reps >= 1 && payload.reps <= 20)) { alert('Reps must be 1–20'); return; }
    if (!Number.isInteger(payload.weight_lbs) || payload.weight_lbs < 0) { alert('Weight must be ≥ 0'); return; }
    if (!Number.isInteger(payload.rest_seconds) || payload.rest_seconds < 0) { alert('Rest must be ≥ 0'); return; }

    const res = await api.addExercise(payload);
    if (res.error) { alert(res.error); return; }

    await loadExercisesInto(wrap, day.id);

    // Clear + hide
    nameEl.value = '';
    setsEl.value = '1';
    repsEl.value = '1';
    weightEl.value = '0';
    restEl.value = '90';

    addRow.classList.add('hidden');
    showBtn.classList.remove('hidden');
  });

  return wrap;
}

// Render exercises for a day
async function loadExercisesInto(card, dayId) {
  const rows = $('.rows', card);
  rows.innerHTML = '';

  let data = await api.exercises(dayId);
  // Ensure newest go to bottom
  data.sort((a, b) => a.id - b.id);

  for (const ex of data) {
    const line = document.createElement('div');
    line.className = 'row';
    line.innerHTML = `
      <div>${ex.name}</div>
      <div>${ex.sets}</div>
      <div>${ex.reps}</div>
      <div>${ex.weight_lbs}</div>
      <div>${ex.rest_seconds}</div>
      <div style="display:flex; gap:6px;">
        <button class="edit-btn">Edit</button>
        <button class="del-btn">Delete</button>
      </div>
    `;

    // DELETE
    $('.del-btn', line).addEventListener('click', async () => {
      const sure = confirm(`Delete "${ex.name}"?`);
      if (!sure) return;
      const res = await fetch(`${API_BASE}/exercises/${ex.id}`, { method: 'DELETE' });
      if (!res.ok) { alert('Delete failed'); return; }
      await loadExercisesInto(card, dayId);
    });

    // EDIT (prompt-driven)
    $('.edit-btn', line).addEventListener('click', async () => {
      const name = prompt('Exercise name:', ex.name);
      if (name === null || name.trim() === '') return;

      const sets = Number(prompt('Sets (1–10):', ex.sets));
      if (!Number.isInteger(sets) || sets < 1 || sets > 10) { alert('Sets must be 1–10'); return; }

      const reps = Number(prompt('Reps (1–20):', ex.reps));
      if (!Number.isInteger(reps) || reps < 1 || reps > 20) { alert('Reps must be 1–20'); return; }

      const weight_lbs = Number(prompt('Weight (lb):', ex.weight_lbs));
      if (!Number.isInteger(weight_lbs) || weight_lbs < 0) { alert('Weight must be ≥ 0'); return; }

      const rest_seconds = Number(prompt('Rest (sec):', ex.rest_seconds));
      if (!Number.isInteger(rest_seconds) || rest_seconds < 0) { alert('Rest must be ≥ 0'); return; }

      const body = { name, sets, reps, weight_lbs, rest_seconds };
      const res = await fetch(`${API_BASE}/exercises/${ex.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) { alert('Update failed'); return; }
      await loadExercisesInto(card, dayId);
    });

    rows.appendChild(line);
  }
}

// Init
async function init() {
  const daysWrap = $('#days');
  const days = await api.days();
  daysWrap.innerHTML = '';

  for (const d of days) {
    const card = dayCard(d);
    daysWrap.appendChild(card);
  }

  // Expand/Collapse all (avoid duplicate loads; rely on header click handler)
  $('#expandAll').addEventListener('click', () => {
    for (const card of $$('.day')) {
      if (!card.classList.contains('open')) {
        $('.day-header', card).click();
      }
    }
  });

  $('#collapseAll').addEventListener('click', () => {
    for (const card of $$('.day')) {
      if (card.classList.contains('open')) {
        $('.day-header', card).click(); // use same handler to keep aria-expanded in sync
      }
    }
  });
}

init();
