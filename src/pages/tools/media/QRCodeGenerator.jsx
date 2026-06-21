import { useState, useCallback, useEffect, useRef } from 'react';
import QRCode from 'qrcode';

import { useTheme } from '@mui/material/styles';
import facebookImg from 'assets/images/facebook.png';
import githubImg from 'assets/images/github.png';
import instagramImg from 'assets/images/instagram.png';
import twitterImg from 'assets/images/twitter.png';
import linkedinImg from 'assets/images/linkedin.png';
import linkedin2Img from 'assets/images/linkedin2.png';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Stack from '@mui/material/Stack';
import Slider from '@mui/material/Slider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';

import { QrcodeOutlined, DownloadOutlined, CopyOutlined, ClearOutlined, DeleteOutlined } from '@ant-design/icons';

import MainCard from 'components/MainCard';

const ECC_LEVELS = [
  { value: 'L', label: 'L (Low 7%)' },
  { value: 'M', label: 'M (Medium 15%)' },
  { value: 'Q', label: 'Q (Quartile 25%)' },
  { value: 'H', label: 'H (High 30%)' }
];

const STYLES = [
  { value: 'classic', label: 'Normal', desc: 'Standard square modules' },
  { value: 'curved', label: 'Curved', desc: 'Rounded square modules' },
  { value: 'stylish', label: 'Stylish', desc: 'Circular dot modules' },
  { value: 'premium', label: 'Premium', desc: 'Gradient fill with rounded modules' }
];

const SOCIAL_LOGOS = [
  { id: 'github', label: 'GitHub', bg: '#24292f' },
  { id: 'instagram', label: 'Instagram', bg: '#d6249f' },
  { id: 'x', label: 'X (Twitter)', bg: '#000000' },
  { id: 'facebook', label: 'Facebook', bg: '#1877f2' },
  { id: 'linkedin', label: 'LinkedIn', bg: '#0a66c2' }
];

const SOCIAL_IMAGES = {
  facebook: [facebookImg],
  github: [githubImg],
  instagram: [instagramImg],
  x: [twitterImg],
  linkedin: [linkedinImg, linkedin2Img]
};

