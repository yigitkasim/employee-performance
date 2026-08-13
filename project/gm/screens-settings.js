// GrowthMatrix v2 — roles & skills framework builder (settings)

const ROLES = [
  { id:'pm', name:'Product Manager', icon:'📦', levels:['Associate (L3)','Mid (L4)','Senior (L5)','Lead (L6)','Principal (L7)','VP (L8)'], members:8 },
  { id:'des', name:'Designer', icon:'🎨', levels:['Junior','Mid','Senior','Staff','Principal'], members:5 },
  { id:'eng', name:'Engineer', icon:'⚡', levels:['Junior','Mid','Senior','Staff','Principal','Distinguished'], members:14 },
  { id:'mkt', name:'Marketing', icon:'📣', levels:['Specialist','Mid','Senior','Lead','Director','VP'], members:4 },
  { id:'ops', name:'Operations', icon:'⚙️', levels:['Analyst','Mid','Senior','Lead','Director'], members:3 },
];

const BUILDER_SKILLS = [
  { id:'soft', name:'Soft Skills', icon:'💬', sub: CATALOG['Soft Skills'].map(s => s[0]) },
  { id:'disc', name:'Discovery', icon:'🔍', sub: CATALOG['Discovery'].map(s => s[0]) },
  { id:'des2', name:'Design', icon:'✏️', sub: CATALOG['Design'].map(s => s[0]) },
  { id:'del',  name:'Delivery', icon:'🚚', sub: CATALOG['Delivery'].map(s => s[0]) },
  { id:'adp',  name:'Adoption', icon:'🚀', sub: CATALOG['Adoption'].map(s => s[0]) },
];

let ACTIVE_ROLE = 'pm';
let BUILDER_TAB = 'matrix';

function expectedFor(roleId, levelIdx, subId){
  const key = roleId + ':' + levelIdx + ':' + subId;
  if (S.matrixOv[key] != null) return S.matrixOv[key];
  const seed = (roleId.charCodeAt(0) + levelIdx*7 + subId.length*3) % 11;
  return Math.min(5, Math.max(1, Math.round(1 + (levelIdx/5)*4 + (seed-5)*0.15)));
}
function cycleMatrixCell(roleId, levelIdx, subId){
  const key = roleId + ':' + levelIdx + ':' + subId;
  const cur = expectedFor(roleId, levelIdx, subId);
  S.matrixOv[key] = cur >= 5 ? 1 : cur + 1;
  save(); go('settings');
}
function setBuilderTab(t){ BUILDER_TAB = t; go('settings'); }
function setActiveRole(id){ ACTIVE_ROLE = id; go('settings'); }

screens.settings = () => {
  const role = ROLES.find(r => r.id === ACTIVE_ROLE);
  const edited = Object.keys(S.matrixOv).length;
  return `
  <div class="flex justify-between items-end mb-5">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Roles & skills framework</h1>
      <p class="text-slate-500 text-sm mt-0.5">Build roles, levels, and the expected score for every sub-skill at every level.</p>
    </div>
    <div class="flex gap-2">
      <button onclick="toast('CSV import is stubbed in this prototype')" class="text-sm border border-slate-200 rounded-md px-3 py-1.5 hover:bg-slate-50">Import CSV</button>
      <button onclick="publishMatrix()" class="text-sm bg-indigo-600 text-white rounded-md px-3 py-1.5">Publish framework${edited ? ' (' + edited + ')' : ''}</button>
    </div>
  </div>

  <div class="flex gap-1 border-b border-slate-200 mb-5 text-sm">
    ${[['matrix','Expected matrix'],['roles','Roles & levels'],['skills','Skills & sub-skills']].map(([id, l]) => `
      <button onclick="setBuilderTab('${id}')" class="px-4 py-2.5 border-b-2 ${BUILDER_TAB === id ? 'border-indigo-600 text-indigo-700 font-medium' : 'border-transparent text-slate-500 hover:text-slate-800'}">${l}</button>
    `).join('')}
  </div>

  ${BUILDER_TAB === 'roles' ? rolesTab() : BUILDER_TAB === 'skills' ? skillsTab() : matrixTab(role)}
  `;
};

function publishMatrix(){
  const n = Object.keys(S.matrixOv).length;
  toast(n ? `Framework published — ${n} cell${n > 1 ? 's' : ''} changed` : 'Framework published — no changes');
}

