// GrowthMatrix v2 — 1:1 prep, history & log, capture inbox

// ---------- 1:1 PREP ----------
const TALKING_DEFAULTS = [
  'Walk through H1 goals — on track?',
  'Pairing / mentoring — kicked off?',
  'How did the last stretch task feel? Comfortable doing more?',
  'Career check-in: still aiming for the next level this year?',
  "Anything blocking that I'm not seeing?",
];

screens.oneone = () => {
  const m = member();
  const logs = S.logs.filter(l => l.m === m.id);
  const wins = logs.filter(l => l.to > l.from).slice(0, 2);
  const stuck = topGaps(m.id, 2);
  const checks = S.talking[m.id] || {};
  const custom = S.talkingCustom[m.id] || [];
  const notes = S.notes[m.id] != null ? S.notes[m.id] : "Lead with the recent win. Ask, don't tell, on the stuck skill.";
  const done = S.goalsDone[m.id] || {};
  return `
  <div class="flex justify-between items-end mb-5">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">1:1 prep · ${firstName(m)}</h1>
      <p class="text-slate-500 text-sm mt-0.5">Auto-built from logs, goals, and recent score changes.</p>
    </div>
    <div class="flex gap-2 items-center">
      ${memberSelect()}
      <button onclick="copyOneOne()" class="text-sm border border-slate-200 rounded-md px-3 py-1.5">Copy as notes ↗</button>
      <button onclick="toast('Live 1:1 mode is stubbed in this prototype')" class="text-sm bg-indigo-600 text-white rounded-md px-3 py-1.5">Open during 1:1 →</button>
    </div>
  </div>

  <div class="grid grid-cols-3 gap-4">
    <div class="col-span-2 space-y-4">
      <div class="bg-white border border-slate-200 rounded-xl p-5">
        <div class="font-semibold mb-3 text-emerald-700">🎉 Celebrate</div>
        ${wins.length ? `<ul class="text-sm space-y-2 list-disc list-inside text-slate-700">
          ${wins.map(l => `<li><strong>${l.skill}</strong> moved <strong>${l.from} → ${l.to}</strong> (${l.d}) — ${l.note}</li>`).join('')}
        </ul>` : '<div class="text-sm text-slate-500">No recent score increases — rate skills or file observations first.</div>'}
      </div>
      <div class="bg-white border border-slate-200 rounded-xl p-5">
        <div class="font-semibold mb-3 text-amber-700">🧭 Address</div>
        ${stuck.length ? `<ul class="text-sm space-y-2 list-disc list-inside text-slate-700">
          ${stuck.map(([n, g, c, e]) => `<li><strong>${n}</strong> at ${c}, target ${e} — biggest open gap (${g.toFixed(0)} pts).</li>`).join('')}
        </ul>` : '<div class="text-sm text-slate-500">No open gaps to address. 🎉</div>'}
      </div>
      <div class="bg-white border border-slate-200 rounded-xl p-5">
        <div class="font-semibold mb-3">Talking points</div>
        <div class="space-y-1">
          ${TALKING_DEFAULTS.concat(custom).map((t, i) => `
            <label class="flex items-start gap-2.5 text-sm py-1.5 cursor-pointer">
              <input type="checkbox" class="mt-1" ${checks[i] ? 'checked' : ''} onchange="toggleTalking('${m.id}',${i},this.checked)">
              <span class="${checks[i] ? 'line-through text-slate-400' : ''}">${t}</span>
            </label>`).join('')}
        </div>
        <div class="flex gap-2 mt-3">
          <input id="tp-new" class="flex-1 text-sm border border-slate-200 rounded-md px-3 py-1.5" placeholder="Add a talking point…" onkeydown="if(event.key==='Enter')addTalking('${m.id}')">
          <button onclick="addTalking('${m.id}')" class="text-sm text-indigo-600 border border-indigo-200 rounded-md px-3 py-1.5 hover:bg-indigo-50">Add</button>
        </div>
      </div>
      <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div class="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Your private notes · autosaved</div>
        <textarea oninput="setNotes('${m.id}', this.value)" class="w-full bg-transparent text-sm border-0 outline-none resize-none" rows="3">${notes}</textarea>
      </div>
    </div>

    <div class="space-y-4">
      <div class="bg-white border border-slate-200 rounded-xl p-5">
        <div class="font-semibold mb-1">Since last 1:1</div>
        <div class="text-xs text-slate-500 mb-3">${logs.length} log ${logs.length === 1 ? 'entry' : 'entries'}</div>
        ${logs.length ? `<ul class="text-sm divide-y divide-slate-100">
          ${logs.slice(0, 5).map(l => `
            <li class="grid grid-cols-12 py-2 gap-2"><span class="col-span-3 text-xs text-slate-500">${l.d}</span><span class="col-span-6 truncate">${l.skill}</span><span class="col-span-3 text-right font-medium">${l.from !== l.to ? l.from + '→' + l.to : '·'}</span></li>
          `).join('')}
        </ul>` : '<div class="text-sm text-slate-500">Nothing logged yet.</div>'}
      </div>
      <div class="bg-white border border-slate-200 rounded-xl p-5">
        <div class="font-semibold mb-3">Goals progress</div>
        ${['Solo stakeholder review','BizPlan model','Competitor teardown'].map((n, i) => {
          const p = done[i] ? 100 : [50, 20, 15][i];
          return `<div class="mb-3 last:mb-0"><div class="flex justify-between text-sm mb-1"><span>${n}</span><span class="text-slate-500">${p}%</span></div><div class="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div class="h-full ${p === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}" style="width:${p}%"></div></div></div>`;
        }).join('')}
      </div>
    </div>
  </div>
  `;
};

function toggleTalking(mid, i, v){ S.talking[mid] = S.talking[mid] || {}; S.talking[mid][i] = v; save(); go('oneone'); }
function addTalking(mid){
  const inp = document.getElementById('tp-new'); if (!inp || !inp.value.trim()) return;
  S.talkingCustom[mid] = S.talkingCustom[mid] || [];
  S.talkingCustom[mid].push(inp.value.trim());
  save(); go('oneone');
}
function setNotes(mid, v){ S.notes[mid] = v; save(); }
function copyOneOne(){
  const m = member();
  const txt = `1:1 prep — ${m.name}\n\nCelebrate:\n${S.logs.filter(l => l.m === m.id && l.to > l.from).slice(0,2).map(l => `- ${l.skill} ${l.from}→${l.to}: ${l.note}`).join('\n')}\n\nAddress:\n${topGaps(m.id, 2).map(([n,g,c,e]) => `- ${n} at ${c}, target ${e}`).join('\n')}\n\nNotes: ${S.notes[m.id] || ''}`;
  navigator.clipboard && navigator.clipboard.writeText(txt).then(() => toast('Copied 1:1 notes to clipboard')).catch(() => toast('Copy failed — clipboard unavailable'));
}

// ---------- HISTORY & LOG ----------
screens.logs = () => {
  const m = member();
  const all = S.logs.filter(l => l.m === m.id);
  const filter = S.logFilter || 'all';
  const shown = filter === 'all' ? all : all.filter(l => l.skill === filter);
  const skillNames = [...new Set(all.map(l => l.skill))];
  return `
  <div class="flex justify-between items-end mb-5">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">History & log · ${firstName(m)}</h1>
      <p class="text-slate-500 text-sm mt-0.5">Every score change + observation, newest first. Rating changes land here automatically.</p>
    </div>
    <div class="flex gap-2 items-center">
      ${memberSelect()}
      <select onchange="S.logFilter=this.value;save();go('logs')" class="text-sm border border-slate-200 rounded-md px-3 py-1.5 bg-white">
        <option value="all">All skills</option>
        ${skillNames.map(n => `<option value="${n}" ${filter === n ? 'selected' : ''}>${n}</option>`).join('')}
      </select>
      <button onclick="openCapture()" class="text-sm bg-indigo-600 text-white rounded-md px-3 py-1.5">+ New entry</button>
    </div>
  </div>

  <div class="grid grid-cols-3 gap-4">
    <div class="col-span-2 space-y-3">
      ${shown.length ? shown.map(l => {
        const same = l.from === l.to;
        return `<div class="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-12 gap-4">
          <div class="col-span-2"><div class="font-medium text-sm">${l.d}</div><div class="text-xs text-slate-500">by ${l.by}</div></div>
          <div class="col-span-10">
            <div class="flex items-center gap-2 mb-1.5">
              <span class="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">${l.skill}</span>
              ${same ? `<span class="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-500">no change · ${l.from}</span>` : `<span class="text-xs px-2 py-0.5 rounded ${l.to > l.from ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}">${l.from} → ${l.to}</span>`}
            </div>
            <div class="text-sm text-slate-700">${l.note}</div>
            <div class="flex gap-2 mt-2 text-xs text-slate-500">
              <button onclick="editLogNote(${l.id})" class="hover:text-slate-700">Edit note</button><span>·</span>
              <button onclick="deleteLog(${l.id})" class="hover:text-rose-600">Delete</button>
            </div>
          </div>
        </div>`;
      }).join('') : '<div class="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">No entries yet. Rate a skill or file an observation from the inbox.</div>'}
    </div>

    <div class="space-y-4">
      <div class="bg-white border border-slate-200 rounded-xl p-5">
        <div class="font-semibold mb-1">Trend by skill</div>
        <div class="text-xs text-slate-500 mb-3">Reconstructed from the log</div>
        ${trendRows(m.id)}
      </div>
      <div class="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-sm text-indigo-900">
        Entries auto-feed promotion cases & 1:1 prep. No double-entry, no lost context.
      </div>
    </div>
  </div>
  `;
};

function trendRows(mid){
  const sk = mskills(mid);
  const names = [...new Set(S.logs.filter(l => l.m === mid).map(l => l.skill))].slice(0, 5);
  if (!names.length) return '<div class="text-sm text-slate-500">No history yet.</div>';
  return names.map(n => {
    const cur = sk[n] ? sk[n].c : 3;
    const changes = S.logs.filter(l => l.m === mid && l.skill === n).reverse(); // oldest first
    let series = changes.length ? [changes[0].from, ...changes.map(c => c.to)] : [cur];
    while (series.length < 4) series.unshift(series[0]);
    series = series.slice(-6);
    const pts = series.map((v, i) => `${(i/(series.length-1))*60+2},${22-((v-1)/4)*18}`).join(' ');
    return `<div class="flex items-center justify-between gap-3 py-2 border-b border-slate-100 last:border-0">
      <span class="text-sm flex-1 min-w-0 truncate">${n}</span>
      <svg width="64" height="24"><polyline points="${pts}" fill="none" stroke="#4f46e5" stroke-width="1.5" stroke-linecap="round"></polyline></svg>
      <span class="text-xs text-slate-500 tabular-nums">${series[0]}→${series[series.length-1]}</span>
    </div>`;
  }).join('');
}

function editLogNote(id){
  const l = S.logs.find(x => x.id === id); if (!l) return;
  const nv = prompt('Edit note:', l.note);
  if (nv != null) { l.note = nv.trim(); save(); go('logs'); }
}
function deleteLog(id){ S.logs = S.logs.filter(x => x.id !== id); save(); go('logs'); toast('Entry deleted'); }

// ---------- CAPTURE INBOX ----------
screens.inbox = () => {
  return `
  <div class="flex justify-between items-end mb-5">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Capture inbox</h1>
      <p class="text-slate-500 text-sm mt-0.5">${S.inbox.length ? S.inbox.length + ' unsorted observation' + (S.inbox.length > 1 ? 's' : '') + ' · drop now, file later.' : 'Inbox zero — nice.'}</p>
    </div>
    <div class="flex gap-2">
      <span class="text-xs px-2 py-1 rounded-md bg-slate-100 text-slate-600 self-center">⌘⇧L global capture</span>
      <button onclick="toast('Slack connection is stubbed in this prototype')" class="text-sm border border-slate-200 rounded-md px-3 py-1.5">Connect Slack</button>
      <button onclick="openCapture()" class="text-sm bg-indigo-600 text-white rounded-md px-3 py-1.5">+ Quick note</button>
    </div>
  </div>

  <div class="grid grid-cols-3 gap-4">
    <div class="col-span-2 space-y-3">
      <div class="bg-white border border-slate-200 rounded-xl p-4">
        <textarea id="inbox-jot" class="w-full text-sm border-0 outline-none resize-none" rows="2" placeholder="Just jot it — mention a first name to auto-suggest, e.g. 'Priya ran a great retro'…" onkeydown="if((event.metaKey||event.ctrlKey)&&event.key==='Enter')jotSave()"></textarea>
        <div class="flex justify-between items-center pt-2 border-t border-slate-100 text-xs">
          <div class="flex gap-1.5"><span class="px-2 py-0.5 rounded bg-slate-100">@</span><span class="px-2 py-0.5 rounded bg-slate-100">#skill</span></div>
          <div class="flex items-center gap-2">
            <span class="text-slate-500"><kbd class="px-1.5 py-0.5 bg-slate-100 rounded">⌘</kbd>+<kbd class="px-1.5 py-0.5 bg-slate-100 rounded">↵</kbd></span>
            <button onclick="jotSave()" class="px-2.5 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700">Save</button>
          </div>
        </div>
      </div>

      ${S.inbox.map(item => {
        const t = member(item.m);
        return `
        <div class="bg-white border border-slate-200 rounded-xl p-4">
          <div class="flex justify-between items-start mb-2">
            <span class="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">${item.src}</span>
            <span class="text-xs text-slate-500">${item.when}</span>
          </div>
          <div class="text-sm text-slate-700">${item.txt}</div>
          <div class="flex flex-wrap gap-1.5 items-center mt-3">
            <span class="text-xs text-slate-500">Files to:</span>
            <span class="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">${t ? t.name : 'Unassigned'}</span>
            ${item.skill ? `<span class="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">${item.skill}</span>` : '<span class="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-500">no skill</span>'}
          </div>
          <div class="flex justify-end gap-2 mt-3 pt-3 border-t border-slate-100">
            <button onclick="inboxArchive(${item.id})" class="text-xs px-2 py-1 rounded text-slate-500 hover:bg-slate-50">Archive</button>
            <button onclick="inboxFile(${item.id}, false)" class="text-xs px-2 py-1 rounded border border-slate-200 hover:bg-slate-50">File as observation</button>
            ${item.skill && item.m ? `<button onclick="inboxFile(${item.id}, true)" class="text-xs px-2 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700">File & bump score</button>` : ''}
          </div>
        </div>`;
      }).join('')}
      ${!S.inbox.length ? '<div class="bg-white border border-dashed border-slate-300 rounded-xl p-10 text-center text-sm text-slate-500">Everything filed. New captures land here.</div>' : ''}
    </div>

    <div class="space-y-4">
      <div class="bg-white border border-slate-200 rounded-xl p-5">
        <div class="font-semibold mb-2">Sources</div>
        <div class="space-y-2 text-sm">
          ${Object.entries(S.sources).map(([l, c]) => `
            <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" ${c ? 'checked' : ''} onchange="S.sources['${l.replace(/'/g, "\\'")}']=this.checked;save()"> <span>${l}</span></label>
          `).join('')}
        </div>
      </div>
      <div class="bg-white border border-slate-200 rounded-xl p-5">
        <div class="font-semibold mb-3">This week</div>
        <div class="grid grid-cols-2 gap-y-2 text-sm">
          <span class="text-slate-500">In inbox</span><span class="text-right font-semibold">${S.inbox.length}</span>
          <span class="text-slate-500">Filed</span><span class="text-right font-semibold">${S.stats.filed}</span>
          <span class="text-slate-500">Score changes</span><span class="text-right font-semibold">${S.stats.bumped}</span>
          <span class="text-slate-500">Archived</span><span class="text-right font-semibold">${S.stats.archived}</span>
        </div>
      </div>
    </div>
  </div>
  `;
};

function detectMember(text){
  const lower = text.toLowerCase();
  return (TEAM.find(t => lower.includes(firstName(t).toLowerCase())) || {}).id || null;
}
function addInboxItem(text){
  const mid = detectMember(text);
  S.inbox.unshift({ id: Date.now(), src: '⌨ Quick', txt: text, when: 'just now', m: mid, skill: null });
  save(); renderNav(S.screen);
}
function jotSave(){
  const ta = document.getElementById('inbox-jot'); if (!ta || !ta.value.trim()) return;
  addInboxItem(ta.value.trim());
  ta.value = '';
  go('inbox'); toast('Captured to inbox');
}
function inboxArchive(id){
  S.inbox = S.inbox.filter(x => x.id !== id);
  S.stats.archived++; save(); go('inbox'); toast('Archived');
}
function inboxFile(id, bump){
  const item = S.inbox.find(x => x.id === id); if (!item) return;
  const mid = item.m || 'yk';
  if (bump && item.skill) {
    const sk = mskills(mid)[item.skill];
    if (sk && sk.c < 5) {
      setScoreCore(mid, item.skill, sk.c + 1, item.txt);
      S.stats.bumped++;
      toast(`${member(mid).name.split(' ')[0]} · ${item.skill} bumped to ${sk.c}`);
    } else {
      toast('Already at 5 — filed as observation instead');
      S.logs.unshift({ id: Date.now(), m: mid, d: fmtToday(), skill: item.skill || 'General', from: sk ? sk.c : 3, to: sk ? sk.c : 3, by: 'You', note: item.txt });
    }
  } else {
    const sk = item.skill ? mskills(mid)[item.skill] : null;
    S.logs.unshift({ id: Date.now(), m: mid, d: fmtToday(), skill: item.skill || 'General', from: sk ? sk.c : 3, to: sk ? sk.c : 3, by: 'You', note: item.txt });
    toast('Filed as observation');
  }
  S.inbox = S.inbox.filter(x => x.id !== id);
  S.stats.filed++;
  save(); go('inbox');
}
