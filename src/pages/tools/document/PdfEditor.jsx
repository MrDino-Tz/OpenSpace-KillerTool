import { useState, useCallback, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import Paper from '@mui/material/Paper';
import LinearProgress from '@mui/material/LinearProgress';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import {
  FilePdfOutlined, DeleteOutlined, DownloadOutlined, CloudUploadOutlined, InboxOutlined,
  BoldOutlined, ItalicOutlined, SelectOutlined, EditOutlined,
  FontSizeOutlined, PictureOutlined, BorderOutlined, PushpinOutlined,
  PlusOutlined, ScissorOutlined, MergeCellsOutlined, RadarChartOutlined
} from '@ant-design/icons';

import MainCard from 'components/MainCard';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

function formatSize(bytes) {
  if (!bytes) return 'unknown';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

const FONT_OPTIONS = [
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'TimesRoman', label: 'Times New Roman' },
  { value: 'Courier', label: 'Courier' }
];

const FONT_MAP = {
  Helvetica: StandardFonts.Helvetica, HelveticaBold: StandardFonts.HelveticaBold,
  HelveticaOblique: StandardFonts.HelveticaOblique, HelveticaBoldOblique: StandardFonts.HelveticaBoldOblique,
  TimesRoman: StandardFonts.TimesRoman, TimesBold: StandardFonts.TimesBold,
  TimesRomanItalic: StandardFonts.TimesRomanItalic, TimesBoldItalic: StandardFonts.TimesBoldItalic,
  Courier: StandardFonts.Courier, CourierBold: StandardFonts.CourierBold,
  CourierOblique: StandardFonts.CourierOblique, CourierBoldOblique: StandardFonts.CourierBoldOblique
};

function getPdfLibFont(family, bold, italic) {
  const key = family + (bold ? 'Bold' : '') + (italic ? (family === 'Courier' ? 'Oblique' : 'Italic') : '');
  return FONT_MAP[key] || FONT_MAP[family];
}

let uid = 0;
const id = () => ++uid;

export default function PdfEditor() {
  const theme = useTheme();
  const canvasRefs = useRef({});
  const overlayRefs = useRef({});
  const thumbRefs = useRef({});
  const fileInputRef = useRef(null);
  const shapeStartRef = useRef(null);

  const [pdfFile, setPdfFile] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pages, setPages] = useState([]);
  const [textItems, setTextItems] = useState([]);
  const [freeTexts, setFreeTexts] = useState([]);
  const [shapes, setShapes] = useState([]);
  const [images, setImages] = useState([]);
  const [notes, setNotes] = useState([]);
  const [formFields, setFormFields] = useState([]);
  const [detectedForms, setDetectedForms] = useState([]);
  const [detectedImages, setDetectedImages] = useState([]);
  const [pendingImage, setPendingImage] = useState(null);
  const [drawingShape, setDrawingShape] = useState(null);
  const [activePage, setActivePage] = useState(0);

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [tool, setTool] = useState('select');
  const [shapeType, setShapeType] = useState('rectangle');
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');
  const [snackSeverity, setSnackSeverity] = useState('success');
  const [pageScale, setPageScale] = useState(1.2);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [splitOpen, setSplitOpen] = useState(false);
  const [splitRange, setSplitRange] = useState('');

  // annotation style state
  const [annFont, setAnnFont] = useState('Helvetica');
  const [annSize, setAnnSize] = useState(14);
  const [annBold, setAnnBold] = useState(false);
  const [annItalic, setAnnItalic] = useState(false);
  const [annColor, setAnnColor] = useState('#000000');
  const [fillColor, setFillColor] = useState('#ffffff');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);

  const showSnack = (msg, severity = 'success') => {
    setSnackMsg(msg);
    setSnackSeverity(severity);
    setSnackOpen(true);
  };

  // ---- PDF loading ----
  const loadPdf = useCallback(async (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') { showSnack('Please select a valid PDF file', 'error'); return; }
    setLoading(true); setProgress(0);
    setTextItems([]); setFreeTexts([]); setShapes([]); setImages([]); setNotes([]); setFormFields([]);
    setSelectedId(null); setEditingId(null);
    try {
      const ab = await file.arrayBuffer();
      const task = pdfjsLib.getDocument({ data: ab, onProgress: (d) => { if (d.total > 0) setProgress(Math.round((d.loaded / d.total) * 100)); } });
      const pdf = await task.promise;
      setProgress(100);
      const pageData = [];
      const allItems = [];
      const allFields = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        pageData.push({ index: i - 1, pageNumber: i, rotation: 0 });
        const page = await pdf.getPage(i);
        const tc = await page.getTextContent();
        const vp = page.getViewport({ scale: 1 });
        for (const item of tc.items) {
          if (!item.str.trim()) continue;
          const tf = item.transform;
          allItems.push({
            id: id(), pageIndex: i - 1, originalText: item.str,
            pdfX: tf[4], pdfY: tf[5], pdfWidth: item.width, pdfFontSize: Math.abs(tf[3]),
            pageHeight: vp.height, modified: false, newText: item.str,
            newFont: 'Helvetica', newSize: Math.abs(tf[3]), newBold: false, newItalic: false, newColor: '#000000'
          });
        }
      }
      setPdfFile(file); setPdfDoc(pdf); setPages(pageData); setTextItems(allItems);
      showSnack(`Loaded ${pdf.numPages} page${pdf.numPages > 1 ? 's' : ''}, ${allItems.length} text items`);
    } catch (err) { showSnack('Failed: ' + err.message, 'error'); }
    finally { setLoading(false); setProgress(0); }
  }, []);

  // ---- auto detect components ----
  const detectComponents = useCallback(async () => {
    if (!pdfDoc) return;
    setLoading(true);
    try {
      const forms = [];
      const imgs = [];
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        // detect form fields
        const annots = await page.getAnnotations();
        for (const a of annots) {
          if (a.subtype === 'Widget') {
            forms.push({ id: id(), pageIndex: i - 1, name: a.fieldName || 'Field', value: a.fieldValue || '', type: a.fieldType || 'text', x: a.rect[0], y: a.rect[1], w: a.rect[2] - a.rect[0], h: a.rect[3] - a.rect[1] });
          }
        }
        // detect images via operator list
        try {
          const opList = await page.getOperatorList();
          const vp = page.getViewport({ scale: 1 });
          let imgCount = 0;
          for (let j = 0; j < opList.fnArray.length; j++) {
            const fn = opList.fnArray[j];
            if (fn === pdfjsLib.OPS.paintImageXObject || fn === pdfjsLib.OPS.paintJpegXObject || fn === pdfjsLib.OPS.paintImageMaskXObject) {
              const args = opList.argsArray[j];
              if (args && args.length >= 2) {
                imgCount++;
                if (imgCount <= 20) {
                  imgs.push({ id: id(), pageIndex: i - 1, x: 0, y: vp.height - 50, w: 50, h: 50, detected: true });
                }
              }
            }
          }
        } catch (_) { /* skip image detection errors */ }
      }
      setDetectedForms(forms);
      setDetectedImages(imgs);
      showSnack(`Detected ${textItems.length} text items, ${forms.length} form fields, ${imgs.length} images`);
    } catch (err) {
      showSnack('Detection failed: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [pdfDoc, textItems.length]);

  // ---- page rendering ----
  const renderPage = useCallback(async (pdf, pageIndex, canvas, rotation = 0) => {
    if (!canvas || !pdf) return;
    const page = await pdf.getPage(pageIndex + 1);
    const vp = page.getViewport({ scale: pageScale, rotation });
    const ctx = canvas.getContext('2d');
    canvas.width = vp.width; canvas.height = vp.height;
    canvas.dataset.pageHeight = vp.height; canvas.dataset.pageWidth = vp.width;
    await page.render({ canvasContext: ctx, viewport: vp }).promise;
  }, [pageScale]);

  useEffect(() => {
    if (!pdfDoc) return;
    Object.keys(canvasRefs.current).forEach((k) => { const c = canvasRefs.current[k]; if (c) renderPage(pdfDoc, parseInt(k), c); });
  }, [pdfDoc, pages, pageScale, renderPage, activePage]);

  const renderThumb = useCallback(async (pdf, pageIndex, canvas) => {
    if (!canvas || !pdf) return;
    const page = await pdf.getPage(pageIndex + 1);
    const vp = page.getViewport({ scale: 0.2 });
    const ctx = canvas.getContext('2d');
    canvas.width = vp.width; canvas.height = vp.height;
    await page.render({ canvasContext: ctx, viewport: vp }).promise;
  }, []);

  useEffect(() => {
    if (!pdfDoc) return;
    Object.keys(thumbRefs.current).forEach((k) => { const c = thumbRefs.current[k]; if (c) renderThumb(pdfDoc, parseInt(k), c); });
  }, [pdfDoc, renderThumb]);

  // keep activePage in bounds
  useEffect(() => {
    if (activePage >= pages.length && pages.length > 0) setActivePage(pages.length - 1);
  }, [pages.length]);

  // ---- coordinate helpers ----
  const getScreenDims = useCallback((pageIndex, pdfX, pdfY, pdfW, pdfH) => {
    const c = canvasRefs.current[pageIndex];
    if (!c) return { left: 0, top: 0, width: 100, height: 20 };
    const ch = parseFloat(c.dataset.pageHeight) || c.height;
    return { left: pdfX * pageScale, top: ch - (pdfY + pdfH) * pageScale, width: pdfW * pageScale, height: pdfH * pageScale };
  }, [pageScale]);

  const screenToPdf = useCallback((pageIndex, sx, sy) => {
    const c = canvasRefs.current[pageIndex];
    if (!c) return { x: 0, y: 0 };
    const ch = parseFloat(c.dataset.pageHeight) || c.height;
    return { x: sx / pageScale, y: (ch - sy) / pageScale };
  }, [pageScale]);

  // ---- tool handlers ----
  const handleFileUpload = (e) => { const f = e.target.files[0]; if (f) loadPdf(f); };

  const shapePageRef = useRef(null);

  const handlePageMouseDown = (e, pageIndex) => {
    if (tool === 'addShape') {
      const rect = e.currentTarget.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      shapeStartRef.current = { x: sx, y: sy, pageIndex };
      shapePageRef.current = pageIndex;
      const { x: pdfX, y: pdfY } = screenToPdf(pageIndex, sx, sy);
      setDrawingShape({ id: id(), pageIndex, type: shapeType, x: pdfX, y: pdfY, w: 0, h: 0, fillColor, strokeColor, strokeWidth });
      const onMove = (ev) => {
        const pi = shapePageRef.current;
        if (pi === null) return;
        const cvs = canvasRefs.current[pi];
        if (!cvs) return;
        const r = cvs.getBoundingClientRect();
        const csx = ev.clientX - r.left;
        const csy = ev.clientY - r.top;
        const start = shapeStartRef.current;
        if (!start) return;
        const { x: pX, y: pY } = screenToPdf(pi, start.x, start.y);
        const { x: cX, y: cY } = screenToPdf(pi, csx, csy);
        setDrawingShape((prev) => prev ? { ...prev, x: Math.min(pX, cX), y: Math.min(pY, cY), w: Math.abs(cX - pX), h: Math.abs(cY - pY) } : prev);
      };
      const onUp = () => {
        const pi = shapePageRef.current;
        if (pi !== null && drawingShape) {
          if (drawingShape.w > 2 || drawingShape.h > 2) {
            if (drawingShape.type === 'line') {
              setShapes((prev) => [...prev, { ...drawingShape, x1: shapeStartRef.current?.x ? screenToPdf(pi, shapeStartRef.current.x, shapeStartRef.current.y).x : 0, y1: shapeStartRef.current?.y ? screenToPdf(pi, shapeStartRef.current.x, shapeStartRef.current.y).y : 0, x2: drawingShape.x + drawingShape.w, y2: drawingShape.y + drawingShape.h }]);
            } else {
              setShapes((prev) => [...prev, { ...drawingShape, x: drawingShape.x, y: drawingShape.y, w: Math.max(drawingShape.w, 5), h: Math.max(drawingShape.h, 5) }]);
            }
          }
        }
        setDrawingShape(null); shapeStartRef.current = null; shapePageRef.current = null;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    }
  };

  const handlePageClick = async (e, pageIndex) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const { x: pdfX, y: pdfY } = screenToPdf(pageIndex, sx, sy);

    if (tool === 'addText') {
      setFreeTexts((prev) => [...prev, { id: id(), pageIndex, x: pdfX, y: pdfY, text: 'New text', font: annFont, size: annSize, bold: annBold, italic: annItalic, color: annColor }]);
      setTool('select');
    } else if (tool === 'addNote') {
      setNotes((prev) => [...prev, { id: id(), pageIndex, x: pdfX, y: pdfY, text: 'Note text' }]);
      setTool('select');
    } else if (tool === 'addImage' && pendingImage) {
      const img = new Image();
      img.onload = () => {
        const w = img.naturalWidth / 72; // points
        const h = img.naturalHeight / 72;
        setImages((prev) => [...prev, { id: id(), pageIndex, x: pdfX, y: pdfY, w, h, dataUrl: pendingImage }]);
        setPendingImage(null);
        setTool('select');
      };
      img.src = pendingImage;
    }
  };

  // ---- delete selected element ----
  const deleteSelected = () => {
    if (!selectedId) return;
    const type = selectedId.split('-')[0];
    const numId = parseInt(selectedId.split('-')[1]);
    if (type === 'item') { setTextItems((prev) => prev.filter((t) => t.id !== numId)); }
    else if (type === 'free') { setFreeTexts((prev) => prev.filter((t) => t.id !== numId)); }
    else if (type === 'shape') { setShapes((prev) => prev.filter((s) => s.id !== numId)); }
    else if (type === 'img') { setImages((prev) => prev.filter((i) => i.id !== numId)); }
    else if (type === 'note') { setNotes((prev) => prev.filter((n) => n.id !== numId)); }
    setSelectedId(null);
  };

  // ---- page management ----
  const addPage = () => {
    setPages((prev) => [...prev, { index: prev.length, pageNumber: prev.length + 1, rotation: 0 }]);
  };

  const deletePage = (pageIndex) => {
    setPages((prev) => {
      const next = prev.filter((_, i) => i !== pageIndex);
      if (activePage >= next.length) setActivePage(Math.max(0, next.length - 1));
      return next;
    });
    setTextItems((prev) => prev.filter((t) => t.pageIndex !== pageIndex));
    setFreeTexts((prev) => prev.filter((t) => t.pageIndex !== pageIndex));
    setShapes((prev) => prev.filter((s) => s.pageIndex !== pageIndex));
    setImages((prev) => prev.filter((i) => i.pageIndex !== pageIndex));
    setNotes((prev) => prev.filter((n) => n.pageIndex !== pageIndex));
  };

  // ---- merge ----
  const handleMergeFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const ab = await file.arrayBuffer();
      const pdfToMerge = await PDFDocument.load(ab);
      const pdfMain = await PDFDocument.load(await pdfFile.arrayBuffer());
      const copied = await pdfMain.copyPages(pdfToMerge, pdfToMerge.getPageIndices());
      copied.forEach((p) => pdfMain.addPage(p));
      const mergedBytes = await pdfMain.save();
      const blob = new Blob([mergedBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = pdfFile.name.replace('.pdf', '_merged.pdf'); a.click();
      URL.revokeObjectURL(url);
      showSnack('Merged PDF downloaded');
    } catch (err) { showSnack('Merge failed: ' + err.message, 'error'); }
    setMergeOpen(false);
  };

  // ---- split ----
  const handleSplit = async () => {
    if (!splitRange.trim()) return;
    try {
      const ranges = splitRange.split(',').map((s) => s.trim()).filter(Boolean);
      const indices = [];
      for (const r of ranges) {
        if (r.includes('-')) {
          const [a, b] = r.split('-').map(Number);
          for (let i = a; i <= b; i++) indices.push(i - 1);
        } else { indices.push(parseInt(r) - 1); }
      }
      const pdfMain = await PDFDocument.load(await pdfFile.arrayBuffer());
      const newPdf = await PDFDocument.create();
      const copied = await newPdf.copyPages(pdfMain, indices.filter((i) => i >= 0 && i < pdfMain.getPageCount()));
      copied.forEach((p) => newPdf.addPage(p));
      const bytes = await newPdf.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = pdfFile.name.replace('.pdf', '_split.pdf'); a.click();
      URL.revokeObjectURL(url);
      showSnack('Split PDF downloaded');
    } catch (err) { showSnack('Split failed: ' + err.message, 'error'); }
    setSplitOpen(false);
  };

  // ---- save ----
  const downloadModifiedPdf = async () => {
    if (!pdfFile) return;
    try {
      const ab = await pdfFile.arrayBuffer();
      const pdfDocMod = await PDFDocument.load(ab);
      const pi = pages.map((p) => p.index);
      const allP = pdfDocMod.getPages();
      [...allP.map((_, i) => i).filter((i) => !pi.includes(i)).sort((a, b) => b - a)].forEach((i) => pdfDocMod.removePage(i));
      const rem = pdfDocMod.getPages();

      // white-out + replace modified detected text
      for (const item of textItems) {
        if (!item.modified) continue;
        const pIdx = pages.findIndex((p) => p.index === item.pageIndex);
        if (pIdx === -1 || !rem[pIdx]) continue;
        const pad = 2;
        rem[pIdx].drawRectangle({ x: item.pdfX - pad, y: item.pdfY - item.pdfFontSize * 0.25 - pad, width: item.pdfWidth + pad * 2, height: item.pdfFontSize * 0.9 + pad * 2, color: rgb(1, 1, 1) });
        const fn = await pdfDocMod.embedFont(getPdfLibFont(item.newFont, item.newBold, item.newItalic));
        const [r, g, b] = [parseInt(item.newColor.slice(1, 3), 16) / 255, parseInt(item.newColor.slice(3, 5), 16) / 255, parseInt(item.newColor.slice(5, 7), 16) / 255];
        rem[pIdx].drawText(item.newText, { x: item.pdfX, y: item.pdfY, size: item.newSize, font: fn, color: rgb(r, g, b) });
      }

      // free text
      for (const ft of freeTexts) {
        const pIdx = pages.findIndex((p) => p.index === ft.pageIndex);
        if (pIdx === -1 || !rem[pIdx]) continue;
        const fn = await pdfDocMod.embedFont(getPdfLibFont(ft.font, ft.bold, ft.italic));
        const [r, g, b] = [parseInt(ft.color.slice(1, 3), 16) / 255, parseInt(ft.color.slice(3, 5), 16) / 255, parseInt(ft.color.slice(5, 7), 16) / 255];
        rem[pIdx].drawText(ft.text, { x: ft.x, y: ft.y, size: ft.size, font: fn, color: rgb(r, g, b) });
      }

      // shapes
      for (const sh of shapes) {
        const pIdx = pages.findIndex((p) => p.index === sh.pageIndex);
        if (pIdx === -1 || !rem[pIdx]) continue;
        const [fr, fg, fb] = [parseInt(sh.fillColor.slice(1, 3), 16) / 255, parseInt(sh.fillColor.slice(3, 5), 16) / 255, parseInt(sh.fillColor.slice(5, 7), 16) / 255];
        const [sr, sg, sb] = [parseInt(sh.strokeColor.slice(1, 3), 16) / 255, parseInt(sh.strokeColor.slice(3, 5), 16) / 255, parseInt(sh.strokeColor.slice(5, 7), 16) / 255];
        if (sh.type === 'rectangle') {
          if (sh.fillColor !== '#ffffff' || sh.strokeWidth > 0) rem[pIdx].drawRectangle({ x: sh.x, y: sh.y, width: sh.w, height: sh.h, color: rgb(fr, fg, fb), borderColor: rgb(sr, sg, sb), borderWidth: sh.strokeWidth });
        } else if (sh.type === 'circle') {
          rem[pIdx].drawEllipse({ x: sh.x + sh.w / 2, y: sh.y + sh.h / 2, xScale: sh.w / 2, yScale: sh.h / 2, color: rgb(fr, fg, fb), borderColor: rgb(sr, sg, sb), borderWidth: sh.strokeWidth });
        } else if (sh.type === 'line') {
          rem[pIdx].drawLine({ start: { x: sh.x1, y: sh.y1 }, end: { x: sh.x2, y: sh.y2 }, color: rgb(sr, sg, sb), thickness: sh.strokeWidth || 2 });
        }
      }

      // images
      for (const img of images) {
        const pIdx = pages.findIndex((p) => p.index === img.pageIndex);
        if (pIdx === -1 || !rem[pIdx]) continue;
        let imgEmbed;
        try {
          if (img.dataUrl.startsWith('data:image/png')) {
            imgEmbed = await pdfDocMod.embedPng(img.dataUrl);
          } else {
            imgEmbed = await pdfDocMod.embedJpg(img.dataUrl);
          }
          rem[pIdx].drawImage(imgEmbed, { x: img.x, y: img.y, width: img.w, height: img.h });
        } catch (_) { /* skip images that fail to embed */ }
      }

      // notes as text annotations
      for (const note of notes) {
        const pIdx = pages.findIndex((p) => p.index === note.pageIndex);
        if (pIdx === -1 || !rem[pIdx]) continue;
        const fn = await pdfDocMod.embedFont(StandardFonts.Helvetica);
        rem[pIdx].drawText('Note: ' + note.text, { x: note.x, y: note.y, size: 10, font: fn, color: rgb(0.8, 0.6, 0) });
      }

      const bytes = await pdfDocMod.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = pdfFile.name.replace('.pdf', '_edited.pdf'); a.click();
      URL.revokeObjectURL(url);
      showSnack('PDF downloaded successfully');
    } catch (err) { showSnack('Failed to save: ' + err.message, 'error'); }
  };

  // ---- drag-and-drop PDF upload ----
  const handleDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setDragging(false); };
  const handleDrop = (e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) loadPdf(f); };

  // ---- render helpers ----
  const getOverlayStyle = (item) => {
    const c = canvasRefs.current[item.pageIndex];
    if (!c) return { left: 0, top: 0, width: 100, height: 20 };
    const ch = parseFloat(c.dataset.pageHeight) || c.height;
    const h = item.size ? item.size * pageScale * 0.75 : 14;
    const w = item.w ? item.w * pageScale : 100;
    return { left: item.x * pageScale, top: ch - (item.y + (item.h || item.size || 10)) * pageScale, width: w, height: Math.max(h, 14) };
  };

  const uidToStr = (prefix, n) => `${prefix}-${n}`;

  const selectableId = (prefix, n) => selectedId === `${prefix}-${n}`;

  // update selected element style from toolbar
  const applyStyleToSelected = () => {
    if (!selectedId) return;
    const [pref, num] = selectedId.split('-');
    const n = parseInt(num);
    if (pref === 'free') setFreeTexts((prev) => prev.map((t) => t.id === n ? { ...t, font: annFont, size: annSize, bold: annBold, italic: annItalic, color: annColor } : t));
    else if (pref === 'item') setTextItems((prev) => prev.map((t) => t.id === n ? { ...t, newFont: annFont, newSize: annSize, newBold: annBold, newItalic: annItalic, newColor: annColor, modified: true } : t));
  };

  const modifiedCount = textItems.filter((t) => t.modified).length;

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
      <Grid container spacing={3}>
        <Grid size={12}>
          <MainCard title={pdfFile ? `PDF Editor — ${pdfFile.name}` : 'PDF Editor'} sx={{ '& .MuiCardContent-root': { p: { xs: 2, md: 3 } } }}>
            <Stack spacing={3}>
              {/* ---- Top bar ---- */}
              <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
                <Button variant="contained" component="label" startIcon={<CloudUploadOutlined />} size="small" disabled={loading}>
                  {pdfFile ? 'Replace' : 'Upload PDF'}
                  <input type="file" accept=".pdf" hidden onChange={handleFileUpload} />
                </Button>
                {pdfFile && !loading && (
                  <>
                    <Chip icon={<FilePdfOutlined />} label={formatSize(pdfFile.size)} variant="outlined" size="small" />
                    <Button size="small" variant="contained" color="primary" startIcon={<DownloadOutlined />} onClick={downloadModifiedPdf}>Download</Button>
                    {modifiedCount > 0 && <Chip label={`${modifiedCount} modified`} color="warning" size="small" />}
                    <Divider orientation="vertical" flexItem />
                    <Tooltip title="Add blank page"><IconButton size="small" onClick={addPage}><PlusOutlined /></IconButton></Tooltip>
                    <Tooltip title="Merge PDF"><IconButton size="small" onClick={() => setMergeOpen(true)}><MergeCellsOutlined /></IconButton></Tooltip>
                    <Tooltip title="Split PDF"><IconButton size="small" onClick={() => setSplitOpen(true)}><ScissorOutlined /></IconButton></Tooltip>
                    <Divider orientation="vertical" flexItem />
                    <Tooltip title="Auto-detect components (text, forms, images)">
                      <Button size="small" variant="outlined" startIcon={<RadarChartOutlined />} onClick={detectComponents} disabled={loading}>Detect</Button>
                    </Tooltip>
                  </>
                )}
                {pages.length > 0 && !loading && (
                  <Stack direction="row" alignItems="center" spacing={0.5} sx={{ ml: 'auto' }}>
                    <Typography variant="caption" color="text.secondary">Zoom:</Typography>
                    <Select size="small" value={pageScale} onChange={(e) => setPageScale(parseFloat(e.target.value))} sx={{ height: 28, fontSize: '0.7rem', minWidth: 60 }}>
                      {[0.5, 0.75, 1, 1.2, 1.5, 2].map((s) => (<MenuItem key={s} value={s}>{Math.round(s * 100)}%</MenuItem>))}
                    </Select>
                  </Stack>
                )}
              </Stack>

              {/* Loading */}
              {loading && (
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Stack spacing={1.5}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <FilePdfOutlined style={{ color: theme.palette.primary.main }} />
                        <Typography variant="body2" fontWeight={600}>{pdfFile?.name || 'Loading...'}</Typography>
                      </Stack>
                      <Typography variant="caption" color="text.secondary">{formatSize(pdfFile?.size)}</Typography>
                    </Stack>
                    <LinearProgress variant="determinate" value={progress} />
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">Processing PDF...</Typography>
                      <Typography variant="caption" fontWeight={600} color="primary">{progress}%</Typography>
                    </Stack>
                  </Stack>
                </Paper>
              )}

              {/* Drop zone */}
              {!pdfFile && !loading && (
                <Paper onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                  sx={{ border: '2px dashed', borderColor: dragging ? 'primary.main' : 'divider', borderRadius: 2, p: 6, textAlign: 'center', bgcolor: dragging ? 'action.hover' : 'transparent', transition: 'all 0.2s', cursor: 'pointer', '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' } }}
                  onClick={() => { const i = document.createElement('input'); i.type = 'file'; i.accept = '.pdf'; i.onchange = (e) => { const f = e.target.files[0]; if (f) loadPdf(f); }; i.click(); }}
                >
                  <Stack alignItems="center" spacing={1.5}>
                    <InboxOutlined style={{ fontSize: 48, color: theme.palette.text.secondary }} />
                    <Typography variant="h6" color="text.secondary">Drag & drop a PDF here</Typography>
                    <Typography variant="body2" color="text.disabled">or click to browse files</Typography>
                  </Stack>
                </Paper>
              )}

              {/* ---- Editor toolbar ---- */}
              {pages.length > 0 && !loading && (
                <>
                  <Paper variant="outlined" sx={{ p: 0.75, overflowX: 'auto' }}>
                    <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                      <Tooltip title="Select / Move">
                        <IconButton size="small" color={tool === 'select' ? 'primary' : 'default'} onClick={() => setTool('select')}><SelectOutlined style={{ fontSize: 16 }} /></IconButton>
                      </Tooltip>
                      <Tooltip title="Edit text in PDF">
                        <IconButton size="small" color={tool === 'editText' ? 'primary' : 'default'} onClick={() => setTool('editText')}><FontSizeOutlined style={{ fontSize: 16 }} /></IconButton>
                      </Tooltip>
                      <Tooltip title="Add new text">
                        <IconButton size="small" color={tool === 'addText' ? 'primary' : 'default'} onClick={() => setTool('addText')}><EditOutlined style={{ fontSize: 16 }} /></IconButton>
                      </Tooltip>
                      <Tooltip title="Add image">
                        <IconButton size="small" color={tool === 'addImage' ? 'primary' : 'default'}
                          onClick={() => {
                            setTool('addImage');
                            const i = document.createElement('input');
                            i.type = 'file'; i.accept = 'image/png,image/jpeg';
                            i.onchange = (e) => {
                              const f = e.target.files[0];
                              if (f) {
                                const reader = new FileReader();
                                reader.onload = (ev) => setPendingImage(ev.target.result);
                                reader.readAsDataURL(f);
                              }
                            };
                            i.click();
                          }}
                        ><PictureOutlined style={{ fontSize: 16 }} /></IconButton>
                      </Tooltip>
                      <Tooltip title="Draw shape">
                        <IconButton size="small" color={tool === 'addShape' ? 'primary' : 'default'} onClick={() => setTool(tool === 'addShape' ? 'select' : 'addShape')}><BorderOutlined style={{ fontSize: 16 }} /></IconButton>
                      </Tooltip>
                      {tool === 'addShape' && (
                        <Select size="small" value={shapeType} onChange={(e) => setShapeType(e.target.value)} sx={{ height: 28, fontSize: '0.7rem', minWidth: 80 }}>
                          <MenuItem value="rectangle">Rectangle</MenuItem>
                          <MenuItem value="circle">Circle</MenuItem>
                          <MenuItem value="line">Line</MenuItem>
                        </Select>
                      )}
                      <Tooltip title="Add note annotation">
                        <IconButton size="small" color={tool === 'addNote' ? 'primary' : 'default'} onClick={() => setTool('addNote')}><PushpinOutlined style={{ fontSize: 16 }} /></IconButton>
                      </Tooltip>

                      <Divider orientation="vertical" flexItem />

                      {selectedId && selectedId.startsWith('free-') && (
                        <>
                          <Select size="small" value={annFont} onChange={(e) => { setAnnFont(e.target.value); setTimeout(applyStyleToSelected, 0); }} sx={{ height: 28, fontSize: '0.7rem', minWidth: 80 }}>
                            {FONT_OPTIONS.map((f) => (<MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>))}
                          </Select>
                          <TextField size="small" type="number" value={annSize} onChange={(e) => { setAnnSize(Math.max(4, Math.min(200, parseInt(e.target.value) || 12))); setTimeout(applyStyleToSelected, 0); }} sx={{ width: 50, '& input': { fontSize: '0.7rem', py: 0.25, textAlign: 'center' } }} inputProps={{ min: 4, max: 200 }} />
                          <IconButton size="small" onClick={() => { setAnnBold((b) => !b); setTimeout(applyStyleToSelected, 0); }} color={annBold ? 'primary' : 'default'}><BoldOutlined style={{ fontSize: 13 }} /></IconButton>
                          <IconButton size="small" onClick={() => { setAnnItalic((b) => !b); setTimeout(applyStyleToSelected, 0); }} color={annItalic ? 'primary' : 'default'}><ItalicOutlined style={{ fontSize: 13 }} /></IconButton>
                          <input type="color" value={annColor} onChange={(e) => { setAnnColor(e.target.value); setTimeout(applyStyleToSelected, 0); }} style={{ width: 26, height: 26, padding: 0, border: 'none', cursor: 'pointer', background: 'transparent' }} />
                        </>
                      )}

                      {(tool === 'addShape' || (selectedId && selectedId.startsWith('shape-'))) && (
                        <>
                          <input type="color" value={fillColor} onChange={(e) => setFillColor(e.target.value)} style={{ width: 26, height: 26, padding: 0, border: 'none', cursor: 'pointer', background: 'transparent' }} title="Fill color" />
                          <input type="color" value={strokeColor} onChange={(e) => setStrokeColor(e.target.value)} style={{ width: 26, height: 26, padding: 0, border: 'none', cursor: 'pointer', background: 'transparent' }} title="Stroke color" />
                          <TextField size="small" type="number" value={strokeWidth} onChange={(e) => setStrokeWidth(Math.max(0, parseInt(e.target.value) || 0))} sx={{ width: 40, '& input': { fontSize: '0.7rem', py: 0.25, textAlign: 'center' } }} inputProps={{ min: 0, max: 20 }} label="" />
                        </>
                      )}

                      <Divider orientation="vertical" flexItem />

                      {selectedId && (
                        <Button size="small" color="error" variant="outlined" startIcon={<DeleteOutlined />} onClick={deleteSelected}>Delete</Button>
                      )}

                      <Box sx={{ ml: 'auto' }}>
                        <Typography variant="caption" color="text.secondary">
                          {tool === 'select' && 'Select elements to edit or delete'}
                          {tool === 'editText' && 'Click detected text to modify it'}
                          {tool === 'addText' && 'Click on a page to place new text'}
                          {tool === 'addImage' && 'Click on a page to place image'}
                          {tool === 'addShape' && 'Drag on a page to draw'}
                          {tool === 'addNote' && 'Click on a page to add note'}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>

                  {/* ---- Workspace ---- */}
                  <Box sx={{ display: 'flex', gap: 2, minHeight: 400, width: '100%' }}>
                    {/* Main pages area */}
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2, bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.100', borderRadius: 2, overflowX: 'auto', minWidth: 0 }}>
                      {/* Page nav bar */}
                      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2, width: '100%', justifyContent: 'center' }}>
                        <IconButton size="small" onClick={() => setActivePage((prev) => Math.max(0, prev - 1))} disabled={activePage === 0}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
                        </IconButton>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ minWidth: 80, textAlign: 'center' }}>
                          Page {activePage + 1} of {pages.length}
                        </Typography>
                        <IconButton size="small" onClick={() => setActivePage((prev) => Math.min(pages.length - 1, prev + 1))} disabled={activePage >= pages.length - 1}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/></svg>
                        </IconButton>
                      </Stack>
                      {pages.filter((p) => p.index === activePage).map((page) => (
                        <Box key={page.index} sx={{ position: 'relative', boxShadow: 3, borderRadius: 1, overflow: 'hidden', bgcolor: 'background.paper', maxWidth: '100%' }}
                          onMouseDown={(e) => handlePageMouseDown(e, page.index)}
                          onClick={(e) => handlePageClick(e, page.index)}
                      >
                        <canvas ref={(el) => { canvasRefs.current[page.index] = el; }} style={{ display: 'block', maxWidth: '100%', height: 'auto', pointerEvents: tool === 'addShape' ? 'none' : 'auto' }} />
                        {/* Overlay for elements */}
                        <Box ref={(el) => { overlayRefs.current[page.index] = el; }}
                          sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: tool === 'select' || tool === 'editText' || tool === 'addShape' ? 'auto' : 'none' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Detected text (only interactive in editText mode) */}
                          {textItems.filter((t) => t.pageIndex === page.index).map((item) => {
                            const isEditing = editingId === item.id;
                            const dim = getScreenDims(page.index, item.pdfX, item.pdfY, item.pdfWidth, item.pdfFontSize);
                            return (
                              <Box key={item.id}
                                onClick={(e) => { if (tool === 'editText') { e.stopPropagation(); setSelectedId(uidToStr('item', item.id)); } }}
                                onDoubleClick={() => { if (tool === 'editText') { setEditingId(item.id); setEditValue(item.newText); } }}
                                sx={{ position: 'absolute', left: dim.left, top: dim.top, minWidth: Math.max(dim.width, 20), minHeight: Math.max(dim.height, 10), cursor: tool === 'editText' ? 'pointer' : 'default', outline: selectableId('item', item.id) ? '2px solid ' + theme.palette.primary.main : '1px solid transparent', outlineOffset: 1, borderRadius: '2px', bgcolor: isEditing ? 'rgba(255,255,255,0.9)' : 'transparent', '&:hover': tool === 'editText' ? { outline: '1px solid ' + theme.palette.primary.light } : {}, zIndex: isEditing ? 10 : 1, fontSize: item.pdfFontSize * pageScale * 0.75, lineHeight: 1, color: item.modified ? item.newColor : 'transparent', pointerEvents: tool === 'editText' ? 'auto' : 'none' }}
                              >
                                {isEditing ? (
                                  <textarea autoFocus value={editValue} onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={() => { setTextItems((prev) => prev.map((t) => t.id === item.id ? { ...t, newText: editValue, modified: editValue !== t.originalText } : t)); setEditingId(null); }}
                                    onKeyDown={(e) => { if (e.key === 'Escape') setEditingId(null); if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); setTextItems((prev) => prev.map((t) => t.id === item.id ? { ...t, newText: editValue, modified: editValue !== t.originalText } : t)); setEditingId(null); } }}
                                    style={{ width: Math.max(dim.width, 60), minHeight: dim.height, fontSize: item.newSize * pageScale * 0.75, fontWeight: item.newBold ? 'bold' : 'normal', fontStyle: item.newItalic ? 'italic' : 'normal', fontFamily: item.newFont === 'TimesRoman' ? '"Times New Roman", Times, serif' : item.newFont === 'Courier' ? 'Courier New, Courier, monospace' : 'Helvetica, Arial, sans-serif', color: item.newColor, background: 'rgba(255,255,255,0.9)', border: '1px solid ' + theme.palette.primary.main, outline: 'none', resize: 'both', padding: '1px 2px', lineHeight: 1.2 }}
                                  />
                                ) : item.modified ? (
                                  <Typography sx={{ fontSize: item.newSize * pageScale * 0.75, fontWeight: item.newBold ? 'bold' : 'normal', fontStyle: item.newItalic ? 'italic' : 'normal', fontFamily: item.newFont === 'TimesRoman' ? '"Times New Roman", Times, serif' : item.newFont === 'Courier' ? 'Courier New, Courier, monospace' : 'Helvetica, Arial, sans-serif', color: item.newColor, whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.1, userSelect: 'none' }}>{item.newText}</Typography>
                                ) : null}
                              </Box>
                            );
                          })}

                          {/* Free text annotations */}
                          {freeTexts.filter((t) => t.pageIndex === page.index).map((ft) => {
                            const style = getOverlayStyle(ft);
                            return (
                              <Box key={ft.id} onClick={(e) => { e.stopPropagation(); setSelectedId(uidToStr('free', ft.id)); }}
                                sx={{ position: 'absolute', left: style.left, top: style.top, cursor: 'move', outline: selectableId('free', ft.id) ? '2px solid ' + theme.palette.primary.main : '1px solid transparent', borderRadius: '2px', bgcolor: 'rgba(255,255,255,0.6)', p: '1px 2px', '&:hover': { outline: '1px solid ' + theme.palette.primary.light }, userSelect: 'none' }}
                              >
                                <Typography sx={{ fontSize: ft.size * pageScale * 0.75, fontWeight: ft.bold ? 'bold' : 'normal', fontStyle: ft.italic ? 'italic' : 'normal', fontFamily: ft.font === 'TimesRoman' ? '"Times New Roman", Times, serif' : ft.font === 'Courier' ? 'Courier New, Courier, monospace' : 'Helvetica, Arial, sans-serif', color: ft.color, lineHeight: 1.1 }}>{ft.text}</Typography>
                              </Box>
                            );
                          })}

                          {/* Shapes */}
                          {shapes.filter((s) => s.pageIndex === page.index).map((sh) => {
                            const st = getOverlayStyle(sh);
                            return (
                              <Box key={sh.id} onClick={(e) => { e.stopPropagation(); setSelectedId(uidToStr('shape', sh.id)); }}
                                sx={{ position: 'absolute', left: st.left, top: st.top, width: st.width, height: st.height, pointerEvents: 'auto', outline: selectableId('shape', sh.id) ? '2px solid ' + theme.palette.primary.main : '1px solid transparent', borderRadius: sh.type === 'circle' ? '50%' : '2px', bgcolor: sh.fillColor, border: sh.strokeWidth > 0 ? `${sh.strokeWidth}px solid ${sh.strokeColor}` : 'none' }}
                              />
                            );
                          })}

                          {/* Images */}
                          {images.filter((im) => im.pageIndex === page.index).map((im) => {
                            const st = getOverlayStyle(im);
                            return (
                              <Box key={im.id} onClick={(e) => { e.stopPropagation(); setSelectedId(uidToStr('img', im.id)); }}
                                sx={{ position: 'absolute', left: st.left, top: st.top, width: st.width, height: st.height, pointerEvents: 'auto', outline: selectableId('img', im.id) ? '2px solid ' + theme.palette.primary.main : '1px solid transparent', backgroundImage: `url(${im.dataUrl})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat' }}
                              />
                            );
                          })}

                          {/* Notes */}
                          {notes.filter((n) => n.pageIndex === page.index).map((n) => {
                            const st = getOverlayStyle(n);
                            return (
                              <Box key={n.id} onClick={(e) => { e.stopPropagation(); setSelectedId(uidToStr('note', n.id)); }}
                                sx={{ position: 'absolute', left: st.left, top: st.top - 20, width: 18, height: 18, bgcolor: '#ffd700', borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)', cursor: 'pointer', outline: selectableId('note', n.id) ? '2px solid ' + theme.palette.primary.main : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                <Typography sx={{ fontSize: 8, transform: 'rotate(45deg)', fontWeight: 'bold', color: '#000' }}>i</Typography>
                              </Box>
                            );
                          })}

                          {/* Drawing shape preview */}
                          {drawingShape && drawingShape.pageIndex === page.index && (
                            <Box sx={{ position: 'absolute', left: drawingShape.x * pageScale, top: (() => { const c = canvasRefs.current[page.index]; const ch = c ? parseFloat(c.dataset.pageHeight) || c.height : 0; return ch - (drawingShape.y + drawingShape.h) * pageScale; })(), width: Math.max(drawingShape.w * pageScale, 2), height: Math.max(drawingShape.h * pageScale, 2), border: `2px dashed ${theme.palette.primary.main}`, borderRadius: drawingShape.type === 'circle' ? '50%' : '2px', pointerEvents: 'none' }} />
                          )}

                          {/* Detected form fields */}
                          {detectedForms.filter((f) => f.pageIndex === page.index).map((f) => (
                            <Box key={f.id}
                              sx={{ position: 'absolute', left: f.x * pageScale, top: (() => { const c = canvasRefs.current[page.index]; const ch = c ? parseFloat(c.dataset.pageHeight) || c.height : 0; return ch - (f.y + f.h) * pageScale; })(), width: f.w * pageScale, height: f.h * pageScale, border: '2px dashed ' + theme.palette.warning.main, borderRadius: 1, bgcolor: 'rgba(255,152,0,0.1)', pointerEvents: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Typography variant="caption" sx={{ fontSize: '0.55rem', color: theme.palette.warning.main, textAlign: 'center', lineHeight: 1.1, overflow: 'hidden' }}>{f.name}</Typography>
                            </Box>
                          ))}

                          {/* Detected images */}
                          {detectedImages.filter((im) => im.pageIndex === page.index).map((im) => (
                            <Box key={im.id}
                              sx={{ position: 'absolute', left: im.x * pageScale, top: (() => { const c = canvasRefs.current[page.index]; const ch = c ? parseFloat(c.dataset.pageHeight) || c.height : 0; return ch - (im.y + im.h) * pageScale; })(), width: im.w * pageScale, height: im.h * pageScale, border: '2px dashed ' + theme.palette.info.main, borderRadius: 1, bgcolor: 'rgba(33,150,243,0.08)', pointerEvents: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <PictureOutlined style={{ fontSize: 14, color: theme.palette.info.main }} />
                            </Box>
                          ))}

                          {/* Page delete button */}
                          <IconButton size="small" color="error" onClick={() => deletePage(page.index)}
                            sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(255,255,255,0.7)', '&:hover': { bgcolor: 'rgba(255,255,255,0.9)', opacity: 1 }, zIndex: 20, opacity: 0.6 }}
                          ><DeleteOutlined style={{ fontSize: 14 }} /></IconButton>
                        </Box>
                      </Box>
                    ))}
                  </Box>

                  {/* ---- Thumbnail sidebar ---- */}
                  <Paper variant="outlined" sx={{ width: 140, flexShrink: 0, p: 1, overflowY: 'auto', maxHeight: 600, borderRadius: 2, display: { xs: 'none', md: 'block' } }}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 1, textAlign: 'center' }}>Pages</Typography>
                    {pages.map((page) => (
                      <Box
                        key={page.index}
                        onClick={() => setActivePage(page.index)}
                        sx={{
                          mb: 1, cursor: 'pointer', borderRadius: 1, overflow: 'hidden',
                          border: '2px solid',
                          borderColor: activePage === page.index ? 'primary.main' : 'divider',
                          opacity: activePage === page.index ? 1 : 0.55,
                          transition: 'all 0.15s',
                          bgcolor: activePage === page.index ? 'action.selected' : 'transparent',
                          '&:hover': { opacity: 1, borderColor: 'primary.light' }
                        }}
                        ref={(el) => {
                          if (el && activePage === page.index) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                          }
                        }}
                      >
                        <canvas ref={(el) => { thumbRefs.current[page.index] = el; }} style={{ display: 'block', width: '100%', height: 'auto' }} />
                        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', py: 0.25, fontSize: '0.6rem', bgcolor: activePage === page.index ? 'primary.main' : 'transparent', color: activePage === page.index ? 'primary.contrastText' : 'text.secondary' }}>
                          {page.pageNumber}
                        </Typography>
                      </Box>
                    ))}
                    <Button fullWidth size="small" variant="outlined" startIcon={<PlusOutlined />} onClick={addPage} sx={{ mt: 1, fontSize: '0.65rem' }}>Add</Button>
                  </Paper>
                </Box>
                </>
              )}
            </Stack>
          </MainCard>
        </Grid>
      </Grid>

      {/* Merge dialog */}
      <Dialog open={mergeOpen} onClose={() => setMergeOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Merge PDF</DialogTitle>
        <DialogContent><Typography variant="body2" sx={{ mt: 1 }}>Select a PDF to merge into the current document. All pages from the selected file will be appended.</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setMergeOpen(false)}>Cancel</Button>
          <Button variant="contained" component="label" startIcon={<CloudUploadOutlined />}>Select PDF<input type="file" accept=".pdf" hidden onChange={handleMergeFile} /></Button>
        </DialogActions>
      </Dialog>

      {/* Split dialog */}
      <Dialog open={splitOpen} onClose={() => setSplitOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Split PDF</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>Enter page numbers or ranges to extract (e.g. <code>1-3, 5, 7-9</code>).</Typography>
          <TextField fullWidth size="small" placeholder="1-3, 5, 7-9" value={splitRange} onChange={(e) => setSplitRange(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSplitOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSplit} disabled={!splitRange.trim()}>Split</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackOpen} autoHideDuration={3000} onClose={() => setSnackOpen(false)}>
        <Alert severity={snackSeverity} onClose={() => setSnackOpen(false)} variant="filled">{snackMsg}</Alert>
      </Snackbar>
    </Box>
  );
}