function rolesTab(){
  const role = ROLES.find(r => r.id === ACTIVE_ROLE);
  return `
  <div class="grid grid-cols-12 gap-5">
    <div class="col-span-4 bg-white border border-slate-200 rounded-xl p-4">
      <div class="flex justify-between items-baseline mb-3">
        <div class="font-semibold">Roles</div>
        <span class="text-xs text-slate-500">${ROLES.length} active</span>
      </div>
      <div class="space-y-1">
        ${ROLES.map(r => `
          <button onclick="setActiveRole('${r.id}')" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-md ${ACTIVE_ROLE === r.id ? 'bg-indigo-50 text-indigo-900' : 'hover:bg-slate-50'} text-left">
            <span class="text-lg">${r.icon}</span>
            <div class="flex-1"><div class="font-medium text-sm">${r.name}</div><div class="text-xs text-slate-500">${r.levels.length} levels · ${r.members} members</div></div>
          </button>
        `).join('')}
      </div>
      <button onclick="toast('Role creation is stubbed in this prototype')" class="w-full mt-3 px-3 py-2.5 border border-dashed border-slate-300 rounded-md text-sm text-slate-600 hover:bg-slate-50 hover:text-indigo-700 hover:border-indigo-300">+ New role</button>
    </div>

    <div class="col-span-8 space-y-4">
      <div class="bg-white border border-slate-200 rounded-xl p-5">
        <div class="font-semibold mb-3">Role details</div>
        <div class="grid grid-cols-2 gap-4">
          <label class="block"><span class="text-xs text-slate-500">Name</span><input value="${role.name}" class="w-full border border-slate-200 rounded-md px-3 py-2 mt-1 text-sm"></label>
          <label class="block"><span class="text-xs text-slate-500">Icon / emoji</span><input value="${role.icon}" class="w-full border border-slate-200 rounded-md px-3 py-2 mt-1 text-sm"></label>
          <label class="block col-span-2"><span class="text-xs text-slate-500">Description</span><textarea class="w-full border border-slate-200 rounded-md px-3 py-2 mt-1 text-sm" rows="2">Owns the discovery→delivery→adoption lifecycle for a product area.</textarea></label>
        </div>
      </div>

      <div class="bg-white border border-slate-200 rounded-xl p-5">
        <div class="flex justify-between items-baseline mb-3">
          <div class="font-semibold">Levels</div>
          <span class="text-xs text-slate-500">low → high</span>
        </div>
        <div class="space-y-2">
          ${role.levels.map((l, i) => `
            <div class="flex items-center gap-3 px-3 py-2 border border-slate-200 rounded-md hover:bg-slate-50 group">
              <span class="text-slate-300 cursor-grab">☰</span>
              <span class="w-7 h-7 rounded-md bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-semibold">L${i+1}</span>
              <input value="${l}" class="flex-1 bg-transparent border-0 outline-none text-sm font-medium">
              <span class="text-xs text-slate-500">expected avg ${(2 + i*0.5).toFixed(1)}</span>
              <button onclick="toast('Level removal is stubbed in this prototype')" class="text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100">✕</button>
            </div>
          `).join('')}
        </div>
        <button onclick="toast('Level creation is stubbed in this prototype')" class="mt-3 px-3 py-2 border border-dashed border-slate-300 rounded-md text-sm text-slate-600 hover:bg-slate-50 hover:text-indigo-700 hover:border-indigo-300 w-full">+ Add level</button>
      </div>

      <div class="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-sm text-indigo-900">
        <strong>Tip:</strong> after editing levels, head to <button onclick="setBuilderTab('matrix')" class="underline hover:no-underline">the Expected matrix</button> to dial in scores for each new level.
      </div>
    </div>
  </div>`;
}

