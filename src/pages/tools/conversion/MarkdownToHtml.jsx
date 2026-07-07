import { useState, useMemo, useCallback, useRef } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { jsPDF } from 'jspdf';

// material-ui
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import Snackbar from '@mui/material/Snackbar';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import LinearProgress from '@mui/material/LinearProgress';

// icons
import {
  CopyOutlined,
  ClearOutlined,
  DownloadOutlined,
  EyeOutlined,
  CodeOutlined,
  FileMarkdownOutlined,
  DownOutlined,
  QuestionCircleOutlined,
  FilePdfOutlined,
  SettingOutlined
} from '@ant-design/icons';

// project imports
import MainCard from 'components/MainCard';

// Configure marked
marked.setOptions({
  gfm: true,
  breaks: true
});

const SAMPLE_MARKDOWN = `# Hello World

This is a **Markdown to HTML** converter built into OpenSpace-KillerTools.

## Features

- Real-time preview
- GFM (GitHub Flavored Markdown) support
- Sanitized HTML output
- Copy & download options

### Code Block

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
console.log(greet("World"));
\`\`\`

### Table

| Feature | Status |
|---------|--------|
| Bold | ✅ |
| Italic | ✅ |
| Links | ✅ |
| Images | ✅ |
| Tables | ✅ |
| Code | ✅ |

### Blockquote

> "The best way to predict the future is to invent it." — Alan Kay

### Links & Images

[Visit GitHub](https://github.com) — Here's a link example.

### Task List

- [x] Markdown input
- [x] Live preview
- [x] HTML output
- [ ] More features coming

---

*Made with ❤️ by DTC Team*
`;

const SYNTAX_REFERENCE = [
  {
    section: 'Headings',
    rows: [
      { md: '# H1', html: '<h1>H1</h1>' },
      { md: '## H2', html: '<h2>H2</h2>' },
      { md: '### H3', html: '<h3>H3</h3>' },
      { md: '#### H4', html: '<h4>H4</h4>' },
      { md: '##### H5', html: '<h5>H5</h5>' },
      { md: '###### H6', html: '<h6>H6</h6>' }
    ]
  },
  {
    section: 'Text Formatting',
    rows: [
      { md: '**bold**', html: '<strong>bold</strong>' },
      { md: '*italic*', html: '<em>italic</em>' },
      { md: '***bold+italic***', html: '<strong><em>bold+italic</em></strong>' },
      { md: '~~strikethrough~~', html: '<del>strikethrough</del>' },
      { md: '`inline code`', html: '<code>inline code</code>' },
      { md: 'H~2~O (subscript)', html: 'H<sub>2</sub>O' },
      { md: 'X^2^ (superscript)', html: 'X<sup>2</sup>' }
    ]
  },
  {
    section: 'Lists',
    rows: [
      { md: '- Unordered item', html: '<ul><li>Unordered item</li></ul>' },
      { md: '1. Ordered item', html: '<ol><li>Ordered item</li></ol>' },
      { md: '- [x] Task done', html: '<li><input checked="" disabled="" type="checkbox"> Task done</li>' },
      { md: '- [ ] Task open', html: '<li><input disabled="" type="checkbox"> Task open</li>' }
    ]
  },
  {
    section: 'Links & Images',
    rows: [
      { md: '[Link](https://example.com)', html: '<a href="https://example.com">Link</a>' },
      { md: '![Alt](image.png)', html: '<img src="image.png" alt="Alt">' },
      { md: '<https://auto.link>', html: '<a href="https://auto.link">https://auto.link</a>' },
      { md: '[Reference][1]\n\n[1]: https://ref.com', html: '<a href="https://ref.com">Reference</a>' }
    ]
  },
  {
    section: 'Code',
    rows: [
      { md: '```js\nconst x = 1;\n```', html: '<pre><code class="language-js">const x = 1;</code></pre>' },
      { md: '```\nplain block\n```', html: '<pre><code>plain block</code></pre>' },
      { md: '`inline code`', html: '<code>inline code</code>' }
    ]
  },
  {
    section: 'Tables',
    rows: [
      { md: '| A | B |\n|---|---|\n| 1 | 2 |', html: '<table><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table>' }
    ]
  },
  {
    section: 'Blockquotes',
    rows: [
      { md: '> Quote', html: '<blockquote><p>Quote</p></blockquote>' },
      { md: '> **Nested**\n> > Inner', html: '<blockquote><p><strong>Nested</strong></p><blockquote><p>Inner</p></blockquote></blockquote>' }
    ]
  },
  {
    section: 'Other',
    rows: [
      { md: '---', html: '<hr>' },
      { md: '\\*escaped\\*', html: '*escaped*' },
      { md: ':rocket:', html: ':rocket:' },
      { md: '<!-- comment -->', html: '<!-- comment -->' }
    ]
  }
];

