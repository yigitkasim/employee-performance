// GrowthMatrix v2 — team, profile, skills (rate) screens

// ---------- TEAM ----------
function teamRows(){
  const q = (S.teamQuery || '').toLowerCase();
  let rows = TEAM.map(t => ({ t, avg: avgOf(t.id), target: targetOf(t.id), gap: gapOf(t.id), gaps: gapCount(t.id) }));
  if (q) rows = rows.filter(r => (r.t.name + ' ' + r.t.title + ' ' + r.t.level).toLowerCase().includes(q));
  const s = S.teamSort;
  rows.sort((a,b) => s === 'name' ? a.t.name.localeCompare(b.t.name) : s === 'avg' ? b.avg - a.avg : b.gap - a.gap);
  return rows;
}

function teamTbodyHTML(){
  return teamRows().map(({t, avg, target, gap, gaps}) => `
    <tr class="hover:bg-slate-50 cursor-pointer" onclick="goProfile('${t.id}')">
      <td class="py-3 px-4">
        <div class="flex items-center gap-3">${avatar(t,'sm')}
          <div><div class="font-medium">${t.name}</div><div class="text-xs text-slate-500">${t.title} · ${t.level}</div></div>
        </div>
      </td>
      <td class="py-3 px-4">${statusBadge(t.status)}</td>
      <td class="py-3 px-4 font-medium">${avg.toFixed(1)} <span class="text-slate-400">→</span> ${target.toFixed(1)}</td>
      <td class="py-3 px-4">${gapBar(avg, target)}</td>
      <td class="py-3 px-4 text-slate-600">${gaps}</td>
      <td class="py-3 px-4 ${t.trend.startsWith('+') ? 'text-emerald-600' : t.trend === '0.0' ? 'text-slate-500' : 'text-rose-600'}">${t.trend}</td>
      <td class="py-3 px-4 text-slate-500">${t.lastReview}</td>
      <td class="py-3 px-4 text-right text-slate-400">›</td>
    </tr>
  `).join('');
}

function teamSearch(v){ S.teamQuery = v; const tb = document.getElementById('team-tbody'); if (tb) tb.innerHTML = teamTbodyHTML(); }
function cycleTeamSort(){
  S.teamSort = S.teamSort === 'gap' ? 'avg' : S.teamSort === 'avg' ? 'name' : 'gap'; save();
  const b = document.getElementById('team-sort'); if (b) b.textContent = 'Sort: ' + S.teamSort + ' ▾';
  const tb = document.getElementById('team-tbody'); if (tb) tb.innerHTML = teamTbodyHTML();
}

