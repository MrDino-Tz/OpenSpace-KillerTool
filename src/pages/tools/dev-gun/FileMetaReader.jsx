import { useState, useCallback } from 'react';
import * as exifr from 'exifr';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import TableContainer from '@mui/material/TableContainer';
import Button from '@mui/material/Button';

import { FileTextOutlined, DeleteOutlined } from '@ant-design/icons';

import MainCard from 'components/MainCard';

function formatSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatDuration(sec) {
  if (!sec && sec !== 0) return '';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${m}m ${s.toFixed(1)}s`;
  if (m > 0) return `${m}m ${s.toFixed(1)}s`;
  return `${s.toFixed(2)}s`;
}

function prettyKey(k) {
  return k
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .replace(/e ?xif/i, 'EXIF')
    .replace(/i ?so/i, 'ISO')
    .replace(/f ?number/i, 'F Number');
}

function readMp4Dates(buf) {
  const dv = new DataView(buf);
  const len = buf.byteLength;
  let i = 0;
  while (i + 8 <= len) {
    const boxSize = dv.getUint32(i);
    const boxType = String.fromCharCode(dv.getUint8(i + 4), dv.getUint8(i + 5), dv.getUint8(i + 6), dv.getUint8(i + 7));
    if (boxType === 'moov') {
      const moovEnd = boxSize === 0 ? len : i + boxSize;
      let j = i + 8;
      while (j + 8 <= moovEnd) {
        const subSize = dv.getUint32(j);
        const subType = String.fromCharCode(dv.getUint8(j + 4), dv.getUint8(j + 5), dv.getUint8(j + 6), dv.getUint8(j + 7));
        if (subType === 'mvhd') {
          const version = dv.getUint8(j + 8);
          if (version === 0) {
            const ctime = dv.getUint32(j + 12);
            const mtime = dv.getUint32(j + 16);
            const epoch = new Date('1904-01-01T00:00:00Z').getTime();
            return {
              'Created': new Date(epoch + ctime * 1000).toLocaleString(),
              'Modified': new Date(epoch + mtime * 1000).toLocaleString()
            };
          } else {
            const ctime = dv.getUint32(j + 12) * 0x100000000 + dv.getUint32(j + 16);
            const mtime = dv.getUint32(j + 20) * 0x100000000 + dv.getUint32(j + 24);
            const epoch = new Date('1904-01-01T00:00:00Z').getTime();
            return {
              'Created': new Date(epoch + ctime * 1000).toLocaleString(),
              'Modified': new Date(epoch + mtime * 1000).toLocaleString()
            };
          }
        }
        j += subSize === 0 ? 8 : subSize;
      }
    }
    if (boxSize === 0) break;
    i += boxSize;
  }
  return null;
}

const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/tiff', 'image/gif', 'image/bmp', 'image/avif'];

export default function FileMetaReader() {
  const theme = useTheme();
  const [file, setFile] = useState(null);
  const [basicMeta, setBasicMeta] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [mediaMeta, setMediaMeta] = useState(null);
  const [exifData, setExifData] = useState(null);
  const [mp4Dates, setMp4Dates] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const processFile = useCallback(async (f) => {
    setError('');
    setLoading(true);
    setFile(f);
    setExifData(null);
    setMediaMeta(null);
    setMp4Dates(null);
    setPreviewUrl(null);
    setFileType(null);

    const basic = {
      'File Name': f.name,
      'File Size': formatSize(f.size),
      'MIME Type': f.type || 'unknown',
      'Last Modified': new Date(f.lastModified).toLocaleString()
    };
    setBasicMeta(basic);

    const isImage = IMAGE_TYPES.includes(f.type) || f.type.startsWith('image/');
    const isVideo = VIDEO_TYPES.includes(f.type) || f.type.startsWith('video/');
    if (isImage) setFileType('image');
    else if (isVideo) setFileType('video');

    try {
      if (isImage) {
        const img = await new Promise((resolve, reject) => {
          const i = new Image();
          i.onload = () => resolve(i);
          i.onerror = () => reject(new Error('Failed to decode image'));
          i.src = URL.createObjectURL(f);
        });
        setMediaMeta({ Width: img.naturalWidth, Height: img.naturalHeight });
        setPreviewUrl(img.src);

        const exif = await exifr.parse(f, { tiff: true, xmp: false, iptc: false, jfif: true, icc: false });
        if (exif && Object.keys(exif).length > 0) {
          const cleaned = {};
          for (const [k, v] of Object.entries(exif)) {
            if (v !== undefined && v !== null && v !== '')
              cleaned[prettyKey(k)] = v instanceof Date ? v.toLocaleString() : v;
          }
          if (Object.keys(cleaned).length > 0) setExifData(cleaned);
        }
      }

      if (isVideo) {
        const vid = await new Promise((resolve, reject) => {
          const v = document.createElement('video');
          v.preload = 'metadata';
          v.onloadedmetadata = () => resolve(v);
          v.onerror = () => reject(new Error('Failed to load video metadata'));
          v.src = URL.createObjectURL(f);
        });
        const meta = {
          Duration: formatDuration(vid.duration),
          Width: vid.videoWidth,
          Height: vid.videoHeight
        };
        if (vid.videoWidth === 0 && vid.videoHeight === 0) {
          delete meta.Width;
          delete meta.Height;
        }
        setMediaMeta(meta);

        if (vid.duration > 0) {
          vid.currentTime = Math.min(vid.duration * 0.1, 5);
          await new Promise((resolve) => { vid.onseeked = () => resolve(); setTimeout(resolve, 2000); });
          const canvas = document.createElement('canvas');
          canvas.width = vid.videoWidth || 320;
          canvas.height = vid.videoHeight || 240;
          canvas.getContext('2d').drawImage(vid, 0, 0, canvas.width, canvas.height);
          setPreviewUrl(canvas.toDataURL('image/jpeg', 0.6));
        }
        URL.revokeObjectURL(vid.src);

        if (f.type === 'video/mp4' || f.type === 'video/quicktime') {
          const buf = await f.arrayBuffer();
          const dates = readMp4Dates(buf);
          if (dates) setMp4Dates(dates);
        }
      }
    } catch (e) {
      setError(`Note: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0];
    if (f) processFile(f);
  };

  const handleClear = () => {
    setFile(null);
    setBasicMeta(null);
    setFileType(null);
    setMediaMeta(null);
    setExifData(null);
    setMp4Dates(null);
    setPreviewUrl(null);
    setError('');
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" gap={1.5} sx={{ mb: 1 }}>
          <FileTextOutlined style={{ fontSize: 28, color: theme.palette.primary.main }} />
          <Typography variant="h3" fontWeight="bold">
            File Meta Reader
          </Typography>
        </Stack>
        <Typography variant="body1" color="text.secondary">
          Read metadata from images and videos. View EXIF data, MP4 timestamps, dimensions, duration, and more.
        </Typography>
      </Box>

      <Paper
        variant="outlined"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        sx={{
          p: 4, mb: 3, textAlign: 'center', borderStyle: 'dashed',
          bgcolor: 'action.hover', cursor: 'pointer',
          '&:hover': { bgcolor: 'action.selected' },
          transition: 'background 0.2s'
        }}
        onClick={() => document.getElementById('file-meta-input')?.click()}
      >
        <input id="file-meta-input" type="file" hidden onChange={handleFileChange} />
        <FileTextOutlined style={{ fontSize: 40, color: theme.palette.text.secondary, display: 'block', margin: '0 auto 8px' }} />
        <Typography variant="body1" fontWeight={500}>
          Drop a file here or click to browse
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Supports JPEG, PNG, WebP, MP4, MOV, WebM and more
        </Typography>
      </Paper>

      {error && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {loading && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Reading file metadata...
        </Alert>
      )}

      {basicMeta && (
        <Grid container spacing={3}>
          {previewUrl && (
            <Grid size={{ xs: 12, md: 4 }}>
              <MainCard title="Preview" sx={{ height: '100%' }}>
                <Box
                  component={fileType === 'video' ? 'img' : 'img'}
                  src={previewUrl}
                  alt="Preview"
                  sx={{ width: '100%', height: 'auto', maxHeight: 300, objectFit: 'contain', borderRadius: 1 }}
                />
                {fileType === 'video' && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 0.5 }}>
                    Thumbnail (first frame)
                  </Typography>
                )}
              </MainCard>
            </Grid>
          )}

          <Grid size={{ xs: 12, md: previewUrl ? 8 : 12 }}>
            <MainCard title="Basic Info" sx={{ height: '100%' }}>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    {Object.entries(basicMeta).map(([k, v]) => (
                      <TableRow key={k} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                        <TableCell sx={{ fontWeight: 600, width: 160, color: 'text.secondary', borderBottomColor: 'divider' }}>
                          {k}
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', borderBottomColor: 'divider' }}>
                          {v}
                        </TableCell>
                      </TableRow>
                    ))}
                    {mp4Dates && Object.entries(mp4Dates).map(([k, v]) => (
                      <TableRow key={k}>
                        <TableCell sx={{ fontWeight: 600, width: 160, color: 'text.secondary', borderBottomColor: 'divider' }}>
                          {k} (MP4)
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', borderBottomColor: 'divider' }}>
                          {v}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </MainCard>
          </Grid>

          {mediaMeta && (
            <Grid size={{ xs: 12, md: exifData ? 6 : 12 }}>
              <MainCard title={fileType === 'video' ? 'Video Info' : 'Image Info'}>
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      {Object.entries(mediaMeta).map(([k, v]) => (
                        <TableRow key={k} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                          <TableCell sx={{ fontWeight: 600, width: 160, color: 'text.secondary', borderBottomColor: 'divider' }}>
                            {k}
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'monospace', borderBottomColor: 'divider' }}>
                            {v}{k === 'Width' || k === 'Height' ? ' px' : ''}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </MainCard>
            </Grid>
          )}

          {exifData && (
            <Grid size={{ xs: 12, md: mediaMeta ? 6 : 12 }}>
              <MainCard
                title={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <span>EXIF Data</span>
                    <Chip label={`${Object.keys(exifData).length} fields`} size="small" color="primary" variant="outlined" />
                  </Stack>
                }
              >
                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table size="small" stickyHeader>
                    <TableBody>
                      {Object.entries(exifData).map(([k, v]) => (
                        <TableRow key={k} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                          <TableCell sx={{ fontWeight: 600, width: 200, color: 'text.secondary', borderBottomColor: 'divider', whiteSpace: 'nowrap' }}>
                            {k}
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.82rem', borderBottomColor: 'divider', wordBreak: 'break-all' }}>
                            {typeof v === 'number' ? (Number.isInteger(v) ? v : v.toFixed(4)) : String(v)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </MainCard>
            </Grid>
          )}

          <Grid size={{ xs: 12 }}>
            <Stack direction="row" spacing={1.5} justifyContent="flex-end">
              <Button variant="outlined" color="error" size="small" startIcon={<DeleteOutlined />} onClick={handleClear}>
                Clear
              </Button>
            </Stack>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}