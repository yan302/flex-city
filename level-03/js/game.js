/* ============================================================
   Flex City — Level 03 / Cat Café
   level-03/js/game.js
   共用引擎：shared/flex-city.js
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

let hasSuccess = false;
let hintUsed   = false;

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

  // 同步更新生氣狀態（貼太近 / 貼牆 → 加 .is-angry 到對應 .cat-slot）
  updateAngryCats(clean, hasJC, hasBetween);
}

/* ── ANGRY / HAPPY CATS：依輸入狀態切換情緒 ──
   四個獨立 class：
   - .is-angry     → 顯示 💢 + 偶爾晃動（不舒服）
   - .is-sleeping  → 顯示 💤（呼吸般輕緩擺動）
   - .has-bubble   → 顯示對話框（內容由 JS 動態設定文字）
   - .bubble-tight → 短內容（•‿•）的對話框 padding 減半

   邏輯（左數位置以 1-indexed 描述，slots 索引為 0-indexed）：
   - hasJC（有空間了：space-around / evenly）
       → 第 3 隻（罐頭塔貓）頭頂浮現 💤（蜷在罐頭上睡）
         第 5 隻（毛線球籃）對話框「•‿•」（在玩）
         第 6 隻（吊床貓）頭頂浮現 💤（在吊床上打盹）
         其他貓冷靜無語
   - hasBetween（頭尾貼牆）
       → 第 1 + 第 6 隻 💢（不講話）
   - hasCenterOrEdges（center / flex-start / flex-end）
       → 全員 💢（被擠成一團）
   - 其他（完全沒輸入 / 不相關輸入）
       → 第 2, 3, 6 隻 💢（自然站位時的不適點）
   ──────────────────────────────────────────── */
function updateAngryCats(clean, hasJC, hasBetween) {
  const slots = document.querySelectorAll('#live-stage .cat-slot');
  if (!slots.length) return;
  // 先全部冷靜，清空 mark 文字 + 對話框
  slots.forEach(s => {
    s.classList.remove('is-angry', 'is-sleeping', 'has-bubble', 'bubble-tight');
    const b = s.querySelector('.angry-bubble');
    if (b) b.textContent = '';
    const m = s.querySelector('.angry-mark');
    if (m) m.textContent = '';
  });

  if (hasJC) {
    // 有空間 → 罐頭塔/吊床貓打盹（💤 漂浮 mark）、毛線球籃在玩（•‿• 對話框）
    setSleep(slots[2]);                            // 第 3 隻（cat_1 罐頭塔貓）
    setBubble(slots[4], '•‿•', /* tight */ true); // 第 5 隻（cat_4 毛線球籃）
    setSleep(slots[5]);                            // 第 6 隻（cat_5 吊床貓）
    return;
  }

  if (hasBetween) {
    // 頭尾貼牆 → 頭尾 💢；第 6 隻講話「貼太近了啦！」
    setAngry(slots[0]);
    setAngry(slots[5]);
    setBubble(slots[5], '貼太近了啦！');
    return;
  }

  // 偵測「明確選擇 JC 卻沒分散」的擠壓情境
  const hasCenterOrEdges =
    clean.includes('justify-content:center')      ||
    clean.includes('justify-content:flex-start')  ||
    clean.includes('justify-content:flex-end');

  if (hasCenterOrEdges) {
    // 全部擠成一團 → 每隻都生氣；第 3 隻講話「貼太近了啦！」
    slots.forEach(s => setAngry(s));
    setBubble(slots[2], '貼太近了啦！');
  } else {
    // 完全沒輸入 / 不相關輸入 → 只第 2, 3, 6 隻不舒服（無對話框）
    [1, 2, 5].forEach(i => setAngry(slots[i]));
  }
}

/* helper：標記生氣（💢 漂浮 mark + 偶爾晃動） */
function setAngry(slot) {
  if (!slot) return;
  const m = slot.querySelector('.angry-mark');
  if (m) m.textContent = '💢';
  slot.classList.add('is-angry');
}

/* helper：標記睡覺（💤 漂浮 mark + 呼吸般擺動） */
function setSleep(slot) {
  if (!slot) return;
  const m = slot.querySelector('.angry-mark');
  if (m) m.textContent = '💤';
  slot.classList.add('is-sleeping');
}

/* helper：為指定 slot 設定對話框文字並打開
   tight=true 時加上 .bubble-tight，CSS 把左右 padding 減半（給單一符號用）*/
function setBubble(slot, text, tight) {
  if (!slot) return;
  const b = slot.querySelector('.angry-bubble');
  if (!b) return;
  b.textContent = text;
  slot.classList.add('has-bubble');
  if (tight) slot.classList.add('bubble-tight');
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

  // 🎉 任天堂式過關大字（蓋章後 1.5s 彈出）
  setTimeout(() => {
    FlexCity.celebrate({
      title:    '咖啡廳開幕',
      titleSvg: '../shared/titles/title-03.svg',
      subtitle: 'LEVEL 3 CLEAR',
      accent:   '#ec4899',                       // 咖啡廳粉
      glow:     'rgba(236,72,153,.75)',
      palette:  ['#ec4899', '#facc15', '#22c55e', '#a855f7', '#f97316'],
    });
  }, 1500);

  // 大字 1.5s 出，等顯示完 + 淡出完（共 2.3s）+ 0.2s 緩衝 = 4.0s 接 modal
  const stars = hintUsed ? 2 : 3;
  setTimeout(() => {
    if (hasSuccess) FlexCity.showModal(stars, { onShow: applyModalCopy });
  }, 4000);
}

/* modal 彈出時依使用者實際採用的 justify-content 值改寫描述 */
function applyModalCopy() {
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
}

/* ── RESET ──────────────────────────────────── */
function doReset() {
  hasSuccess  = false;
  hintUsed    = false;
  editor.value = '';
  editor.classList.remove('text-green-700', 'font-bold');
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
editor.focus();

/* 初始化時跑一次 → 空輸入觸發「全員擠在一起 → 全員生氣」的視覺提示 */
updateStyles();