screens.team = () => {
  const avgs = TEAM.map(t => avgOf(t.id));
  const teamAvg = avgs.reduce((a,b)=>a+b,0) / avgs.length;
  const openGaps = TEAM.reduce((s,t) => s + gapCount(t.id), 0);
  const ready = TEAM.filter(t => readinessOf(t.id) >= 75);
  return `
  <div class="flex justify-between items-end mb-5">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Your team</h1>
      <p class="text-slate-500 text-sm mt-0.5">8 members · cycle H1 2026 · 3 of 8 reviews complete</p>
    </div>
    <div class="flex gap-2">
      <input oninput="teamSearch(this.value)" value="${S.teamQuery || ''}" class="text-sm border border-slate-200 rounded-md px-3 py-1.5 w-56" placeholder="Search team…">
      <button id="team-sort" onclick="cycleTeamSort()" class="text-sm border border-slate-200 rounded-md px-3 py-1.5 hover:bg-slate-50">Sort: ${S.teamSort} ▾</button>
      <button onclick="toast('Member invites are stubbed in this prototype')" class="text-sm bg-indigo-600 text-white rounded-md px-3 py-1.5 hover:bg-indigo-700">+ Add member</button>
    </div>
  </div>

  <div class="grid grid-cols-3 gap-4 mb-6">
    <div class="bg-white border border-slate-200 rounded-xl p-4">
      <div class="text-xs text-slate-500">Team avg current</div>
      <div class="flex items-baseline gap-2 mt-1"><span class="text-2xl font-semibold">${teamAvg.toFixed(1)}</span><span class="text-xs text-emerald-600">+0.3 vs last cycle</span></div>
    </div>
    <div class="bg-white border border-slate-200 rounded-xl p-4">
      <div class="text-xs text-slate-500">Total open gaps</div>
      <div class="flex items-baseline gap-2 mt-1"><span class="text-2xl font-semibold">${openGaps}</span><span class="text-xs text-slate-500">≥ 1 pt below target</span></div>
    </div>
    <div class="bg-white border border-slate-200 rounded-xl p-4">
      <div class="text-xs text-slate-500">Promotion ready</div>
      <div class="flex items-baseline gap-2 mt-1"><span class="text-2xl font-semibold">${ready.length}</span><span class="text-xs text-emerald-600">${ready.map(firstName).join(', ') || '—'}</span></div>
    </div>
  </div>

  <div class="bg-white border border-slate-200 rounded-xl overflow-hidden">
    <table class="w-full text-sm">
      <thead class="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
        <tr>
          <th class="text-left py-3 px-4 font-medium">Member</th>
          <th class="text-left py-3 px-4 font-medium">Status</th>
          <th class="text-left py-3 px-4 font-medium">Avg → target</th>
          <th class="text-left py-3 px-4 font-medium w-48">Progress</th>
          <th class="text-left py-3 px-4 font-medium">Gaps</th>
          <th class="text-left py-3 px-4 font-medium">Trend</th>
          <th class="text-left py-3 px-4 font-medium">Last review</th>
          <th class="py-3 px-4"></th>
        </tr>
      </thead>
      <tbody id="team-tbody" class="divide-y divide-slate-100">${teamTbodyHTML()}</tbody>
    </table>
  </div>
  `;
};

