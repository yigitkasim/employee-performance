// GrowthMatrix v2 — skill gaps + growth simulator (draggable)

// ---------- GAPS ----------
screens.gaps = () => {
  afterLayout(initHeatmap);
  // team-wide avg gap per skill
  const agg = {};
  TEAM.forEach(t => Object.entries(mskills(t.id)).forEach(([n, v]) => {
    agg[n] = agg[n] || { gapSum: 0, below: 0 };
    const g = v.e - v.c;
    agg[n].gapSum += Math.max(0, g);
    if (g >= 1) agg[n].below++;
  }));
  const top = Object.entries(agg).map(([n, a]) => [n, a.gapSum / TEAM.length, a.below])
    .sort((a,b) => b[1] - a[1]).slice(0, 5);
  const maxGap = Math.max(0.1, top[0] ? top[0][1] : 1);
  return `
  <div class="flex justify-between items-end mb-5">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Skill gaps</h1>
      <p class="text-slate-500 text-sm mt-0.5">Live from current ratings — where coaching investment will pay off most.</p>
    </div>
    <div class="flex gap-2">
      <button onclick="toast('Role filter is stubbed in this prototype')" class="text-sm border border-slate-200 rounded-md px-3 py-1.5">Filter: All roles ▾</button>
      <button onclick="toast('Export is stubbed in this prototype')" class="text-sm border border-slate-200 rounded-md px-3 py-1.5">Export ↗</button>
    </div>
  </div>

  <div class="grid grid-cols-3 gap-4 mb-5">
    <div class="bg-white border border-slate-200 rounded-xl p-5">
      <div class="font-semibold mb-3">Top team-wide gaps</div>
      <ul class="space-y-3">
        ${top.map(([n, g, p]) => `
          <li>
            <div class="flex justify-between"><span class="text-sm">${n}</span><span class="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 rounded">${p} below target</span></div>
            <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1"><div class="h-full bg-amber-500" style="width:${(g/maxGap)*100}%"></div></div>
            <div class="text-xs text-slate-500 mt-1">avg gap ${g.toFixed(1)} pts</div>
          </li>
        `).join('')}
      </ul>
    </div>

    <div class="col-span-2 bg-white border border-slate-200 rounded-xl p-5">
      <div class="flex justify-between items-center mb-3">
        <div class="font-semibold">Heatmap · skills × people</div>
        <div class="flex gap-3 text-xs text-slate-500">
          <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-sm" style="background:#fee2e2"></span>Big gap</span>
          <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-sm" style="background:#fef3c7"></span>Some gap</span>
          <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-sm" style="background:#d1fae5"></span>At target</span>
        </div>
      </div>
      <div id="heatmap" class="overflow-auto scroll-area"></div>
    </div>
  </div>

  <div class="grid grid-cols-3 gap-4">
    ${[
      ['Coaching opportunities', coachingTips(), 'emerald'],
      ['Quick wins', quickWins(), 'blue'],
      ['Risks', riskNotes(), 'amber'],
    ].map(([title, items, c]) => `
      <div class="bg-white border border-slate-200 rounded-xl p-5">
        <div class="font-semibold mb-2 text-${c}-700">${title}</div>
        <ul class="text-sm text-slate-700 space-y-1.5 list-disc list-inside">${items.map(i => `<li>${i}</li>`).join('')}</ul>
      </div>
    `).join('')}
  </div>
  `;
};

function coachingTips(){
  const tips = [];
  // find mentors: someone at 5 on a skill where ≥2 others have gap ≥1
  const names = {};
  TEAM.forEach(t => Object.entries(mskills(t.id)).forEach(([n, v]) => {
    names[n] = names[n] || { expert: null, needy: 0 };
    if (v.c >= 5) names[n].expert = names[n].expert || firstName(t);
    if (v.e - v.c >= 1) names[n].needy++;
  }));
  Object.entries(names).filter(([, x]) => x.expert && x.needy >= 2)
    .sort((a,b) => b[1].needy - a[1].needy).slice(0, 3)
    .forEach(([n, x]) => tips.push(`${x.expert} can mentor ${x.needy} on ${n}`));
  return tips.length ? tips : ['No clear mentor pairings yet — rate more skills.'];
}
function quickWins(){
  const wins = [];
  const oneAway = {};
  TEAM.forEach(t => Object.entries(mskills(t.id)).forEach(([n, v]) => {
    if (v.e - v.c === 1) oneAway[n] = (oneAway[n] || 0) + 1;
  }));
  Object.entries(oneAway).sort((a,b) => b[1] - a[1]).slice(0, 3)
    .forEach(([n, c]) => wins.push(`${c} ${c > 1 ? 'people are' : 'person is'} 1pt from target on ${n}`));
  return wins.length ? wins : ['Nothing within a 1-pt reach right now.'];
}
function riskNotes(){
  const risks = [];
  const atTarget = {};
  TEAM.forEach(t => Object.entries(mskills(t.id)).forEach(([n, v]) => {
    atTarget[n] = atTarget[n] || 0;
    if (v.c >= v.e) atTarget[n]++;
  }));
  Object.entries(atTarget).filter(([, c]) => c <= 1).slice(0, 2)
    .forEach(([n, c]) => risks.push(`${n}: only ${c} at target across the team`));
  risks.push('Elena hasn\u2019t been logged in 6 weeks');
  return risks;
}

