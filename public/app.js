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
      <div></div>
    `;
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