function skillsTab(){
  return `
  <div class="grid grid-cols-12 gap-5">
    <div class="col-span-4 bg-white border border-slate-200 rounded-xl p-4">
      <div class="flex justify-between items-baseline mb-3">
        <div class="font-semibold">Skill groups</div>
        <span class="text-xs text-slate-500">${BUILDER_SKILLS.length}</span>
      </div>
      <div class="space-y-1">
        ${BUILDER_SKILLS.map((s, i) => `
          <button class="w-full flex items-center gap-3 px-3 py-2.5 rounded-md ${i === 0 ? 'bg-indigo-50 text-indigo-900' : 'hover:bg-slate-50'} text-left">
            <span class="text-lg">${s.icon}</span>
            <div class="flex-1"><div class="font-medium text-sm">${s.name}</div><div class="text-xs text-slate-500">${s.sub.length} sub-skills</div></div>
          </button>
        `).join('')}
      </div>
      <button onclick="toast('Skill-group creation is stubbed in this prototype')" class="w-full mt-3 px-3 py-2.5 border border-dashed border-slate-300 rounded-md text-sm text-slate-600 hover:bg-slate-50 hover:text-indigo-700 hover:border-indigo-300">+ New skill group</button>
    </div>

    <div class="col-span-8 space-y-4">
      <div class="bg-white border border-slate-200 rounded-xl p-5">
        <div class="flex justify-between items-baseline mb-4">
          <div>
            <div class="font-semibold">${BUILDER_SKILLS[0].icon} ${BUILDER_SKILLS[0].name}</div>
            <div class="text-xs text-slate-500 mt-0.5">${BUILDER_SKILLS[0].sub.length} sub-skills · used by 5 roles</div>
          </div>
          <button onclick="toast('Group deletion is stubbed in this prototype')" class="text-sm text-rose-600 hover:underline">Delete group</button>
        </div>
        <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Sub-skills</div>
        <div class="space-y-2">
          ${BUILDER_SKILLS[0].sub.map((s, i) => `
            <div class="flex items-center gap-3 px-3 py-2 border border-slate-200 rounded-md hover:bg-slate-50 group">
              <span class="text-slate-300 cursor-grab">☰</span>
              <span class="w-6 h-6 rounded bg-slate-100 text-slate-600 flex items-center justify-center text-xs">${i+1}</span>
              <input value="${s}" class="flex-1 bg-transparent border-0 outline-none text-sm font-medium">
              <button onclick="toast('Rubrics are stubbed in this prototype')" class="text-xs text-slate-500 hover:text-indigo-700 opacity-0 group-hover:opacity-100">+ rubric</button>
              <button onclick="toast('Sub-skill removal is stubbed in this prototype')" class="text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100">✕</button>
            </div>
          `).join('')}
        </div>
        <button onclick="toast('Sub-skill creation is stubbed in this prototype')" class="mt-3 px-3 py-2 border border-dashed border-slate-300 rounded-md text-sm text-slate-600 hover:bg-slate-50 hover:text-indigo-700 hover:border-indigo-300 w-full">+ Add sub-skill</button>
      </div>

      <div class="bg-white border border-slate-200 rounded-xl p-5">
        <div class="font-semibold mb-3">Applied to roles</div>
        <div class="flex flex-wrap gap-2">
          ${ROLES.map(r => `
            <label class="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-md cursor-pointer hover:bg-slate-50">
              <input type="checkbox" ${r.id !== 'ops' ? 'checked' : ''}>
              <span class="text-sm">${r.icon} ${r.name}</span>
            </label>
          `).join('')}
        </div>
      </div>
    </div>
  </div>`;
}

