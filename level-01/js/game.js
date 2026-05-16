/* ============================================================
   Skyline Architect — Level 01 / Wake Up
   level-01/js/game.js
   ============================================================ */

const editor    = document.getElementById('css-editor');
const dynStyles = document.getElementById('dynamic-styles');
const stamp     = document.getElementById('pass-stamp');
const resetBtn  = document.getElementById('reset-btn');
const gameBody  = document.getElementById('game-body');

const ANSWER_KEY = 'display:flex';
const MODAL_DELAY_MS = 3500;  // 過關後等動畫播完再出 modal（留時間閱讀屬性家族）

/* ── EMMET ABBREVIATIONS ────────────────────── */
const EMMET = {
  'df'  : 'display: flex;',
  'fdc' : 'flex-direction: column;',
  'fdrr': 'flex-direction: row-reverse;',
  'jcc' : 'justify-content: center;',
  'jcfe': 'justify-content: flex-end;',
  'jcsb': 'justify-content: space-between;',
  'jcsa': 'justify-content: space-around;',
  'aic' : 'align-items: center;',
  'aife': 'align-items: flex-end;',
  'aifs': 'align-items: flex-start;',
  'fww' : 'flex-wrap: wrap;',
};

let selIdx      = 0;
let suggestions = [];
let hasSuccess  = false;
let hintUsed    = false;

/* ── EMMET ─────────────────────────────────── */
function getWordBefore() {
  const pos    = editor.selectionStart;
  const before = editor.value.substring(0, pos);
  const m      = before.match(/([a-z0-9]+)$/);
  return m ? { word: m[1], start: pos - m[1].length } : { word: '', start: pos };
}

function updateSuggestions() {
  const { word } = getWordBefore();
  if (!word) { hideDrop(); return; }
  suggestions = Object.entries(EMMET)
    .filter(([a]) => a.startsWith(word))
    .sort((a, b) => a[0].length - b[0].length);
  selIdx = 0;
  suggestions.length ? renderDrop(word) : hideDrop();
}

function renderDrop(typed) {
  const list = document.getElementById('emmet-list');
  list.innerHTML = suggestions.map(([abbr, val], i) => {
    const t = '<span class="e-typed">' + abbr.slice(0, typed.length) + '</span>';
    const r = abbr.length > typed.length
      ? '<span class="e-rest">' + abbr.slice(typed.length) + '</span>'
      : '';
    return '<div class="e-item' + (i === selIdx ? ' sel' : '') + '"'
      + ' onmousedown="applyIdx(' + i + ')">'
      + '<span class="e-abbr">' + t + r + '</span>'
      + '<span class="e-arr">→</span>'
      + '<span class="e-val">' + val + '</span>'
      + '</div>';
  }).join('');
  positionDrop();
  document.getElementById('emmet-drop').style.display = 'block';
}

function positionDrop() {
  const drop = document.getElementById('emmet-drop');
  const r    = editor.getBoundingClientRect();
  drop.style.left   = r.left + 'px';
  drop.style.width  = Math.max(r.width, 320) + 'px';
  drop.style.bottom = (window.innerHeight - r.top + 2) + 'px';
  drop.style.top    = 'auto';
}

function hideDrop() {
  document.getElementById('emmet-drop').style.display = 'none';
  suggestions = [];
  selIdx = 0;
}

function applyIdx(i) {
  if (i === undefined) i = selIdx;
  if (!suggestions[i]) return;
  const [, val]  = suggestions[i];
  const { start } = getWordBefore();
  const end       = editor.selectionStart;
  editor.value    = editor.value.substring(0, start) + val + editor.value.substring(end);
  editor.setSelectionRange(start + val.length, start + val.length);
  hideDrop();
  updateStyles();
  editor.focus();
}

/* ── LIVE PREVIEW + ANSWER CHECK ────────────── */
function updateStyles() {
  if (hasSuccess) return;
  dynStyles.textContent = `#live-city { ${editor.value} }`;
  checkAnswer();
}

function checkAnswer() {
  if (hasSuccess) return;
  const clean = editor.value.replace(/\s/g, '').toLowerCase();
  if (clean.includes(ANSWER_KEY)) doSuccess();
}

function doSuccess() {
  hasSuccess = true;
  dynStyles.textContent =
    `#live-city { display:flex; align-items:flex-end; justify-content:space-around; }`;
  gameBody.classList.add('is-success');
  stamp.classList.add('active');
  editor.classList.add('text-green-700', 'font-bold');
  setTimeout(() => showModal(hintUsed ? 2 : 3), MODAL_DELAY_MS);
}

function showModal(stars) {
  document.getElementById('modal-stars').textContent =
    '★'.repeat(stars) + '☆'.repeat(3 - stars);

  const seal = document.querySelector('.modal-seal');
  seal.style.animation = 'none';
  requestAnimationFrame(() => {
    seal.style.animation = '';
    document.getElementById('modal-overlay').classList.add('on');
  });
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('on');
}

function doReset() {
  hasSuccess  = false;
  hintUsed    = false;
  editor.value = '';
  editor.classList.remove('text-green-700', 'font-bold');
  editor.disabled = false;
  stamp.classList.remove('active');
  gameBody.classList.remove('is-success');
  closeModal();
  hideDrop();
  updateStyles();
  editor.focus();
}

/* ── KEYBOARD ───────────────────────────────── */
editor.addEventListener('keydown', e => {
  if (suggestions.length && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
    e.preventDefault();
    selIdx = e.key === 'ArrowDown'
      ? (selIdx + 1) % suggestions.length
      : (selIdx - 1 + suggestions.length) % suggestions.length;
    renderDrop(getWordBefore().word);
    return;
  }

  if (e.key === 'Tab') {
    e.preventDefault();
    if (suggestions.length) {
      applyIdx(selIdx);
    } else {
      const p = editor.selectionStart;
      editor.value = editor.value.substring(0, p) + '  ' + editor.value.substring(p);
      editor.setSelectionRange(p + 2, p + 2);
      updateStyles();
    }
    return;
  }

  if (e.key === 'Escape') { hideDrop(); return; }
  if (e.key === 'Enter' && suggestions.length) { hideDrop(); }
});

editor.addEventListener('input', () => {
  updateStyles();
  updateSuggestions();
});

document.addEventListener('mousedown', e => {
  if (!e.target.closest('#emmet-drop') && !e.target.closest('#css-editor')) {
    hideDrop();
  }
});

resetBtn.addEventListener('click', doReset);
document.getElementById('modal-close-btn').addEventListener('click', closeModal);
document.getElementById('modal-overlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeModal();
});

editor.focus();