function lum(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(c1, c2) {
  const l1 = lum(parseInt(c1.slice(1, 3), 16), parseInt(c1.slice(3, 5), 16), parseInt(c1.slice(5, 7), 16));
  const l2 = lum(parseInt(c2.slice(1, 3), 16), parseInt(c2.slice(3, 5), 16), parseInt(c2.slice(5, 7), 16));
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function hexToRgb(hex) {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

function lighten(hex, amt) {
  const [r, g, b] = hexToRgb(hex);
  const f = (c) => Math.min(255, Math.round(c + (255 - c) * amt));
  return `#${f(r).toString(16).padStart(2, '0')}${f(g).toString(16).padStart(2, '0')}${f(b).toString(16).padStart(2, '0')}`;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawModule(ctx, x, y, m, style) {
  if (style === 'classic') {
    ctx.fillRect(x, y, m, m);
  } else if (style === 'curved') {
    const r = m * 0.28;
    roundRect(ctx, x, y, m, m, r);
    ctx.fill();
  } else if (style === 'stylish') {
    ctx.beginPath();
    ctx.arc(x + m / 2, y + m / 2, m * 0.42, 0, Math.PI * 2);
    ctx.fill();
  } else if (style === 'premium') {
    const r = m * 0.22;
    roundRect(ctx, x, y, m, m, r);
    ctx.fill();
  }
}

function drawSocialImage(ctx, img, cx, cy, size) {
  const h = size * 0.80;
  const hr = h / 2;
  ctx.save();
  ctx.beginPath();
  roundRect(ctx, cx - hr, cy - hr, h, h, h * 0.22);
  ctx.clip();
  const pad = h * 0.15;
  ctx.drawImage(img, cx - hr + pad, cy - hr + pad, h - pad * 2, h - pad * 2);
  ctx.restore();
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
  const [style, setStyle] = useState('classic');
  const [darkColor, setDarkColor] = useState('#000000');
  const [lightColor, setLightColor] = useState('#ffffff');
  const [logoFile, setLogoFile] = useState(null);
  const [logoDataUrl, setLogoDataUrl] = useState(null);
  const [socialBrand, setSocialBrand] = useState(null);
  const [socialVariant, setSocialVariant] = useState(0);
  const [socialBgColor, setSocialBgColor] = useState('');
  const [socialBgPad, setSocialBgPad] = useState(8);
  const [socialMenuAnchor, setSocialMenuAnchor] = useState(null);
  const [socialMenuBrand, setSocialMenuBrand] = useState(null);
  const [logoSize, setLogoSize] = useState(25);
  const [socialSize, setSocialSize] = useState(22);
  const [dataUrl, setDataUrl] = useState('');
  const [error, setError] = useState('');

  const socialImagesRef = useRef({});

  useEffect(() => {
    const imgs = {};
    for (const [id, urls] of Object.entries(SOCIAL_IMAGES)) {
      imgs[id] = urls.map(url => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = url;
        return img;
      });
    }
    socialImagesRef.current = imgs;
  }, []);

  const overlayLogo = useCallback(async (canvas, ctx) => {
    const cs = canvas.width;
    if (!logoDataUrl && !socialBrand) return;

    if (socialBrand && !logoDataUrl) {
      const lw = cs * (socialSize / 100);
      const lx = (cs - lw) / 2;
      const ly = (cs - lw) / 2;
      const images = socialImagesRef.current[socialBrand];
      const img = images?.[socialVariant] || images?.[0];
      if (img) {
        if (socialBgColor) {
          ctx.fillStyle = socialBgColor;
          roundRect(ctx, lx - socialBgPad, ly - socialBgPad, lw + socialBgPad * 2, lw + socialBgPad * 2, 8);
          ctx.fill();
        }
        drawSocialImage(ctx, img, cs / 2, cs / 2, lw);
      }
    } else if (logoDataUrl) {
      const lw = cs * (logoSize / 100);
      const lx = (cs - lw) / 2;
      const ly = (cs - lw) / 2;
      const img = await new Promise((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = () => reject(new Error('Failed to load logo'));
        i.src = logoDataUrl;
      });
      ctx.fillStyle = lightColor;
      roundRect(ctx, lx - 4, ly - 4, lw + 8, lw + 8, 8);
      ctx.fill();
      ctx.drawImage(img, lx, ly, lw, lw);
    }
  }, [lightColor, logoDataUrl, socialBrand, socialVariant, socialSize, logoSize, socialBgColor, socialBgPad]);

  const generate = useCallback(async () => {
    if (!text.trim()) { setDataUrl(''); setError(''); return; }
    try {
      setError('');
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      if (style === 'classic') {
        await QRCode.toCanvas(canvas, text, {
          width: size, margin: 2,
          errorCorrectionLevel: ecc,
          color: { dark: darkColor, light: lightColor }
        });
        await overlayLogo(canvas, ctx);
      } else {
        const qr = QRCode.create(text, { errorCorrectionLevel: ecc });
        const moduleCount = qr.modules.size;
        const margin = moduleCount * 0.4;
        const avail = size - margin * 2;
        const m = avail / moduleCount;

        ctx.fillStyle = lightColor;
        ctx.fillRect(0, 0, size, size);

        const isPremium = style === 'premium';
        if (isPremium) {
          const grad = ctx.createLinearGradient(0, 0, size, size);
          const lighter = lighten(darkColor, 0.5);
          grad.addColorStop(0, darkColor);
          grad.addColorStop(1, lighter);
          ctx.fillStyle = grad;
        } else {
          ctx.fillStyle = darkColor;
        }

        for (let row = 0; row < moduleCount; row++) {
          for (let col = 0; col < moduleCount; col++) {
            if (qr.modules.data[row * moduleCount + col]) {
              drawModule(ctx, margin + col * m, margin + row * m, m, style);
            }
          }
        }

        if (isPremium) {
          ctx.globalCompositeOperation = 'destination-atop';
          ctx.fillStyle = lightColor;
          ctx.fillRect(0, 0, size, size);
          ctx.globalCompositeOperation = 'source-over';
        }

        await overlayLogo(canvas, ctx);
      }

      setDataUrl(canvas.toDataURL('image/png'));
    } catch (e) {
      setError(e.message);
      setDataUrl('');
    }
  }, [text, size, ecc, style, darkColor, lightColor, overlayLogo]);

  useEffect(() => {
    const timer = setTimeout(generate, 200);
    return () => clearTimeout(timer);
  }, [generate]);

  const handleLogoUpload = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setLogoFile(f);
    setSocialBrand(null);
    const reader = new FileReader();
    reader.onload = () => setLogoDataUrl(reader.result);
    reader.readAsDataURL(f);
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoDataUrl(null);
    setSocialBrand(null);
    setSocialVariant(0);
  };

  const handleSocialSelect = (brand) => {
    if (socialBrand === brand) {
      setSocialBrand(null);
      setSocialVariant(0);
    } else {
      setSocialBrand(brand);
      setSocialVariant(0);
      setLogoFile(null);
      setLogoDataUrl(null);
    }
  };

  const handleSocialMenuOpen = (e, brand) => {
    e.stopPropagation();
    setSocialMenuAnchor(e.currentTarget);
    setSocialMenuBrand(brand);
  };

  const handleSocialMenuPick = (variantIdx) => {
    const brand = socialMenuBrand;
    if (socialBrand !== brand) {
      setSocialBrand(brand);
      setLogoFile(null);
      setLogoDataUrl(null);
    }
    setSocialVariant(variantIdx);
    setSocialMenuAnchor(null);
    setSocialMenuBrand(null);
  };

  const handleSocialMenuClose = () => {
    setSocialMenuAnchor(null);
    setSocialMenuBrand(null);
  };

  const ratio = contrastRatio(darkColor, lightColor);
  const lowContrast = ratio < 3;

  const applyPreset = (p) => { setDarkColor(p.dark); setLightColor(p.light); };

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
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    } catch { navigator.clipboard.writeText(text); }
  };

  const handleClear = () => {
    setText('');
    setDataUrl('');
    setError('');
    setLogoFile(null);
    setLogoDataUrl(null);
    setSocialBrand(null);
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" gap={1.5} sx={{ mb: 1 }}>
          <QrcodeOutlined style={{ fontSize: 28, color: theme.palette.primary.main }} />
          <Typography variant="h3" fontWeight="bold">QR Code Generator</Typography>
        </Stack>
        <Typography variant="body1" color="text.secondary">
          Generate styled QR codes. Add logos, social media brands, gradients, and customize every detail.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <MainCard title="Input">
            <Stack spacing={2.5}>
              <TextField fullWidth multiline rows={2} label="Text or URL"
                placeholder="Enter text or URL to encode..." value={text}
                onChange={(e) => setText(e.target.value)} />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="stretch">
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom display="block">Size: {size}px</Typography>
                  <Slider value={size} onChange={(_, v) => setSize(v)} min={120} max={600} step={10} valueLabelDisplay="auto" />
                </Box>
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>Error Correction</InputLabel>
                  <Select value={ecc} label="Error Correction" onChange={(e) => setEcc(e.target.value)}>
                    {ECC_LEVELS.map(l => <MenuItem key={l.value} value={l.value}>{l.label}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Style</InputLabel>
                  <Select value={style} label="Style" onChange={(e) => setStyle(e.target.value)}>
                    {STYLES.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </Stack>

              <Box>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>Colors</Typography>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1.5 }} flexWrap="wrap" useFlexGap>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="caption" color="text.secondary">QR</Typography>
                    <input type="color" value={darkColor} onChange={(e) => setDarkColor(e.target.value)}
                      style={{ width: 36, height: 36, border: 'none', cursor: 'pointer', padding: 0, background: 'none' }} />
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="caption" color="text.secondary">Bg</Typography>
                    <input type="color" value={lightColor} onChange={(e) => setLightColor(e.target.value)}
                      style={{ width: 36, height: 36, border: 'none', cursor: 'pointer', padding: 0, background: 'none' }} />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">Contrast: {ratio.toFixed(1)}:1</Typography>
                  {lowContrast && <Alert severity="warning" sx={{ py: 0, px: 1.5, '& .MuiAlert-message': { py: 0.5 } }}>Low contrast</Alert>}
                </Stack>
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                  {PRESET_COLORS.map((p, i) => (
                    <Tooltip key={i} title={p.label}>
                      <Box onClick={() => applyPreset(p)}
                        sx={{ width: 28, height: 28, borderRadius: '6px', cursor: 'pointer',
                          border: '2px solid', borderColor: darkColor === p.dark && lightColor === p.light ? 'primary.main' : 'divider',
                          overflow: 'hidden', display: 'flex', flexWrap: 'wrap', '&:hover': { borderColor: 'primary.light' } }}>
                        <Box sx={{ width: '50%', height: '50%', bgcolor: p.dark }} />
                        <Box sx={{ width: '50%', height: '50%', bgcolor: p.light }} />
                        <Box sx={{ width: '50%', height: '50%', bgcolor: p.light }} />
                        <Box sx={{ width: '50%', height: '50%', bgcolor: p.dark }} />
                      </Box>
                    </Tooltip>
                  ))}
                </Stack>
              </Box>

              <Box>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>Center Logo</Typography>
                <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                  <Button variant="outlined" size="small" component="label">
                    {logoFile ? 'Change Logo' : 'Upload Logo'}
                    <input type="file" hidden accept="image/png,image/jpeg,image/webp" onChange={handleLogoUpload} />
                  </Button>
                  {(logoFile || socialBrand) && (
                    <Tooltip title="Remove logo"><IconButton size="small" onClick={handleRemoveLogo} color="error"><DeleteOutlined /></IconButton></Tooltip>
                  )}
                </Stack>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>Social media presets:</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {SOCIAL_LOGOS.map(s => {
                    const variants = SOCIAL_IMAGES[s.id] || [];
                    const currentVariant = socialBrand === s.id ? socialVariant : 0;
                    const imgUrl = variants[currentVariant];
                    const isSelected = socialBrand === s.id;
                    return (
                      <Tooltip key={s.id} title={s.label}>
                        <Box
                          onClick={(e) => handleSocialMenuOpen(e, s.id)}
                          sx={{
                            width: 36, height: 36, borderRadius: '8px', cursor: 'pointer',
                            border: '2px solid', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            borderColor: isSelected ? 'primary.main' : 'divider',
                            bgcolor: isSelected ? s.bg : 'transparent',
                            '&:hover': { borderColor: 'primary.light', bgcolor: s.bg }
                          }}
                        >
                          {imgUrl ? (
                            <Box component="img" src={imgUrl} alt={s.label}
                              sx={{ width: 20, height: 20 }} />
                          ) : (
                            <Typography variant="caption" fontWeight={700}
                              sx={{ color: isSelected ? '#fff' : 'text.secondary', fontSize: '0.65rem' }}>
                              {s.label.slice(0, 2)}
                            </Typography>
                          )}
                        </Box>
                      </Tooltip>
                    );
                  })}
                  <Menu
                    anchorEl={socialMenuAnchor}
                    open={Boolean(socialMenuAnchor)}
                    onClose={handleSocialMenuClose}
                    slotProps={{ paper: { sx: { minWidth: 120, p: 0.5 } } }}
                  >
                    {socialMenuBrand && SOCIAL_IMAGES[socialMenuBrand]?.map((url, idx) => (
                      <MenuItem key={idx} onClick={() => handleSocialMenuPick(idx)}
                        selected={socialBrand === socialMenuBrand && socialVariant === idx}
                        sx={{ gap: 1, py: 1 }}
                      >
                        <Box component="img" src={url} alt={`variant ${idx}`} sx={{ width: 24, height: 24 }} />
                        <Typography variant="body2">Variant {idx + 1}</Typography>
                      </MenuItem>
                    ))}
                  </Menu>
                </Stack>
                {logoDataUrl && !socialBrand && (
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 40 }}>Size: {logoSize}%</Typography>
                    <Slider value={logoSize} onChange={(_, v) => setLogoSize(v)} min={12} max={40} step={1} valueLabelDisplay="auto" sx={{ maxWidth: 200 }} />
                  </Stack>
                )}
                {socialBrand && !logoDataUrl && (
                  <Stack spacing={1} sx={{ mt: 0.5 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 48 }}>Icon: {socialSize}%</Typography>
                      <Slider value={socialSize} onChange={(_, v) => setSocialSize(v)} min={10} max={40} step={1} valueLabelDisplay="auto" sx={{ maxWidth: 160 }} />
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Typography variant="caption" color="text.secondary">Bg color</Typography>
                      <input type="color" value={socialBgColor || '#ffffff'} onChange={(e) => setSocialBgColor(e.target.value)}
                        style={{ width: 32, height: 32, border: 'none', cursor: 'pointer', padding: 0, background: 'none' }} />
                      <Button size="small" variant="text" color="error"
                        onClick={() => setSocialBgColor('')} sx={{ minWidth: 'auto', fontSize: '0.65rem', p: 0.5 }}>
                        {socialBgColor ? 'Remove' : 'Off'}
                      </Button>
                    </Stack>
                    {socialBgColor && (
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 52 }}>Pad: {socialBgPad}px</Typography>
                        <Slider value={socialBgPad} onChange={(_, v) => setSocialBgPad(v)} min={1} max={20} step={0.5} valueLabelDisplay="auto" sx={{ maxWidth: 160 }} />
                      </Stack>
                    )}
                  </Stack>
                )}
              </Box>

              <Stack direction="row" spacing={1.5}>
                <Button variant="outlined" color="error" size="small" startIcon={<ClearOutlined />} onClick={handleClear}>Clear All</Button>
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
                    <span><Button size="small" startIcon={<CopyOutlined />} onClick={handleCopy} disabled={!dataUrl}>Copy</Button></span>
                  </Tooltip>
                  <Tooltip title="Download PNG">
                    <span><Button size="small" startIcon={<DownloadOutlined />} onClick={handleDownload} disabled={!dataUrl}>Download</Button></span>
                  </Tooltip>
                </Stack>
              </Stack>
            }
            sx={{ height: '100%' }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <Paper variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.hover', minHeight: 300, width: '100%' }}>
                {dataUrl ? (
                  <Box component="img" src={dataUrl} alt="QR Code" sx={{ maxWidth: '100%', height: 'auto', imageRendering: 'pixelated' }} />
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