# 集點趣 (Stamp App)

一個可愛的兒童集點卡應用程式，使用 Vue.js 和 Firebase Firestore。

## 功能特色

- 📱 響應式設計，適合手機使用
- 🎨 多種主題顏色選擇（抹茶、櫻花、紅豆、海洋、墨染、金箔）
- 🖼️ 自訂背景圖片
- 🎯 自訂印章（支援 Emoji 或圖片）
- ✨ 優雅的動畫效果
- 💾 使用 Firebase Firestore 儲存資料
- 🎁 兌換點數功能
- 📊 即時集點狀況檢視

## 技術架構

- **前端框架**: Vue.js 3
- **樣式**: Tailwind CSS
- **資料庫**: Firebase Firestore
- **圖示**: FontAwesome
- **字型**: Google Fonts (Noto Sans TC, Playfair Display)

## 快速開始

### 1. 設定 Firebase

請參考 [FIREBASE_SETUP.md](FIREBASE_SETUP.md) 完成 Firebase 專案設定。

### 2. 更新配置

複製範例配置檔案並填入您的 Firebase 資訊：

```bash
# Windows PowerShell
copy firebase-config.example.js firebase-config.js

# Mac/Linux
cp firebase-config.example.js firebase-config.js
```

然後編輯 `firebase-config.js`，替換成您的 Firebase 配置。

### 3. 本地執行

直接在瀏覽器開啟 `index.html` 即可。

### 4. 部署

```bash
git add .
git commit -m "你的訊息"
git push
```

```bash
firebase deploy
```

## 使用說明

### 新增名單

1. 點擊「狀況」頁籤
2. 點擊「新增名單」
3. 輸入姓名、選擇主題顏色
4. 可選擇性添加背景圖片和自訂印章

### 集點

1. 在集點卡頁面選擇要集點的人
2. 點擊底部的集點按鈕
3. 集滿 10 點自動轉換為 1 個獎勵

### 兌換點數

1. 進入「狀況」頁面
2. 點擊「兌換」按鈕
3. 選擇要兌換的點數
4. 輸入管理員密碼確認

## 資料結構

### Firestore Collections

#### `profiles` Collection

```json
{
  "name": "Anna",
  "bgUrl": "https://...",
  "theme": "matcha",
  "stamp": "🐻",
  "createdAt": "2026-02-12T..."
}
```

#### `transactions` Collection

```json
{
  "name": "Anna",
  "points": 1,
  "type": "add",
  "timestamp": "2026-02-12 10:30:00",
  "createdAt": "2026-02-12T..."
}
```

## 版本歷史

### v2.0 (2026-02-12)

- ✨ 改用 Firebase Firestore 儲存資料
- 🗑️ 移除 Google Sheets 和 Webhook 依賴
- ⚡ 即時資料同步

### v1.0

- 🎉 初始版本
- 使用 Google Sheets + Webhook