// ---------- PROFILE ----------
screens.profile = () => {
  const m = member();
  const avg = avgOf(m.id), target = targetOf(m.id), gap = gapOf(m.id);
  const cats = catAvgs(m.id);
  const gaps = topGaps(m.id, 5);
  const logs = S.logs.filter(l => l.m === m.id).slice(0, 3);
  const done = S.goalsDone[m.id] || {};
  afterLayout(() => initProfileCharts(m.id));
  return `
  <div class="flex justify-between items-start mb-5">
    <div class="flex items-center gap-4">
      ${avatar(m,'lg')}
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">${m.name}</h1>
        <p class="text-slate-500 text-sm">${m.title} · ${m.level} · Reports to you</p>
      </div>
      ${statusBadge(m.status)}
    </div>
    <div class="flex gap-2 items-center">
      ${memberSelect()}
      <button onclick="go('skills')" class="text-sm border border-slate-200 rounded-md px-3 py-1.5 hover:bg-slate-50">Rate skills</button>
      <button onclick="go('oneone')" class="text-sm border border-slate-200 rounded-md px-3 py-1.5 hover:bg-slate-50">Prep 1:1</button>
      <button onclick="openCapture()" class="text-sm bg-indigo-600 text-white rounded-md px-3 py-1.5 hover:bg-indigo-700">+ Log entry</button>
    </div>
  </div>

  <div class="grid grid-cols-4 gap-4 mb-5">
    ${[
      ['Average current', avg.toFixed(1), '/ 5', ''],
      ['Average expected', target.toFixed(1), '/ 5', ''],
      ['Avg gap', '+' + gap.toFixed(1), 'open', 'text-amber-600'],
      ['Δ vs last cycle', m.trend, m.trend.startsWith('+') ? 'growing' : 'flat', m.trend.startsWith('+') ? 'text-emerald-600' : 'text-slate-500'],
    ].map(([l,v,s,cls]) => `
      <div class="bg-white border border-slate-200 rounded-xl p-4">
        <div class="text-xs text-slate-500">${l}</div>
        <div class="mt-1 text-2xl font-semibold ${cls}">${v} <span class="text-sm text-slate-400 font-normal">${s}</span></div>
      </div>
    `).join('')}
  </div>

  <div class="grid grid-cols-5 gap-4 mb-5">
    <div class="col-span-3 bg-white rounded-xl border border-slate-200 p-5">
      <div class="flex items-center justify-between mb-3">
        <div class="font-semibold">Current vs expected</div>
        <div class="text-xs text-slate-500 flex gap-3">
          <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-sm bg-indigo-600"></span>Current</span>
          <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-sm bg-indigo-200"></span>Expected</span>
        </div>
      </div>
      <div style="position:relative;height:300px"><canvas id="radar"></canvas></div>
    </div>
    <div class="col-span-2 bg-white rounded-xl border border-slate-200 p-5">
      <div class="font-semibold mb-3">Top growth opportunities</div>
      <ul class="space-y-3">
        ${gaps.length ? gaps.map(([n, g]) => `
          <li>
            <div class="flex justify-between"><span>${n}</span><span class="text-amber-600 font-medium">+${g.toFixed(1)}</span></div>
            <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1"><div class="h-full bg-amber-500" style="width:${Math.min(100, g/3*100)}%"></div></div>
          </li>
        `).join('') : '<li class="text-sm text-slate-500">No open gaps — everything at target. 🎉</li>'}
      </ul>
    </div>
  </div>

  <div class="bg-white rounded-xl border border-slate-200 p-5 mb-5">
    <div class="font-semibold mb-3">Category breakdown</div>
    <div class="grid grid-cols-5 gap-4">
      ${cats.map(c => `<div class="text-center p-3 rounded-lg hover:bg-slate-50 cursor-pointer" onclick="go('skills')">
        <div class="text-xs text-slate-500">${c.cat}</div>
        <div class="text-2xl font-semibold mt-1">${c.cur.toFixed(1)}</div>
        <div class="text-xs text-emerald-600">→ ${c.exp.toFixed(1)}</div>
      </div>`).join('')}
    </div>
  </div>

  <div class="grid grid-cols-2 gap-4">
    <div class="bg-white rounded-xl border border-slate-200 p-5">
      <div class="font-semibold mb-3">Development goals · H1 2026</div>
      <ul class="space-y-2.5">
        ${[
          ['Run 1 stakeholder review per sprint, solo.', 'Due May 30'],
          ['Deliver 1 Business Plan model end-to-end.', 'Due Jun 15'],
          ['Pair with a senior PM on competitor teardown.', 'Due Jul 1'],
        ].map(([g, due], i) => {
          const d = !!done[i];
          return `<li class="flex items-start gap-3 cursor-pointer" onclick="toggleGoal('${m.id}',${i})">
            <span class="mt-1 w-4 h-4 rounded border ${d ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-slate-300'} flex items-center justify-center text-xs shrink-0">${d ? '✓' : ''}</span>
            <div><div class="${d ? 'line-through text-slate-400' : ''}">${g}</div><div class="text-xs text-slate-500">${due}${d ? ' · done' : ''}</div></div>
          </li>`;
        }).join('')}
      </ul>
      <button onclick="toast('Goal creation is stubbed in this prototype')" class="text-sm text-indigo-600 hover:underline mt-3">+ Add goal</button>
    </div>
    <div class="bg-white rounded-xl border border-slate-200 p-5">
      <div class="font-semibold mb-3">Recent activity</div>
      ${logs.length ? `<ul class="space-y-3 text-sm">
        ${logs.map(l => `
          <li class="flex gap-3 pb-3 border-b border-slate-100 last:border-0">
            <div class="text-xs text-slate-500 w-12 shrink-0 pt-0.5">${l.d}</div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2"><span class="font-medium">${l.skill}</span><span class="text-xs px-2 py-0.5 ${l.to > l.from ? 'bg-emerald-50 text-emerald-700' : l.to < l.from ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-500'} rounded">${l.from} → ${l.to}</span></div>
              <div class="text-xs text-slate-600 mt-0.5">${l.note}</div>
            </div>
          </li>
        `).join('')}
      </ul>` : `<div class="text-sm text-slate-500">No entries yet. Rate a skill or file an observation to start the history.</div>`}
      <button onclick="go('logs')" class="text-sm text-indigo-600 hover:underline mt-3">View full log →</button>
    </div>
  </div>
  `;
};

