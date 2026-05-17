/* ============================================================
   Flex City — Level 05 / Night Market Expansion
   level-05/js/game.js
   共用引擎：shared/flex-city.js
   ============================================================ */

const editor    = document.getElementById('css-editor');
const dynStyles = document.getElementById('dynamic-styles');
const stamp     = document.getElementById('pass-stamp');
const resetBtn  = document.getElementById('reset-btn');
const gameBody  = document.getElementById('game-body');
const hintEl    = document.getElementById('progress-hint');
const hintText  = hintEl.querySelector('.ph-text');

const TARGET_GAP_PX = 240;
const COLUMN_GAP_PX = 4;

/* ── EMMET ABBREVIATIONS ────────────────────── */
const EMMET = {
  'fww'    : 'flex-wrap: wrap;',
  'fwnw'   : 'flex-wrap: nowrap;',
  'rg240'  : 'row-gap: 240px;',
  'rg'     : 'row-gap: ',
  'cg'     : 'column-gap: ',
  'gap240' : 'gap: 240px;',
  'gap'    : 'gap: ',
  'jcc'    : 'justify-content: center;',
  'jcsa'   : 'justify-content: space-around;',
  'jcsb'   : 'justify-content: space-between;',
  'aic'    : 'align-items: center;',
  'aife'   : 'align-items: flex-end;',
  'df'     : 'display: flex;',
  'fdc'    : 'flex-direction: column;',
};

let hasSuccess        = false;
let hintUsed          = false;
let pendingModalTimer = null;   // doSuccess 排程的 PASS modal setTimeout id

/* ── LIVE PREVIEW + ANSWER CHECK ────────────── */
function updateStyles() {
  if (hasSuccess) return;
  dynStyles.textContent =
    `#live-view { display: flex; align-items: flex-start; align-content: flex-start; padding: 56px 24px; column-gap: ${COLUMN_GAP_PX}px; ${editor.value} }`;
  checkAnswer();
  // 如果使用者已經打了 flex-wrap，要重新算誰是第二排
  scheduleFlipRecompute();
}

function checkAnswer() {
  if (hasSuccess) return;
  const clean = editor.value.replace(/\s/g, '').toLowerCase();

  const hasWrap = /flex-wrap:wrap/.test(clean);

  // row-gap:240px ✓  |  gap:240px ✓  |  column-gap:240px ✗
  const gapStr = `${TARGET_GAP_PX}px`;
  const hasRowGap = clean.includes(`row-gap:${gapStr}`);
  const shortGapPattern = new RegExp(`(^|[^a-z-])gap:${TARGET_GAP_PX}px`);
  const hasShortGap = !clean.includes(`column-gap:${gapStr}`) &&
                      shortGapPattern.test(clean);
  const hasGap = hasRowGap || hasShortGap;

  if (hasWrap && hasGap) {
    doSuccess();
  } else if (hasWrap) {
    showHint(`攤位變兩行了，但中間沒有走道，請加上 ${TARGET_GAP_PX}px 的間距讓人潮穿梭。`);
  } else if (hasGap) {
    showHint('走道空間打開了，但攤位還擠在一排，請讓它們自動換行到下一排。');
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

/* ── SUCCESS (staged animation) ──────────────
   Stage 1: gap expands → booths drift down (CSS transition handles this)
   Stage 2: +700ms → flip bottom row 180°
   Stage 3: +1500ms → lighting effects + PASSED stamp
   Stage 4: +3500ms → modal popup
   ────────────────────────────────────────────── */
function doSuccess() {
  hasSuccess = true;
  hideHint();

  // Stage 1: apply final gap to trigger smooth reflow
  dynStyles.textContent =
    `#live-view { display: flex; flex-wrap: wrap; align-items: flex-start; align-content: flex-start; padding: 56px 24px; column-gap: ${COLUMN_GAP_PX}px; row-gap: ${TARGET_GAP_PX}px; }`;
  editor.classList.add('text-pink-700', 'font-bold');

  // Stage 2: flip the bottom row
  setTimeout(() => {
    gameBody.classList.add('is-flipped');
    recomputeFlippedRows();              // 標記第二排起的攤位
  }, 700);

  // Stage 3: lighting effects + PASSED stamp
  const STAMP_AT  = 1500;
  const MODAL_GAP = 2400;   // 印章後 2.4s 彈 modal — 大字 3.6s 消失後 ~0.3s 接上
  setTimeout(() => {
    gameBody.classList.add('is-success');
    stamp.classList.add('active');
  }, STAMP_AT);

  // 🎉 任天堂式過關大字（蓋章後 0.3s 彈出）
  setTimeout(() => {
    FlexCity.celebrate({
      title:    '萬頭攢動',
      titleSvg: '../shared/titles/title-05.svg',
      subtitle: 'FINAL LEVEL CLEAR',
      accent:   '#facc15',                       // 夜市霓虹黃
      glow:     'rgba(250,204,21,.85)',
      palette:  ['#facc15', '#ec4899', '#22c55e', '#3b82f6', '#f97316', '#a855f7'],
    });
  }, STAMP_AT + 300);

  // Stage 4: modal (印章後再等 3s = 總共 4.5s)
  // 存下 timer id，方便「完成挑戰」按鈕在 modal 還沒 fire 前能取消它
  // (移除 onShow 的 fireConfetti('pass')，因為大字慶祝已經有粒子了)
  pendingModalTimer = setTimeout(() => {
    pendingModalTimer = null;
    FlexCity.showModal(hintUsed ? 2 : 3);
  }, STAMP_AT + MODAL_GAP);
}

/* ── 🎊 CONFETTI ─────────────────────────────
   兩種撒花模式：
   - 'pass'   : modal 彈出時，左右輕柔兩束
   - 'finish' : 完成挑戰時，全螢幕煙火三連發
   ────────────────────────────────────────── */
function fireConfetti(mode = 'pass') {
  if (typeof confetti !== 'function') return;   // CDN 沒載到就靜默略過

  const palette = ['#fde047', '#ec4899', '#22c55e', '#3b82f6', '#f97316', '#a78bfa'];
  const Z = 1000;   // 蓋過 modal-overlay 的 z-index 200

  if (mode === 'pass') {
    // 從左右下角往中間斜射
    confetti({ particleCount: 60, angle: 60,  spread: 55, origin: { x: 0, y: 0.85 }, colors: palette, zIndex: Z });
    confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1, y: 0.85 }, colors: palette, zIndex: Z });
    return;
  }

  // mode === 'finish' — 三連發大爆炸
  const duration = 1800;
  const end = Date.now() + duration;
  (function frame() {
    confetti({ particleCount: 6, angle: 60,  spread: 70, startVelocity: 55,
               origin: { x: 0, y: 0.7 }, colors: palette, zIndex: Z });
    confetti({ particleCount: 6, angle: 120, spread: 70, startVelocity: 55,
               origin: { x: 1, y: 0.7 }, colors: palette, zIndex: Z });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
  // 中央再來一發大的
  setTimeout(() => {
    confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 }, colors: palette, zIndex: Z });
  }, 300);
}

