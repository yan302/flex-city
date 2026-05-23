/* ============================================================
   Flex City — Level 01 / Wake Up
   level-01/js/game.js

   共用引擎：shared/flex-city.js（Emmet 補全 + modal 基底）
   本檔只保留 L01 專屬：答案判定、過關編排（stagger 進場）。
   ============================================================ */

const editor    = document.getElementById('css-editor');
const dynStyles = document.getElementById('dynamic-styles');
const stamp     = document.getElementById('pass-stamp');
const resetBtn  = document.getElementById('reset-btn');
const gameBody  = document.getElementById('game-body');
const liveCity  = document.getElementById('live-city');

const ANSWER_KEY     = 'display:flex';
const MODAL_DELAY_MS = 5500;  // 過關後等 stagger + 大字慶祝播完再出 modal（大字 3.0s + banner 2.3s + 緩衝 0.2s）

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

let hasSuccess = false;
let hintUsed   = false;

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

/* ── SUCCESS（stagger 進場編排）──────────────
   這是玩家第一次「輸入一句 CSS → 城市真的活了」的時刻，
   讓建築依序就位，而不是同時瞬移：
     拍 0  : 城市入夜（夜空降臨、雲淡入、背景煙火施放）
     拍 1  : 摩天輪先亮燈
     拍 2+ : 大樓由左至右依序升起（CSS animation-delay 處理）
     最後  : 噴水池彈跳就位 + 噴水
   ────────────────────────────────────────── */
function doSuccess() {
  hasSuccess = true;
  dynStyles.textContent =
    `#live-city { display:flex; align-items:flex-end; justify-content:space-around; }`;

  // 先進入「甦醒」狀態（夜空 / 雲），建築維持隱形等待 stagger
  gameBody.classList.add('is-awakening');

  // 下一幀加上 staggering，觸發每棟建築的 animation-delay 序列進場
  requestAnimationFrame(() => {
    requestAnimationFrame(() => liveCity.classList.add('staggering'));
  });

  // 🎆 夜空煙火：等天色轉暗後（~0.7s）在建築後面的背景施放，陪著 stagger 進場。
  // 用自製 canvas 引擎（火箭升空→爆炸→重力粒子+拖尾），跟 Disney demo 同一風格；
  // 設定值：太空微重（gravity 0.06）+ 歡樂盛典（freq 60 ≈ 260ms 一發）+
  // 經典花冠 + 垂柳流星——跟使用者前面確認過的偏好一致。
  setTimeout(() => {
    FlexCity.fireworks({
      canvas:    '#live-city .sky-fireworks',
      duration:  4500,                   // 發射期延長到 4.5s，加上粒子尾聲飄落約 5.7s 整段視覺
      gravity:   0.06,
      frequency: 60,
      types:     ['classic', 'willow'],
    });
  }, 700);

  // 序列尾聲再蓋章（與噴水池就位同步）
  setTimeout(() => {
    gameBody.classList.add('is-success');
    stamp.classList.add('active');
    editor.classList.add('text-green-700', 'font-bold');
  }, 2600);

  // 🎉 任天堂式過關大字 + 原本的撒花（緊接著蓋章後彈出）
  setTimeout(() => {
    FlexCity.celebrate({
      title:    '城市甦醒',
      titleSvg: '../shared/titles/title-01.svg',  // 手繪描邊字
      subtitle: 'LEVEL 1 CLEAR',
      accent:   '#f97316',                       // 日出橘 → sub-pill 底色
      glow:     'rgba(251,146,60,.75)',
      palette:  ['#f97316', '#fbbf24', '#22c55e', '#3b82f6', '#ec4899'],
    });
  }, 3000);

  setTimeout(() => {
    if (hasSuccess) FlexCity.showModal(hintUsed ? 2 : 3);
  }, MODAL_DELAY_MS);
}

/* ── RESET ──────────────────────────────────── */
function doReset() {
  hasSuccess = false;
  hintUsed   = false;
  editor.value = '';
  editor.classList.remove('text-green-700', 'font-bold');
  editor.disabled = false;
  stamp.classList.remove('active');
  gameBody.classList.remove('is-success', 'is-awakening');
  liveCity.classList.remove('staggering');
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