function initHeatmap(){
  const el = document.getElementById('heatmap'); if (!el) return;
  const skills = Object.entries(CATALOG).flatMap(([cat, sks]) => sks.slice(0, 4).map(s => s[0]));
  let html = `<table class="border-separate border-spacing-1 text-xs"><thead><tr><th></th>${TEAM.map(t => `<th class="px-1 align-bottom"><div style="writing-mode:vertical-rl;transform:rotate(180deg);font-weight:500;color:#475569;white-space:nowrap">${firstName(t)}</div></th>`).join('')}</tr></thead><tbody>`;
  for (const name of skills) {
    html += `<tr><td class="text-right pr-2 text-xs text-slate-700 whitespace-nowrap">${name}</td>`;
    for (const t of TEAM) {
      const v = mskills(t.id)[name];
      const gap = Math.max(0, Math.min(3, v.e - v.c));
      const bg = gap === 0 ? '#d1fae5' : gap === 1 ? '#fef3c7' : gap === 2 ? '#fed7aa' : '#fee2e2';
      html += `<td><div class="heatcell" style="background:${bg}" title="${firstName(t)} · ${name}: ${v.c} of ${v.e}">${gap === 0 ? '✓' : gap}</div></td>`;
    }
    html += '</tr>';
  }
  el.innerHTML = html + '</tbody></table>';
}

// ---------- GROWTH SIMULATOR ----------
let simChart = null;

function simSkills(mid){
  // 6 biggest-gap skills; stable order
  return topGaps(mid, 6).map(([name, g, c, e]) => ({ name, c, e }));
}
function simVals(mid){
  S.sim[mid] = S.sim[mid] || {};
  return S.sim[mid];
}

