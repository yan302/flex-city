/* ============================================================
   Skyline Architect — Level 03 / Cat Café
   level-03/js/game.js
   ============================================================ */

const editor    = document.getElementById('css-editor');
const dynStyles = document.getElementById('dynamic-styles');
const stamp     = document.getElementById('pass-stamp');
const resetBtn  = document.getElementById('reset-btn');
const gameBody  = document.getElementById('game-body');
const hintEl    = document.getElementById('progress-hint');
const hintText  = hintEl.querySelector('.ph-text');

/* 兩個合理答案都接受（題目「每隻貓都需要剛剛好的距離」對應的是
   「每隻貓周圍都要有空間」——space-around 跟 space-evenly 都符合，
   差別只在邊距大小。space-between 會讓首尾貓貼牆，不接受。       */
const ANSWERS_JC = ['justify-content:space-around', 'justify-content:space-evenly'];
const ANSWER_AI  = 'align-items:flex-end';

/* ── EMMET ABBREVIATIONS ────────────────────── */
const EMMET = {
  'jcsa': 'justify-content: space-around;',
  'jcsb': 'justify-content: space-between;',
  'jcse': 'justify-content: space-evenly;',
  'jcc' : 'justify-content: center;',
  'jcfe': 'justify-content: flex-end;',
  'jcfs': 'justify-content: flex-start;',
  'aife': 'align-items: flex-end;',
  'aic' : 'align-items: center;',
  'aifs': 'align-items: flex-start;',
  'ais' : 'align-items: stretch;',
  'df'  : 'display: flex;',
  'fdc' : 'flex-direction: column;',
  'fdr' : 'flex-direction: row;',
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
  const userCss = editor.value;
  // 注意：這裡刻意不設 padding——讓 space-between 能真的把邊邊的貓擠到牆，
  // 讓「擠到牆 vs 周圍有空間」的視覺差異更明顯。
  dynStyles.textContent =
    `#live-cafe .cafe-stage { display: flex; padding: 0; ${userCss} }`;
  checkAnswer();
}

function checkAnswer() {
  if (hasSuccess) return;
  const clean = editor.value.replace(/\s/g, '').toLowerCase();
  const hasJC = ANSWERS_JC.some(a => clean.includes(a));
  const hasAI = clean.includes(ANSWER_AI);
  // 偵測「貼牆」的常見錯誤答案：space-between
  const hasBetween = clean.includes('justify-content:space-between');

  if (hasJC && hasAI) {
    doSuccess();
  } else if (hasJC) {
    showHint('貓咪們已經平均分散了，但牠們飄在半空中，讓牠們各自站到地板上吧。');
  } else if (hasBetween) {
    showHint('最旁邊的貓咪被牆壁擠到了——試試看別的排列方式吧。');
  } else if (hasAI) {
    showHint('貓咪們站好了，但都擠在同一邊，讓牠們在空間裡平均分散開來。');
  } else {
    hideHint();
  }
}

function showHint(html) {
  hintText.innerHTML = html;
  hintEl.classList.add('show');
}
function hideHint() {
  hintEl.classList.remove('show');
}

/* ── SUCCESS ────────────────────────────────── */
function doSuccess() {
  hasSuccess = true;
  hideHint();
  // 保留使用者實際輸入的 justify-content 值（space-around 或 space-evenly）
  const clean = editor.value.replace(/\s/g, '').toLowerCase();
  const usedJC = clean.includes('space-evenly') ? 'space-evenly' : 'space-around';
  dynStyles.textContent =
    `#live-cafe .cafe-stage { display: flex; padding: 0; justify-content: ${usedJC}; align-items: flex-end; }`;
  // 把實際採用的值傳給 modal
  window.__finalJC = usedJC;
  gameBody.classList.add('is-success');
  stamp.classList.add('active');
  editor.classList.add('text-green-700', 'font-bold');
  // 延遲 6.5 秒——這關有 2 組屬性家族（justify-content 5 個 + align-items 5 個），
  // 基準 3.5s + 多 3s 給雙倍屬性
  const stars = hintUsed ? 2 : 3;
  setTimeout(() => {
    if (hasSuccess) showModal(stars);
  }, 6500);
}

function showModal(stars) {
  document.getElementById('modal-stars').textContent =
    '★'.repeat(stars) + '☆'.repeat(3 - stars);

  // 依使用者實際採用的 justify-content 值動態調整 modal 描述
  const propEl = document.getElementById('modal-prop');
  const descEl = document.getElementById('modal-desc');
  const jc = window.__finalJC || 'space-around';
  if (propEl) {
    propEl.innerHTML = `justify-content: ${jc};<br>align-items: flex-end;`;
  }
  if (descEl) {
    descEl.textContent = (jc === 'space-evenly')
      ? 'space-evenly：每個間隔完全相等，每隻貓都有真正「剛剛好」的距離。'
      : 'space-around：每隻貓周圍都保留空間。配上 align-items: flex-end，貓咪們站到地板上各自安心。';
  }

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
  hideHint();
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
