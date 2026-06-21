import { useState, useCallback, useEffect } from 'react';
import QRCode from 'qrcode';

import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Stack from '@mui/material/Stack';
import Slider from '@mui/material/Slider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';

import { QrcodeOutlined, DownloadOutlined, CopyOutlined, ClearOutlined, ReloadOutlined } from '@ant-design/icons';

import MainCard from 'components/MainCard';

const ECC_LEVELS = [
  { value: 'L', label: 'L (Low 7%)' },
  { value: 'M', label: 'M (Medium 15%)' },
  { value: 'Q', label: 'Q (Quartile 25%)' },
  { value: 'H', label: 'H (High 30%)' }
];

function lum(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(c1, c2) {
  const l1 = lum(parseInt(c1.slice(1, 3), 16), parseInt(c1.slice(3, 5), 16), parseInt(c1.slice(5, 7), 16));
  const l2 = lum(parseInt(c2.slice(1, 3), 16), parseInt(c2.slice(3, 5), 16), parseInt(c2.slice(5, 7), 16));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const PRESET_COLORS = [
  { dark: '#000000', light: '#ffffff', label: 'Black on White' },
  { dark: '#1a237e', light: '#e8eaf6', label: 'Navy on Lavender' },
  { dark: '#2e7d32', light: '#e8f5e9', label: 'Green on Mint' },
  { dark: '#c62828', light: '#ffebee', label: 'Red on Rose' },
  { dark: '#e65100', light: '#fff3e0', label: 'Orange on Cream' },
  { dark: '#4a148c', light: '#f3e5f5', label: 'Purple on Violet' },
  { dark: '#0d47a1', light: '#e3f2fd', label: 'Blue on Sky' },
  { dark: '#37474f', light: '#eceff1', label: 'Dark Grey on Light' },
  { dark: '#ffffff', light: '#121212', label: 'White on Dark (Invert)' },
  { dark: '#ff6f00', light: '#121212', label: 'Amber on Dark' }
];

export default function QRCodeGenerator() {
  const theme = useTheme();
  const [text, setText] = useState('https://github.com');
  const [size, setSize] = useState(280);
  const [ecc, setEcc] = useState('M');
  const [darkColor, setDarkColor] = useState('#000000');
  const [lightColor, setLightColor] = useState('#ffffff');
  const [dataUrl, setDataUrl] = useState('');
  const [error, setError] = useState('');

  const generate = useCallback(async (t, s, e, d, l) => {
    if (!t.trim()) { setDataUrl(''); setError(''); return; }
    try {
      setError('');
      const url = await QRCode.toDataURL(t, {
        width: s,
        margin: 2,
        errorCorrectionLevel: e,
        color: { dark: d, light: l }
      });
      setDataUrl(url);
    } catch (e) {
      setError(e.message);
      setDataUrl('');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => generate(text, size, ecc, darkColor, lightColor), 200);
    return () => clearTimeout(timer);
  }, [text, size, ecc, darkColor, lightColor, generate]);

  const ratio = contrastRatio(darkColor, lightColor);
  const lowContrast = ratio < 3;

  const applyPreset = (preset) => {
    setDarkColor(preset.dark);
    setLightColor(preset.light);
  };

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'qrcode.png';
    a.click();
  };

  const handleCopy = async () => {
    if (!dataUrl) return;
    try {
      const resp = await fetch(dataUrl);
      const blob = await resp.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
    } catch {
      navigator.clipboard.writeText(text);
    }
  };

  const handleClear = () => {
    setText('');
    setDataUrl('');
    setError('');
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" gap={1.5} sx={{ mb: 1 }}>
          <QrcodeOutlined style={{ fontSize: 28, color: theme.palette.primary.main }} />
          <Typography variant="h3" fontWeight="bold">
            QR Code Generator
          </Typography>
        </Stack>
        <Typography variant="body1" color="text.secondary">
          Generate QR codes from text, URLs, or any data. Customize colors, size, and error correction.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <MainCard title="Input">
            <Stack spacing={2.5}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Text or URL"
                placeholder="Enter text or URL to encode..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="stretch">
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                    Size: {size}px
                  </Typography>
                  <Slider
                    value={size}
                    onChange={(_, v) => setSize(v)}
                    min={120}
                    max={600}
                    step={10}
                    valueLabelDisplay="auto"
                  />
                </Box>
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>Error Correction</InputLabel>
                  <Select value={ecc} label="Error Correction" onChange={(e) => setEcc(e.target.value)}>
                    {ECC_LEVELS.map((l) => (
                      <MenuItem key={l.value} value={l.value}>{l.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>

              <Box>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Colors
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1.5 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="caption" color="text.secondary">QR</Typography>
                    <input
                      type="color"
                      value={darkColor}
                      onChange={(e) => setDarkColor(e.target.value)}
                      style={{ width: 36, height: 36, border: 'none', cursor: 'pointer', padding: 0, background: 'none' }}
                    />
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="caption" color="text.secondary">Bg</Typography>
                    <input
                      type="color"
                      value={lightColor}
                      onChange={(e) => setLightColor(e.target.value)}
                      style={{ width: 36, height: 36, border: 'none', cursor: 'pointer', padding: 0, background: 'none' }}
                    />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    Contrast: {ratio.toFixed(1)}:1
                  </Typography>
                  {lowContrast && (
                    <Alert severity="warning" sx={{ py: 0, px: 1.5, '& .MuiAlert-message': { py: 0.5 } }}>
                      Low contrast — may not scan
                    </Alert>
                  )}
                </Stack>

                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                  {PRESET_COLORS.map((p, i) => (
                    <Tooltip key={i} title={p.label}>
                      <Box
                        onClick={() => applyPreset(p)}
                        sx={{
                          width: 28, height: 28, borderRadius: '6px', cursor: 'pointer',
                          border: '2px solid', borderColor: darkColor === p.dark && lightColor === p.light ? 'primary.main' : 'divider',
                          overflow: 'hidden', display: 'flex', flexWrap: 'wrap',
                          '&:hover': { borderColor: 'primary.light' }
                        }}
                      >
                        <Box sx={{ width: '50%', height: '50%', bgcolor: p.dark }} />
                        <Box sx={{ width: '50%', height: '50%', bgcolor: p.light }} />
                        <Box sx={{ width: '50%', height: '50%', bgcolor: p.light }} />
                        <Box sx={{ width: '50%', height: '50%', bgcolor: p.dark }} />
                      </Box>
                    </Tooltip>
                  ))}
                </Stack>
              </Box>

              <Stack direction="row" spacing={1.5}>
                <Button variant="outlined" color="error" size="small" startIcon={<ClearOutlined />} onClick={handleClear}>
                  Clear
                </Button>
              </Stack>
            </Stack>
          </MainCard>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <MainCard
            title={
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ width: '100%' }}>
                <Typography variant="h5" fontWeight="600">QR Code</Typography>
                <Stack direction="row" gap={0.5}>
                  <Tooltip title="Copy QR as PNG">
                    <span>
                      <Button size="small" startIcon={<CopyOutlined />} onClick={handleCopy} disabled={!dataUrl}>
                        Copy
                      </Button>
                    </span>
                  </Tooltip>
                  <Tooltip title="Download PNG">
                    <span>
                      <Button size="small" startIcon={<DownloadOutlined />} onClick={handleDownload} disabled={!dataUrl}>
                        Download
                      </Button>
                    </span>
                  </Tooltip>
                </Stack>
              </Stack>
            }
            sx={{ height: '100%' }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'action.hover',
                  minHeight: 300,
                  width: '100%'
                }}
              >
                {dataUrl ? (
                  <Box
                    component="img"
                    src={dataUrl}
                    alt="QR Code"
                    sx={{ maxWidth: '100%', height: 'auto', imageRendering: 'pixelated' }}
                  />
                ) : (
                  <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center' }}>
                    {error ? error : 'Enter text and a QR code will appear here'}
                  </Typography>
                )}
              </Paper>

              {text.trim() && dataUrl && (
                <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', wordBreak: 'break-all' }}>
                  Encodes: {text.length > 60 ? text.slice(0, 60) + '...' : text}
                </Typography>
              )}
            </Box>
          </MainCard>
        </Grid>
      </Grid>
    </Box>
  );
}