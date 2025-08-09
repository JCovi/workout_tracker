const $ = (sel, el=document) => el.querySelector(sel);
const $$ = (sel, el=document) => [...el.querySelectorAll(sel)];

const api = {
  days: () => fetch('/days').then(r=>r.json()),
  exercises: (day_id) => fetch(`/exercises?day_id=${day_id}`).then(r=>r.json()),
  addExercise: (payload) =>
    fetch('/exercises', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })
      .then(r=>r.json())
};

const setsOptions = Array.from({length:10}, (_,i)=>i+1);
const repsOptions = Array.from({length:20}, (_,i)=>i+1);

function makeSelect(options, value){
  const s = document.createElement('select');
  for(const o of options){
    const opt = document.createElement('option');
    opt.value = o; opt.textContent = o;
    if (o === value) opt.selected = true;
    s.appendChild(opt);
  }
  return s;
}

function dayCard(day){
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
      <div class="controls">
        <input type="text" placeholder="Exercise name" class="name" />
        <select class="sets"></select>
        <select class="reps"></select>
        <input type="number" class="weight" min="0" step="1" value="0" />
        <input type="number" class="rest" min="0" step="5" value="90" />
        <button class="add-btn">Add</button>
      </div>
    </div>
  `;

  // fill selects
  const setsSel = $('.sets', wrap); setsOptions.forEach(v=>setsSel.append(new Option(v, v)));
  const repsSel = $('.reps', wrap); repsOptions.forEach(v=>repsSel.append(new Option(v, v)));

  // toggle
  $('.day-header', wrap).addEventListener('click', () => {
    const open = wrap.classList.toggle('open');
    $('.day-header', wrap).setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  // add handler
  $('.add-btn', wrap).addEventListener('click', async () => {
    const payload = {
      day_id: day.id,
      name: $('.name', wrap).value.trim(),
      sets: Number($('.sets', wrap).value),
      reps: Number($('.reps', wrap).value),
      weight_lbs: Number($('.weight', wrap).value || 0),
      rest_seconds: Number($('.rest', wrap).value || 0),
      position: 0
    };
    if (!payload.name) { alert('Enter exercise name'); return; }
    if (!(payload.sets >= 1 && payload.sets <= 10)) { alert('Sets must be 1–10'); return; }
    if (!(payload.reps >= 1 && payload.reps <= 20)) { alert('Reps must be 1–20'); return; }
    if (!Number.isInteger(payload.weight_lbs) || payload.weight_lbs < 0) { alert('Weight must be ≥ 0'); return; }
    if (!Number.isInteger(payload.rest_seconds) || payload.rest_seconds < 0) { alert('Rest must be ≥ 0'); return; }
    
    const res = await api.addExercise(payload);
    if (res.error) { alert(res.error); return; }
    await loadExercisesInto(wrap, day.id);
    $('.name', wrap).value = '';
  });

  return wrap;
}

async function loadExercisesInto(card, dayId){
    const rows = $('.rows', card);
    rows.innerHTML = '';
    const data = await api.exercises(dayId);
  
    for(const ex of data){
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
        const res = await fetch(`/exercises/${ex.id}`, { method: 'DELETE' });
        if (!res.ok) { alert('Delete failed'); return; }
        await loadExercisesInto(card, dayId);
      });
  
      // EDIT (quick inline prompt-based)
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
        const res = await fetch(`/exercises/${ex.id}`, {
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
  

async function init(){
  const daysWrap = $('#days');
  const days = await api.days();
  daysWrap.innerHTML = '';
  for(const d of days){
    const card = dayCard(d);
    daysWrap.appendChild(card);
    // lazy load exercises the first time you open the day
    $('.day-header', card).addEventListener('click', async () => {
      if ($('.rows', card).childElementCount === 0) {
        await loadExercisesInto(card, d.id);
      }
    }, { once: true });
  }

  // Expand/Collapse all
  $('#expandAll').addEventListener('click', async () => {
    for(const card of $$('.day')) {
      const body = $('.day-body', card);
      if (!card.classList.contains('open')) $('.day-header', card).click();
      // ensure data is loaded
      if ($('.rows', card).childElementCount === 0) await loadExercisesInto(card, Number(card.dataset.dayId));
    }
  });
  $('#collapseAll').addEventListener('click', () => {
    for(const card of $$('.day')) card.classList.remove('open');
  });
}

init();
