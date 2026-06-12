import { useState, useCallback, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';

// vite worker import
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// material-ui
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

// icons
import { FilePdfOutlined, DeleteOutlined, ReloadOutlined, DownloadOutlined, CloudUploadOutlined, InboxOutlined } from '@ant-design/icons';

// project imports
import MainCard from 'components/MainCard';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

function formatSize(bytes) {
  if (!bytes) return 'unknown';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

export default function PdfEditor() {
  const theme = useTheme();
  const canvasRefs = useRef([]);
  const dropRef = useRef(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');
  const [snackSeverity, setSnackSeverity] = useState('success');

  const showSnack = (msg, severity = 'success') => {
    setSnackMsg(msg);
    setSnackSeverity(severity);
    setSnackOpen(true);
  };

  const loadPdf = useCallback(async (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      showSnack('Please select a valid PDF file', 'error');
      return;
    }
    setLoading(true);
    setProgress(0);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        onProgress: (data) => {
          if (data.total > 0) {
            setProgress(Math.round((data.loaded / data.total) * 100));
          }
        }
      });
      const pdf = await loadingTask.promise;
      setProgress(100);
      const pageData = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        pageData.push({ index: i - 1, pageNumber: i, rotation: 0 });
      }
      setPdfFile(file);
      setPdfDoc(pdf);
      setPages(pageData);
      showSnack(`Loaded ${pdf.numPages} page${pdf.numPages > 1 ? 's' : ''}`);
    } catch (err) {
      showSnack('Failed to load PDF: ' + err.message, 'error');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  }, []);

  const renderPage = useCallback(async (pdf, pageIndex, canvas, rotation = 0) => {
    if (!canvas || !pdf) return;
    const page = await pdf.getPage(pageIndex + 1);
    const viewport = page.getViewport({ scale: 0.5, rotation });
    const ctx = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: ctx, viewport }).promise;
  }, []);

  useEffect(() => {
    if (!pdfDoc) return;
    canvasRefs.current.forEach((canvas, i) => {
      if (canvas) renderPage(pdfDoc, i, canvas, pages[i]?.rotation || 0);
    });
  }, [pdfDoc, pages, renderPage]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) loadPdf(file);
  };

  const rotatePage = (pageIndex) => {
    setPages((prev) => prev.map((p, i) => (i === pageIndex ? { ...p, rotation: p.rotation + 90 } : p)));
  };

  const deletePage = (pageIndex) => {
    setPages((prev) => prev.filter((_, i) => i !== pageIndex));
  };

  const downloadModifiedPdf = async () => {
    if (!pdfFile) return;
    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfDocMod = await PDFDocument.load(arrayBuffer);
      const pageIndices = pages.map((p) => p.index);
      const allPages = pdfDocMod.getPages();
      const pagesToRemove = allPages
        .map((_, i) => i)
        .filter((i) => !pageIndices.includes(i))
        .sort((a, b) => b - a);
      for (const idx of pagesToRemove) {
        pdfDocMod.removePage(idx);
      }
      const remaining = pdfDocMod.getPages();
      for (const p of pages) {
        const idx = pageIndices.indexOf(p.index);
        if (idx !== -1 && p.rotation !== 0) {
          remaining[idx].setRotation(p.rotation);
        }
      }
      const pdfBytes = await pdfDocMod.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = pdfFile.name.replace('.pdf', '_edited.pdf');
      a.click();
      URL.revokeObjectURL(url);
      showSnack('PDF downloaded successfully');
    } catch (err) {
      showSnack('Failed to save PDF: ' + err.message, 'error');
    }
  };

  // drag-and-drop
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) loadPdf(file);
  };

  return (
    <Grid container spacing={3}>
      <Grid size={12}>
        <MainCard title="PDF Editor">
          <Stack spacing={3}>
            {/* Upload controls */}
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
              <Button variant="contained" component="label" startIcon={<CloudUploadOutlined />} disabled={loading}>
                {pdfFile ? 'Replace PDF' : 'Upload PDF'}
                <input type="file" accept=".pdf" hidden onChange={handleFileUpload} />
              </Button>
              {pdfFile && !loading && (
                <Chip icon={<FilePdfOutlined />} label={`${pdfFile.name} (${formatSize(pdfFile.size)})`} variant="outlined" />
              )}
              {pages.length > 0 && !loading && (
                <Button variant="contained" color="primary" startIcon={<DownloadOutlined />} onClick={downloadModifiedPdf}>
                  Download Edited PDF
                </Button>
              )}
            </Stack>

            {/* Loading progress */}
            {loading && (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={1.5}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <FilePdfOutlined style={{ color: theme.palette.primary.main }} />
                      <Typography variant="body2" fontWeight={600}>
                        {pdfFile?.name || 'Loading PDF...'}
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {formatSize(pdfFile?.size)}
                    </Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={progress} />
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">
                      Processing PDF...
                    </Typography>
                    <Typography variant="caption" fontWeight={600} color="primary">
                      {progress}%
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>
            )}

            {/* Drop zone */}
            {!pdfFile && !loading && (
              <Paper
                ref={dropRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                sx={{
                  border: '2px dashed',
                  borderColor: dragging ? 'primary.main' : 'divider',
                  borderRadius: 2,
                  p: 6,
                  textAlign: 'center',
                  bgcolor: dragging ? 'action.hover' : 'transparent',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                  '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' }
                }}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.pdf';
                  input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) loadPdf(file);
                  };
                  input.click();
                }}
              >
                <Stack alignItems="center" spacing={1.5}>
                  <InboxOutlined style={{ fontSize: 48, color: theme.palette.text.secondary }} />
                  <Typography variant="h6" color="text.secondary">
                    Drag & drop a PDF here
                  </Typography>
                  <Typography variant="body2" color="text.disabled">
                    or click to browse files
                  </Typography>
                </Stack>
              </Paper>
            )}

            {/* Pages */}
            {pages.length > 0 && !loading && (
              <>
                <Divider />
                <Typography variant="subtitle1" fontWeight={600}>
                  Pages ({pages.length})
                </Typography>
                <Grid container spacing={2}>
                  {pages.map((page, i) => (
                    <Grid key={i} size={{ xs: 6, sm: 4, md: 3, lg: 2 }}>
                      <Box
                        sx={{
                          border: '1px solid',
                          borderColor: theme.palette.divider,
                          borderRadius: 1,
                          p: 1,
                          textAlign: 'center'
                        }}
                      >
                        <canvas
                          ref={(el) => (canvasRefs.current[i] = el)}
                          style={{ width: '100%', height: 'auto', maxHeight: 200 }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                          Page {page.pageNumber}{page.rotation ? ` (${page.rotation}°)` : ''}
                        </Typography>
                        <Stack direction="row" justifyContent="center" spacing={0.5} sx={{ mt: 0.5 }}>
                          <Tooltip title="Rotate 90°">
                            <IconButton size="small" onClick={() => rotatePage(i)}>
                              <ReloadOutlined style={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete page">
                            <IconButton size="small" color="error" onClick={() => deletePage(i)}>
                              <DeleteOutlined style={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </>
            )}
          </Stack>
        </MainCard>
      </Grid>
      <Snackbar open={snackOpen} autoHideDuration={3000} onClose={() => setSnackOpen(false)}>
        <Alert severity={snackSeverity} onClose={() => setSnackOpen(false)} variant="filled">
          {snackMsg}
        </Alert>
      </Snackbar>
    </Grid>
  );
}
