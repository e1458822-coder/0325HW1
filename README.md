# RL Gridworld Evaluator (HW1)

這是一個基於 Flask & HTML/JS 所開發的網頁應用程式，用來符合 HW1-1 與 HW1-2 的作業要求：

* **HW1-1: 網格地圖開發** (可自訂 n=5~9，點擊設定起點🟩、終點🟥 與 n-2個障礙物🔲)
* **HW1-2: 策略顯示與價值評估** (顯示隨機生成的動作作為策略，並推導顯示 V(s) 矩陣)

## 環境要求
請在 Anaconda 中您指定的 `DRL` 環境執行。

## 專案架構
這是一個完全不需後端伺服器的靜態網頁（Static Single-Page Application）。所有的 Policy Evaluation 與運算皆使用 JavaScript 在使用者瀏覽器內即時完成。因此，**完美支援 GitHub Pages** 或任何靜態資源託管服務。

## 啟動系統 (使用方式)

因為包含了後端「價值迭代運算」，請在本地 Anaconda 環境中執行：

1. 開啟 **Anaconda Prompt**，並啟動 `DRL` 環境：
   ```bash
   conda activate DRL
   ```
2. 切換到此專案資料夾：
   ```bash
   cd /d D:\Desktop\深度強化學習\HW1
   ```
3. 執行 Flask 後端程式：
   ```bash
   python app.py
   ```
4. 開啟瀏覽器，前往：[http://127.0.0.1:5000](http://127.0.0.1:5000)

## 系統重點流程說明
1. **設定 N 值**：輸入您要的維度大小 5 到 9，點擊 Generate Square。
2. **依序設定**：
   - 首先點擊作為 **起點 (Start)** 的網格
   - 接著點擊作為 **終點 (End)** 的網格 (進入此格獲得 Reward +10)
   - 最後依序點擊設定 **n-2 個障礙物 (Obstacles)**
3. **評估策略 (Evaluate Policy)**：
   - 點擊設定下方的 Evaluate 按鈕。
   - 後端將為每個有效網格配置一個隨機方向作為決定性策略 (Deterministic Policy)。
   - 使用 Policy Evaluation 搭配 Discount factor $\gamma=0.9$, Step Penalty $r=-1$ 來推導 V(s) 矩陣。
   - 網頁自動向下滾動，為您以雙視窗方式清楚展現 **Value Matrix** 和 **Policy Matrix**。
