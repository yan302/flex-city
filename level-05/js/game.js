/* ============================================================
   Skyline Architect — Level 06 / Night Market Expansion
   level-06/js/game.js
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

let selIdx              = 0;
let suggestions         = [];
let hasSuccess          = false;
let hintUsed            = false;
let pendingModalTimer   = null;   // doSuccess 排程的 PASS modal setTimeout id

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

  // row-gap:160px ✓  |  gap:160px ✓  |  column-gap:160px ✗
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
   Stage 4: +2800ms → modal popup
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
  const MODAL_GAP = 2000;   // 印章出現後再等 2s 才彈 modal (印章 1.5s + 2s = 3.5s 總)
  setTimeout(() => {
    gameBody.classList.add('is-success');
    stamp.classList.add('active');
  }, STAMP_AT);

  // Stage 4: modal (印章後再等 2s = 總共 3.5s)
  // 存下 timer id，方便「完成挑戰」按鈕在 modal 還沒 fire 前能取消它
  pendingModalTimer = setTimeout(() => {
    pendingModalTimer = null;
    showModal(hintUsed ? 2 : 3);
  }, STAMP_AT + MODAL_GAP);
}

function showModal(stars) {
  document.getElementById('modal-stars').textContent =
    '★'.repeat(stars) + '☆'.repeat(3 - stars);

  const seal = document.querySelector('.modal-seal');
  seal.style.animation = 'none';
  requestAnimationFrame(() => {
    seal.style.animation = '';
    document.getElementById('modal-overlay').classList.add('on');
    // 🎊 modal 一彈出就撒花
    fireConfetti('pass');
  });
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('on');
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

/* 「完成挑戰」按鈕：撒花 → 開 finish modal （不直接跳轉）*/
const finishBtn = document.getElementById('next-level-inline-btn');
if (finishBtn) {
  finishBtn.addEventListener('click', () => {
    openFinishModal();
  });
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

/* ── INIT ───────────────────────────────────── */
updateStyles();
editor.focus();