function toggleGoal(mid, i){
  S.goalsDone[mid] = S.goalsDone[mid] || {};
  S.goalsDone[mid][i] = !S.goalsDone[mid][i];
  save(); go('profile');
}

function initProfileCharts(mid){
  const c = document.getElementById('radar'); if (!c) return;
  const cats = catAvgs(mid);
  const ch = new Chart(c, {
    type: 'radar',
    data: {
      labels: cats.map(x => x.cat),
      datasets: [
        { label:'Current', data: cats.map(x => +x.cur.toFixed(2)), backgroundColor:'rgba(79,70,229,0.25)', borderColor:'#4f46e5', borderWidth:2, pointBackgroundColor:'#4f46e5' },
        { label:'Expected', data: cats.map(x => +x.exp.toFixed(2)), backgroundColor:'rgba(199,210,254,0.30)', borderColor:'#a5b4fc', borderWidth:2, borderDash:[4,3], pointBackgroundColor:'#a5b4fc' }
      ]
    },
    options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}},
      scales:{ r: Object.assign({}, RADAR_SCALE, { ticks:{stepSize:1,color:'#94a3b8'} }) } }
  });
  chartInstances.push(ch);
  setTimeout(() => ch.resize(), 50);
}

// ---------- SKILLS (rate) ----------
const catCharts = {};

screens.skills = () => {
  afterLayout(initSkillsRender);
  const m = member();
  return `
  <div class="flex justify-between items-end mb-5">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Rate skills · ${m.name}</h1>
      <p class="text-slate-500 text-sm mt-0.5">Click a dot to set the score (click the same dot again to step down). Every change creates a log entry.</p>
    </div>
    <div class="flex gap-2 items-center">
      ${memberSelect()}
      <span id="save-ind" class="text-xs text-slate-500">All changes saved · autosaving</span>
      <button onclick="toast('Finalized — scores were already autosaved')" class="text-sm bg-indigo-600 text-white rounded-md px-3 py-1.5">Save & finalize</button>
    </div>
  </div>
  <div class="space-y-3" id="skill-list"></div>
  `;
};

function skillRowHTML(name, c, e){
  return `
  <div class="skill-row px-2 py-2 grid grid-cols-12 gap-2 items-center text-sm" data-skill="${name}">
    <div class="col-span-4 font-medium truncate">${name}</div>
    <div class="col-span-3"><div class="flex gap-1">${[1,2,3,4,5].map(x =>
      `<button class="dotbtn" data-v="${x}" title="Set ${name} to ${x}"><span class="dot ${x <= c ? 'dot-on' : 'dot-off'}"></span></button>`).join('')}</div></div>
    <div class="col-span-3"><div class="flex gap-1">${[1,2,3,4,5].map(x =>
      `<span class="dot ${x <= e ? 'dot-target' : 'dot-off'}"></span>`).join('')}</div></div>
    <div class="col-span-2 text-right"><span class="text-xs ${e-c >= 2 ? 'text-amber-600' : e-c >= 1 ? 'text-amber-500' : 'text-emerald-600'} font-medium">${e-c > 0 ? '+' : ''}${e-c}</span></div>
  </div>`;
}

function catSummaryHTML(cat, sks){
  const ac = (sks.reduce((s,x)=>s+x[1],0)/sks.length).toFixed(1);
  const ae = (sks.reduce((s,x)=>s+x[2],0)/sks.length).toFixed(1);
  const gap = (ae - ac).toFixed(1);
  return `
    <div class="flex items-center gap-3"><span class="font-semibold">${cat}</span><span class="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">${sks.length}</span></div>
    <div class="text-xs text-slate-500 flex gap-4"><span>avg <strong class="text-slate-700">${ac}</strong> → <strong class="text-indigo-700">${ae}</strong></span><span class="${gap > 0 ? 'text-amber-600' : 'text-emerald-600'} font-medium">${gap > 0 ? '+' + gap + ' gap' : 'at target'}</span></div>`;
}