screens.sim = () => {
  const m = member();
  const skills = simSkills(m.id);
  const sim = simVals(m.id);
  afterLayout(() => { initSimChart(m.id); bindSimTracks(m.id); updateSimKPIs(m.id); });
  return `
  <div class="flex justify-between items-end mb-5">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Growth simulator · ${firstName(m)}</h1>
      <p class="text-slate-500 text-sm mt-0.5">Drag any dot to see how readiness, time-to-promo, and band move. Nothing here changes real scores.</p>
    </div>
    <div class="flex gap-2 items-center">
      ${memberSelect()}
      <button onclick="resetSim()" class="text-sm border border-slate-200 rounded-md px-3 py-1.5 hover:bg-slate-50">Reset</button>
      <button onclick="toast('Plan saved — it will persist across reloads')" class="text-sm bg-indigo-600 text-white rounded-md px-3 py-1.5">Save as plan</button>
    </div>
  </div>

  <div class="grid grid-cols-4 gap-4 mb-5" id="sim-kpis">
    ${['Readiness','Est. time to next level','Avg score','Band'].map((l, i) => `
      <div class="bg-white border border-slate-200 rounded-xl p-4">
        <div class="text-xs text-slate-500">${l}</div>
        <div class="mt-1 text-xl font-semibold flex items-baseline gap-1.5">
          <span class="text-slate-400" data-kpi="now-${i}">–</span><span class="text-slate-300">→</span>
          <span class="text-indigo-600" data-kpi="sim-${i}">–</span>
          <span class="text-xs text-slate-400 font-normal" data-kpi="unit-${i}"></span>
        </div>
        ${i === 0 ? `<div class="mt-2 relative h-1.5 bg-slate-100 rounded-full overflow-hidden"><div class="absolute inset-y-0 left-0 bg-indigo-600 rounded-full transition-all" style="width:0%" data-kpi="bar"></div><div class="absolute inset-y-0 left-0 bg-slate-300 rounded-full" style="width:0%" data-kpi="bar-now"></div></div>` : ''}
      </div>
    `).join('')}
  </div>

  <div class="grid grid-cols-3 gap-4">
    <div class="col-span-2 bg-white border border-slate-200 rounded-xl p-5">
      <div class="font-semibold mb-1">Drag the dot to simulate</div>
      <div class="text-xs text-slate-500 mb-4">Showing the 6 biggest gaps for ${firstName(m)} · dot can't go below today's score</div>
      <div class="space-y-5" id="sim-rows">
        ${skills.map(({name, c, e}) => {
          const s = Math.max(c, sim[name] || c);
          return `
          <div data-skill="${name}" data-c="${c}" data-e="${e}">
            <div class="flex justify-between text-sm mb-1.5">
              <span class="font-medium">${name}</span>
              <span class="text-xs text-slate-500">${c} <span class="text-slate-300">→</span> <strong class="text-indigo-700" data-role="val">${s}</strong> · target ${e}</span>
            </div>
            <div class="sim-track relative h-2 bg-slate-100 rounded-full" style="touch-action:none;cursor:pointer">
              <div class="absolute inset-y-0 left-0 bg-slate-300 rounded-full pointer-events-none" style="width:${(c/5)*100}%"></div>
              <div class="absolute inset-y-0 left-0 bg-indigo-200 rounded-full pointer-events-none" data-role="fill" style="width:${(s/5)*100}%"></div>
              <div class="absolute top-[-3px] bottom-[-3px] w-0.5 bg-slate-700 pointer-events-none" style="left:${(e/5)*100}%"></div>
              <div class="absolute top-[-5px] w-3.5 h-3.5 rounded-full ${s > c ? 'bg-indigo-600' : 'bg-slate-400'} border-2 border-white shadow" data-role="dot" style="left:calc(${(s/5)*100}% - 7px);cursor:grab"></div>
            </div>
            <div class="text-xs text-slate-500 mt-1.5 min-h-[18px]" data-role="hint">${simHint(name, c, s)}</div>
          </div>`;
        }).join('')}
        ${skills.length === 0 ? '<div class="text-sm text-slate-500">No gaps to simulate — all skills at target.</div>' : ''}
      </div>
    </div>
    <div class="space-y-4">
      <div class="bg-white border border-slate-200 rounded-xl p-5">
        <div class="font-semibold mb-2">What changes</div>
        <div style="position:relative;height:220px"><canvas id="simRadar"></canvas></div>
        <div class="flex justify-center gap-3 text-xs text-slate-500 mt-2">
          <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-sm bg-slate-300"></span>Now</span>
          <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-sm bg-indigo-600"></span>Sim</span>
        </div>
      </div>
      <div class="bg-white border border-slate-200 rounded-xl p-5">
        <div class="font-semibold mb-2">Recommended path</div>
        <ul class="text-sm text-slate-700 space-y-2" id="sim-path">${simPath(m.id)}</ul>
      </div>
    </div>
  </div>
  `;
};

function simHint(name, c, s){
  if (s <= c) return '';
  return `≈ ${(s - c) * 6} weeks of focused work · <span class="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">pair with a senior</span> <span class="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">stretch project</span>`;
}
function simPath(mid){
  const sim = simVals(mid);
  const boosted = simSkills(mid).filter(({name, c}) => (sim[name] || c) > c);
  if (!boosted.length) return '<li class="text-slate-500">Drag a dot up to build a path.</li>';
  return boosted.map(({name, c}, i) => {
    const s = sim[name];
    return `<li><strong>Mo ${i*2+1}–${i*2+2}:</strong> ${name} ${c} → ${s} — shadow, then own it solo</li>`;
  }).join('');
}

function bindSimTracks(mid){
  document.querySelectorAll('#sim-rows [data-skill]').forEach(row => {
    const track = row.querySelector('.sim-track');
    const c = +row.dataset.c;
    const setFrom = (ev) => {
      const r = track.getBoundingClientRect();
      let v = Math.round(((ev.clientX - r.left) / r.width) * 5);
      v = clampv(c, 5, v);
      setSimVal(mid, row, v);
    };
    track.addEventListener('pointerdown', (ev) => {
      ev.preventDefault();
      track.setPointerCapture(ev.pointerId);
      setFrom(ev);
      const move = (e2) => setFrom(e2);
      const up = () => { track.removeEventListener('pointermove', move); track.removeEventListener('pointerup', up); };
      track.addEventListener('pointermove', move);
      track.addEventListener('pointerup', up);
    });
  });
}

