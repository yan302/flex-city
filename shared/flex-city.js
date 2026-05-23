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

    /* Enter：跟 Tab 一樣可以套用補全（建議下拉有出現時才攔截，
       避免在純文字編輯時影響正常換行行為） */
    if (e.key === 'Enter' && suggestions.length) {
      e.preventDefault();
      applyIdx(selIdx);
      return;
    }
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
      /* 持續遮罩：跟 banner 同時淡入，停留到 modal 關閉時才清掉。
         顏色與所有關卡 modal-overlay 同（深夜色 + 6px blur），
         所以從「大字進場」→「modal 進場」整段視覺完全連續、零跳色。
         z-index 195：必須低於 modal-overlay (200)，否則會蓋住 modal。 */
      .fc-celebrate-backdrop {
        position: fixed;
        inset: 0;
        z-index: 195;
        background: rgba(15, 23, 42, 0.78);
        backdrop-filter: blur(6px);
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

  /* ============================================================
     FIREWORKS — 真．煙火引擎（自製 canvas 版）
     火箭從畫布底部升空 → 抵達目標 → 爆炸 → 重力粒子 + 拖尾。
     視覺風格參考使用者提供的 Disney「Happily Ever After」demo，
     但抽掉音效／反射／米奇心型，只留「經典花冠 + 垂柳流星」+
     太空微重 + 歡樂盛典頻率，並關進指定畫布內當背景施放。

     用法：
       FlexCity.fireworks({
         canvas:    '#live-city .sky-fireworks', // 必填，畫布 selector 或 element
         duration:  3000,            // 自動發射期長度（ms），結束後粒子自然飄落完
         gravity:   0.06,            // 太空微重（垂柳會再 × 0.4 = 更慢落）
         frequency: 60,              // 0–100，歡樂盛典 ≈ 60（約每 260ms 一發）
         types:     ['classic', 'willow'],  // 經典花冠 + 垂柳
         palette:   [{r,g,b}, …],    // RGB 物件陣列；不傳就用預設五色（橘/黃/綠/藍/桃）
       });

     不傳 canvas → 直接 return（這個版本一定要關進畫布）。
     ============================================================ */
  function fireworks(opts) {
    opts = opts || {};
    const cv = typeof opts.canvas === 'string'
      ? document.querySelector(opts.canvas)
      : opts.canvas;
    if (!cv || !cv.getContext) return;

    const c2d      = cv.getContext('2d');
    const duration = opts.duration  || 3000;
    const gravity  = opts.gravity   != null ? opts.gravity   : 0.06;
    const freq     = opts.frequency != null ? opts.frequency : 60;
    const types    = opts.types     || ['classic', 'willow'];
    const palette  = opts.palette   || [
      { r: 249, g: 115, b: 22  },   // 日出橘
      { r: 251, g: 191, b: 36  },   // 金黃
      { r: 34,  g: 197, b: 94  },   // 翠綠
      { r: 59,  g: 130, b: 246 },   // 寶藍
      { r: 236, g: 72,  b: 153 },   // 粉桃
    ];

    /* 畫布要跟著 DPR 重新設尺寸，否則 HiDPI 螢幕會糊掉。
       setTransform 之後座標可以直接用 CSS px（W × H = 畫布的 CSS 尺寸）。 */
    let W = 0, H = 0;
    function resize() {
      const dpr  = window.devicePixelRatio || 1;
      const rect = cv.getBoundingClientRect();
      W = rect.width;  H = rect.height;
      cv.width  = W * dpr;
      cv.height = H * dpr;
      c2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    const onResize = () => resize();
    window.addEventListener('resize', onResize);

    const rand      = (a, b) => Math.random() * (b - a) + a;
    const pickColor = ()     => palette[Math.floor(Math.random() * palette.length)];
    const pickType  = ()     => types[Math.floor(Math.random() * types.length)];

    const rockets   = [];
    const particles = [];
    const end       = Date.now() + duration;
    let lastLaunch  = 0;
    let raf         = null;

    /* 發射：從底部隨機 x 出發，飛向畫面上 5–40% 高度的目標點 */
    function launch() {
      const tx = rand(W * 0.15, W * 0.85);
      const ty = rand(H * 0.05, H * 0.40);
      const sx = tx + rand(-20, 20);
      const sy = H + 4;
      rockets.push({
        x: sx, y: sy, tx, ty,
        angle: Math.atan2(ty - sy, tx - sx),
        speed: 2, accel: 1.04,
        color: pickColor(),
        type:  pickType(),
        trail: [[sx, sy], [sx, sy], [sx, sy], [sx, sy]],
      });
    }

    /* 抵達目標 → 爆炸。經典 = 球狀放射；垂柳 = 慢速、長尾、低重力。 */
    function explode(r) {
      const isWillow = r.type === 'willow';
      const count = isWillow ? 70 : 55;   // 配合 'lighter' 加法疊色已經夠亮，少 25% 粒子減負擔
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = isWillow ? rand(0.8, 2.2) : rand(1.6, 4.6);
        particles.push({
          x: r.x, y: r.y,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v,
          color: r.color,
          type:  r.type,
          alpha: 1,
          decay:    isWillow ? rand(0.008, 0.014) : rand(0.014, 0.022),
          friction: isWillow ? 0.985 : 0.94,
          gravity:  isWillow ? gravity * 0.4 : gravity,
          trail: [],
        });
      }
    }

    function frame() {
      const now  = Date.now();
      const left = end - now;

      /* 拖尾淡化：用 destination-out 把畫布上已存在的像素「擦掉一點點」，
         而不是塗黑——這樣下層的 CSS 夜空才會透過畫布顯現出來，
         而粒子拖尾會在 ~10 幀內漸漸消失，做出彗星尾巴的效果。 */
      c2d.save();
      c2d.globalCompositeOperation = 'destination-out';
      c2d.fillStyle = 'rgba(0,0,0,0.18)';
      c2d.fillRect(0, 0, W, H);
      c2d.restore();

      /* 自動發射節奏：freq 60 ≈ 260ms / 發 */
      if (left > 0) {
        const interval = Math.max(80, 800 - freq * 9);
        if (now - lastLaunch > interval) {
          launch();
          lastLaunch = now;
        }
      }

      /* 更新火箭 */
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.trail.pop();
        r.trail.unshift([r.x, r.y]);
        r.speed *= r.accel;
        const d = Math.hypot(r.tx - r.x, r.ty - r.y);
        if (d <= r.speed) {
          explode(r);
          rockets.splice(i, 1);
        } else {
          r.x += Math.cos(r.angle) * r.speed;
          r.y += Math.sin(r.angle) * r.speed;
        }
      }
      /* 畫火箭 + 粒子：用 'lighter'（加法疊色）取代 shadowBlur 做發光。
         shadowBlur 每筆都要跑一次 offscreen gaussian blur，幾百顆粒子下來
         主執行緒會被吃光、連 CSS stagger 都跟著卡；'lighter' 則是 GPU 友善的
         混色模式，粒子重疊處會自然加色爆白成熱核心，視覺上反而更像真煙火。 */
      c2d.save();
      c2d.globalCompositeOperation = 'lighter';

      for (const r of rockets) {
        const p0 = r.trail[r.trail.length - 1];
        c2d.beginPath();
        c2d.moveTo(p0[0], p0[1]);
        c2d.lineTo(r.x, r.y);
        c2d.strokeStyle = `rgba(${r.color.r},${r.color.g},${r.color.b},0.95)`;
        c2d.lineWidth   = 2;
        c2d.stroke();
      }

      /* 更新爆炸粒子（摩擦 + 重力 + alpha 衰減）—— 只算數、不畫圖 */
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.trail.unshift([p.x, p.y]);
        if (p.trail.length > 4) p.trail.pop();
        p.vx *= p.friction;
        p.vy *= p.friction;
        p.vy += p.gravity;
        p.x  += p.vx;
        p.y  += p.vy;
        p.alpha -= p.decay;
        if (p.alpha <= 0) particles.splice(i, 1);
      }

      for (const p of particles) {
        if (!p.trail.length) continue;
        const last = p.trail[p.trail.length - 1];
        c2d.beginPath();
        c2d.moveTo(last[0], last[1]);
        c2d.lineTo(p.x, p.y);
        c2d.strokeStyle = `rgba(${p.color.r},${p.color.g},${p.color.b},${p.alpha})`;
        c2d.lineWidth   = Math.max(0.6, (p.type === 'willow' ? 1.4 : 2.1) * p.alpha);
        c2d.stroke();
      }

      c2d.restore();

      /* 結束條件：發射期過完、火箭打完、粒子也全淡完 → 收尾擦淨畫布 */
      if (left <= 0 && rockets.length === 0 && particles.length === 0) {
        window.removeEventListener('resize', onResize);
        cancelAnimationFrame(raf);
        c2d.clearRect(0, 0, W, H);
        return;
      }
      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);
  }

  /* ============================================================
     全域樣式注入（每關共用）
     - nav 上的 F 標誌 hover 時，右側浮現「← 回首頁」字樣
     ============================================================ */
  function injectGlobalStyles() {
    if (document.getElementById('fc-global-styles')) return;
    const style = document.createElement('style');
    style.id = 'fc-global-styles';
    style.textContent = `
      /* F 標誌上方浮字：偵測「指向 ../index.html」的 nav 連結即套用 */
      nav a[href="../index.html"] {
        position: relative;
      }
      nav a[href="../index.html"]::after {
        content: "← 回首頁";
        position: absolute;
        bottom: calc(100% + 8px);   /* 圈圈上方 8px */
        left: 50%;
        transform: translateX(-50%) translateY(4px);
        font-family: 'Noto Sans TC', sans-serif;
        font-size: .78rem;
        font-weight: 700;
        letter-spacing: .04em;
        white-space: nowrap;
        color: var(--ink, #0e0c09);
        opacity: 0;
        pointer-events: none;
        transition: opacity .25s ease,
                    transform .25s cubic-bezier(.34, 1.4, .64, 1);
      }
      nav a[href="../index.html"]:hover::after {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    `;
    document.head.appendChild(style);
  }
  injectGlobalStyles();

  return {
    initEmmet,
    showModal,
    closeModal,
    wireModalDismiss,
    hideDrop,
    celebrate,
    fireworks,
  };
})();
