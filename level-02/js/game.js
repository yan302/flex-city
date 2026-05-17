/* ============================================================
   Flex City — Level 02 / Vertical Stack
   level-02/js/game.js
   共用引擎：shared/flex-city.js
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

let hasSuccess = false;
let hintUsed   = false;

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

  // 🎉 任天堂式過關大字（蓋章後 0.5s 彈出）
  setTimeout(() => {
    FlexCity.celebrate({
      title:    '大樓落成',
      titleSvg: '../shared/titles/title-02.svg',
      subtitle: 'LEVEL 2 CLEAR',
      accent:   '#3b82f6',                        // 天空藍
      glow:     'rgba(59,130,246,.75)',
      palette:  ['#3b82f6', '#22c55e', '#facc15', '#ec4899', '#f97316'],
    });
  }, 500);

  // 大字消失（2.3s）後 ~0.3s 接 modal — 視覺零空檔
  const stars = hintUsed ? 2 : 3;
  setTimeout(() => {
    if (hasSuccess) FlexCity.showModal(stars);
  }, 2600);
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
  FlexCity.closeModal();
  FlexCity.hideDrop();
  editor.focus();
}

/* ── WIRE UP ────────────────────────────────── */
FlexCity.initEmmet({ editor, emmet: EMMET, onApply: checkAnswer });
FlexCity.wireModalDismiss();
resetBtn.addEventListener('click', doReset);
editor.focus();
