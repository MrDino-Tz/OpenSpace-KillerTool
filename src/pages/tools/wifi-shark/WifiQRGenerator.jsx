import { useState, useCallback, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Slider from '@mui/material/Slider';
import Tooltip from '@mui/material/Tooltip';
import Alert from '@mui/material/Alert';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import MainCard from 'components/MainCard';
import { QrcodeOutlined, DownloadOutlined, CopyOutlined, ClearOutlined } from '@ant-design/icons';
import QRCode from 'qrcode';

function buildWifiString(ssid, password, encryption, hidden) {
  const pwd = password || '';
  const enc = encryption || 'nopass';
  const hid = hidden ? 'true' : 'false';
  return `WIFI:T:${enc};S:${ssid};P:${pwd};H:${hid};;`;
}

export default function WifiQRGenerator() {
  const theme = useTheme();
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [encryption, setEncryption] = useState('WPA2');
  const [hidden, setHidden] = useState(false);
  const [size, setSize] = useState(280);
  const [wifiString, setWifiString] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [qrGenerated, setQrGenerated] = useState(false);

  const generateQR = useCallback(async (str, canvas) => {
    if (!canvas) return;
    try {
      setError('');
      await QRCode.toCanvas(canvas, str, {
        width: size,
        margin: 2,
        color: {
          dark: theme.palette.text.primary,
          light: theme.palette.background.paper
        }
      });
      setQrGenerated(true);
    } catch (err) {
      setError('Failed to generate QR code: ' + err.message);
      setQrGenerated(false);
    }
  }, [size, theme.palette.text.primary, theme.palette.background.paper]);

  useEffect(() => {
    const str = buildWifiString(ssid, password, encryption, hidden);
    setWifiString(str);
  }, [ssid, password, encryption, hidden]);

  useEffect(() => {
    if (wifiString && ssid) {
      const canvas = document.getElementById('wifi-qr-canvas');
      if (canvas) generateQR(wifiString, canvas);
    } else {
      setQrGenerated(false);
    }
  }, [wifiString, ssid, generateQR]);

  const handleGenerate = useCallback(() => {
    if (!ssid.trim()) {
      setError('SSID is required');
      return;
    }
    setError('');
    const canvas = document.getElementById('wifi-qr-canvas');
    if (canvas) generateQR(wifiString, canvas);
  }, [ssid, wifiString, generateQR]);

  const handleDownload = useCallback(() => {
    const canvas = document.getElementById('wifi-qr-canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `wifi-${ssid.replace(/[^a-zA-Z0-9]/g, '_') || 'config'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [ssid]);

  const handleCopyWifiString = useCallback(() => {
    navigator.clipboard.writeText(wifiString).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [wifiString]);

  const handleClear = useCallback(() => {
    setSsid('');
    setPassword('');
    setEncryption('WPA2');
    setHidden(false);
    setSize(280);
    setError('');
    setQrGenerated(false);
    setCopied(false);
  }, []);

  const hasQr = qrGenerated && ssid.trim();

  return (
    <MainCard title="WiFi QR Generator">
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Stack spacing={2.5}>
            <Typography variant="subtitle1" fontWeight={600}>Network Configuration</Typography>

            <TextField
              label="SSID (Network Name)"
              value={ssid}
              onChange={(e) => setSsid(e.target.value)}
              fullWidth
              size="small"
              required
            />

            <TextField
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              size="small"
              type="text"
              disabled={encryption === 'None'}
            />

            <FormControl fullWidth size="small">
              <InputLabel>Encryption</InputLabel>
              <Select
                value={encryption}
                label="Encryption"
                onChange={(e) => setEncryption(e.target.value)}
              >
                <MenuItem value="WPA2">WPA2</MenuItem>
                <MenuItem value="WPA">WPA</MenuItem>
                <MenuItem value="WEP">WEP</MenuItem>
                <MenuItem value="None">None</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Checkbox
                  checked={hidden}
                  onChange={(e) => setHidden(e.target.checked)}
                  size="small"
                />
              }
              label="Hidden network"
            />

            <Box sx={{ px: 0.5 }}>
              <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                QR Code Size: {size}px
              </Typography>
              <Slider
                value={size}
                onChange={(_, v) => setSize(v)}
                min={128}
                max={512}
                step={8}
                valueLabelDisplay="auto"
              />
            </Box>

            <Stack direction="row" spacing={1.5}>
              <Button variant="contained" startIcon={<QrcodeOutlined />} onClick={handleGenerate}>
                Generate
              </Button>
              <Button variant="outlined" color="error" size="small" startIcon={<ClearOutlined />} onClick={handleClear}>
                Clear
              </Button>
            </Stack>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', bgcolor: 'action.hover', minHeight: 340, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            {hasQr ? (
              <>
                <Box sx={{ mb: 2 }}>
                  <canvas id="wifi-qr-canvas" />
                </Box>

                <Stack direction="row" spacing={1.5}>
                  <Tooltip title="Download as PNG">
                    <Button variant="outlined" size="small" startIcon={<DownloadOutlined />} onClick={handleDownload}>
                      Download
                    </Button>
                  </Tooltip>
                  <Tooltip title="Copy WiFi config string">
                    <Button variant="outlined" size="small" startIcon={<CopyOutlined />} onClick={handleCopyWifiString}>
                      {copied ? 'Copied!' : 'Copy'}
                    </Button>
                  </Tooltip>
                </Stack>
              </>
            ) : (
              <Box sx={{ color: 'text.disabled', textAlign: 'center' }}>
                <QrcodeOutlined style={{ fontSize: 48, marginBottom: 12, opacity: 0.4 }} />
                <Typography variant="body2" color="text.disabled">
                  Fill in the network details and click Generate to create a WiFi QR code.
                </Typography>
              </Box>
            )}

            {copied && (
              <Alert severity="success" sx={{ mt: 2, py: 0.5, width: '100%' }}>
                WiFi config string copied to clipboard!
              </Alert>
            )}
          </Paper>

          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </Grid>
      </Grid>
    </MainCard>
  );
}
