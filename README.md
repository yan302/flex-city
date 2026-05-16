# 🏙️ Flex City

> 一個以城市生活為主題的互動式 Flexbox 學習遊戲。
> 透過 5 個情境關卡，將抽象的 CSS 排版概念轉化成直覺的空間操作。

## 🎮 五大關卡

| 關卡 | 主題 | 核心屬性 |
|---|---|---|
| **01 喚醒城市** / Wake Up | 一條沉睡的街道甦醒過來 | `display: flex` |
| **02 向上開發** / Vertical Stack | 土地有限，蓋一棟五層樓 | `flex-direction: column-reverse` |
| **03 貓咪咖啡** / Cat Café | 讓每隻貓都有剛剛好的距離 | `justify-content` + `align-items` |
| **04 星空暗號** / F·L·E·X | 讓鐘樓與滿月精準重疊，星座暗號顯現 | `justify-content: center` + `align-items: center` |
| **05 夜市開張** / Night Market | 攤位太多放不下，自動換行 | `flex-wrap: wrap` + `row-gap` |

## ✨ 特色

- 🎯 **即時預覽**：每打一個字，畫面立刻反應
- 💡 **漸進式提示系統**：不是直接公布答案，而是在玩家逐步接近正解時提供方向引導
- ⌨️ **Emmet 縮寫支援**：`df` → `display: flex;`、`fdc` → `flex-direction: column;`...
- 🎬 **過關動畫序列**：印章 → 動畫 → modal，2.5–6.5s 不等的節奏
- 🎊 **最終關撒花**：通關 + 完成挑戰雙重慶祝
- 📱 **視窗大小自適應**：Flex 排版在不同寬度下也不會壞

## 🌃 為什麼是城市？

Flexbox 本質上是在處理「空間中的排列與關係」。

因此，我選擇用「城市生活」作為隱喻。

街道、建築、咖啡廳、夜市與星空，不只是生活中的風景，<br>
也能自然對應 Flexbox 的排列、對齊、留白與方向。

只要稍微留心，生活中的每個角落，<br>
都可能是一場正在發生的 Flexbox 練習。

## 🧠 設計思考

每一關都不是單純的語法翻譯，而是將 Flexbox 的抽象概念轉化成空間問題。

例如：

- **`flex-direction: column-reverse`**
  玩家會看到「建築樓層的對調」，藉此理解軸線反轉。

- **`space-around` vs `space-evenly`**
  兩者都能成立，因為「剛剛好的距離」本身就存在不同理解。

- **`space-between`**
  不被接受，因為首尾元素貼牆，破壞了空間舒適感。

## 🛠️ 技術

Vanilla HTML / CSS / JavaScript（無框架、零建置）

- [Tailwind CSS](https://tailwindcss.com/) CDN 版做 UI 排版
- [canvas-confetti](https://github.com/catdad/canvas-confetti) 做撒花效果
- 字體：Noto Sans TC + Space Mono

## 🚀 跑起來

```bash
# 用任何靜態伺服器都可以，例如 VS Code Live Server
# 或：
python3 -m http.server 8000
open http://localhost:8000
```

直接點 `index.html` 也行（但有些 CDN 資源在 `file://` 協議下可能會被擋）。

## 📂 結構

```
flex-city/
├── index.html         # 首頁 / 關卡選單
├── level-01/          # 每關獨立目錄
│   ├── index.html
│   ├── css/style.css
│   ├── js/game.js
│   └── assets/        # 每關的 SVG / PNG 插畫
├── level-02/
├── level-03/
├── level-04/
└── level-05/
```

## 🎨 致謝

- 插畫：手繪 + AI 輔助生成（夜市攤位）
- 互動設計與課程腳本：我 + Claude Code 的協作迭代