function matrixTab(role){
  const edited = Object.keys(S.matrixOv).length;
  return `
  <div class="flex gap-3 mb-4 items-center">
    <span class="text-sm text-slate-500">Role:</span>
    <div class="flex gap-1 flex-wrap">
      ${ROLES.map(r => `
        <button onclick="setActiveRole('${r.id}')" class="text-sm px-3 py-1.5 rounded-md border ${ACTIVE_ROLE === r.id ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 hover:bg-slate-50'}">
          ${r.icon} ${r.name}
        </button>
      `).join('')}
    </div>
    <span class="text-xs text-slate-500 ml-auto">Click any cell to cycle the expected score 1 → 5</span>
  </div>

  <div class="bg-white border border-slate-200 rounded-xl overflow-hidden">
    <div class="overflow-auto scroll-area" style="max-height: 70vh">
      <table class="w-full text-sm border-collapse">
        <thead class="sticky top-0 bg-slate-50 z-10">
          <tr class="border-b border-slate-200">
            <th class="text-left px-4 py-3 font-medium text-xs uppercase tracking-wider text-slate-500 sticky left-0 bg-slate-50 z-20 min-w-[220px]">Sub-skill</th>
            ${role.levels.map((l, i) => `
              <th class="px-3 py-3 text-center font-medium" style="min-width:96px">
                <div class="text-xs text-slate-500 uppercase tracking-wider">L${i+1}</div>
                <div class="text-sm text-slate-800 mt-0.5 font-semibold">${l}</div>
              </th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          ${BUILDER_SKILLS.map(g => `
            <tr class="bg-slate-50/60"><td colspan="${role.levels.length + 1}" class="px-4 py-2 sticky left-0 bg-slate-50/60">
              <div class="flex items-center gap-2"><span>${g.icon}</span><span class="font-semibold text-xs uppercase tracking-wider text-slate-700">${g.name}</span><span class="text-xs text-slate-400">· ${g.sub.length}</span></div>
            </td></tr>
            ${g.sub.map(sub => `
              <tr class="border-t border-slate-100 hover:bg-indigo-50/30">
                <td class="px-4 py-2 sticky left-0 bg-white hover:bg-indigo-50/30 font-medium text-slate-800">${sub}</td>
                ${role.levels.map((_, li) => {
                  const v = expectedFor(role.id, li, sub);
                  const edited2 = S.matrixOv[role.id + ':' + li + ':' + sub] != null;
                  const tone = v >= 4 ? 'bg-indigo-600 text-white' : v >= 3 ? 'bg-indigo-100 text-indigo-800' : v >= 2 ? 'bg-slate-100 text-slate-700' : 'bg-slate-50 text-slate-400';
                  return `<td class="px-3 py-2 text-center">
                    <button onclick="cycleMatrixCell('${role.id}',${li},'${sub.replace(/'/g, "\\'")}')" title="${sub} — ${role.levels[li]}: expected ${v}/5 (click to cycle)" class="matrix-cell w-12 h-9 rounded ${tone} ${edited2 ? 'ring-2 ring-amber-400' : ''} text-sm font-semibold hover:ring-2 hover:ring-indigo-400 transition">${v}</button>
                  </td>`;
                }).join('')}
              </tr>
            `).join('')}
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>

  <div class="mt-4 grid grid-cols-3 gap-3 text-sm">
    <div class="bg-white border border-slate-200 rounded-lg p-3">
      <div class="text-xs text-slate-500 mb-2">Score legend</div>
      <div class="flex flex-wrap gap-2">
        <span class="flex items-center gap-1.5"><span class="w-5 h-5 rounded bg-slate-50 text-slate-400 flex items-center justify-center text-xs font-semibold">1</span><span class="text-xs">No skill</span></span>
        <span class="flex items-center gap-1.5"><span class="w-5 h-5 rounded bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-semibold">2</span><span class="text-xs">Beginner</span></span>
        <span class="flex items-center gap-1.5"><span class="w-5 h-5 rounded bg-indigo-100 text-indigo-800 flex items-center justify-center text-xs font-semibold">3</span><span class="text-xs">Competent</span></span>
        <span class="flex items-center gap-1.5"><span class="w-5 h-5 rounded bg-indigo-600 text-white flex items-center justify-center text-xs font-semibold">4</span><span class="text-xs">Strong</span></span>
        <span class="flex items-center gap-1.5"><span class="w-5 h-5 rounded bg-indigo-600 text-white flex items-center justify-center text-xs font-semibold">5</span><span class="text-xs">Expert / can teach</span></span>
      </div>
    </div>
    <div class="bg-white border border-slate-200 rounded-lg p-3">
      <div class="text-xs text-slate-500 mb-1">Bulk actions</div>
      <div class="flex gap-2 mt-1.5">
        <button onclick="toast('Copy-from-role is stubbed in this prototype')" class="text-xs px-2.5 py-1.5 border border-slate-200 rounded hover:bg-slate-50">Copy from another role</button>
        <button onclick="resetMatrix()" class="text-xs px-2.5 py-1.5 border border-slate-200 rounded hover:bg-slate-50">Reset to default</button>
      </div>
    </div>
    <div class="${edited ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-white border-slate-200 text-slate-500'} border rounded-lg p-3">
      <div class="text-xs font-semibold mb-1">${edited ? 'Unsaved changes' : 'No pending edits'}</div>
      <div class="text-xs">${edited ? edited + ' cell' + (edited > 1 ? 's' : '') + ' edited (amber ring) · publishing affects 8 active reviews.' : 'Click cells in the matrix to adjust expectations.'}</div>
    </div>
  </div>`;
}

function resetMatrix(){
  S.matrixOv = {}; save(); go('settings'); toast('Matrix reset to defaults');
}
