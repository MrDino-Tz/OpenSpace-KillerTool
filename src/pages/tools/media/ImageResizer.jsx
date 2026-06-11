import { useState, useRef, useCallback } from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Slider from '@mui/material/Slider';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import Snackbar from '@mui/material/Snackbar';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Tooltip from '@mui/material/Tooltip';

import {
  ScissorOutlined,
  DownloadOutlined,
  UploadOutlined,
  UndoOutlined,
  LinkOutlined,
  CopyOutlined,
  StopOutlined
} from '@ant-design/icons';

import MainCard from 'components/MainCard';

function dataURLtoBlob(url) {
  const parts = url.split(',');
  const mime = parts[0].match(/:(.*?);/)[1];
  const bytes = atob(parts[1]);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export default function ImageResizer() {
  const theme = useTheme();
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const [originalImg, setOriginalImg] = useState(null);
  const [originalSize, setOriginalSize] = useState(null);
  const [fileName, setFileName] = useState('');

  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [lockAspect, setLockAspect] = useState(true);
  const [quality, setQuality] = useState(0.92);
  const [format, setFormat] = useState('png');

  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');

  const aspectRatio = useRef(1);

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setOriginalImg(img);
        setOriginalSize({ width: img.naturalWidth, height: img.naturalHeight });
        const w = Math.min(img.naturalWidth, 1200);
        const h = Math.round(w * (img.naturalHeight / img.naturalWidth));
        setWidth(w);
        setHeight(h);
        aspectRatio.current = img.naturalWidth / img.naturalHeight;
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, [handleFile]);

  const handleWidthChange = useCallback((val) => {
    const w = Math.max(1, Math.min(10000, Number(val) || 0));
    setWidth(w);
    if (lockAspect) {
      setHeight(Math.round(w / aspectRatio.current));
    }
  }, [lockAspect]);

  const handleHeightChange = useCallback((val) => {
    const h = Math.max(1, Math.min(10000, Number(val) || 0));
    setHeight(h);
    if (lockAspect) {
      setWidth(Math.round(h * aspectRatio.current));
    }
  }, [lockAspect]);

  const handleReset = useCallback(() => {
    if (!originalImg) return;
    setWidth(originalImg.naturalWidth);
    setHeight(originalImg.naturalHeight);
    aspectRatio.current = originalImg.naturalWidth / originalImg.naturalHeight;
  }, [originalImg]);

  const getResizedDataURL = useCallback(() => {
    if (!originalImg || !canvasRef.current) return null;
    const canvas = canvasRef.current;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(originalImg, 0, 0, width, height);
    return canvas.toDataURL(`image/${format}`, quality);
  }, [originalImg, width, height, format, quality]);

  const handleDownload = useCallback(() => {
    const dataUrl = getResizedDataURL();
    if (!dataUrl) return;
    const blob = dataURLtoBlob(dataUrl);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ext = format === 'jpeg' ? 'jpg' : format;
    const baseName = fileName.replace(/\.[^.]+$/, '') || 'image';
    a.href = url;
    a.download = `${baseName}_${width}x${height}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    setSnackMsg(`Downloaded ${a.download}`);
    setSnackOpen(true);
  }, [getResizedDataURL, fileName, width, height, format]);

  const handleCopy = useCallback(() => {
    const dataUrl = getResizedDataURL();
    if (!dataUrl) return;
    const blob = dataURLtoBlob(dataUrl);
    navigator.clipboard.write([
      new ClipboardItem({ [blob.type]: blob })
    ]).then(() => {
      setSnackMsg('Image copied to clipboard!');
      setSnackOpen(true);
    });
  }, [getResizedDataURL]);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" gap={1.5} sx={{ mb: 1 }}>
          <ScissorOutlined style={{ fontSize: 28, color: theme.palette.primary.main }} />
          <Typography variant="h3" fontWeight="bold">
            Image Resizer
          </Typography>
        </Stack>
        <Typography variant="body1" color="text.secondary">
          Resize images instantly in your browser. No uploads to any server — everything stays local.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <MainCard title="Preview" sx={{ height: '100%' }}>
            {originalImg ? (
              <Box>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 300,
                    maxHeight: 500,
                    overflow: 'hidden',
                    borderRadius: 1.5,
                    border: '1px solid',
                    borderColor: theme.palette.divider,
                    bgcolor: theme.palette.mode === 'dark' ? 'grey.100' : 'grey.50',
                    position: 'relative'
                  }}
                >
                  <canvas
                    ref={canvasRef}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  />
                </Box>
                <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap">
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<DownloadOutlined />}
                    onClick={handleDownload}
                  >
                    Download
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<CopyOutlined />}
                    onClick={handleCopy}
                  >
                    Copy Image
                  </Button>
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<UndoOutlined />}
                    onClick={handleReset}
                  >
                    Original Size
                  </Button>
                </Stack>
                <Box sx={{ mt: 2, p: 1.5, borderRadius: 1, bgcolor: theme.palette.action.hover }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                    Output: {width} x {height} px | {format.toUpperCase()} | Quality: {Math.round(quality * 100)}%
                    {originalSize && ` | Original: ${originalSize.width} x ${originalSize.height} px`}
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Box
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 300,
                  borderRadius: 1.5,
                  border: '2px dashed',
                  borderColor: theme.palette.divider,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': { borderColor: theme.palette.primary.main, bgcolor: theme.palette.action.hover }
                }}
              >
                <UploadOutlined style={{ fontSize: 48, color: theme.palette.text.secondary, marginBottom: 16 }} />
                <Typography variant="h6" color="text.secondary">
                  Drop an image here or click to browse
                </Typography>
                <Typography variant="caption" color="text.disabled" sx={{ mt: 1 }}>
                  Supports PNG, JPEG, WEBP, GIF, BMP, SVG
                </Typography>
              </Box>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                if (e.target.files[0]) handleFile(e.target.files[0]);
              }}
            />
          </MainCard>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <MainCard title="Resize Options">
            <Stack spacing={3}>
              <Stack spacing={2}>
                <Typography variant="subtitle2" fontWeight={600}>Dimensions</Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <TextField
                    size="small"
                    label="Width (px)"
                    type="number"
                    value={width}
                    onChange={(e) => handleWidthChange(e.target.value)}
                    slotProps={{
                      input: { inputProps: { min: 1, max: 10000 } }
                    }}
                    sx={{ flex: 1 }}
                  />
                  <Tooltip title={lockAspect ? 'Unlock aspect ratio' : 'Lock aspect ratio'}>
                    <IconButton
                      size="small"
                      color={lockAspect ? 'primary' : 'default'}
                      onClick={() => setLockAspect(!lockAspect)}
                    >
                      {lockAspect ? <LinkOutlined /> : <StopOutlined />}
                    </IconButton>
                  </Tooltip>
                  <TextField
                    size="small"
                    label="Height (px)"
                    type="number"
                    value={height}
                    onChange={(e) => handleHeightChange(e.target.value)}
                    slotProps={{
                      input: { inputProps: { min: 1, max: 10000 } }
                    }}
                    sx={{ flex: 1 }}
                  />
                </Stack>
                <Slider
                  size="small"
                  value={width}
                  onChange={(_, val) => handleWidthChange(val)}
                  min={1}
                  max={originalImg ? originalImg.naturalWidth * 2 : 2000}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(v) => `${v}px`}
                  disabled={!originalImg}
                />
              </Stack>

              <Divider />

              <Stack spacing={2}>
                <Typography variant="subtitle2" fontWeight={600}>Output Settings</Typography>
                <FormControl fullWidth size="small">
                  <InputLabel>Format</InputLabel>
                  <Select
                    value={format}
                    label="Format"
                    onChange={(e) => setFormat(e.target.value)}
                  >
                    <MenuItem value="png">PNG</MenuItem>
                    <MenuItem value="jpeg">JPEG</MenuItem>
                    <MenuItem value="webp">WEBP</MenuItem>
                  </Select>
                </FormControl>
                {format !== 'png' && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                      Quality: {Math.round(quality * 100)}%
                    </Typography>
                    <Slider
                      size="small"
                      value={quality}
                      onChange={(_, val) => setQuality(val)}
                      min={0.1}
                      max={1}
                      step={0.01}
                      valueLabelDisplay="auto"
                      valueLabelFormat={(v) => `${Math.round(v * 100)}%`}
                    />
                  </Box>
                )}
              </Stack>

              <Divider />

              <Stack spacing={1}>
                <Typography variant="caption" color="text.secondary">
                  {originalSize
                    ? `Original: ${originalSize.width} × ${originalSize.height} px → ${width} × ${height} px`
                    : 'No image loaded'}
                </Typography>
                {originalImg && (
                  <Box
                    component="img"
                    src={originalImg.src}
                    alt="Original"
                    sx={{
                      width: '100%',
                      maxHeight: 120,
                      objectFit: 'contain',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: theme.palette.divider
                    }}
                  />
                )}
              </Stack>
            </Stack>
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
