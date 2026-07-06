import { useState, useRef, useCallback } from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import MainCard from 'components/MainCard';
import { ScanOutlined, CopyOutlined, ClearOutlined, CloudUploadOutlined } from '@ant-design/icons';
import jsQR from 'jsqr';

function parseWifiConfig(str) {
  const result = { ssid: '', password: '', encryption: '', hidden: false };
  if (!str || !str.startsWith('WIFI:')) return null;
  const parts = str.slice(5).split(';');
  for (const part of parts) {
    if (part.startsWith('S:')) result.ssid = part.slice(2);
    else if (part.startsWith('P:')) result.password = part.slice(2);
    else if (part.startsWith('T:')) result.encryption = part.slice(2);
    else if (part.startsWith('H:')) result.hidden = part.slice(2) === 'true';
  }
  if (!result.ssid) return null;
  return result;
}

export default function WifiQRDecoder() {
  const theme = useTheme();
  const [imageUrl, setImageUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [rawData, setRawData] = useState(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const processFile = useCallback((file) => {
    setError('');
    setResult(null);
    setRawData(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target.result;
      setImageUrl(url);

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          setRawData(code.data);
          const wifi = parseWifiConfig(code.data);
          if (wifi) {
            setResult(wifi);
          } else {
            setError('This QR code does not contain a WiFi configuration.');
          }
        } else {
          setError('Could not decode QR code. Try a clearer image.');
        }
      };
      img.onerror = () => setError('Failed to load image.');
      img.src = url;
    };
    reader.onerror = () => setError('Failed to read file.');
    reader.readAsDataURL(file);
  }, []);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    } else {
      setError('Please drop an image file.');
    }
  };

  const handleReset = () => {
    setImageUrl(null);
    setResult(null);
    setRawData(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const copyPassword = () => {
    if (result?.password) {
      navigator.clipboard.writeText(result.password);
    }
  };

  const encryptionColor = (t) => {
    if (!t || t === 'nopass') return 'success';
    if (t === 'WPA' || t === 'WPA2') return 'warning';
    return 'default';
  };

  return (
    <MainCard title="WiFi QR Decoder">
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Stack spacing={2}>
            <Box>
              <Button variant="outlined" component="label" startIcon={<ScanOutlined />}>
                Upload QR Code Image
                <input ref={fileInputRef} type="file" hidden accept="image/png,image/jpeg,image/webp" onChange={handleFile} />
              </Button>
            </Box>

            <Paper
              variant="outlined"
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              sx={{
                p: 3,
                minHeight: 160,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: dragOver ? 'action.selected' : 'action.hover',
                border: '2px dashed',
                borderColor: dragOver ? 'primary.main' : 'divider',
                borderRadius: 2,
                transition: 'all 0.2s',
                cursor: 'pointer',
                '&:hover': { borderColor: 'primary.light' }
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <CloudUploadOutlined style={{ fontSize: 36, color: dragOver ? theme.palette.primary.main : theme.palette.text.disabled, marginBottom: 8 }} />
              <Typography variant="body2" color={dragOver ? 'primary' : 'text.secondary'} fontWeight={500}>
                {dragOver ? 'Drop image here' : 'Drag & drop a QR code image here'}
              </Typography>
              <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5 }}>
                or click to browse
              </Typography>
            </Paper>

            {imageUrl && (
              <Paper variant="outlined" sx={{ p: 1, display: 'flex', justifyContent: 'center', bgcolor: 'action.hover' }}>
                <Box component="img" src={imageUrl} alt="QR Code"
                  sx={{ maxWidth: '100%', maxHeight: 280, borderRadius: 1 }} />
              </Paper>
            )}

            {(imageUrl || result) && (
              <Button variant="outlined" color="error" size="small" startIcon={<ClearOutlined />} onClick={handleReset}>
                Clear
              </Button>
            )}
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {result && (
            <Paper variant="outlined" sx={{ p: 2.5, bgcolor: 'action.hover' }}>
              <Stack spacing={2}>
                <Typography variant="h6" fontWeight={600}>Network Details</Typography>

                <Box>
                  <Typography variant="caption" color="text.secondary">Network Name (SSID)</Typography>
                  <Typography variant="body1" fontWeight={600}>{result.ssid}</Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">Password</Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="body1" fontWeight={600}
                      sx={{ fontFamily: 'monospace', letterSpacing: 1 }}>
                      {result.password || '(none)'}
                    </Typography>
                    {result.password && (
                      <Tooltip title="Copy password">
                        <Box component="span" onClick={copyPassword}
                          sx={{ cursor: 'pointer', display: 'flex', color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
                          <CopyOutlined style={{ fontSize: 16 }} />
                        </Box>
                      </Tooltip>
                    )}
                  </Stack>
                </Box>

                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="caption" color="text.secondary">Encryption:</Typography>
                  <Chip label={result.encryption || 'Open'} size="small"
                    color={encryptionColor(result.encryption)} variant="outlined" />
                </Stack>

                {result.hidden && (
                  <Alert severity="info" sx={{ py: 0.5 }}>This is a hidden network</Alert>
                )}

                {rawData && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Raw QR Data</Typography>
                    <Box sx={{
                      mt: 0.5, p: 1.5, borderRadius: 1, bgcolor: 'background.paper',
                      fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all',
                      border: '1px solid', borderColor: 'divider'
                    }}>
                      {rawData}
                    </Box>
                  </Box>
                )}
              </Stack>
            </Paper>
          )}

          {!result && !error && !rawData && (
            <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', bgcolor: 'action.hover', minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body2" color="text.disabled">
                Upload or drop a QR code image. WiFi QR codes will show network details; other QR codes will display the raw decoded data.
              </Typography>
            </Paper>
          )}

          {!result && error && rawData && (
            <Paper variant="outlined" sx={{ p: 2.5, bgcolor: 'action.hover' }}>
              <Stack spacing={1.5}>
                <Typography variant="h6" fontWeight={600}>Decoded Data</Typography>
                <Typography variant="caption" color="text.secondary">This QR code is not a WiFi configuration. Raw content:</Typography>
                <Box sx={{
                  p: 1.5, borderRadius: 1, bgcolor: 'background.paper',
                  fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all',
                  border: '1px solid', borderColor: 'divider'
                }}>
                  {rawData}
                </Box>
              </Stack>
            </Paper>
          )}
        </Grid>
      </Grid>
    </MainCard>
  );
}
