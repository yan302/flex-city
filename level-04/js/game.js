/* ============================================================
   Flex City — Level 04 / Starry Constellation
   level-04/js/game.js
   共用引擎：shared/flex-city.js
   ============================================================ */

const editor    = document.getElementById('css-editor');
const dynStyles = document.getElementById('dynamic-styles');
const stamp     = document.getElementById('pass-stamp');
const resetBtn  = document.getElementById('reset-btn');
const gameBody  = document.getElementById('game-body');
const liveView  = document.getElementById('live-view');
const hintEl    = document.getElementById('progress-hint');
const hintText  = hintEl.querySelector('.ph-text');

const ANSWER_JC = 'justify-content:center';
const ANSWER_AI = 'align-items:center';

/* ── EMMET ABBREVIATIONS ────────────────────── */
const EMMET = {
  'jcc' : 'justify-content: center;',
  'jcsa': 'justify-content: space-around;',
  'jcsb': 'justify-content: space-between;',
  'jcse': 'justify-content: space-evenly;',
  'jcfe': 'justify-content: flex-end;',
  'jcfs': 'justify-content: flex-start;',
  'aic' : 'align-items: center;',
  'aife': 'align-items: flex-end;',
  'aifs': 'align-items: flex-start;',
  'ais' : 'align-items: stretch;',
  'df'  : 'display: flex;',
  'fdc' : 'flex-direction: column;',
  'fdr' : 'flex-direction: row;',
};

let hasSuccess = false;
let hintUsed   = false;

/* ── INJECT TOWER ───────────────────────────── */
function injectTower() {
  liveView.innerHTML = '';
  const tpl = document.getElementById('tpl-tower').content.cloneNode(true);
  liveView.appendChild(tpl);
}

/* ── LIVE PREVIEW + ANSWER CHECK ────────────── */
function updateStyles() {
  if (hasSuccess) return;
  dynStyles.textContent = `#live-view { display: flex; ${editor.value} }`;
  checkAnswer();
}

function checkAnswer() {
  if (hasSuccess) return;
  const clean = editor.value.replace(/\s/g, '').toLowerCase();
  const hasJC = clean.includes(ANSWER_JC);
  const hasAI = clean.includes(ANSWER_AI);

  if (hasJC && hasAI) {
    doSuccess();
  } else if (hasJC) {
    showHint('鐘樓水平到位了，但還沒對上滿月的高度，把它也垂直置中吧。');
  } else if (hasAI) {
    showHint('鐘樓垂直到位了，但還偏向一邊，把它也水平置中讓它對齊滿月。');
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
  dynStyles.textContent =
    `#live-view { display: flex; justify-content: center; align-items: center; }`;
  gameBody.classList.add('is-success');
  stamp.classList.add('active');
  editor.classList.add('text-indigo-700', 'font-bold');

  // 🎉 任天堂式過關大字（蓋章後 0.5s 彈出）
  setTimeout(() => {
    FlexCity.celebrate({
      title:    '星座解密',
      titleSvg: '../shared/titles/title-04.svg',
      subtitle: 'LEVEL 4 CLEAR',
      accent:   '#a78bfa',                       // 星夜紫
      glow:     'rgba(167,139,250,.8)',
      palette:  ['#a78bfa', '#facc15', '#3b82f6', '#ec4899', '#22c55e'],
    });
  }, 500);

  // 大字消失（2.3s）後 ~0.3s 接 modal — 視覺零空檔
  setTimeout(() => FlexCity.showModal(hintUsed ? 2 : 3), 2600);
}

/* ── RESET ──────────────────────────────────── */
function doReset() {
  hasSuccess  = false;
  hintUsed    = false;
  editor.value = '';
  editor.classList.remove('text-indigo-700', 'font-bold');
  editor.disabled = false;
  stamp.classList.remove('active');
  gameBody.classList.remove('is-success');
  hideHint();
  FlexCity.closeModal();
  FlexCity.hideDrop();
  updateStyles();
  editor.focus();
}

/* ── WIRE UP ────────────────────────────────── */
FlexCity.initEmmet({ editor, emmet: EMMET, onApply: updateStyles });
FlexCity.wireModalDismiss();
resetBtn.addEventListener('click', doReset);

/* ── INIT ───────────────────────────────────── */
injectTower();
updateStyles();
editor.focus();
