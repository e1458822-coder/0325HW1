# RL Gridworld Evaluator (HW1)

這是一個基於 Flask & HTML/JS 所開發的網頁應用程式，用來符合 HW1-1 與 HW1-2 的作業要求：

* **HW1-1: 網格地圖開發** (可自訂 n=5~9，點擊設定起點🟩、終點🟥 與 n-2個障礙物🔲)
* **HW1-2: 策略顯示與價值評估** (顯示隨機生成的動作作為策略，並推導顯示 V(s) 矩陣)

## 環境要求
請在 Anaconda 中您指定的 `DRL` 環境執行。

## 安裝套件
如果您尚未安裝 `Flask`，請在 Anaconda Prompt 內啟動環境並執行：

```bash
conda activate DRL
pip install flask
```

## 啟動系統
在命令提示字元 (Anaconda Prompt) 中，切換到此專案資料夾 (`d:\Desktop\深度強化學習\HW1`)，然後執行 `app.py`：

```bash
cd /d d:\Desktop\深度強化學習\HW1
python app.py
```

接著，在您的瀏覽器中開啟 `http://127.0.0.1:5000` 即可檢視並操作網格地圖！

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
