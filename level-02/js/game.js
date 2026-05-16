/* ============================================================
   Skyline Architect — Level 02 / Vertical Stack
   level-02/js/game.js
   ============================================================ */

const editor    = document.getElementById('css-editor');
const stamp     = document.getElementById('pass-stamp');
const resetBtn  = document.getElementById('reset-btn');
const gameBody  = document.getElementById('game-body');
const hintEl    = document.getElementById('progress-hint');
const hintText  = hintEl.querySelector('.ph-text');

const ANSWER_KEY = 'flex-direction:column-reverse';
const PRESET     = 'display: flex;';

/* ── EMMET ABBREVIATIONS ────────────────────── */
const EMMET = {
  'fdc' : 'flex-direction: column;',
  'fdcr': 'flex-direction: column-reverse;',
  'fdr' : 'flex-direction: row;',
  'fdrr': 'flex-direction: row-reverse;',
  'df'  : 'display: flex;',
  'jcc' : 'justify-content: center;',
  'jcfe': 'justify-content: flex-end;',
  'jcsb': 'justify-content: space-between;',
  'aic' : 'align-items: center;',
  'aife': 'align-items: flex-end;',
  'aifs': 'align-items: flex-start;',
};

let selIdx      = 0;
let suggestions = [];
let hasSuccess  = false;
let hintUsed    = false;

/* ── EMMET: word before cursor ─────────────── */
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
  checkAnswer();
  editor.focus();
}

/* ── CHECK ANSWER ───────────────────────────── */
function checkAnswer() {
  if (hasSuccess) return;
  const clean = editor.value.replace(/\s/g, '').toLowerCase();

  // 完全正解：column-reverse
  if (/flex-direction:column-reverse/.test(clean)) {
    doSuccess();
    return;
  }

  // 半正解：column（沒加 -reverse）→ 顯示提示 + 預覽倒置大樓
  if (/flex-direction:column(?!-reverse)/.test(clean)) {
    showHint(
      '建築方向似乎反了。<br><br>' +
      '停車場被推到了最高樓，<br>' +
      '頂樓花園卻落到了地面。<br><br>' +
      '請重新調整建築堆疊方向。'
    );
    gameBody.classList.add('is-half');
  } else {
    hideHint();
    gameBody.classList.remove('is-half');
  }
}

function showHint(html) {
  hintText.innerHTML = html;
  hintEl.classList.add('show');
  hintUsed = true;
}
function hideHint() {
  hintEl.classList.remove('show');
}

/* ── SUCCESS ────────────────────────────────── */
function doSuccess() {
  hasSuccess = true;
  hideHint();
  gameBody.classList.remove('is-half');   // 移除錯誤狀態（如果之前有）
  gameBody.classList.add('is-success');
  stamp.classList.add('active');
  editor.classList.add('text-green-700', 'font-bold');
  // 延遲 3.5 秒再彈 modal，讓 PASSED 印章 + 大樓落成 + 玩家有時間讀屬性家族
  const stars = hintUsed ? 2 : 3;
  setTimeout(() => {
    if (hasSuccess) showModal(stars);
  }, 3500);
}

/* ── MODAL ──────────────────────────────────── */
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

/* ── RESET ──────────────────────────────────── */
function doReset() {
  hasSuccess  = false;
  hintUsed    = false;
  editor.value = '';
  editor.classList.remove('text-green-700', 'font-bold');
  editor.disabled = false;
  stamp.classList.remove('active');
  gameBody.classList.remove('is-success', 'is-half');
  hideHint();
  closeModal();
  hideDrop();
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
      checkAnswer();
    }
    return;
  }

  if (e.key === 'Escape') { hideDrop(); return; }
  if (e.key === 'Enter' && suggestions.length) { hideDrop(); }
});

editor.addEventListener('input', () => {
  checkAnswer();
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