// ==============================|| MARKDOWN TO HTML ||============================== //

export default function MarkdownToHtml() {
  const theme = useTheme();

  const [markdown, setMarkdown] = useState(SAMPLE_MARKDOWN);
  const [viewMode, setViewMode] = useState('preview');
  const [sanitize, setSanitize] = useState(true);
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);
  const [showPdfSettings, setShowPdfSettings] = useState(false);
  const [pdfOptions, setPdfOptions] = useState({
    size: 'a4',
    orientation: 'portrait',
    margins: 'normal',
    filename: 'output'
  });
  const previewRef = useRef(null);

  // Extract first H1 for default filename
  const pdfFilename = useMemo(() => {
    const custom = pdfOptions.filename;
    if (custom && custom !== 'output') return custom;
    const match = markdown.match(/^#\s+(.+)/m);
    return match ? match[1].trim().replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').toLowerCase() || 'output' : 'output';
  }, [markdown, pdfOptions.filename]);

  // Convert markdown to HTML
  const rawHtml = useMemo(() => {
    try {
      return marked.parse(markdown || '');
    } catch {
      return '<p style="color:red">Error parsing markdown</p>';
    }
  }, [markdown]);

  const html = useMemo(() => {
    return sanitize ? DOMPurify.sanitize(rawHtml) : rawHtml;
  }, [rawHtml, sanitize]);

  // Stats
  const stats = useMemo(() => {
    const lines = markdown.split('\n').length;
    const words = markdown.split(/\s+/).filter(Boolean).length;
    const chars = markdown.length;
    const htmlSize = new Blob([html]).size;
    return { lines, words, chars, htmlSize };
  }, [markdown, html]);

  const handleCopy = useCallback(
    (text, label) => {
      navigator.clipboard.writeText(text).then(() => {
        setSnackMsg(`${label} copied to clipboard!`);
        setSnackOpen(true);
      });
    },
    []
  );

  const handleDownload = useCallback(
    (content, filename, type) => {
      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      setSnackMsg(`Downloaded ${filename}!`);
      setSnackOpen(true);
    },
    []
  );

  // DOM text renderer for PDF — selectable text with word-level line breaking
  const renderDomToPdf = useCallback((pdf, html, margin, pageW, pageH) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div id="root">${html}</div>`, 'text/html');
    const root = doc.getElementById('root');
    if (!root) return;

    const usableW = pageW - margin * 2;
    const usableH = pageH - margin * 2;
    let y = margin;
    let pageNum = 0;

    function setTextColor(hex) {
      if (!hex) { pdf.setTextColor(0, 0, 0); return; }
      pdf.setTextColor(
        parseInt(hex.slice(1, 3), 16),
        parseInt(hex.slice(3, 5), 16),
        parseInt(hex.slice(5, 7), 16)
      );
    }

    function addPage() {
      pageFooter();
      pdf.addPage();
      pageNum++;
      y = margin;
    }

    function pageFooter() {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(180);
      const total = pdf.internal.getNumberOfPages();
      pdf.text(`${pageNum + 1} / ${total}`, pageW - margin, pageH - margin / 2, { align: 'right' });
    }

    function needSpace(h) {
      if (y + h > margin + usableH) addPage();
    }

    // Collect inline segments from a node tree
    function collectSegments(node, base) {
      const segs = [];
      function walk(n, s) {
        if (n.nodeType === Node.TEXT_NODE) {
          const t = n.textContent;
          if (t) segs.push({ ...s, text: t });
        } else if (n.nodeType === Node.ELEMENT_NODE) {
          const tag = n.tagName.toLowerCase();
          const ns = { ...s };
          switch (tag) {
            case 'strong': case 'b': ns.bold = true; break;
            case 'em': case 'i': ns.italic = true; break;
            case 'code': ns.font = 'courier'; ns.color = '#c7254e'; break;
            case 'a': ns.color = '#1976d2'; ns.underline = true; break;
            case 'del': ns.color = '#888'; break;
            case 'br': segs.push({ ...s, text: '\n' }); return;
            case 'sub': ns.size = Math.max((ns.size || 10) * 0.7, 7); break;
            case 'sup': ns.size = Math.max((ns.size || 10) * 0.7, 7); break;
            default: break;
          }
          for (const c of n.childNodes) walk(c, ns);
        }
      }
      walk(node, base);
      return segs;
    }

    // Merge adjacent segments with identical style
    function mergeSegs(segs) {
      if (!segs.length) return [];
      const out = [segs[0]];
      for (let i = 1; i < segs.length; i++) {
        const prev = out[out.length - 1];
        const cur = segs[i];
        if (prev.font === cur.font && prev.bold === cur.bold && prev.italic === cur.italic &&
            prev.color === cur.color && prev.underline === cur.underline && prev.size === cur.size) {
          prev.text += cur.text;
        } else {
          out.push(cur);
        }
      }
      return out;
    }

    // Apply font/style to jsPDF
    function applyStyle(seg) {
      const family = seg.font || 'helvetica';
      let style = 'normal';
      if (seg.bold && seg.italic) style = 'bolditalic';
      else if (seg.bold) style = 'bold';
      else if (seg.italic) style = 'italic';
      try { pdf.setFont(family, style); } catch { pdf.setFont('helvetica', 'normal'); }
      pdf.setFontSize(seg.size || 10);
      setTextColor(seg.color || '#333');
    }

    // Render inline segments with word-level wrapping
    function renderSegments(segs, x, w, leading) {
      if (!segs.length) return;
      const merged = mergeSegs(segs);
      const lineH = (leading || 10) * 1.35;
      let currentLine = [];
      let currentW = 0;

      function flushLine() {
        if (!currentLine.length) return;
        needSpace(lineH);
        try {
          let cx = x;
          for (const s of currentLine) {
            if (!s.text) continue;
            applyStyle(s);
            pdf.text(s.text, cx, y);
            if (s.underline) {
              const clr = s.color || '#333';
              pdf.setDrawColor(parseInt(clr.slice(1,3),16), parseInt(clr.slice(3,5),16), parseInt(clr.slice(5,7),16));
              pdf.setLineWidth(0.3);
              pdf.line(cx, y + 0.5, cx + s.w, y + 0.5);
            }
            cx += s.w;
          }
        } catch { /* */ }
        y += lineH;
        currentLine = [];
        currentW = 0;
      }

      for (const seg of merged) {
        // Split on \n first, then on word boundaries
        const segments = seg.text.split('\n');
        for (let si = 0; si < segments.length; si++) {
          if (si > 0) flushLine(); // \n → line break
          const txt = segments[si];
          if (!txt) continue;
          // Split into words with their trailing space
          const words = [];
          let buf = '';
          for (const ch of txt) {
            if (/\S/.test(ch)) {
              buf += ch;
            } else {
              if (buf) { words.push(buf); buf = ''; }
              words.push(ch);
            }
          }
          if (buf) words.push(buf);
          // Process each word
          for (const word of words) {
            if (!word) continue;
            try {
              applyStyle(seg);
              const wordW = word === ' ' ? seg.size * 0.25 : pdf.getTextWidth(word);
              // Check if word fits on current line
              if (wordW > 0 && currentW + wordW > w && currentLine.length > 0) {
                flushLine();
              }
              currentLine.push({ ...seg, text: word, w: wordW });
              currentW += wordW;
            } catch { /* skip unmeasurable */ }
          }
        }
      }
      flushLine();
      y += 1;
    }

    // Block-level render
    function renderBlock(node, indent) {
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const tag = node.tagName.toLowerCase();
      if (tag === 'style' || tag === 'script') return;

      // Keep heading with next content (minimum 2 lines after)
      function keepWithNext(h) {
        if (y + h + 20 > margin + usableH) addPage();
      }

      switch (tag) {
        case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6': {
          const sizes = { h1: 24, h2: 20, h3: 16, h4: 14, h5: 12, h6: 11 };
          const gaps = { h1: 8, h2: 6, h3: 5, h4: 4, h5: 3, h6: 3 };
          const sz = sizes[tag];
          const gap = gaps[tag];
          keepWithNext(sz + gap);
          y += gap;
          const segs = collectSegments(node, { size: sz, bold: true, color: '#1a1a1a', font: 'helvetica' });
          renderSegments(segs, margin + indent, usableW - indent, sz);
          if (['h1', 'h2'].includes(tag)) {
            y += 1;
            pdf.setDrawColor(220, 220, 220);
            pdf.setLineWidth(0.4);
            if (y < margin + usableH) pdf.line(margin + indent, y, margin + usableW, y);
            y += 4;
          }
          y += 2;
          break;
        }
        case 'p': {
          y += 2;
          const segs = collectSegments(node, { size: 10, color: '#333', font: 'helvetica' });
          renderSegments(segs, margin + indent, usableW - indent, 10);
          y += 1;
          break;
        }
        case 'blockquote': {
          const bqIndent = indent + 8;
          // Draw background
          const startY = y;
          for (const c of node.childNodes) renderBlock(c, bqIndent);
          const endY = y;
          if (endY > startY + 0.5) {
            pdf.setFillColor(248, 249, 250);
            pdf.rect(margin + indent, startY - 1, usableW - indent, endY - startY + 1, 'F');
            pdf.setDrawColor(25, 118, 210);
            pdf.setLineWidth(1.2);
            pdf.line(margin + indent, startY - 1, margin + indent, endY + 1);
          }
          break;
        }
        case 'ul': case 'ol': {
          let idx = 0;
          for (const li of node.childNodes) {
            if (li.tagName?.toLowerCase() !== 'li') continue;
            idx++;
            const bullet = tag === 'ul' ? '•' : `${idx}.`;
            const bIndent = indent + 8;
            y += 1;
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(10);
            pdf.setTextColor(51, 51, 51);
            pdf.text(bullet, margin + indent, y + 3.5);
            const inner = collectSegments(li, { size: 10, color: '#333', font: 'helvetica' });
            renderSegments(inner, margin + bIndent, usableW - bIndent, 10);
            // Handle nested lists inside li
            for (const c of li.childNodes) {
              if (c.nodeType === Node.ELEMENT_NODE && ['ul', 'ol'].includes(c.tagName.toLowerCase())) {
                renderBlock(c, bIndent);
              }
            }
          }
          break;
        }
        case 'pre': {
          const codeEl = node.querySelector('code');
          const text = codeEl ? codeEl.textContent : node.textContent;
          const lines = text.split('\n');
          // Calculate if we need a page break
          const blockH = lines.length * 12 + 10;
          needSpace(blockH);
          y += 2;
          const preY = y;
          const leftX = margin + indent + 4;
          // Background
          pdf.setFillColor(246, 248, 250);
          pdf.rect(margin + indent, y, usableW - indent, blockH - 2, 'F');
          pdf.setDrawColor(225, 228, 232);
          pdf.setLineWidth(0.5);
          pdf.rect(margin + indent, y, usableW - indent, blockH - 2, 'S');
          // Line numbers + code
          const maxLineNum = String(lines.length);
          const numW = maxLineNum.length * 4 + 6;
          for (let i = 0; i < lines.length; i++) {
            if (y + 11 > margin + usableH) {
              addPage();
              y += 2;
              // Redraw header on new page
              pdf.setFillColor(246, 248, 250);
              pdf.rect(margin + indent, y - 2, usableW - indent, blockH - (preY - y) + 200, 'F');
            }
            // Line number
            pdf.setFont('courier', 'normal');
            pdf.setFontSize(8);
            pdf.setTextColor(180);
            pdf.text(String(i + 1).padStart(maxLineNum.length), margin + indent + 2, y);
            // Code text
            pdf.setFont('courier', 'normal');
            pdf.setFontSize(9);
            pdf.setTextColor(51, 51, 51);
            const lineText = lines[i] || ' ';
            pdf.text(lineText, leftX + numW, y);
            y += 11;
          }
          y += 4;
          break;
        }
        case 'table': {
          const rows = [];
          const numCols = node.querySelectorAll('tr')[0]?.children.length || 1;
          for (const tr of node.querySelectorAll('tr')) {
            const cells = [];
            for (const cell of tr.querySelectorAll('th,td')) {
              cells.push({ text: cell.textContent.trim(), tag: cell.tagName.toLowerCase() });
            }
            if (cells.length) rows.push(cells);
          }
          if (!rows.length) break;

          // Calculate column widths based on content
          const colWidths = Array(numCols).fill(0);
          for (const row of rows) {
            for (let c = 0; c < Math.min(row.length, numCols); c++) {
              pdf.setFont('helvetica', row[0]?.tag === 'th' ? 'bold' : 'normal');
              pdf.setFontSize(9);
              const w = pdf.getTextWidth(row[c].text) + 6;
              colWidths[c] = Math.max(colWidths[c], w);
            }
          }
          const totalW = colWidths.reduce((a, b) => a + b, 0);
          // Scale to fit
          const scale = Math.min(1, (usableW - indent) / totalW);
          const scaledWidths = colWidths.map(w => w * scale);
          const rowH = 7;

          const tableH = rows.length * (rowH + 0.5) + 2;
          needSpace(tableH);
          y += 2;

          for (let ri = 0; ri < rows.length; ri++) {
            if (y + rowH + 1 > margin + usableH) addPage();
            let cx = margin + indent;
            for (let ci = 0; ci < numCols; ci++) {
              const cell = rows[ri]?.[ci] || { text: '', tag: 'td' };
              const isHead = cell.tag === 'th';
              // Background
              if (isHead) {
                pdf.setFillColor(240, 240, 240);
                pdf.rect(cx, y, scaledWidths[ci], rowH, 'F');
              }
              // Border
              pdf.setDrawColor(220, 220, 220);
              pdf.setLineWidth(0.3);
              pdf.rect(cx, y, scaledWidths[ci], rowH, 'S');
              // Text
              pdf.setFont('helvetica', isHead ? 'bold' : 'normal');
              pdf.setFontSize(isHead ? 9 : 8);
              pdf.setTextColor(isHead ? 26 : 51, isHead ? 26 : 51, isHead ? 26 : 51);
              const pad = 2;
              const maxTextW = scaledWidths[ci] - pad * 2;
              let display = cell.text;
              pdf.setFont('helvetica', isHead ? 'bold' : 'normal');
              pdf.setFontSize(isHead ? 9 : 8);
              const textW = pdf.getTextWidth(display);
              if (textW > maxTextW) {
                while (display.length > 2 && pdf.getTextWidth(display + '…') > maxTextW) {
                  display = display.slice(0, -1);
                }
                display += '…';
              }
              pdf.text(display, cx + pad, y + rowH - 2);
              cx += scaledWidths[ci];
            }
            y += rowH + 0.5;
          }
          y += 4;
          break;
        }
        case 'hr': {
          y += 4;
          pdf.setDrawColor(220, 220, 220);
          pdf.setLineWidth(0.5);
          if (y < margin + usableH) pdf.line(margin + indent, y, margin + usableW, y);
          y += 6;
          break;
        }
        case 'img': {
          const alt = node.getAttribute('alt') || node.getAttribute('src') || 'image';
          y += 2;
          needSpace(12);
          pdf.setFont('helvetica', 'italic');
          pdf.setFontSize(9);
          pdf.setTextColor(150);
          pdf.text(`[Image: ${alt}]`, margin + indent, y);
          y += 12;
          break;
        }
        case 'div':
        case 'section':
        case 'article':
        case 'main':
        case 'body':
        case 'span':
          for (const c of node.childNodes) renderBlock(c, indent);
          break;
        default:
          break;
      }
    }

    for (const c of root.childNodes) renderBlock(c, 0);
    pageFooter();
  }, []);

  const handleDownloadPdf = useCallback(async () => {
    setPdfLoading(true);
    setPdfProgress(0);
    try {
      setPdfProgress(10);
      const isLandscape = pdfOptions.orientation === 'landscape';
      const pdf = new jsPDF({ orientation: isLandscape ? 'l' : 'p', unit: 'mm', format: pdfOptions.size });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const marginSizes = { narrow: 10, normal: 20, wide: 30 };
      const margin = marginSizes[pdfOptions.margins] || 20;

      renderDomToPdf(pdf, html, margin, pageW, pageH);
      setPdfProgress(80);

      pdf.save(`${pdfFilename}.pdf`);
      setPdfProgress(100);
      setSnackMsg(`Downloaded ${pdfFilename}.pdf!`);
      setSnackOpen(true);
    } catch (e) {
      setSnackMsg(`PDF failed: ${e.message || 'unknown error'}`);
      setSnackOpen(true);
    } finally {
      setPdfLoading(false);
      setTimeout(() => setPdfProgress(0), 1000);
    }
  }, [html, pdfOptions, pdfFilename, renderDomToPdf]);

  const handleClear = () => {
    setMarkdown('');
  };

  const handleLoadSample = () => {
    setMarkdown(SAMPLE_MARKDOWN);
  };

  // Styled HTML wrapper for the preview
  const previewStyles = `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: ${theme.palette.text.primary}; margin: 0; padding: 0; }
      h1, h2, h3, h4, h5, h6 { margin-top: 1.2em; margin-bottom: 0.5em; font-weight: 600; }
      h1 { font-size: 2em; border-bottom: 1px solid ${theme.palette.divider}; padding-bottom: 0.3em; }
      h2 { font-size: 1.5em; border-bottom: 1px solid ${theme.palette.divider}; padding-bottom: 0.3em; }
      p { margin: 0.8em 0; }
      code { background: ${theme.palette.action.hover}; padding: 0.2em 0.4em; border-radius: 4px; font-size: 0.9em; font-family: 'Courier New', monospace; }
      pre { background: ${theme.palette.mode === 'dark' ? '#1a1a2e' : '#f6f8fa'}; padding: 16px; border-radius: 8px; overflow-x: auto; }
      pre code { background: none; padding: 0; }
      blockquote { border-left: 4px solid ${theme.palette.primary.main}; margin: 1em 0; padding: 0.5em 1em; color: ${theme.palette.text.secondary}; background: ${theme.palette.action.hover}; border-radius: 0 4px 4px 0; }
      table { border-collapse: collapse; width: 100%; margin: 1em 0; }
      th, td { border: 1px solid ${theme.palette.divider}; padding: 8px 12px; text-align: left; }
      th { background: ${theme.palette.action.hover}; font-weight: 600; }
      a { color: ${theme.palette.primary.main}; text-decoration: none; }
      a:hover { text-decoration: underline; }
      ul, ol { padding-left: 2em; }
      li { margin: 0.3em 0; }
      hr { border: none; border-top: 1px solid ${theme.palette.divider}; margin: 1.5em 0; }
      img { max-width: 100%; border-radius: 4px; }
      input[type="checkbox"] { margin-right: 0.5em; }
    </style>
  `;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" gap={1.5} sx={{ mb: 1 }}>
          <FileMarkdownOutlined style={{ fontSize: 28, color: theme.palette.primary.main }} />
          <Typography variant="h3" fontWeight="bold">
            Markdown to HTML
          </Typography>
        </Stack>
        <Typography variant="body1" color="text.secondary">
          Convert Markdown to clean HTML with live preview. Supports GitHub Flavored Markdown (GFM), tables, task lists, and code blocks.
        </Typography>
      </Box>

      {/* Toolbar */}
      <MainCard sx={{ mb: 3 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            {/* View Mode */}
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, val) => val && setViewMode(val)}
              size="small"
            >
              <ToggleButton value="split">
                <Stack direction="row" alignItems="center" gap={0.5}>
                  <CodeOutlined />
                  Split
                </Stack>
              </ToggleButton>
              <ToggleButton value="preview">
                <Stack direction="row" alignItems="center" gap={0.5}>
                  <EyeOutlined />
                  Preview
                </Stack>
              </ToggleButton>
              <ToggleButton value="html">
                <Stack direction="row" alignItems="center" gap={0.5}>
                  <CodeOutlined />
                  HTML
                </Stack>
              </ToggleButton>
            </ToggleButtonGroup>

            <FormControlLabel
              control={<Switch size="small" checked={sanitize} onChange={(e) => setSanitize(e.target.checked)} />}
              label={<Typography variant="caption">Sanitize</Typography>}
            />
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button size="small" variant="outlined" startIcon={<CopyOutlined />} onClick={() => handleCopy(html, 'HTML')}>
              Copy HTML
            </Button>
            <Button size="small" variant="outlined" startIcon={<CopyOutlined />} onClick={() => handleCopy(markdown, 'Markdown')}>
              Copy MD
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="secondary"
              startIcon={<DownloadOutlined />}
              onClick={() => handleDownload(html, 'output.html', 'text/html')}
            >
              .html
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<FilePdfOutlined />}
              onClick={handleDownloadPdf}
              disabled={pdfLoading}
            >
              {pdfLoading ? 'PDF...' : 'PDF'}
            </Button>
            <IconButton
              size="small"
              color="error"
              onClick={() => setShowPdfSettings(v => !v)}
              disabled={pdfLoading}
              sx={{ bgcolor: showPdfSettings ? 'action.selected' : 'transparent' }}
            >
              <SettingOutlined />
            </IconButton>
            <Button
              size="small"
              variant="outlined"
              color="secondary"
              startIcon={<DownloadOutlined />}
              onClick={() => handleDownload(markdown, 'output.md', 'text/markdown')}
            >
              .md
            </Button>
            <Button size="small" variant="text" onClick={handleLoadSample}>
              Sample
            </Button>
            <Button size="small" variant="text" color="error" startIcon={<ClearOutlined />} onClick={handleClear}>
              Clear
            </Button>
          </Stack>
        </Stack>
      </MainCard>

      {/* PDF Settings */}
      <Accordion
        expanded={showPdfSettings}
        onChange={() => setShowPdfSettings(v => !v)}
        sx={{
          mb: 3,
          bgcolor: 'transparent',
          border: '1px solid',
          borderColor: theme.palette.divider,
          borderRadius: '12px !important',
          boxShadow: 'none',
          '&:before': { display: 'none' }
        }}
      >
        <AccordionSummary expandIcon={<DownOutlined style={{ fontSize: 14 }} />}>
          <Stack direction="row" alignItems="center" gap={1}>
            <FilePdfOutlined style={{ color: theme.palette.error.main, fontSize: 18 }} />
            <Typography variant="h6" fontWeight={600}>PDF Export Options</Typography>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6, md: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Paper Size</InputLabel>
                  <Select
                    value={pdfOptions.size}
                    label="Paper Size"
                    onChange={e => setPdfOptions(o => ({ ...o, size: e.target.value }))}
                  >
                    <MenuItem value="a4">A4</MenuItem>
                    <MenuItem value="letter">Letter</MenuItem>
                    <MenuItem value="legal">Legal</MenuItem>
                    <MenuItem value="a3">A3</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Orientation</InputLabel>
                  <Select
                    value={pdfOptions.orientation}
                    label="Orientation"
                    onChange={e => setPdfOptions(o => ({ ...o, orientation: e.target.value }))}
                  >
                    <MenuItem value="portrait">Portrait</MenuItem>
                    <MenuItem value="landscape">Landscape</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Margins</InputLabel>
                  <Select
                    value={pdfOptions.margins}
                    label="Margins"
                    onChange={e => setPdfOptions(o => ({ ...o, margins: e.target.value }))}
                  >
                    <MenuItem value="narrow">Narrow</MenuItem>
                    <MenuItem value="normal">Normal</MenuItem>
                    <MenuItem value="wide">Wide</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Filename"
                  value={pdfOptions.filename}
                  onChange={e => setPdfOptions(o => ({ ...o, filename: e.target.value }))}
                  helperText={pdfFilename !== pdfOptions.filename ? `Auto: ${pdfFilename}` : ' '}
                />
              </Grid>
            </Grid>
            {pdfLoading && pdfProgress > 0 && (
              <Box>
                <LinearProgress variant="determinate" value={pdfProgress} sx={{ height: 6, borderRadius: 3 }} />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', textAlign: 'center' }}>
                  Generating PDF... {Math.round(pdfProgress)}%
                </Typography>
              </Box>
            )}
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* Editor & Preview */}
      <Grid container spacing={3}>
        {/* Markdown Input */}
        {(viewMode === 'split' || viewMode === 'html') && (
          <Grid size={{ xs: 12, md: viewMode === 'split' ? 6 : 12 }}>
            <MainCard
              title={
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ width: '100%' }}>
                  <Typography variant="h5" fontWeight="600">
                    {viewMode === 'html' ? 'Markdown Input' : 'Markdown'}
                  </Typography>
                  <Stack direction="row" gap={1}>
                    <Chip label={`${stats.lines} lines`} size="small" variant="outlined" />
                    <Chip label={`${stats.words} words`} size="small" variant="outlined" />
                  </Stack>
                </Stack>
              }
              sx={{ height: '100%' }}
            >
              <MarkdownInput
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                rows={viewMode === 'split' ? 22 : 16}
                placeholder="Type your markdown here..."
              />
            </MainCard>
          </Grid>
        )}

        {/* Preview / HTML Output */}
        {(viewMode === 'split' || viewMode === 'preview') && (
          <Grid size={{ xs: 12, md: viewMode === 'split' ? 6 : 12 }}>
            <MainCard
              title={
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ width: '100%' }}>
                  <Typography variant="h5" fontWeight="600">
                    Preview
                  </Typography>
                  <Chip label={`${stats.htmlSize} bytes`} size="small" variant="outlined" color="primary" />
                </Stack>
              }
              sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              {viewMode === 'preview' && (
                <MarkdownInput
                  value={markdown}
                  onChange={(e) => setMarkdown(e.target.value)}
                  rows={6}
                  placeholder="Type your markdown here..."
                  sx={{ mb: 2, flexShrink: 0 }}
                />
              )}
              {viewMode !== 'preview' && <Divider sx={{ mb: 2 }} />}
              <Box
                ref={previewRef}
                sx={{
                  flex: 1,
                  minHeight: viewMode === 'split' ? 480 : 200,
                  maxHeight: 600,
                  overflowY: 'auto',
                  p: 2,
                  borderRadius: 1.5,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: theme.palette.divider,
                  '&::-webkit-scrollbar': { width: 6 },
                  '&::-webkit-scrollbar-thumb': { borderRadius: 3, bgcolor: theme.palette.divider }
                }}
                dangerouslySetInnerHTML={{ __html: previewStyles + html }}
              />
            </MainCard>
          </Grid>
        )}

        {/* Raw HTML Output */}
        {viewMode === 'html' && (
          <Grid size={12}>
            <MainCard
              title={
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ width: '100%' }}>
                  <Typography variant="h5" fontWeight="600">
                    HTML Output
                  </Typography>
                  <Tooltip title="Copy HTML">
                    <IconButton size="small" onClick={() => handleCopy(html, 'HTML')}>
                      <CopyOutlined />
                    </IconButton>
                  </Tooltip>
                </Stack>
              }
            >
              <Box
                sx={{
                  minHeight: 200,
                  maxHeight: 500,
                  overflowY: 'auto',
                  p: 2,
                  borderRadius: 1.5,
                  bgcolor: theme.palette.mode === 'dark' ? 'grey.100' : 'grey.50',
                  border: '1px solid',
                  borderColor: theme.palette.divider,
                  '&::-webkit-scrollbar': { width: 6 },
                  '&::-webkit-scrollbar-thumb': { borderRadius: 3, bgcolor: theme.palette.divider }
                }}
              >
                <pre
                  style={{
                    margin: 0,
                    fontFamily: '"Courier New", Courier, monospace',
                    fontSize: '0.8rem',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    color: theme.palette.success.main
                  }}
                >
                  {html}
                </pre>
              </Box>
            </MainCard>
          </Grid>
        )}
      </Grid>

      {/* Markdown Syntax Reference */}
      <Box sx={{ mt: 3 }}>
        <Accordion
          sx={{
            bgcolor: 'transparent',
            border: '1px solid',
            borderColor: theme.palette.divider,
            borderRadius: '12px !important',
            boxShadow: 'none',
            '&:before': { display: 'none' }
          }}
        >
          <AccordionSummary expandIcon={<DownOutlined style={{ fontSize: 14 }} />}>
            <Stack direction="row" alignItems="center" gap={1}>
              <QuestionCircleOutlined style={{ color: theme.palette.primary.main, fontSize: 18 }} />
              <Typography variant="h6" fontWeight={600}>
                Markdown Syntax Reference
              </Typography>
              <Chip label="GFM" size="small" color="primary" variant="outlined" sx={{ height: 20 }} />
            </Stack>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            <Box sx={{ p: 2, pt: 0 }}>
              {SYNTAX_REFERENCE.map((group) => (
                <Box key={group.section} sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, color: theme.palette.primary.main }}>
                    {group.section}
                  </Typography>
                  <Box
                    sx={{
                      borderRadius: 1.5,
                      border: '1px solid',
                      borderColor: theme.palette.divider,
                      overflow: 'hidden'
                    }}
                  >
                    {group.rows.map((row, i) => (
                      <Box
                        key={i}
                        sx={{
                          display: 'flex',
                          borderBottom: i < group.rows.length - 1 ? '1px solid' : 'none',
                          borderColor: theme.palette.divider,
                          '&:last-child': { borderBottom: 'none' },
                          '& > div': { p: 1.5, fontSize: '0.8rem' }
                        }}
                      >
                        <Box
                          sx={{
                            flex: 1,
                            borderRight: '1px solid',
                            borderColor: theme.palette.divider,
                            bgcolor: theme.palette.mode === 'dark' ? 'grey.100' : 'grey.50',
                            fontFamily: '"Courier New", monospace',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-all'
                          }}
                        >
                          {row.md}
                        </Box>
                        <Box
                          sx={{
                            flex: 1,
                            fontFamily: '"Courier New", monospace',
                            color: theme.palette.success.main,
                            wordBreak: 'break-all',
                            borderRight: '1px solid',
                            borderColor: theme.palette.divider
                          }}
                        >
                          {row.html}
                        </Box>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 40,
                            minWidth: 40
                          }}
                        >
                          <Tooltip title="Copy markdown">
                            <IconButton
                              size="small"
                              onClick={() => handleCopy(row.md, 'Markdown syntax')}
                              sx={{ p: 0.5 }}
                            >
                              <CopyOutlined style={{ fontSize: 13 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackOpen}
        autoHideDuration={2000}
        onClose={() => setSnackOpen(false)}
        message={snackMsg}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      />
    </Box>
  );
}

function MarkdownInput({ value, onChange, rows, placeholder, sx }) {
  const textareaRef = useRef(null);
  const gutterRef = useRef(null);
  const theme = useTheme();
  const lines = value.split('\n');
  const lineCount = lines.length;
  const gutterWidth = String(lineCount).length * 10 + 16;

  function syncScroll() {
    if (gutterRef.current && textareaRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }

  return (
    <Box sx={{
      display: 'flex',
      border: '1px solid',
      borderColor: theme.palette.divider,
      borderRadius: 1.5,
      overflow: 'hidden',
      bgcolor: 'background.paper',
      ...sx
    }}>
      <Box
        ref={gutterRef}
        sx={{
          minWidth: gutterWidth,
          py: 1.75,
          textAlign: 'right',
          bgcolor: theme.palette.mode === 'dark' ? 'grey.100' : 'grey.50',
          borderRight: '1px solid',
          borderColor: theme.palette.divider,
          overflow: 'hidden',
          userSelect: 'none',
          fontFamily: '"Courier New", Courier, monospace',
          fontSize: '0.85rem',
          lineHeight: 1.6,
          color: theme.palette.text.disabled
        }}
      >
        {Array.from({ length: lineCount }, (_, i) => (
          <Box
            key={i}
            sx={{
              px: 1,
              lineHeight: 1.6,
              fontFamily: '"Courier New", Courier, monospace',
              fontSize: '0.85rem',
              whiteSpace: 'pre',
              color: theme.palette.text.disabled
            }}
          >
            {i + 1}
          </Box>
        ))}
      </Box>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        onScroll={syncScroll}
        placeholder={placeholder}
        rows={rows}
        style={{
          flex: 1,
          border: 'none',
          outline: 'none',
          resize: 'none',
          padding: '7px 12px',
          fontFamily: '"Courier New", Courier, monospace',
          fontSize: '0.85rem',
          lineHeight: 1.6,
          color: theme.palette.text.primary,
          backgroundColor: 'transparent',
          minHeight: rows * 1.6 * 16 + 14
        }}
      />
    </Box>
  );
}