function initSkillsRender(){
  const root = document.getElementById('skill-list'); if (!root) return;
  root.innerHTML = '';
  Object.keys(catCharts).forEach(k => delete catCharts[k]);
  const byCat = skillsByCat();
  let ci = 0;
  for (const [cat, sks] of Object.entries(byCat)) {
    const det = document.createElement('details'); det.open = true;
    det.className = 'bg-white border border-slate-200 rounded-xl overflow-hidden';
    det.dataset.cat = cat;
    det.innerHTML = `
      <summary class="px-5 py-3 flex justify-between items-center bg-slate-50 border-b border-slate-200" data-role="summary">${catSummaryHTML(cat, sks)}</summary>
      <div class="grid grid-cols-12 gap-5 p-5">
        <div class="col-span-5"><div style="height:240px;position:relative"><canvas id="cat-${ci}"></canvas></div></div>
        <div class="col-span-7">
          <div class="grid grid-cols-12 gap-2 px-2 pb-2 text-[10px] uppercase tracking-wider text-slate-400 font-medium border-b border-slate-100">
            <div class="col-span-4">Skill</div><div class="col-span-3">Current</div><div class="col-span-3">Expected</div><div class="col-span-2 text-right">Δ</div>
          </div>
          <div class="divide-y divide-slate-100" data-role="rows">${sks.map(([n,c,e]) => skillRowHTML(n,c,e)).join('')}</div>
        </div>
      </div>`;
    root.appendChild(det);
    const cch = new Chart(det.querySelector('#cat-' + ci), {
      type: 'radar',
      data: { labels: sks.map(s => s[0]), datasets: [
        { data: sks.map(s => s[1]), backgroundColor:'rgba(79,70,229,0.25)', borderColor:'#4f46e5', borderWidth:2, pointBackgroundColor:'#4f46e5', pointRadius:3 },
        { data: sks.map(s => s[2]), backgroundColor:'rgba(199,210,254,0.30)', borderColor:'#a5b4fc', borderWidth:2, borderDash:[4,3], pointBackgroundColor:'#a5b4fc', pointRadius:3 }
      ]},
      options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}},
        scales:{ r: Object.assign({}, RADAR_SCALE, { pointLabels:{font:{size:10}, color:'#475569'} }) } }
    });
    catCharts[cat] = cch;
    chartInstances.push(cch);
    setTimeout(() => cch.resize(), 50);
    ci++;
  }
  if (!root.dataset.bound) {
    root.dataset.bound = '1';
    root.addEventListener('click', (e) => {
      const btn = e.target.closest('.dotbtn'); if (!btn) return;
      const row = btn.closest('[data-skill]'); if (!row) return;
      onDotClick(row.dataset.skill, +btn.dataset.v);
    });
  }
}

function onDotClick(skillName, v){
  const sk = mskills()[skillName]; if (!sk) return;
  const target = (sk.c === v) ? Math.max(1, v - 1) : v;   // click same dot = step down
  if (sk.c === target) return;
  setScoreCore(S.member, skillName, target);
  refreshSkillCat(sk.cat);
  const ind = document.getElementById('save-ind');
  if (ind) ind.textContent = 'Saved just now · autosaving';
  renderNav(S.screen);
}

function refreshSkillCat(cat){
  const det = document.querySelector(`details[data-cat="${cat}"]`); if (!det) return;
  const sks = skillsByCat()[cat];
  det.querySelector('[data-role="summary"]').innerHTML = catSummaryHTML(cat, sks);
  det.querySelector('[data-role="rows"]').innerHTML = sks.map(([n,c,e]) => skillRowHTML(n,c,e)).join('');
  const ch = catCharts[cat];
  if (ch) { ch.data.datasets[0].data = sks.map(s => s[1]); ch.update(); }
}
