/* ============================================================
   Flex City — Shared Engine
   shared/flex-city.js

   把五關共用的 Emmet 自動補全引擎與 modal 基底集中於此。
   各關 game.js 只需呼叫 FlexCity.initEmmet({...}) 並保留
   自己的 checkAnswer / doSuccess / doReset 等關卡專屬邏輯。

   設計原則：行為與抽出前「逐字一致」，差異只透過 callback 注入：
     - onApply : 套用補全 / Tab / input 後要跑的關卡邏輯
                 （L01/03/04/05 = updateStyles，L02 = checkAnswer）
     - showModal 的 onShow : modal 彈出後的客製動作
                 （L03 改寫描述文字，L05 撒花）
   ============================================================ */

window.FlexCity = (function () {
  let editor      = null;
  let EMMET       = {};
  let onApply     = function () {};
  let selIdx      = 0;
  let suggestions = [];

  /* ── EMMET: 游標前的單字 ─────────────────── */
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
    const [, val]   = suggestions[i];
    const { start } = getWordBefore();
    const end       = editor.selectionStart;
    editor.value    = editor.value.substring(0, start) + val + editor.value.substring(end);
    editor.setSelectionRange(start + val.length, start + val.length);
    hideDrop();
    onApply();
    editor.focus();
  }

  /* ── 鍵盤處理 ───────────────────────────── */
  function onKeydown(e) {
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
        onApply();
      }
      return;
    }

    if (e.key === 'Escape') { hideDrop(); return; }
    if (e.key === 'Enter' && suggestions.length) { hideDrop(); }
  }

  /* ── 初始化 Emmet 引擎 ──────────────────── */
  function initEmmet(cfg) {
    editor  = cfg.editor;
    EMMET   = cfg.emmet || {};
    onApply = cfg.onApply || function () {};

    // renderDrop 內以 inline onmousedown="applyIdx(i)" 呼叫，需掛到全域
    window.applyIdx = applyIdx;

    editor.addEventListener('keydown', onKeydown);
    editor.addEventListener('input', () => {
      onApply();
      updateSuggestions();
    });
    document.addEventListener('mousedown', e => {
      if (!e.target.closest('#emmet-drop') && !e.target.closest('#css-editor')) {
        hideDrop();
      }
    });
  }

  /* ── MODAL ──────────────────────────────── */
  function showModal(stars, opts) {
    opts = opts || {};
    document.getElementById('modal-stars').textContent =
      '★'.repeat(stars) + '☆'.repeat(3 - stars);

    const seal = document.querySelector('.modal-seal');
    seal.style.animation = 'none';
    requestAnimationFrame(() => {
      seal.style.animation = '';
      document.getElementById('modal-overlay').classList.add('on');
      if (typeof opts.onShow === 'function') opts.onShow(stars);
    });
  }

  function closeModal() {
    document.getElementById('modal-overlay').classList.remove('on');
    // 同步清掉 celebrate 留下的持續 backdrop（淡出後移除）
    const cb = document.querySelector('.fc-celebrate-backdrop');
    if (cb) {
      cb.classList.remove('fc-on');
      setTimeout(() => cb.remove(), 400);
    }
  }

  /* 關閉鈕 + 點遮罩關閉（五關行為一致） */
  function wireModalDismiss() {
    const closeBtn = document.getElementById('modal-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.addEventListener('click', e => {
      if (e.target === e.currentTarget) closeModal();
    });
  }

  /* ============================================================
     CELEBRATE — 任天堂式過關大字 + 粒子（純視覺，無音效震動）
     用法：
       FlexCity.celebrate({
         title:    '城市甦醒',         // 大字（必填）
         subtitle: 'LEVEL 1 CLEAR',     // 副標（可省）
         accent:   '#f97316',           // 副標底色 + 主色調
         glow:     'rgba(251,146,60,.7)', // 大字外發光
         palette:  ['#f97316', '#fbbf24', ...], // confetti 配色
         duration: 1800                 // banner 停留毫秒（含進場）
       });
     需要 canvas-confetti（CDN 載入），沒載到就只彈大字不灑粒子。
     ============================================================ */
  function injectCelebrateStyles() {
    if (document.getElementById('fc-celebrate-styles')) return;
    const style = document.createElement('style');
    style.id = 'fc-celebrate-styles';
    style.textContent = `
      /* 持續遮罩：跟 banner 同時淡入，但「不會」隨 banner 消失──
         會一直停留到 modal 關閉時，由 closeModal() 統一清掉。
         好處：銀幕從「大字進場」→ 短暫「霧化的城市」→「modal 卡片進場」
              整段都是同一片紙色霧化，視覺完全連續、零空檔。

         z-index 195：必須低於 modal-overlay (200)，否則會蓋住 modal
         讓 modal 完全點不到。banner 仍在 998，confetti 在 999，
         celebrate 階段三者仍正確分層。 */
      .fc-celebrate-backdrop {
        position: fixed;
        inset: 0;
        z-index: 195;
        background: rgba(249, 246, 240, 0.88);
        backdrop-filter: blur(4px);
        opacity: 0;
        pointer-events: none;
        transition: opacity .4s ease;
      }
      .fc-celebrate-backdrop.fc-on { opacity: 1; }

      .fc-celebrate {
        position: fixed;
        top: 42%;
        left: 50%;
        z-index: 998;
        pointer-events: none;
        text-align: center;
        white-space: nowrap;
        opacity: 0;
        transform: translate(-50%, -50%) scale(0);
      }
      .fc-celebrate.fc-on  { animation: fcCelebrateIn  .7s cubic-bezier(.34,1.7,.64,1) forwards; }
      .fc-celebrate.fc-off { animation: fcCelebrateOut .5s ease-in forwards; }
      .fc-celebrate-title {
        font-family: 'Noto Sans TC', sans-serif;
        font-size: clamp(4.5rem, 14vw, 9.5rem);
        font-weight: 900;
        letter-spacing: 0.08em;
        line-height: 1;
        color: var(--fc-title, var(--fc-accent, #facc15));
        filter: drop-shadow(8px 8px 0 var(--fc-stroke, #0e0c09));
      }
      /* SVG 標題：用手繪的描邊字（白色內填 + 黑色 stroke），
         高度跟文字版對齊，斜置陰影由 CSS 統一加，便於日後調整。 */
      .fc-celebrate-title-svg {
        display: block;
        height: clamp(4.5rem, 14vw, 9.5rem);
        width: auto;
        max-width: 92vw;
        margin: 0 auto;
        filter: drop-shadow(8px 8px 0 var(--fc-stroke, #0e0c09));
      }
      .fc-celebrate-sub {
        font-family: 'Space Mono', monospace;
        font-size: clamp(.85rem, 1.8vw, 1.1rem);
        font-weight: 700;
        color: var(--fc-stroke, #0e0c09);
        background: var(--fc-accent, #facc15);
        letter-spacing: 0.3em;
        margin-top: 1.5rem;   /* 1rem + 8px ≈ 24px，跟標題拉開距離 */
        padding: 0.4em 1.4em;
        display: inline-block;
        text-transform: uppercase;
        border: 2px solid var(--fc-stroke, #0e0c09);
        box-shadow: 4px 4px 0 var(--fc-stroke, #0e0c09);
      }
      @keyframes fcCelebrateIn {
        0%   { opacity: 0; transform: translate(-50%, -50%) scale(0)    rotate(-8deg); }
        60%  { opacity: 1; transform: translate(-50%, -50%) scale(1.2)  rotate(2deg);  }
        80%  {              transform: translate(-50%, -50%) scale(.92) rotate(-1deg); }
        100% { opacity: 1; transform: translate(-50%, -50%) scale(1)    rotate(0);    }
      }
      @keyframes fcCelebrateOut {
        0%   { opacity: 1; transform: translate(-50%, -50%) scale(1) rotate(0); }
        100% { opacity: 0; transform: translate(-50%, -52%) scale(.85); }
      }
      @media (prefers-reduced-motion: reduce) {
        .fc-celebrate.fc-on,
        .fc-celebrate.fc-off {
          animation: fcCelebrateFade .35s ease forwards;
          transform: translate(-50%, -50%);
        }
        @keyframes fcCelebrateFade {
          from { opacity: 0; } to { opacity: 1; }
        }
      }
    `;
    document.head.appendChild(style);
  }

  function celebrate(opts) {
    opts = opts || {};
    const title      = opts.title      || 'LEVEL CLEAR!';
    const subtitle   = opts.subtitle   || '';
    const accent     = opts.accent     || '#facc15';
    const titleColor = opts.titleColor || null;       // 文字版才有效
    const titleSvg   = opts.titleSvg   || null;       // 傳了就用手繪 SVG 取代文字
    const glow       = opts.glow       || 'rgba(250,204,21,.7)';
    const stroke     = opts.stroke     || '#0e0c09';
    const palette    = opts.palette    || ['#facc15', '#22c55e', '#3b82f6', '#ec4899', '#f97316'];
    const duration   = opts.duration   || 1800;

    injectCelebrateStyles();

    /* 防呆：若還有上次留下的元素先清掉 */
    document.querySelectorAll('.fc-celebrate, .fc-celebrate-backdrop')
            .forEach(el => el.remove());

    /* Backdrop：跟 banner 一起淡入，但「不會」隨 banner 一起消失──
       它會持續到 closeModal() 被呼叫時才清掉。 */
    const backdrop = document.createElement('div');
    backdrop.className = 'fc-celebrate-backdrop';
    document.body.appendChild(backdrop);

    const banner = document.createElement('div');
    banner.className = 'fc-celebrate';
    banner.style.setProperty('--fc-accent', accent);
    banner.style.setProperty('--fc-glow',   glow);
    banner.style.setProperty('--fc-stroke', stroke);
    if (titleColor) banner.style.setProperty('--fc-title', titleColor);
    // 有傳 titleSvg → 用手繪 SVG 標題；否則 fallback 到文字版
    const titleHTML = titleSvg
      ? '<img class="fc-celebrate-title-svg" src="' + titleSvg + '" alt="' + title + '">'
      : '<div class="fc-celebrate-title">' + title + '</div>';
    banner.innerHTML = titleHTML +
      (subtitle ? '<div class="fc-celebrate-sub">' + subtitle + '</div>' : '');
    document.body.appendChild(banner);

    requestAnimationFrame(() => {
      backdrop.classList.add('fc-on');
      banner.classList.add('fc-on');
    });

    /* 粒子：跟大字 impact 同步（~180ms 後爆發），三方向噴 */
    if (typeof confetti === 'function') {
      setTimeout(() => {
        confetti({ particleCount: 80, spread: 100, startVelocity: 45,
                   origin: { y: 0.55 }, colors: palette, zIndex: 999 });
        confetti({ particleCount: 50, angle: 60,  spread: 65, startVelocity: 50,
                   origin: { x: 0.1, y: 0.7 }, colors: palette, zIndex: 999 });
        confetti({ particleCount: 50, angle: 120, spread: 65, startVelocity: 50,
                   origin: { x: 0.9, y: 0.7 }, colors: palette, zIndex: 999 });
      }, 180);
    }

    /* 退場：只 banner 跳出消失，backdrop 持續留著等 modal 進場 */
    setTimeout(() => {
      banner.classList.remove('fc-on');
      banner.classList.add('fc-off');
      setTimeout(() => banner.remove(), 500);
    }, duration);
  }

  return {
    initEmmet,
    showModal,
    closeModal,
    wireModalDismiss,
    hideDrop,
    celebrate,
  };
})();
