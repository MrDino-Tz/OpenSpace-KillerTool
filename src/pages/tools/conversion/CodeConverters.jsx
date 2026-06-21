import { useState, useCallback, useMemo } from 'react';
import * as yaml from 'js-yaml';

import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

import { CodeOutlined, CopyOutlined, ClearOutlined, DownloadOutlined, SwapOutlined } from '@ant-design/icons';

import MainCard from 'components/MainCard';
import SyntaxHighlighter from 'components/SyntaxHighlighter';

const FORMATS = ['json', 'yaml', 'xml'];

const INDENT_OPTIONS = [2, 4, 6, 8];

const DEFAULTS = {
  json: `{\n  "name": "OpenSpace",\n  "version": "1.0.0",\n  "features": ["json", "yaml", "xml"],\n  "active": true\n}`,
  yaml: `name: OpenSpace\nversion: 1.0.0\nfeatures:\n  - json\n  - yaml\n  - xml\nactive: true`,
  xml: `<root>\n  <name>OpenSpace</name>\n  <version>1.0.0</version>\n  <features>\n    <item>json</item>\n    <item>yaml</item>\n    <item>xml</item>\n  </features>\n  <active>true</active>\n</root>`
};

function escapeXml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function xmlToObj(node) {
  const result = {};
  if (node.attributes && node.attributes.length) {
    for (const attr of node.attributes)
      result[`@${attr.name}`] = attr.value;
  }
  const elements = [];
  let textContent = '';
  for (const child of node.childNodes) {
    if (child.nodeType === 1) elements.push(child);
    else if (child.nodeType === 3 || child.nodeType === 4) {
      const t = child.textContent.trim();
      if (t) textContent += t;
    }
  }
  if (elements.length === 0) {
    if (textContent) return textContent;
    return Object.keys(result).length ? result : null;
  }
  const groups = {};
  for (const el of elements) {
    const k = el.tagName;
    if (!groups[k]) groups[k] = [];
    groups[k].push(xmlToObj(el));
  }
  const hasAttrs = Object.keys(result).length > 0;
  for (const [k, vals] of Object.entries(groups))
    result[k] = vals.length === 1 ? vals[0] : vals;
  if (textContent) result['#text'] = textContent;
  return hasAttrs || Object.keys(result).length > 0 ? result : null;
}

function objToXml(obj, tagName, indent) {
  const sp = '  '.repeat(indent);
  if (obj === null || obj === undefined)
    return `${sp}<${tagName}/>\n`;
  if (Array.isArray(obj))
    return obj.map(item => objToXml(item, tagName, indent)).join('');
  if (typeof obj === 'object') {
    let attrs = '';
    let children = '';
    let text = '';
    for (const [k, v] of Object.entries(obj)) {
      if (k.startsWith('@')) attrs += ` ${k.slice(1)}="${escapeXml(String(v))}"`;
      else if (k === '#text') text = escapeXml(String(v));
      else children += objToXml(v, k, indent + 1);
    }
    if (!children && !text) return `${sp}<${tagName}${attrs}/>\n`;
    if (children) {
      let out = `${sp}<${tagName}${attrs}>\n${children}`;
      if (out.endsWith('\n')) out += sp;
      return out + `</${tagName}>\n`;
    }
    return `${sp}<${tagName}${attrs}>${text}</${tagName}>\n`;
  }
  return `${sp}<${tagName}>${escapeXml(String(obj))}</${tagName}>\n`;
}

function parseXml(xmlStr) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlStr, 'text/xml');
  const err = doc.querySelector('parsererror');
  if (err) throw new Error(err.textContent);
  return xmlToObj(doc.documentElement);
}

function stringifyXml(obj) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    const keys = Object.keys(obj).filter(k => !k.startsWith('@') && k !== '#text');
    if (keys.length === 1) {
      xml += objToXml(obj[keys[0]], keys[0], 0);
      return xml;
    }
  }
  xml += objToXml(obj, 'root', 0);
  return xml;
}

function parseInput(text, format) {
  if (format === 'json') return JSON.parse(text);
  if (format === 'yaml') return yaml.load(text);
  return parseXml(text);
}

function stringifyOutput(obj, format, indent) {
  if (format === 'json') return JSON.stringify(obj, null, indent);
  if (format === 'yaml') return yaml.dump(obj, { indent, lineWidth: -1, noRefs: true, sortKeys: false });
  return stringifyXml(obj);
}

