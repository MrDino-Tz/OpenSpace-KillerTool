import { useState, useMemo, useCallback } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

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

// icons
import {
  CopyOutlined,
  ClearOutlined,
  DownloadOutlined,
  EyeOutlined,
  CodeOutlined,
  FileMarkdownOutlined,
  DownOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';

import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';

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
  const [viewMode, setViewMode] = useState('preview'); // 'preview' | 'html' | 'split'
  const [sanitize, setSanitize] = useState(true);
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');

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
              <TextField
                fullWidth
                multiline
                rows={viewMode === 'split' ? 22 : 16}
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                placeholder="Type your markdown here..."
                InputProps={{
                  sx: {
                    fontFamily: '"Courier New", Courier, monospace',
                    fontSize: '0.85rem',
                    lineHeight: 1.6
                  }
                }}
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
              sx={{ height: '100%' }}
            >
              {viewMode === 'preview' && (
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  value={markdown}
                  onChange={(e) => setMarkdown(e.target.value)}
                  placeholder="Type your markdown here..."
                  sx={{ mb: 2 }}
                  InputProps={{
                    sx: {
                      fontFamily: '"Courier New", Courier, monospace',
                      fontSize: '0.85rem',
                      lineHeight: 1.6
                    }
                  }}
                />
              )}
              <Divider sx={{ mb: 2 }} />
              <Box
                sx={{
                  minHeight: viewMode === 'split' ? 480 : 350,
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
