# 🛠️ OpenSpace - KillerTools

<p align="center">
  <img src="./logo1.png" alt="OpenSpace - KillerTools Logo" width="120" />
</p>


[![GitHub license](https://img.shields.io/github/license/MrDino-Tz/OpenSpace-KillerTool?style=flat-square)](https://github.com/MrDino-Tz/OpenSpace-KillerTool/blob/main/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/MrDino-Tz/OpenSpace-KillerTool?style=flat-square)](https://github.com/MrDino-Tz/OpenSpace-KillerTool/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/MrDino-Tz/OpenSpace-KillerTool?style=flat-square)](https://github.com/MrDino-Tz/OpenSpace-KillerTool/issues)
[![Live Demo](https://img.shields.io/badge/demo-live-success?style=flat-square)](https://MrDino-Tz.github.io/OpenSpace-KillerTool)

**OpenSpace - KillerTools** is a free, open-source, client-side, and offline-first utility suite designed for developers, designers, and security professionals.

Built with performance, privacy, and aesthetic excellence in mind, all tools run entirely within your local browser sandbox. No sensitive information, file data, or passwords are ever transmitted to external servers—ensuring absolute privacy.

---

## 🚀 Key Features

### 🔐 Crypto & Security
*   **Cryptographically Secure Password Generator:** Generate strong passwords, passphrases, UUIDs, and API keys with customization options and exportable QR codes.
*   **zxcvbn Strength Analyzer:** Analyze passwords locally to estimate cracking duration against brute-force attacks with interactive visualization charts.
*   **PDF Signature Checker:** Validate PKCS#7 digital signatures and X.509 certificate chains locally on uploaded PDFs using client-side cryptography.

### 🎨 Design & Palette
*   **Aesthetic Color Converter:** Seamlessly convert colors between HEX, RGB, HSL, HSV, CMYK, and CSS Name formats. Generates lighter/darker variations and computes real-time contrast ratios against black and white.

### 📝 Text & Conversions
*   **Markdown to HTML Converter:** GFM (GitHub Flavored Markdown) parser featuring sanitized real-time previews, split views, and downloadable HTML/MD formats.
*   **Text-to-Binary Coder:** Instantly encode/decode text into Binary (Base 2), Octal (Base 8), Decimal (Base 10), or Hexadecimal (Base 16) with custom separators.
*   **Emoji Picker:** A rich, searchable catalog of emojis grouped by category for quick copying.
*   **ASCII Word Art Generator:** Convert plain text into styled ASCII banners using 30+ Figlet fonts with size slider and custom canvas coloring.

---

## ✨ Design & Experience Features

*   **Global Command Palette (`Ctrl + K` / `Cmd + K`):** Instantly search, filter, and launch any tool using keyboard navigation.
*   **Sleek Dark Mode Wave Transition:** Smooth, circular wave reveal animations for theme transitions using the web-native `View Transitions API` (with graceful fallback support).
*   **High-Contrast Theme Adaptation:** Optimized dark mode style customization ensuring components adapt seamlessly without hardcoded background conflicts.

---

## 🛠️ Tech Stack

*   **Core:** React 18, Vite
*   **UI Library:** Material-UI (MUI v5)
*   **Icons:** Ant Design Icons (`@ant-design/icons`)
*   **Libraries:** `node-forge` (cryptography), `colord` (color spaces), `marked` (markdown), `dompurify` (HTML sanitization), `figlet` (ASCII art).

---

## 💻 Running Locally

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### 2. Clone and Setup
```bash
git clone https://github.com/MrDino-Tz/OpenSpace-KillerTool.git
cd OpenSpace-KillerTool
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Start Development Server
```bash
npm start
```
The application will run locally at `http://localhost:3000/`.

---

## 📦 Production & Deployment

### Build the bundle
```bash
npm run build
```

### Deploy to GitHub Pages
```bash
npm run deploy
```

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/MrDino-Tz/OpenSpace-KillerTool/issues).

---

## 🛡️ License
Distributed under the MIT License. See `LICENSE` for more information.

DTC Team © 2026