export default function CodeConverters() {
  const theme = useTheme();

  const [fromFormat, setFromFormat] = useState('json');
  const [toFormat, setToFormat] = useState('yaml');
  const [input, setInput] = useState(DEFAULTS.json);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [indent, setIndent] = useState(2);
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');

  const doConvert = useCallback((inputValue, from, to, currentIndent) => {
    setError('');
    if (!inputValue.trim()) { setOutput(''); return; }
    try {
      const parsed = parseInput(inputValue, from);
      const result = stringifyOutput(parsed, to, currentIndent);
      setOutput(result);
    } catch (e) {
      setError(`Error: ${e.message}`);
      setOutput('');
    }
  }, []);

  const handleInputChange = (val) => {
    setInput(val);
    doConvert(val, fromFormat, toFormat, indent);
  };

  const handleFromChange = (e) => {
    const newFrom = e.target.value;
    setFromFormat(newFrom);
    if (newFrom === toFormat) {
      const newTo = FORMATS.find(f => f !== newFrom) || 'yaml';
      setToFormat(newTo);
      const def = DEFAULTS[newFrom];
      setInput(def);
      doConvert(def, newFrom, newTo, indent);
    } else {
      const def = DEFAULTS[newFrom];
      setInput(def);
      doConvert(def, newFrom, toFormat, indent);
    }
  };

  const handleToChange = (e) => {
    const newTo = e.target.value;
    setToFormat(newTo);
    if (newTo === fromFormat) {
      const newFrom = FORMATS.find(f => f !== newTo) || 'json';
      setFromFormat(newFrom);
      const def = DEFAULTS[newFrom];
      setInput(def);
      doConvert(def, newFrom, newTo, indent);
    } else {
      doConvert(input, fromFormat, newTo, indent);
    }
  };

  const handleSwap = () => {
    const newFrom = toFormat;
    const newTo = fromFormat;
    setFromFormat(newFrom);
    setToFormat(newTo);
    setInput(output || '');
    doConvert(output || '', newFrom, newTo, indent);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError('');
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output).then(() => {
      setSnackMsg('Copied to clipboard!');
      setSnackOpen(true);
    });
  };

  const handleDownload = () => {
    if (!output) return;
    const ext = toFormat;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    setSnackMsg('Downloaded!');
    setSnackOpen(true);
  };

  const fromLabel = useMemo(() => fromFormat.toUpperCase(), [fromFormat]);
  const toLabel = useMemo(() => toFormat.toUpperCase(), [toFormat]);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" gap={1.5} sx={{ mb: 1 }}>
          <CodeOutlined style={{ fontSize: 28, color: theme.palette.primary.main }} />
          <Typography variant="h3" fontWeight="bold">
            Code converter
          </Typography>
        </Stack>
        <Typography variant="body1" color="text.secondary">
          Convert between JSON, YAML, and XML formats. Paste your data and see the result instantly.
        </Typography>
      </Box>

      <MainCard sx={{ mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }} flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>From</InputLabel>
            <Select value={fromFormat} label="From" onChange={handleFromChange}>
              {FORMATS.map((f) => (
                <MenuItem key={f} value={f}>{f.toUpperCase()}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SwapOutlined style={{ fontSize: 16, color: theme.palette.text.secondary }} />
          </Box>

          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>To</InputLabel>
            <Select value={toFormat} label="To" onChange={handleToChange}>
              {FORMATS.map((f) => (
                <MenuItem key={f} value={f}>{f.toUpperCase()}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Indent</InputLabel>
            <Select value={indent} label="Indent" onChange={(e) => { setIndent(e.target.value); doConvert(input, fromFormat, toFormat, e.target.value); }}>
              {INDENT_OPTIONS.map((n) => (
                <MenuItem key={n} value={n}>{n} spaces</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </MainCard>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5 }}>
          <MainCard
            title={
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ width: '100%' }}>
                <Typography variant="h5" fontWeight="600">
                  {fromLabel} Input
                </Typography>
                <Stack direction="row" gap={1}>
                  <Tooltip title="Copy input">
                    <IconButton size="small" onClick={() => { navigator.clipboard.writeText(input); setSnackMsg('Input copied!'); setSnackOpen(true); }}>
                      <CopyOutlined />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Clear">
                    <IconButton size="small" onClick={handleClear}>
                      <ClearOutlined />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
            }
            sx={{ height: '100%' }}
          >
            <SyntaxHighlighter
              value={input}
              onChange={handleInputChange}
              language={fromFormat}
              placeholder={`Paste ${fromLabel} here...`}
              minHeight={400}
            />
            <Stack direction="row" gap={1} sx={{ mt: 1.5 }}>
              <Chip label={`${input.length} chars`} size="small" variant="outlined" />
              <Chip label={`${input.split(/\n/).length} lines`} size="small" variant="outlined" />
            </Stack>
          </MainCard>
        </Grid>

        <Grid size={{ xs: 12, md: 2 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Stack spacing={1.5} alignItems="center">
            <Button variant="contained" onClick={handleSwap} sx={{ minWidth: 56, minHeight: 56, borderRadius: '50%', p: 0 }}>
              <SwapOutlined style={{ fontSize: 24 }} />
            </Button>
            <Typography variant="caption" color="text.secondary">Swap</Typography>
            <Divider sx={{ width: '100%' }} />
            <Button variant="outlined" color="error" size="small" startIcon={<ClearOutlined />} onClick={handleClear}>
              Clear
            </Button>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <MainCard
            title={
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ width: '100%' }}>
                <Typography variant="h5" fontWeight="600">
                  {toLabel} Output
                </Typography>
                <Stack direction="row" gap={0.5}>
                  <Tooltip title="Copy output">
                    <IconButton size="small" onClick={handleCopy} disabled={!output}>
                      <CopyOutlined />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Download">
                    <IconButton size="small" onClick={handleDownload} disabled={!output}>
                      <DownloadOutlined />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
            }
            sx={{ height: '100%' }}
          >
            <SyntaxHighlighter
              value={output}
              onChange={() => {}}
              language={toFormat}
              placeholder={`${toLabel} output will appear here...`}
              minHeight={400}
              readOnly
            />
            {output && (
              <Stack direction="row" gap={1} sx={{ mt: 1.5 }}>
                <Chip label={`${output.length} chars`} size="small" variant="outlined" />
                <Chip label={`${output.split(/\n/).length} lines`} size="small" variant="outlined" color="primary" />
              </Stack>
            )}
          </MainCard>
        </Grid>
      </Grid>

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