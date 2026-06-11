import { useState, useRef, useCallback, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Slider from '@mui/material/Slider';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import Snackbar from '@mui/material/Snackbar';
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
  SwapOutlined
} from '@ant-design/icons';

import MainCard from 'components/MainCard';

function dataURLtoBlob(url) {
  if (!url) return null;
  const parts = url.split(',');
  const mime = parts[0].match(/:(.*?);/)[1];
  const bytes = atob(parts[1]);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

const HANDLE_SIZE = 12;

export default function ImageResizer() {
  const theme = useTheme();
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);

  const [originalImg, setOriginalImg] = useState(null);
  const [fileName, setFileName] = useState('');

  const [displayRect, setDisplayRect] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [dragging, setDragging] = useState(null);

  const [outputW, setOutputW] = useState(800);
  const [outputH, setOutputH] = useState(600);
  const [quality, setQuality] = useState(0.92);
  const [format, setFormat] = useState('png');
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');

  const displayRef = useRef(displayRect);
  const cropRef = useRef(crop);
  const imgRef = useRef(null);
  const dragRef = useRef(null);

  useEffect(() => { displayRef.current = displayRect; }, [displayRect]);
  useEffect(() => { cropRef.current = crop; }, [crop]);
  useEffect(() => { imgRef.current = originalImg; }, [originalImg]);

  const fitDisplay = useCallback((img) => {
    if (!img || !containerRef.current) return;
    const container = containerRef.current;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const scale = Math.min(cw / img.naturalWidth, ch / img.naturalHeight, 1);
    const dw = Math.round(img.naturalWidth * scale);
    const dh = Math.round(img.naturalHeight * scale);
    const dx = Math.round((cw - dw) / 2);
    const dy = Math.round((ch - dh) / 2);
    const r = { x: dx, y: dy, w: dw, h: dh };
    setDisplayRect(r);
    setCrop({ x: dx, y: dy, w: dw, h: dh });
  }, []);

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setOriginalImg(img);
        setOutputW(Math.min(img.naturalWidth, 1200));
        setOutputH(Math.round(Math.min(img.naturalWidth, 1200) * (img.naturalHeight / img.naturalWidth)));
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

  const normX = useCallback((clientX) => {
    if (!containerRef.current) return 0;
    return clientX - containerRef.current.getBoundingClientRect().left;
  }, []);

  const normY = useCallback((clientY) => {
    if (!containerRef.current) return 0;
    return clientY - containerRef.current.getBoundingClientRect().top;
  }, []);

  const handleMouseDown = useCallback((e, handle) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = {
      handle,
      startX: normX(e.clientX),
      startY: normY(e.clientY),
      startCrop: { ...cropRef.current }
    };
    setDragging(handle);
  }, [normX, normY]);

  const handleMouseMove = useCallback((e) => {
    if (!dragRef.current) return;
    const { handle, startX, startY, startCrop } = dragRef.current;
    const cx = normX(e.clientX);
    const cy = normY(e.clientY);
    const dx = cx - startX;
    const dy = cy - startY;
    const dr = displayRef.current;

    let x = startCrop.x, y = startCrop.y, w = startCrop.w, h = startCrop.h;

    if (handle === 'move') {
      x = Math.max(dr.x, Math.min(dr.x + dr.w - w, startCrop.x + dx));
      y = Math.max(dr.y, Math.min(dr.y + dr.h - h, startCrop.y + dy));
    } else {
      if (handle.includes('e')) w = Math.max(20, startCrop.w + dx);
      if (handle.includes('w')) { w = Math.max(20, startCrop.w - dx); x = startCrop.x + dx; }
      if (handle.includes('s')) h = Math.max(20, startCrop.h + dy);
      if (handle.includes('n')) { h = Math.max(20, startCrop.h - dy); y = startCrop.y + dy; }
      x = Math.max(dr.x, Math.min(dr.x + dr.w - w, x));
      y = Math.max(dr.y, Math.min(dr.y + dr.h - h, y));
      w = Math.min(w, dr.x + dr.w - x);
      h = Math.min(h, dr.y + dr.h - y);
    }

    setCrop({ x, y, w, h });
  }, [normX, normY]);

  const handleMouseUp = useCallback(() => {
    dragRef.current = null;
    setDragging(null);
  }, []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    if (originalImg) fitDisplay(originalImg);
  }, [originalImg, fitDisplay]);

  const renderOutput = useCallback(() => {
    if (!originalImg || !canvasRef.current) return;
    const dr = displayRef.current;
    const cr = cropRef.current;
    if (!dr.w || !dr.h || !cr.w || !cr.h || !outputW || !outputH) return;
    const scaleX = originalImg.naturalWidth / dr.w;
    const scaleY = originalImg.naturalHeight / dr.h;
    const sx = (cr.x - dr.x) * scaleX;
    const sy = (cr.y - dr.y) * scaleY;
    const sw = cr.w * scaleX;
    const sh = cr.h * scaleY;

    const canvas = canvasRef.current;
    canvas.width = outputW;
    canvas.height = outputH;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(originalImg, sx, sy, sw, sh, 0, 0, outputW, outputH);
  }, [originalImg, outputW, outputH]);

  useEffect(() => {
    renderOutput();
  }, [renderOutput, crop, displayRect]);

  const getOutputDataURL = useCallback(() => {
    if (!originalImg || !canvasRef.current) return null;
    const dr = displayRef.current;
    const cr = cropRef.current;
    if (!dr.w || !dr.h || !cr.w || !cr.h) return null;
    const scaleX = originalImg.naturalWidth / dr.w;
    const scaleY = originalImg.naturalHeight / dr.h;
    const sx = (cr.x - dr.x) * scaleX;
    const sy = (cr.y - dr.y) * scaleY;
    const sw = cr.w * scaleX;
    const sh = cr.h * scaleY;

    const canvas = canvasRef.current;
    canvas.width = outputW;
    canvas.height = outputH;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(originalImg, sx, sy, sw, sh, 0, 0, outputW, outputH);
    return canvas.toDataURL(`image/${format}`, quality);
  }, [originalImg, outputW, outputH, format, quality]);

  const handleDownload = useCallback(() => {
    const dataUrl = getOutputDataURL();
    if (!dataUrl) return;
    const blob = dataURLtoBlob(dataUrl);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ext = format === 'jpeg' ? 'jpg' : format;
    const baseName = fileName.replace(/\.[^.]+$/, '') || 'image';
    a.href = url;
    a.download = `${baseName}_cropped_${outputW}x${outputH}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    setSnackMsg(`Downloaded ${a.download}`);
    setSnackOpen(true);
  }, [getOutputDataURL, fileName, outputW, outputH, format]);

  const handleCopy = useCallback(() => {
    const dataUrl = getOutputDataURL();
    if (!dataUrl) return;
    const blob = dataURLtoBlob(dataUrl);
    navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]).then(() => {
      setSnackMsg('Image copied to clipboard!');
      setSnackOpen(true);
    });
  }, [getOutputDataURL]);

  const handleResetCrop = useCallback(() => {
    if (!originalImg || !containerRef.current) return;
    fitDisplay(originalImg);
    setOutputW(Math.min(originalImg.naturalWidth, 1200));
    setOutputH(Math.round(Math.min(originalImg.naturalWidth, 1200) * (originalImg.naturalHeight / originalImg.naturalWidth)));
  }, [originalImg, fitDisplay]);

  const handleCropAll = useCallback(() => {
    if (!displayRef.current) return;
    setCrop({ ...displayRef.current });
  }, []);

  const handleSwap = useCallback(() => {
    setOutputW(outputH);
    setOutputH(outputW);
  }, [outputW, outputH]);

  const handleDimensions = useCallback((type, val) => {
    const v = Math.max(1, Number(val) || 1);
    if (type === 'w') setOutputW(v);
    else setOutputH(v);
  }, []);

  const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

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
          Crop and resize images in your browser. Everything stays local — nothing is uploaded.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <MainCard title="Crop &amp; Preview" sx={{ height: '100%' }}>
            {originalImg ? (
              <Box>
                <Box
                  ref={containerRef}
                  sx={{
                    position: 'relative',
                    width: '100%',
                    height: '70vh',
                    minHeight: 400,
                    maxHeight: 700,
                    borderRadius: 1.5,
                    border: '1px solid',
                    borderColor: theme.palette.divider,
                    bgcolor: theme.palette.mode === 'dark' ? 'grey.100' : 'grey.50',
                    overflow: 'hidden',
                    userSelect: 'none',
                    cursor: dragging === 'move' ? 'grabbing' : 'default'
                  }}
                >
                  {originalImg && (
                    <Box
                      component="img"
                      src={originalImg.src}
                      alt="Original"
                      draggable={false}
                      sx={{
                        position: 'absolute',
                        top: displayRect.y,
                        left: displayRect.x,
                        width: displayRect.w,
                        height: displayRect.h,
                        pointerEvents: 'none'
                      }}
                    />
                  )}

                  {displayRect.w > 0 && crop.w > 0 && (
                    <>
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0, left: 0, right: 0, bottom: 0,
                          pointerEvents: 'none'
                        }}
                      >
                        <Box sx={{
                          position: 'absolute',
                          top: 0, left: 0, right: 0,
                          height: crop.y,
                          bgcolor: 'rgba(0,0,0,0.45)'
                        }} />
                        <Box sx={{
                          position: 'absolute',
                          top: crop.y, left: 0,
                          width: crop.x, bottom: crop.y + crop.h,
                          bgcolor: 'rgba(0,0,0,0.45)'
                        }} />
                        <Box sx={{
                          position: 'absolute',
                          top: crop.y, right: 0,
                          width: displayRect.x + displayRect.w - crop.x - crop.w,
                          bottom: crop.y + crop.h,
                          bgcolor: 'rgba(0,0,0,0.45)'
                        }} />
                        <Box sx={{
                          position: 'absolute',
                          bottom: 0, left: 0, right: 0,
                          height: displayRect.y + displayRect.h - crop.y - crop.h,
                          bgcolor: 'rgba(0,0,0,0.45)'
                        }} />
                      </Box>

                      <Box
                        onMouseDown={(e) => handleMouseDown(e, 'move')}
                        sx={{
                          position: 'absolute',
                          top: crop.y, left: crop.x,
                          width: crop.w, height: crop.h,
                          border: '2px solid #fff',
                          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.15)',
                          cursor: dragging === 'move' ? 'grabbing' : 'grab',
                          zIndex: 1
                        }}
                      />

                      {handles.map((h) => {
                        const pos = {};
                        if (h.includes('n')) pos.top = crop.y - HANDLE_SIZE / 2;
                        if (h.includes('s')) pos.top = crop.y + crop.h - HANDLE_SIZE / 2;
                        if (h.includes('w')) pos.left = crop.x - HANDLE_SIZE / 2;
                        if (h.includes('e')) pos.left = crop.x + crop.w - HANDLE_SIZE / 2;
                        if (h === 'n' || h === 's') pos.left = crop.x + crop.w / 2 - HANDLE_SIZE / 2;
                        if (h === 'w' || h === 'e') pos.top = crop.y + crop.h / 2 - HANDLE_SIZE / 2;
                        const cursors = { n: 'n-resize', s: 's-resize', e: 'e-resize', w: 'w-resize', ne: 'ne-resize', nw: 'nw-resize', se: 'se-resize', sw: 'sw-resize' };
                        return (
                          <Box
                            key={h}
                            onMouseDown={(e) => handleMouseDown(e, h)}
                            sx={{
                              position: 'absolute',
                              ...pos,
                              width: HANDLE_SIZE,
                              height: HANDLE_SIZE,
                              bgcolor: '#fff',
                              border: '2px solid',
                              borderColor: theme.palette.primary.main,
                              borderRadius: '2px',
                              cursor: cursors[h],
                              zIndex: 2,
                              boxSizing: 'border-box'
                            }}
                          />
                        );
                      })}
                    </>
                  )}
                </Box>

                <Stack direction="row" spacing={1.5} sx={{ mt: 2 }} flexWrap="wrap" alignItems="center">
                  <Button size="small" variant="contained" startIcon={<DownloadOutlined />} onClick={handleDownload}>
                    Download
                  </Button>
                  <Button size="small" variant="outlined" onClick={handleCopy}>
                    Copy
                  </Button>
                  <Button size="small" variant="text" startIcon={<UndoOutlined />} onClick={handleResetCrop}>
                    Reset Crop
                  </Button>
                  <Button size="small" variant="text" onClick={handleCropAll}>
                    Crop Full Image
                  </Button>
                </Stack>
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
                  height: '70vh',
                  minHeight: 400,
                  maxHeight: 700,
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
              onChange={(e) => { if (e.target.files[0]) handleFile(e.target.files[0]); }}
            />
          </MainCard>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <MainCard title="Output">
            <Stack spacing={3}>
              <Box>
                <Box sx={{ position: 'relative', mb: 1.5 }}>
                  <Box
                    sx={{
                      width: '100%',
                      maxHeight: 200,
                      borderRadius: 1.5,
                      border: '1px solid',
                      borderColor: theme.palette.divider,
                      bgcolor: '#000',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden'
                    }}
                  >
                    <canvas
                      ref={canvasRef}
                      style={{ maxWidth: '100%', maxHeight: 200 }}
                    />
                  </Box>
                </Box>
                <Button fullWidth size="small" variant="contained" startIcon={<DownloadOutlined />} onClick={handleDownload}>
                  Download
                </Button>
              </Box>

              <Divider />

              <Stack spacing={1.5}>
                <Typography variant="subtitle2" fontWeight={600}>Output Size</Typography>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <TextField
                    size="small"
                    label="Width"
                    type="number"
                    value={outputW}
                    onChange={(e) => handleDimensions('w', e.target.value)}
                    slotProps={{ input: { inputProps: { min: 1 } } }}
                    sx={{ flex: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>×</Typography>
                  <TextField
                    size="small"
                    label="Height"
                    type="number"
                    value={outputH}
                    onChange={(e) => handleDimensions('h', e.target.value)}
                    slotProps={{ input: { inputProps: { min: 1 } } }}
                    sx={{ flex: 1 }}
                  />
                  <Tooltip title="Swap dimensions">
                    <Button size="small" variant="outlined" onClick={handleSwap} sx={{ minWidth: 36, p: 0.5 }}>
                      <SwapOutlined style={{ fontSize: 14 }} />
                    </Button>
                  </Tooltip>
                </Stack>
              </Stack>

              <Divider />

              <Stack spacing={1.5}>
                <Typography variant="subtitle2" fontWeight={600}>Format</Typography>
                <FormControl fullWidth size="small">
                  <InputLabel>Format</InputLabel>
                  <Select value={format} label="Format" onChange={(e) => setFormat(e.target.value)}>
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
                      onChange={(_, v) => setQuality(v)}
                      min={0.1} max={1} step={0.01}
                      valueLabelDisplay="auto"
                      valueLabelFormat={(v) => `${Math.round(v * 100)}%`}
                    />
                  </Box>
                )}
              </Stack>

              <Divider />

              <Stack spacing={1}>
                <Typography variant="caption" color="text.secondary">
                  {originalImg
                    ? `Crop → ${outputW}×${outputH}px`
                    : 'No image loaded'}
                </Typography>
                {originalImg && (
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Chip label={`${originalImg.naturalWidth}×${originalImg.naturalHeight}`} size="small" variant="outlined" />
                    <Chip label={`→ ${outputW}×${outputH}`} size="small" color="primary" variant="outlined" />
                  </Box>
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