/* ── FINISH MODAL ──────────────────────────
   若使用者在 PASS modal 還沒 fire 前就按下完成挑戰，
   把那個排程中的 setTimeout 取消掉，避免 modal 偷偷在背景出現。
   ─────────────────────────────────────── */
function openFinishModal() {
  if (pendingModalTimer) {
    clearTimeout(pendingModalTimer);
    pendingModalTimer = null;
  }
  // 萬一 PASS modal 已經彈出，就一起關掉（讓 Finish 全螢幕獨佔）
  document.getElementById('modal-overlay').classList.remove('on');
  document.getElementById('finish-overlay').classList.add('on');
  fireConfetti('finish');
}

/* ── RESET ──────────────────────────────────── */
function doReset() {
  hasSuccess  = false;
  hintUsed    = false;
  editor.value = '';
  editor.classList.remove('text-pink-700', 'font-bold');
  editor.disabled = false;
  stamp.classList.remove('active');
  gameBody.classList.remove('is-success', 'is-flipped');
  // 清掉所有動態加的翻轉標記
  document.querySelectorAll('#live-view .stall.booth-flipped')
          .forEach(el => el.classList.remove('booth-flipped'));
  hideHint();
  FlexCity.closeModal();
  FlexCity.hideDrop();
  updateStyles();
  editor.focus();
}

/* ── DYNAMIC ROW DETECTION ────────────────────
   把「真正在第二排以後」的攤位加上 .booth-flipped。
   這樣不管 wrap 出 4+4 / 3+3+2 / 2+2+2+2，都只翻第一排以下的攤位。
   ────────────────────────────────────────── */
function recomputeFlippedRows() {
  const stalls = document.querySelectorAll('#live-view .stall');
  if (stalls.length === 0) return;
  const firstTop = stalls[0].offsetTop;
  stalls.forEach(stall => {
    if (Math.abs(stall.offsetTop - firstTop) > 4) {
      stall.classList.add('booth-flipped');
    } else {
      stall.classList.remove('booth-flipped');
    }
  });
}

/* throttle: 多個事件 (input / resize) 同時觸發時，下一幀再算 */
let _flipRAF = null;
function scheduleFlipRecompute() {
  if (_flipRAF) return;
  _flipRAF = requestAnimationFrame(() => {
    _flipRAF = null;
    recomputeFlippedRows();
  });
}

/* 視窗大小變動 → 重算 (排版會自動 wrap，flip 也要跟著走) */
window.addEventListener('resize', scheduleFlipRecompute);

/* ── WIRE UP ────────────────────────────────── */
FlexCity.initEmmet({ editor, emmet: EMMET, onApply: updateStyles });
FlexCity.wireModalDismiss();
resetBtn.addEventListener('click', doReset);

/* 「完成挑戰」按鈕：撒花 → 開 finish modal （不直接跳轉）*/
const finishBtn = document.getElementById('next-level-inline-btn');
if (finishBtn) {
  finishBtn.addEventListener('click', () => {
    openFinishModal();
  });
}

/* ── INIT ───────────────────────────────────── */
updateStyles();
editor.focus();
