# ⚖️ Licensing — OpenSpace KillerTools

---

## License Summary

**OpenSpace - KillerTools** is distributed under the **MIT License**.

This is one of the most permissive and widely-adopted open-source licenses in the world. In plain language, it means:

| You Can | You Cannot |
|---|---|
| ✅ Use this software freely — personal, commercial, educational | ❌ Hold the authors liable for anything |
| ✅ Modify the source code however you like | ❌ Remove the copyright and license notice from copies |
| ✅ Distribute original or modified copies | |
| ✅ Include it in proprietary software | |
| ✅ Sublicense it | |
| ✅ Use it privately without publishing changes | |

**No royalties. No permissions required. No strings attached.**

---

## Full License Text

```
MIT License

Copyright (c) 2026 DTC Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## Why MIT?

When choosing a license for OpenSpace - KillerTools, the MIT License was the clear and deliberate choice. Here is why:

### 1. Maximum Freedom for Users

The MIT License places no restrictions on what users do with the software. A security researcher can audit it. A company can embed it into a commercial product. A student can fork it for a university project. A developer can remix it into something entirely new. **The software serves the user, not the license.**

### 2. Compatibility With Dependencies

OpenSpace - KillerTools is built on top of excellent open-source libraries — React, Material-UI, Vite, node-forge, marked, and more. The majority of these dependencies are themselves MIT-licensed or Apache 2.0-licensed. The MIT License is compatible with both, ensuring there are no licensing conflicts across the entire dependency tree.

Using a copyleft license like GPL would have created friction for anyone wanting to build on top of this work in a closed-source context. MIT removes that barrier entirely.

### 3. Why Not GPL?

The GPL (General Public License) requires that any software that uses or extends GPL-licensed code must also be released under the GPL. While this is philosophically appealing as a mechanism to keep software "free forever," it has practical downsides:

- It prevents integration into commercial or proprietary products.
- It creates legal complexity for teams using this as a dependency.
- It conflicts with several of the dependencies this project relies on.

The MIT License achieves the same open spirit — the code is always publicly readable — without imposing obligations on anyone who builds on top of it.

### 4. Trust Through Simplicity

The MIT License is short, plain-English-readable, and universally understood by legal teams, developers, and open-source compliance tooling. There is no ambiguity. No one needs a lawyer to understand what they are allowed to do.

---

## Third-Party Licenses

OpenSpace - KillerTools uses the following open-source libraries. Their licenses are listed below for transparency and compliance:

| Library | License | Purpose |
|---|---|---|
| [React](https://github.com/facebook/react) | MIT | Core UI framework |
| [Vite](https://github.com/vitejs/vite) | MIT | Build tooling and dev server |
| [Material-UI (MUI)](https://github.com/mui/material-ui) | MIT | UI component library |
| [Ant Design Icons](https://github.com/ant-design/ant-design-icons) | MIT | Icon set |
| [node-forge](https://github.com/digitalbazaar/forge) | BSD-3-Clause / GPL-2.0 | Cryptography (PDF signature, hash) |
| [colord](https://github.com/omgovich/colord) | MIT | Color space conversions |
| [marked](https://github.com/markedjs/marked) | MIT | Markdown parsing |
| [DOMPurify](https://github.com/cure53/DOMPurify) | Apache-2.0 / MPL-2.0 | HTML sanitization |
| [figlet.js](https://github.com/patorjk/figlet.js) | MIT | ASCII art text generation |
| [simplebar-react](https://github.com/Grsmto/simplebar) | MIT | Custom scrollbar |
| [react-device-detect](https://github.com/duskload/react-device-detect) | MIT | Device type detection |
| [zxcvbn](https://github.com/dropbox/zxcvbn) | MIT | Password strength estimation |
| [pdf-lib](https://github.com/Hopding/pdf-lib) | MIT | PDF manipulation |
| [pdfjs-dist](https://github.com/mozilla/pdf.js) | Apache-2.0 | PDF rendering |

> **Note on node-forge:** The node-forge library is dual-licensed under BSD-3-Clause and GPL-2.0. When used in a browser context (client-side only, no distribution of modified source), the BSD-3-Clause terms apply, which are compatible with the MIT License used in this project.

---

## Desktop Edition Licensing

The **OpenSpace - KillerTool Desktop** application is a companion project built with [Tauri](https://tauri.app/) (Apache-2.0 / MIT dual-licensed). The desktop edition is also distributed under the **MIT License**, consistent with the web platform.

Tauri's Rust backend crates are Apache-2.0 and MIT licensed. All Tauri plugins used in the desktop edition (`tauri-plugin-http`, `tauri-plugin-store`, `tauri-plugin-fs`, etc.) are similarly Apache-2.0 / MIT licensed.

There are **no GPL dependencies** in the desktop edition's dependency tree, ensuring clean MIT compatibility throughout.

---

## Contributing & License Acknowledgment

By submitting a pull request or contribution to the OpenSpace - KillerTools repository, you agree that your contribution will be licensed under the same **MIT License** that covers the project. This ensures the entire codebase remains under a single, consistent license.

No Contributor License Agreement (CLA) is required. The MIT License's terms apply automatically to all accepted contributions.

---

## Contact & Compliance

If you are using OpenSpace - KillerTools in a product, project, or research and have licensing questions, you can reach the team via:

- **GitHub Issues:** [github.com/MrDino-Tz/OpenSpace-KillerTool/issues](https://github.com/MrDino-Tz/OpenSpace-KillerTool/issues)
- **Repository:** [github.com/MrDino-Tz/OpenSpace-KillerTool](https://github.com/MrDino-Tz/OpenSpace-KillerTool)

---

*DTC Team © 2026 — MIT License*
