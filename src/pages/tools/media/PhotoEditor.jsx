import { useState, useRef, useCallback, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import Snackbar from '@mui/material/Snackbar';
import ToggleButton from '@mui/material/ToggleButton';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';

import {
  EditOutlined,
  DownloadOutlined,
  UploadOutlined,
  UndoOutlined,
  DeleteOutlined,
  FontSizeOutlined,
  PictureOutlined,
  FormatPainterOutlined,
  CloseOutlined,
  DragOutlined,
  PlusOutlined,
  BgColorsOutlined
} from '@ant-design/icons';

import MainCard from 'components/MainCard';

let elemId = 0;
function nextId() { return ++elemId; }
let nameIdx = { text: 0, overlay: 0, paint: 0, pixelEraser: 0 };
function nextName(type) {
  nameIdx[type] += 1;
  return { text: 'Text', overlay: 'Overlay', paint: 'Paint', pixelEraser: 'Eraser' }[type] + ' ' + nameIdx[type];
}

const TF = { ox: 0, oy: 0, scale: 1 };
function computeTransform(cw, ch, imgW, imgH) {
  const scale = Math.min(cw / imgW, ch / imgH);
  return { ox: (cw - imgW * scale) / 2, oy: (ch - imgH * scale) / 2, scale };
}
function c2i(t, cx, cy) { return { x: (cx - t.ox) / t.scale, y: (cy - t.oy) / t.scale }; }
function i2c(t, ix, iy) { return { x: ix * t.scale + t.ox, y: iy * t.scale + t.oy }; }

const FONT_OPTIONS = [
  { value: 'sans-serif', label: 'Sans-serif' },
  { value: 'serif', label: 'Serif' },
  { value: 'Arial', label: 'Arial' },
  { value: "'Times New Roman', serif", label: 'Times New Roman' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Verdana', label: 'Verdana' },
  { value: "'Courier New', monospace", label: 'Courier New' },
  { value: 'Impact', label: 'Impact' },
  { value: "'Comic Sans MS', cursive", label: 'Comic Sans MS' },
  { value: 'Tahoma', label: 'Tahoma' },
  { value: "'Trebuchet MS'", label: 'Trebuchet MS' },
  { value: "'Lucida Console', monospace", label: 'Lucida Console' },
  { value: 'monospace', label: 'Monospace' },
  { value: 'Rockybilly', label: 'Rockybilly' },
  { value: 'Gondens', label: 'Gondens' },
  { value: "'Symphonie Calligraphy'", label: 'Symphonie Calligraphy' },
  { value: 'Moralana', label: 'Moralana' },
  { value: 'Awesome', label: 'Awesome' },
  { value: 'Milker', label: 'Milker' },
  { value: "'Retro Floral'", label: 'Retro Floral' },
  { value: 'Rostex', label: 'Rostex' },
  { value: "'Grindy Brush'", label: 'Grindy Brush' },
  { value: "'Higher Jump'", label: 'Higher Jump' },
  { value: "'Casko Luxury Demo'", label: 'Casko Luxury Demo' },
  { value: "'Dalton White'", label: 'Dalton White' },
  { value: "'Greater Theory'", label: 'Greater Theory' },
  { value: "'Californian Signature'", label: 'Californian Signature' }
];

export default function PhotoEditor() {
  const theme = useTheme();
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const overlayInputRef = useRef(null);
  const overlayImgRef = useRef(null);
  const isDrawing = useRef(false);
  const autoPlaceOverlay = useRef(false);
  const tfRef = useRef({ ...TF });

  const [baseImage, setBaseImage] = useState(null);
  const [elements, setElements] = useState([]);
  const [activeTool, setActiveTool] = useState('text');
  const [selectedId, setSelectedId] = useState(null);

  const [textContent, setTextContent] = useState('Hello');
  const [textSize, setTextSize] = useState(36);
  const [textColor, setTextColor] = useState('#ffffff');
  const [textFont, setTextFont] = useState('sans-serif');
  const [textBold, setTextBold] = useState(false);
  const [brushColor, setBrushColor] = useState('#ff0000');
  const [brushSize, setBrushSize] = useState(6);
  const [eraserSize, setEraserSize] = useState(20);
  const [eraserColor, setEraserColor] = useState('');
  const [sampledColor, setSampledColor] = useState(null);
  const [overlaySrc, setOverlaySrc] = useState(null);

  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');
  const [fileName, setFileName] = useState('');
  const [addMenuAnchor, setAddMenuAnchor] = useState(null);

  const elementsRef = useRef(elements);
  useEffect(() => { elementsRef.current = elements; }, [elements]);
  const baseRef = useRef(baseImage);
  useEffect(() => { baseRef.current = baseImage; }, [baseImage]);

  // --- Drawing ---

  const drawAll = useCallback((canvas, base, elems, selId) => {
    if (!canvas || !base) return;
    const ctx = canvas.getContext('2d');
    const cw = canvas.width;
    const ch = canvas.height;
    const imgW = base.naturalWidth;
    const imgH = base.naturalHeight;
    const tf = computeTransform(cw, ch, imgW, imgH);
    tfRef.current = tf;

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(base, tf.ox, tf.oy, imgW * tf.scale, imgH * tf.scale);

    // First pass: pixel eraser strokes (destination-out compositing unless color is set)
    for (const el of elems) {
      if (el.type !== 'pixelEraser' || el.points.length < 2) continue;
      ctx.save();
      if (el.color) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = el.color;
      } else {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
      }
      ctx.beginPath();
      ctx.lineWidth = el.size * tf.scale;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const first = i2c(tf, el.points[0].x, el.points[0].y);
      ctx.moveTo(first.x, first.y);
      for (let i = 1; i < el.points.length; i++) {
        const pt = i2c(tf, el.points[i].x, el.points[i].y);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
      ctx.restore();
    }

    for (const el of elems) {
      ctx.save();
      if (el.type === 'pixelEraser') { ctx.restore(); continue; }
      if (el.type === 'text') {
        const p = i2c(tf, el.x, el.y);
        const fontSizePx = el.fontSize * tf.scale;
        const weight = el.fontWeight === 'bold' ? 'bold ' : '';
        ctx.font = `${weight}${fontSizePx}px ${el.fontFamily || 'sans-serif'}`;
        ctx.fillStyle = el.color;
        ctx.textBaseline = 'top';
        const lines = el.content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          ctx.fillText(lines[i], p.x, p.y + i * fontSizePx * 1.2);
        }
        if (selId === el.id) {
          const maxW = lines.reduce((w, l) => Math.max(w, ctx.measureText(l).width), 0);
          const th = lines.length * fontSizePx * 1.2;
          ctx.strokeStyle = theme.palette.primary.main;
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(p.x - 4, p.y - 4, maxW + 8, th + 8);
          ctx.setLineDash([]);
        }
      } else if (el.type === 'overlay') {
        const p = i2c(tf, el.x, el.y);
        const w = el.w * tf.scale;
        const h = el.h * tf.scale;
        ctx.drawImage(el.img, p.x, p.y, w, h);
        if (selId === el.id) {
          ctx.strokeStyle = theme.palette.primary.main;
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(p.x - 2, p.y - 2, w + 4, h + 4);
          ctx.setLineDash([]);
        }
      } else if (el.type === 'paint') {
        if (el.points.length < 2) continue;
        ctx.beginPath();
        ctx.strokeStyle = el.color;
        ctx.lineWidth = el.size * tf.scale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        const first = i2c(tf, el.points[0].x, el.points[0].y);
        ctx.moveTo(first.x, first.y);
        for (let i = 1; i < el.points.length; i++) {
          const pt = i2c(tf, el.points[i].x, el.points[i].y);
          ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
      }
      ctx.restore();
    }
  }, [theme.palette.primary.main]);

  const scheduleDraw = useCallback(() => {
    const canvas = canvasRef.current;
    const base = baseRef.current;
    const elems = elementsRef.current;
    drawAll(canvas, base, elems, selectedId);
  }, [drawAll, selectedId]);

  useEffect(() => {
    scheduleDraw();
  }, [scheduleDraw, elements, selectedId]);

  // --- Canvas resizing ---

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    let rafId = null;
    const resize = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const w = rect.width;
        const h = rect.height;
        if (w <= 0 || h <= 0) return;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        scheduleDraw();
      });
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();
    return () => {
      observer.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [baseImage, scheduleDraw]);

  // --- Image loading ---

  const handleBaseFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setFileName(file.name);
    setOverlaySrc(null);
    overlayImgRef.current = null;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setBaseImage(img);
        setElements([]);
        setSelectedId(null);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }, []);

  // --- Coordinate helpers ---

  const canvasToImage = useCallback((e) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return { x: 0, y: 0 };
    const rect = container.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    return c2i(tfRef.current, cx, cy);
  }, []);

  const findElementAt = useCallback((ix, iy) => {
    const elems = elementsRef.current;
    for (let i = elems.length - 1; i >= 0; i--) {
      const el = elems[i];
      if (el.type === 'text') {
        const lineH = el.fontSize * 1.2;
        const h = el.content.split('\n').length * lineH;
        const maxW = Math.max(...el.content.split('\n').map((l) => l.length)) * el.fontSize * 0.6;
        if (ix >= el.x && ix <= el.x + maxW && iy >= el.y && iy <= el.y + h) return el.id;
      } else if (el.type === 'overlay') {
        if (ix >= el.x && ix <= el.x + el.w && iy >= el.y && iy <= el.y + el.h) return el.id;
      }
    }
    return null;
  }, []);

  // --- Element operations ---

  const updateSelectedElement = useCallback((props) => {
    setElements((prev) => prev.map((el) => el.id === selectedId ? { ...el, ...props } : el));
  }, [selectedId]);

  const clearAll = useCallback(() => {
    setElements([]);
    setSelectedId(null);
  }, []);

  // --- Mouse events for selection, drag, paint ---

  const [dragState, setDragState] = useState(null);

  const handleCanvasMouseDown = useCallback((e) => {
    if (!baseImage) return;
    const ip = canvasToImage(e);
    const found = findElementAt(ip.x, ip.y);
    if (activeTool === 'eraser') {
      if (found) {
        setElements((prev) => prev.filter((x) => x.id !== found));
        if (selectedId === found) setSelectedId(null);
        setSnackMsg('Element erased!');
        setSnackOpen(true);
      }
      return;
    }
    if (found) {
      setSelectedId(found);
      const el = elementsRef.current.find((x) => x.id === found);
      if (el && el.type !== 'paint') {
        setDragState({ id: found, startIX: ip.x, startIY: ip.y, elX: el.x, elY: el.y });
      }
      } else {
        setSelectedId(null);
        if (activeTool === 'colorPicker') {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const rect = canvas.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const ctx = canvas.getContext('2d');
          const pixel = ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data;
          const hex = '#' + [pixel[0], pixel[1], pixel[2]].map(v => v.toString(16).padStart(2, '0')).join('');
          setSampledColor({ hex, r: pixel[0], g: pixel[1], b: pixel[2] });
          setSnackMsg(`Sampled color: ${hex}`);
          setSnackOpen(true);
          return;
        }
        if (activeTool === 'paint') {
          isDrawing.current = true;
          const newEl = { id: nextId(), type: 'paint', color: brushColor, size: brushSize, points: [ip], name: nextName('paint') };
          setElements((prev) => [...prev, newEl]);
          setSelectedId(newEl.id);
        } else if (activeTool === 'pixelEraser') {
          isDrawing.current = true;
          const newEl = { id: nextId(), type: 'pixelEraser', color: eraserColor || null, size: eraserSize, points: [ip], name: nextName('pixelEraser') };
          setElements((prev) => [...prev, newEl]);
          setSelectedId(newEl.id);
        }
      }
  }, [baseImage, canvasToImage, findElementAt, activeTool, brushColor, brushSize, eraserColor, eraserSize, selectedId]);

  const handleCanvasMouseMove = useCallback((e) => {
    if ((activeTool === 'paint' || activeTool === 'pixelEraser') && isDrawing.current) {
      const ip = canvasToImage(e);
      setElements((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && (last.type === 'paint' || last.type === 'pixelEraser')) {
          updated[updated.length - 1] = { ...last, points: [...last.points, ip] };
        }
        return updated;
      });
      return;
    }
    if (!dragState) return;
    const ip = canvasToImage(e);
    const dx = ip.x - dragState.startIX;
    const dy = ip.y - dragState.startIY;
    setElements((prev) =>
      prev.map((el) =>
        el.id === dragState.id ? { ...el, x: dragState.elX + dx, y: dragState.elY + dy } : el
      )
    );
  }, [activeTool, canvasToImage, dragState]);

  const handleCanvasMouseUp = useCallback(() => {
    isDrawing.current = false;
    setDragState(null);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('mousedown', handleCanvasMouseDown);
    window.addEventListener('mousemove', handleCanvasMouseMove);
    window.addEventListener('mouseup', handleCanvasMouseUp);
    return () => {
      canvas.removeEventListener('mousedown', handleCanvasMouseDown);
      window.removeEventListener('mousemove', handleCanvasMouseMove);
      window.removeEventListener('mouseup', handleCanvasMouseUp);
    };
  }, [handleCanvasMouseDown, handleCanvasMouseMove, handleCanvasMouseUp]);

  // --- Drag & drop from tools panel ---

  const onCanvasDragOver = useCallback((e) => { e.preventDefault(); }, []);

  const onCanvasDrop = useCallback((e) => {
    e.preventDefault();
    if (!baseImage) {
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) { handleBaseFile(file); }
      return;
    }
    const ip = canvasToImage(e);
    const type = e.dataTransfer.getData('application/x-element-type');
    if (type === 'text') {
      const data = e.dataTransfer.getData('application/x-element-data');
      const settings = data ? JSON.parse(data) : { content: textContent, fontSize: textSize, color: textColor };
      const newEl = { id: nextId(), type: 'text', x: ip.x, y: ip.y, content: settings.content, fontSize: settings.fontSize, color: settings.color, fontFamily: settings.fontFamily || 'sans-serif', fontWeight: settings.fontWeight || 'normal', name: nextName('text') };
      setElements((prev) => [...prev, newEl]);
      setSelectedId(newEl.id);
      setSnackMsg('Text placed!');
      setSnackOpen(true);
    } else if (type === 'overlay') {
      if (!overlayImgRef.current) {
        setSnackMsg('Upload an image overlay first in the Tools panel');
        setSnackOpen(true);
        return;
      }
      const maxW = 200;
      const ow = Math.min(overlayImgRef.current.naturalWidth, maxW);
      const oh = Math.round(ow * (overlayImgRef.current.naturalHeight / overlayImgRef.current.naturalWidth));
      const newEl = { id: nextId(), type: 'overlay', x: ip.x - ow / 2, y: ip.y - oh / 2, w: ow, h: oh, img: overlayImgRef.current, name: nextName('overlay') };
      setElements((prev) => [...prev, newEl]);
      setSelectedId(newEl.id);
      setSnackMsg('Overlay placed!');
      setSnackOpen(true);
    }
  }, [baseImage, canvasToImage, textContent, textSize, textColor, handleBaseFile]);

  const onCanvasDropImage = useCallback((e) => {
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    if (!baseImage) { handleBaseFile(file); return; }
    e.preventDefault();
    e.stopPropagation();
    const ip = canvasToImage(e);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const maxW = 200;
        const ow = Math.min(img.naturalWidth, maxW);
        const oh = Math.round(ow * (img.naturalHeight / img.naturalWidth));
        const newEl = { id: nextId(), type: 'overlay', x: ip.x - ow / 2, y: ip.y - oh / 2, w: ow, h: oh, img, name: nextName('overlay') };
        setElements((prev) => [...prev, newEl]);
        setSelectedId(newEl.id);
        setSnackMsg('Overlay dropped!');
        setSnackOpen(true);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }, [baseImage, canvasToImage, handleBaseFile]);

  // --- Overlay upload ---

  const handleOverlayUpload = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        overlayImgRef.current = img;
        setOverlaySrc(e.target.result);
        const autoPlace = autoPlaceOverlay.current;
        autoPlaceOverlay.current = false;
        if (autoPlace && baseRef.current) {
          const maxW = 200;
          const ow = Math.min(img.naturalWidth, maxW);
          const oh = Math.round(ow * (img.naturalHeight / img.naturalWidth));
          const cx = (baseRef.current.naturalWidth - ow) / 2;
          const cy = (baseRef.current.naturalHeight - oh) / 2;
          const newEl = { id: nextId(), type: 'overlay', x: cx, y: cy, w: ow, h: oh, img, name: nextName('overlay') };
          setElements((prev) => [...prev, newEl]);
          setSelectedId(newEl.id);
          setSnackMsg('Overlay added at center!');
        } else {
          setSnackMsg('Image loaded! Drag it from the Tools panel onto the canvas.');
        }
        setSnackOpen(true);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }, []);

  const onTextDragStart = useCallback((e) => {
    e.dataTransfer.setData('application/x-element-type', 'text');
    e.dataTransfer.setData('application/x-element-data', JSON.stringify({ content: textContent, fontSize: textSize, color: textColor, fontFamily: textFont, fontWeight: textBold ? 'bold' : 'normal' }));
    e.dataTransfer.effectAllowed = 'copy';
  }, [textContent, textSize, textColor, textFont, textBold]);

  const onOverlayDragStart = useCallback((e) => {
    if (!overlayImgRef.current) { e.preventDefault(); return; }
    e.dataTransfer.setData('application/x-element-type', 'overlay');
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  // --- Download at full resolution ---

  const handleDownload = useCallback(() => {
    const base = baseRef.current;
    if (!base) return;
    const nc = document.createElement('canvas');
    nc.width = base.naturalWidth;
    nc.height = base.naturalHeight;
    drawAll(nc, base, elementsRef.current, null);
    const dataUrl = nc.toDataURL('image/png');
    const a = document.createElement('a');
    const baseName = fileName.replace(/\.[^.]+$/, '') || 'photo';
    a.href = dataUrl;
    a.download = `${baseName}_edited.png`;
    a.click();
    setSnackMsg('Downloaded edited photo!');
    setSnackOpen(true);
  }, [drawAll, fileName]);

  const selectedEl = elements.find((el) => el.id === selectedId);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" gap={1.5} sx={{ mb: 1 }}>
          <EditOutlined style={{ fontSize: 28, color: theme.palette.primary.main }} />
          <Typography variant="h3" fontWeight="bold">
            Photo Editor
          </Typography>
        </Stack>
        <Typography variant="body1" color="text.secondary">
          Drag elements from the Tools panel onto the canvas. Click to select, then drag to move. All processing stays in your browser.
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ height: 'calc(100vh - 200px)' }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <MainCard title="Tools" sx={{ height: '100%' }}>
            <Stack spacing={2}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<PlusOutlined />}
                  onClick={(e) => setAddMenuAnchor(e.currentTarget)}
                  disabled={!baseImage}
                  sx={{ flexShrink: 0 }}
                >
                  Add
                </Button>
                <Menu
                  anchorEl={addMenuAnchor}
                  open={Boolean(addMenuAnchor)}
                  onClose={() => setAddMenuAnchor(null)}
                >
                  <MenuItem onClick={() => {
                    setAddMenuAnchor(null);
                    if (!baseImage) return;
                    setActiveTool('text');
                    const base = baseRef.current;
                    const cx = base.naturalWidth / 2;
                    const cy = base.naturalHeight / 2;
                    const newEl = { id: nextId(), type: 'text', x: cx, y: cy, content: textContent, fontSize: textSize, color: textColor, fontFamily: textFont, fontWeight: textBold ? 'bold' : 'normal', name: nextName('text') };
                    setElements((prev) => [...prev, newEl]);
                    setSelectedId(newEl.id);
                    setSnackMsg('Text added at center!');
                    setSnackOpen(true);
                  }} dense>
                    <FontSizeOutlined style={{ marginRight: 8 }} /> Text
                  </MenuItem>
                  <MenuItem onClick={() => {
                    setAddMenuAnchor(null);
                    if (!baseImage) return;
                    setActiveTool('overlay');
                    autoPlaceOverlay.current = true;
                    overlayInputRef.current?.click();
                  }} dense>
                    <PictureOutlined style={{ marginRight: 8 }} /> Image Overlay
                  </MenuItem>
                  <MenuItem onClick={() => {
                    setAddMenuAnchor(null);
                    if (!baseImage) return;
                    setActiveTool('paint');
                    setSnackMsg('Paint mode active — draw on the canvas');
                    setSnackOpen(true);
                  }} dense>
                    <FormatPainterOutlined style={{ marginRight: 8 }} /> Paint
                  </MenuItem>
                  <MenuItem onClick={() => {
                    setAddMenuAnchor(null);
                    if (!baseImage) return;
                    setActiveTool('eraser');
                    setSnackMsg('Delete Element active — click any element on the canvas to remove it');
                    setSnackOpen(true);
                  }} dense>
                    <DeleteOutlined style={{ marginRight: 8 }} /> Delete Element
                  </MenuItem>
                  <MenuItem onClick={() => {
                    setAddMenuAnchor(null);
                    if (!baseImage) return;
                    setActiveTool('pixelEraser');
                    setSnackMsg('Pixel Eraser active — click & drag to erase parts of the image');
                    setSnackOpen(true);
                  }} dense>
                    <DeleteOutlined style={{ marginRight: 8 }} /> Pixel Eraser
                  </MenuItem>
                  <MenuItem onClick={() => {
                    setAddMenuAnchor(null);
                    if (!baseImage) return;
                    setActiveTool('colorPicker');
                    setSnackMsg('Color Picker active — click on the image to sample a color');
                    setSnackOpen(true);
                  }} dense>
                    <BgColorsOutlined style={{ marginRight: 8 }} /> Color Picker
                  </MenuItem>
                </Menu>
                <Chip
                  label={
                    activeTool === 'text' ? 'Text' :
                    activeTool === 'overlay' ? 'Image' :
                    activeTool === 'paint' ? 'Paint' :
                    activeTool === 'pixelEraser' ? 'Pixel Eraser' :
                    activeTool === 'colorPicker' ? 'Color Picker' : 'Delete Element'
                  }
                  size="small"
                  color="primary"
                  variant="outlined"
                  icon={
                    activeTool === 'text' ? <FontSizeOutlined style={{ fontSize: 12 }} /> :
                    activeTool === 'overlay' ? <PictureOutlined style={{ fontSize: 12 }} /> :
                    activeTool === 'paint' ? <FormatPainterOutlined style={{ fontSize: 12 }} /> :
                    activeTool === 'pixelEraser' ? <DeleteOutlined style={{ fontSize: 12 }} /> :
                    activeTool === 'colorPicker' ? <BgColorsOutlined style={{ fontSize: 12 }} /> :
                    <DeleteOutlined style={{ fontSize: 12 }} />
                  }
                />
              </Stack>

              <Divider />

              {activeTool === 'text' && (
                <Stack spacing={1.5}>
                  <Typography variant="subtitle2" fontWeight={600}>Text Settings</Typography>
                  <TextField
                    size="small"
                    label="Content"
                    value={textContent}
                    onChange={(e) => {
                      setTextContent(e.target.value);
                      if (selectedEl?.type === 'text') updateSelectedElement({ content: e.target.value });
                    }}
                    multiline
                    rows={2}
                  />
                  <TextField
                    size="small"
                    label="Font Size"
                    type="number"
                    value={textSize}
                    onChange={(e) => {
                      const v = Math.max(8, Number(e.target.value) || 12);
                      setTextSize(v);
                      if (selectedEl?.type === 'text') updateSelectedElement({ fontSize: v });
                    }}
                    slotProps={{ input: { inputProps: { min: 8, max: 200 } } }}
                  />
                  <Select
                    size="small"
                    value={textFont}
                    onChange={(e) => {
                      setTextFont(e.target.value);
                      if (selectedEl?.type === 'text') updateSelectedElement({ fontFamily: e.target.value });
                    }}
                    renderValue={(v) => <span style={{ fontFamily: v }}>{FONT_OPTIONS.find((f) => f.value === v)?.label || v}</span>}
                  >
                    {FONT_OPTIONS.map((f) => (
                      <MenuItem key={f.value} value={f.value} sx={{ fontFamily: f.value }}>{f.label}</MenuItem>
                    ))}
                  </Select>
                  <ToggleButton
                    value="bold"
                    selected={textBold}
                    onChange={() => {
                      setTextBold(!textBold);
                      if (selectedEl?.type === 'text') updateSelectedElement({ fontWeight: textBold ? 'normal' : 'bold' });
                    }}
                    size="small"
                    sx={{ textTransform: 'none', fontWeight: 700 }}
                  >
                    B Bold
                  </ToggleButton>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="caption" sx={{ flexShrink: 0 }}>Color</Typography>
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => {
                        setTextColor(e.target.value);
                        if (selectedEl?.type === 'text') updateSelectedElement({ color: e.target.value });
                      }}
                      style={{ width: 36, height: 36, border: 'none', cursor: 'pointer', padding: 0, background: 'none' }}
                    />
                  </Stack>

                  <Paper
                    variant="outlined"
                    draggable={!!baseImage}
                    onDragStart={onTextDragStart}
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      cursor: baseImage ? 'grab' : 'not-allowed',
                      borderStyle: 'dashed',
                      opacity: baseImage ? 1 : 0.5,
                      '&:active': { cursor: 'grabbing' },
                      userSelect: 'none'
                    }}
                  >
                    <DragOutlined style={{ fontSize: 20, display: 'block', marginBottom: 6 }} />
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      sx={{ color: textColor, fontSize: Math.min(textSize, 18), fontFamily: textFont }}
                    >
                      {textContent || 'Text'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Drag me to the canvas
                    </Typography>
                  </Paper>
                </Stack>
              )}

              {activeTool === 'overlay' && (
                <Stack spacing={1.5}>
                  <Typography variant="subtitle2" fontWeight={600}>Image Overlay</Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<UploadOutlined />}
                    onClick={() => overlayInputRef.current?.click()}
                  >
                    Choose Image
                  </Button>
                  <input
                    ref={overlayInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => { if (e.target.files[0]) handleOverlayUpload(e.target.files[0]); }}
                  />

                  {overlaySrc ? (
                    <Paper
                      variant="outlined"
                      draggable={!!baseImage}
                      onDragStart={onOverlayDragStart}
                      sx={{
                        p: 1,
                        textAlign: 'center',
                        cursor: baseImage ? 'grab' : 'not-allowed',
                        borderStyle: 'dashed',
                        opacity: baseImage ? 1 : 0.5,
                        '&:active': { cursor: 'grabbing' },
                        userSelect: 'none'
                      }}
                    >
                      <Box
                        component="img"
                        src={overlaySrc}
                        sx={{ maxWidth: '100%', maxHeight: 80, display: 'block', mx: 'auto', mb: 0.5 }}
                      />
                      <DragOutlined style={{ fontSize: 14, marginRight: 4 }} />
                      <Typography variant="caption" color="text.secondary">
                        Drag to canvas
                      </Typography>
                    </Paper>
                  ) : (
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', borderStyle: 'dashed' }}>
                      <Typography variant="caption" color="text.secondary">
                        Select an image above, then drag it to the canvas
                      </Typography>
                    </Paper>
                  )}

                  {selectedEl?.type === 'overlay' && (
                    <Stack spacing={1}>
                      <TextField
                        size="small"
                        label="Width"
                        type="number"
                        value={selectedEl.w}
                        onChange={(e) => updateSelectedElement({ w: Math.max(10, Number(e.target.value) || 10) })}
                      />
                      <TextField
                        size="small"
                        label="Height"
                        type="number"
                        value={selectedEl.h}
                        onChange={(e) => updateSelectedElement({ h: Math.max(10, Number(e.target.value) || 10) })}
                      />
                    </Stack>
                  )}

                  <Typography variant="caption" color="text.secondary">
                    You can also drag an image file directly onto the canvas.
                  </Typography>
                </Stack>
              )}

              {activeTool === 'paint' && (
                <Stack spacing={1.5}>
                  <Typography variant="subtitle2" fontWeight={600}>Brush Settings</Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="caption" sx={{ flexShrink: 0 }}>Color</Typography>
                    <input
                      type="color"
                      value={brushColor}
                      onChange={(e) => setBrushColor(e.target.value)}
                      style={{ width: 36, height: 36, border: 'none', cursor: 'pointer', padding: 0, background: 'none' }}
                    />
                  </Stack>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Size: {brushSize}px
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flexWrap: 'wrap', py: 0.5 }}>
                    {[2, 6, 14, 30, 60].map((s) => (
                      <Box
                        key={s}
                        onClick={() => setBrushSize(s)}
                        sx={{
                          width: Math.min(s + 16, 48),
                          height: Math.min(s + 16, 48),
                          borderRadius: '50%',
                          border: '2px solid',
                          borderColor: brushSize === s ? theme.palette.primary.main : theme.palette.divider,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          bgcolor: theme.palette.mode === 'dark' ? 'grey.200' : 'grey.100',
                          transition: 'all 0.15s',
                          '&:hover': { borderColor: theme.palette.primary.light }
                        }}
                      >
                        <Box
                          sx={{
                            width: s,
                            height: s,
                            borderRadius: '50%',
                            bgcolor: brushColor,
                            pointerEvents: 'none'
                          }}
                        />
                      </Box>
                    ))}
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    Draw directly on the image by clicking and dragging.
                  </Typography>
                </Stack>
              )}

              {activeTool === 'pixelEraser' && (
                <Stack spacing={1.5}>
                  <Typography variant="subtitle2" fontWeight={600}>Pixel Eraser</Typography>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Size: {eraserSize}px
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flexWrap: 'wrap', py: 0.5 }}>
                    {[5, 10, 20, 40, 80].map((s) => (
                      <Box
                        key={s}
                        onClick={() => setEraserSize(s)}
                        sx={{
                          width: Math.min(s + 16, 48),
                          height: Math.min(s + 16, 48),
                          borderRadius: '50%',
                          border: '2px solid',
                          borderColor: eraserSize === s ? theme.palette.primary.main : theme.palette.divider,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          bgcolor: theme.palette.mode === 'dark' ? 'grey.200' : 'grey.100',
                          transition: 'all 0.15s',
                          '&:hover': { borderColor: theme.palette.primary.light }
                        }}
                      >
                        <Box
                          sx={{
                            width: s,
                            height: s,
                            borderRadius: '50%',
                            bgcolor: theme.palette.text.secondary,
                            opacity: 0.6,
                            pointerEvents: 'none'
                          }}
                        />
                      </Box>
                    ))}
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="caption" sx={{ flexShrink: 0 }}>Color</Typography>
                    <input
                      type="color"
                      value={eraserColor || '#000000'}
                      onChange={(e) => setEraserColor(e.target.value)}
                      style={{ width: 36, height: 36, border: 'none', cursor: 'pointer', padding: 0, background: 'none' }}
                    />
                    <Button
                      size="small"
                      variant={eraserColor ? 'outlined' : 'contained'}
                      color={eraserColor ? 'primary' : 'error'}
                      onClick={() => setEraserColor(eraserColor ? '' : '#000000')}
                      sx={{ minWidth: 60, fontSize: '0.7rem', textTransform: 'none' }}
                    >
                      {eraserColor ? 'Paint' : 'Erase'}
                    </Button>
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {eraserColor ? 'Click & drag to paint with the selected color.' : 'Click & drag to erase pixels.'}
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={() => setActiveTool('text')}
                    sx={{ mt: 1 }}
                  >
                    Exit Eraser
                  </Button>
                </Stack>
              )}

              {activeTool === 'colorPicker' && (
                <Stack spacing={1.5} sx={{ textAlign: 'center', py: 2 }}>
                  <BgColorsOutlined style={{ fontSize: 36, color: theme.palette.primary.main, display: 'block', margin: '0 auto 8px' }} />
                  <Typography variant="subtitle2" fontWeight={600}>Color Picker</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Click anywhere on the canvas to sample a pixel color.
                  </Typography>
                  {sampledColor && (
                    <Paper variant="outlined" sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ width: 40, height: 40, borderRadius: 1, bgcolor: sampledColor.hex, flexShrink: 0, border: '1px solid', borderColor: theme.palette.divider }} />
                      <Stack spacing={0} sx={{ flex: 1, textAlign: 'left' }}>
                        <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>{sampledColor.hex}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          RGB({sampledColor.r}, {sampledColor.g}, {sampledColor.b})
                        </Typography>
                      </Stack>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => { navigator.clipboard.writeText(sampledColor.hex); setSnackMsg('Copied!'); setSnackOpen(true); }}
                        sx={{ minWidth: 56, fontSize: '0.7rem' }}
                      >
                        Copy
                      </Button>
                    </Paper>
                  )}
                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    onClick={() => setActiveTool('text')}
                    sx={{ mt: 1 }}
                  >
                    Exit Color Picker
                  </Button>
                </Stack>
              )}

              {activeTool === 'eraser' && (
                <Stack spacing={1.5} sx={{ textAlign: 'center', py: 2 }}>
                  <DeleteOutlined style={{ fontSize: 36, color: theme.palette.error.main, display: 'block', margin: '0 auto 8px' }} />
                  <Typography variant="subtitle2" fontWeight={600} color="error.main">Object Eraser</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Click on any element (text, overlay, or paint stroke) on the canvas to remove it.
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={() => setActiveTool('text')}
                    sx={{ mt: 1 }}
                  >
                    Exit Eraser
                  </Button>
                </Stack>
              )}

              <Divider />

              <Stack spacing={1}>
                <Button
                  fullWidth
                  size="small"
                  variant="contained"
                  startIcon={<DownloadOutlined />}
                  onClick={handleDownload}
                  disabled={!baseImage}
                >
                  Download
                </Button>
                <Button
                  fullWidth
                  size="small"
                  variant="text"
                  color="error"
                  startIcon={<DeleteOutlined />}
                  onClick={clearAll}
                  disabled={!baseImage || elements.length === 0}
                >
                  Clear All
                </Button>
                <Button
                  fullWidth
                  size="small"
                  variant="text"
                  startIcon={<UndoOutlined />}
                  onClick={() => {
                    setElements((prev) => prev.slice(0, -1));
                    setSelectedId(null);
                  }}
                  disabled={!baseImage || elements.length === 0}
                >
                  Undo Last
                </Button>
              </Stack>
            </Stack>
          </MainCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex', flexDirection: 'column' }}>
          <MainCard
            title={
              <Stack direction="row" alignItems="center" gap={1}>
                <Typography variant="h6" fontWeight={600}>
                  Canvas
                </Typography>
                {baseImage && (
                  <Chip label={`${elements.length} elements`} size="small" variant="outlined" />
                )}
              </Stack>
            }
            sx={{ flex: 1, display: 'flex', flexDirection: 'column', '& .MuiCardContent-root': { flex: 1, display: 'flex', flexDirection: 'column' } }}
          >
            {baseImage ? (
              <Box
                ref={containerRef}
                onDragOver={onCanvasDragOver}
                onDrop={(e) => {
                  if (e.dataTransfer.files?.length > 0) {
                    onCanvasDropImage(e);
                  } else {
                    onCanvasDrop(e);
                  }
                }}
                sx={{
                  flex: 1,
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor: theme.palette.divider,
                  bgcolor: theme.palette.mode === 'dark' ? 'grey.100' : 'grey.50',
                  overflow: 'hidden',
                  cursor: activeTool === 'paint' ? 'crosshair' : activeTool === 'eraser' ? 'not-allowed' : activeTool === 'pixelEraser' ? 'crosshair' : activeTool === 'colorPicker' ? 'crosshair' : 'default',
                  position: 'relative'
                }}
              >
                <canvas
                  ref={canvasRef}
                  style={{ position: 'absolute', top: 0, left: 0 }}
                />
              </Box>
            ) : (
              <Box
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files[0]) handleBaseFile(e.dataTransfer.files[0]); }}
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
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
                  Drop a photo here or click to browse
                </Typography>
              </Box>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => { if (e.target.files[0]) handleBaseFile(e.target.files[0]); }}
            />
          </MainCard>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <MainCard title="Elements" sx={{ height: '100%' }}>
            {elements.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                {baseImage ? 'No elements yet. Drag text or an overlay from the Tools panel onto the canvas.' : 'Load an image to get started.'}
              </Typography>
            ) : (
              <Stack spacing={1} sx={{ maxHeight: 'calc(100vh - 320px)', overflowY: 'auto', pr: 0.5 }}>
                {elements.map((el) => (
                  <Paper
                    key={el.id}
                    variant="outlined"
                    sx={{
                      p: selectedId === el.id ? 1.5 : 1,
                      cursor: 'pointer',
                      bgcolor: selectedId === el.id ? theme.palette.action.selected : 'transparent',
                      borderColor: selectedId === el.id ? theme.palette.primary.main : theme.palette.divider,
                      '&:hover': { bgcolor: theme.palette.action.hover }
                    }}
                    onClick={() => setSelectedId(el.id)}
                  >
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: selectedId === el.id ? 1 : 0 }}>
                      <Stack direction="row" alignItems="center" gap={1}>
                        {el.type === 'text' && <FontSizeOutlined style={{ fontSize: 14 }} />}
                        {el.type === 'overlay' && <PictureOutlined style={{ fontSize: 14 }} />}
                        {el.type === 'paint' && <FormatPainterOutlined style={{ fontSize: 14 }} />}
                        {el.type === 'pixelEraser' && <DeleteOutlined style={{ fontSize: 14 }} />}
                        <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                          {el.name || (el.type === 'text' ? `"${el.content.substring(0, 10)}"` : el.type === 'overlay' ? `${el.w}\u00d7${el.h}` : el.type === 'pixelEraser' ? `eraser` : `stroke`)}
                        </Typography>
                      </Stack>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setElements((prev) => prev.filter((x) => x.id !== el.id));
                          if (selectedId === el.id) setSelectedId(null);
                        }}
                        sx={{ p: 0.3 }}
                      >
                        <CloseOutlined style={{ fontSize: 11 }} />
                      </IconButton>
                    </Stack>

                    {selectedId === el.id && (
                      <Stack spacing={1} onClick={(e) => e.stopPropagation()}>
                        <TextField
                          size="small"
                          label="Name"
                          value={el.name || ''}
                          onChange={(e) => updateSelectedElement({ name: e.target.value })}
                        />
                        {el.type === 'text' && (
                          <>
                            <TextField
                              size="small"
                              label="Content"
                              value={el.content}
                              onChange={(e) => updateSelectedElement({ content: e.target.value })}
                              multiline
                              rows={2}
                            />
                            <TextField
                              size="small"
                              label="Font Size"
                              type="number"
                              value={el.fontSize}
                              onChange={(e) => updateSelectedElement({ fontSize: Math.max(8, Number(e.target.value) || 12) })}
                              slotProps={{ input: { inputProps: { min: 8, max: 200 } } }}
                            />
                            <Select
                              size="small"
                              value={el.fontFamily || 'sans-serif'}
                              onChange={(e) => updateSelectedElement({ fontFamily: e.target.value })}
                              renderValue={(v) => <span style={{ fontFamily: v }}>{FONT_OPTIONS.find((f) => f.value === v)?.label || v}</span>}
                            >
                              {FONT_OPTIONS.map((f) => (
                                <MenuItem key={f.value} value={f.value} sx={{ fontFamily: f.value }}>{f.label}</MenuItem>
                              ))}
                            </Select>
                            <ToggleButton
                              value="bold"
                              selected={el.fontWeight === 'bold'}
                              onChange={() => updateSelectedElement({ fontWeight: el.fontWeight === 'bold' ? 'normal' : 'bold' })}
                              size="small"
                              sx={{ textTransform: 'none', fontWeight: 700 }}
                            >
                              B Bold
                            </ToggleButton>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Typography variant="caption" sx={{ flexShrink: 0 }}>Color</Typography>
                              <input
                                type="color"
                                value={el.color}
                                onChange={(e) => updateSelectedElement({ color: e.target.value })}
                                style={{ width: 32, height: 32, border: 'none', cursor: 'pointer', padding: 0, background: 'none' }}
                              />
                            </Stack>
                          </>
                        )}
                        {el.type === 'overlay' && (
                          <Stack direction="row" spacing={1}>
                            <TextField
                              size="small"
                              label="W"
                              type="number"
                              value={el.w}
                              onChange={(e) => updateSelectedElement({ w: Math.max(10, Number(e.target.value) || 10) })}
                            />
                            <TextField
                              size="small"
                              label="H"
                              type="number"
                              value={el.h}
                              onChange={(e) => updateSelectedElement({ h: Math.max(10, Number(e.target.value) || 10) })}
                            />
                          </Stack>
                        )}
                        {el.type === 'paint' && (
                          <>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Typography variant="caption" sx={{ flexShrink: 0 }}>Color</Typography>
                              <input
                                type="color"
                                value={el.color}
                                onChange={(e) => updateSelectedElement({ color: e.target.value })}
                                style={{ width: 32, height: 32, border: 'none', cursor: 'pointer', padding: 0, background: 'none' }}
                              />
                            </Stack>
                            <TextField
                              size="small"
                              label="Brush Size"
                              type="number"
                              value={el.size}
                              onChange={(e) => updateSelectedElement({ size: Math.max(1, Number(e.target.value) || 1) })}
                            />
                          </>
                        )}
                        {el.type === 'pixelEraser' && (
                          <>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Typography variant="caption" sx={{ flexShrink: 0 }}>Color</Typography>
                              <input
                                type="color"
                                value={el.color || '#000000'}
                                onChange={(e) => updateSelectedElement({ color: e.target.value })}
                                style={{ width: 32, height: 32, border: 'none', cursor: 'pointer', padding: 0, background: 'none' }}
                              />
                              <Button
                                size="small"
                                variant={el.color ? 'outlined' : 'contained'}
                                color={el.color ? 'primary' : 'error'}
                                onClick={() => updateSelectedElement({ color: el.color ? null : '#000000' })}
                                sx={{ minWidth: 50, fontSize: '0.65rem', textTransform: 'none' }}
                              >
                                {el.color ? 'Paint' : 'Erase'}
                              </Button>
                            </Stack>
                            <TextField
                              size="small"
                              label="Eraser Size"
                              type="number"
                              value={el.size}
                              onChange={(e) => updateSelectedElement({ size: Math.max(1, Number(e.target.value) || 1) })}
                            />
                          </>
                        )}
                      </Stack>
                    )}
                  </Paper>
                ))}
              </Stack>
            )}
          </MainCard>
        </Grid>
      </Grid>

      <Snackbar
        open={snackOpen}
        autoHideDuration={2500}
        onClose={() => setSnackOpen(false)}
        message={snackMsg}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      />
    </Box>
  );
}