function setSimVal(mid, row, v){
  const name = row.dataset.skill, c = +row.dataset.c;
  const sim = simVals(mid);
  if ((sim[name] || c) === v) return;
  sim[name] = v; save();
  row.querySelector('[data-role="val"]').textContent = v;
  row.querySelector('[data-role="fill"]').style.width = (v/5)*100 + '%';
  const dot = row.querySelector('[data-role="dot"]');
  dot.style.left = `calc(${(v/5)*100}% - 7px)`;
  dot.className = `absolute top-[-5px] w-3.5 h-3.5 rounded-full ${v > c ? 'bg-indigo-600' : 'bg-slate-400'} border-2 border-white shadow`;
  dot.setAttribute('data-role','dot'); dot.style.cursor = 'grab';
  row.querySelector('[data-role="hint"]').innerHTML = simHint(name, c, v);
  const path = document.getElementById('sim-path'); if (path) path.innerHTML = simPath(mid);
  updateSimKPIs(mid);
  updateSimChart(mid);
}

function resetSim(){
  S.sim[S.member] = {}; save();
  go('sim');
}

function simOverrides(mid){
  const sim = simVals(mid), out = {};
  simSkills(mid).forEach(({name, c}) => { if (sim[name] && sim[name] > c) out[name] = sim[name]; });
  return out;
}

function updateSimKPIs(mid){
  const root = document.getElementById('sim-kpis'); if (!root) return;
  const ov = simOverrides(mid);
  const sk = mskills(mid);
  const n = Object.keys(sk).length;
  const avgNow = avgOf(mid);
  const avgSim = Object.entries(sk).reduce((s, [name, v]) => s + (ov[name] != null ? ov[name] : v.c), 0) / n;
  const q = (sel) => root.querySelector(`[data-kpi="${sel}"]`);
  const rNow = readinessOf(mid), rSim = readinessOf(mid, ov);
  q('now-0').textContent = rNow; q('sim-0').textContent = rSim; q('unit-0').textContent = '/100';
  q('now-1').textContent = '~' + monthsToNext(mid) + ' mo'; q('sim-1').textContent = '~' + monthsToNext(mid, ov) + ' mo'; q('unit-1').textContent = 'at sim pace';
  q('now-2').textContent = avgNow.toFixed(1); q('sim-2').textContent = avgSim.toFixed(1); q('unit-2').textContent = '/ 5';
  const m = member(mid);
  q('now-3').textContent = m.level + ' · ' + bandOf(avgNow); q('sim-3').textContent = m.level + ' · ' + bandOf(avgSim);
  q('unit-3').textContent = bandOf(avgSim) !== bandOf(avgNow) ? '+1 internal' : 'no band change';
  q('bar').style.width = rSim + '%'; q('bar-now').style.width = rNow + '%';
}

function initSimChart(mid){
  const c = document.getElementById('simRadar'); if (!c) return;
  const skills = simSkills(mid);
  const sim = simVals(mid);
  simChart = new Chart(c, {
    type: 'radar',
    data: {
      labels: skills.map(s => s.name.length > 14 ? s.name.slice(0, 13) + '…' : s.name),
      datasets: [
        { data: skills.map(s => s.c), backgroundColor:'rgba(148,163,184,0.20)', borderColor:'#94a3b8', borderWidth:2, pointBackgroundColor:'#94a3b8' },
        { data: skills.map(s => Math.max(s.c, sim[s.name] || s.c)), backgroundColor:'rgba(79,70,229,0.25)', borderColor:'#4f46e5', borderWidth:2, pointBackgroundColor:'#4f46e5' }
      ]
    },
    options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}},
      scales:{ r: Object.assign({}, RADAR_SCALE, { pointLabels:{font:{size:9}, color:'#475569'} }) } }
  });
  chartInstances.push(simChart);
}

function updateSimChart(mid){
  if (!simChart) return;
  const sim = simVals(mid);
  simChart.data.datasets[1].data = simSkills(mid).map(s => Math.max(s.c, sim[s.name] || s.c));
  simChart.update();
}
