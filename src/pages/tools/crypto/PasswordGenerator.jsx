import { useState, useEffect, useCallback, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { generate as generateWords } from 'random-words';

// material-ui
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Snackbar from '@mui/material/Snackbar';
import Slider from '@mui/material/Slider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Tooltip from '@mui/material/Tooltip';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import LinearProgress from '@mui/material/LinearProgress';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import DialogTitle from '@mui/material/DialogTitle';

// icons
import { KeyOutlined, CopyOutlined, SyncOutlined, DeleteOutlined, QrcodeOutlined, DownloadOutlined } from '@ant-design/icons';

// project imports
import MainCard from 'components/MainCard';

// ==============================|| PASSWORD GENERATOR ||============================== //

const CHAR_SETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+~`|}{[]:;?><,./-='
};

const PRESETS = [
  'Custom',
  'Local admin',
  'Service account',
  'Wi-Fi PSK',
  'PIN (6 digits)',
  'API key (hex)',
  'UUID v4',
  'Passphrase (4 words)',
  'Passphrase (6 words)',
  'Pronounceable'
];

export default function PasswordGenerator() {
  const theme = useTheme();

  const [password, setPassword] = useState('');
  const [preset, setPreset] = useState('Custom');
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true
  });
  const [history, setHistory] = useState([]);
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  
  // Ref to prevent initial duplicate history entry
  const isInitialMount = useRef(true);

  // Helper for generating random string from charset
  const getRandomString = (len, charset) => {
    const array = new Uint32Array(len);
    window.crypto.getRandomValues(array);
    let result = '';
    for (let i = 0; i < len; i++) {
      result += charset[array[i] % charset.length];
    }
    return result;
  };

  const generatePassword = useCallback(() => {
    let generated = '';

    if (preset === 'Custom') {
      let charset = '';
      if (options.uppercase) charset += CHAR_SETS.uppercase;
      if (options.lowercase) charset += CHAR_SETS.lowercase;
      if (options.numbers) charset += CHAR_SETS.numbers;
      if (options.symbols) charset += CHAR_SETS.symbols;

      if (!charset) {
        setPassword('');
        return;
      }
      generated = getRandomString(length, charset);
    } 
    else if (preset === 'Local admin') {
      const charset = CHAR_SETS.uppercase + CHAR_SETS.lowercase + CHAR_SETS.numbers + CHAR_SETS.symbols;
      generated = getRandomString(16, charset);
    } 
    else if (preset === 'Service account') {
      const charset = CHAR_SETS.uppercase + CHAR_SETS.lowercase + CHAR_SETS.numbers + CHAR_SETS.symbols;
      generated = getRandomString(32, charset);
    } 
    else if (preset === 'Wi-Fi PSK') {
      const charset = CHAR_SETS.uppercase + CHAR_SETS.lowercase + CHAR_SETS.numbers;
      generated = getRandomString(63, charset);
    } 
    else if (preset === 'PIN (6 digits)') {
      generated = getRandomString(6, CHAR_SETS.numbers);
    } 
    else if (preset === 'API key (hex)') {
      generated = getRandomString(64, CHAR_SETS.numbers + 'abcdef');
    } 
    else if (preset === 'UUID v4') {
      generated = window.crypto.randomUUID();
    } 
    else if (preset.startsWith('Passphrase')) {
      const count = preset.includes('4') ? 4 : 6;
      const words = generateWords({ exactly: count });
      generated = words.join('-');
    } 
    else if (preset === 'Pronounceable') {
      const cons = 'bcdfghjklmnpqrstvwxyz';
      const vow = 'aeiou';
      let toggle = Math.random() > 0.5;
      for (let i = 0; i < length; i++) {
        if (toggle) generated += getRandomString(1, cons);
        else generated += getRandomString(1, vow);
        toggle = !toggle;
      }
    }

    setPassword(generated);
    
    // Only add to history if it's not the initial mount to prevent double entries
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      setHistory((prev) => [generated, ...prev].slice(0, 10));
    }
  }, [length, options, preset]);

  // Initial generation on mount or preset/option changes
  useEffect(() => {
    generatePassword();
    // Only depend on generation-triggering states (but avoid looping)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, length, options]);

  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setSnackMsg('Copied to clipboard!');
      setSnackOpen(true);
    });
  };

  const handleOptionChange = (name) => (event) => {
    setOptions((prev) => {
      const next = { ...prev, [name]: event.target.checked };
      if (!next.uppercase && !next.lowercase && !next.numbers && !next.symbols) {
        return prev;
      }
      return next;
    });
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'password-qr.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Calculate strength heuristically
  const calculateStrength = () => {
    if (!password) return { value: 0, color: 'error', label: 'None' };
    
    let score = 0;
    const len = password.length;
    
    if (len >= 8) score += 1;
    if (len >= 12) score += 1;
    if (len >= 16) score += 1;
    if (len >= 32) score += 1; // Extra point for very long
    
    // Check variety based on the actual generated string
    let types = 0;
    if (/[A-Z]/.test(password)) types++;
    if (/[a-z]/.test(password)) types++;
    if (/[0-9]/.test(password)) types++;
    if (/[^A-Za-z0-9]/.test(password)) types++;
    
    score += (types - 1);

    if (score <= 2) return { value: 25, color: 'error', label: 'Weak' };
    if (score === 3 || score === 4) return { value: 50, color: 'warning', label: 'Fair' };
    if (score === 5) return { value: 75, color: 'info', label: 'Good' };
    return { value: 100, color: 'success', label: 'Strong' };
  };

  const strength = calculateStrength();
  const isCustomOrPronounceable = preset === 'Custom' || preset === 'Pronounceable';

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" gap={1.5} sx={{ mb: 1 }}>
          <KeyOutlined style={{ fontSize: 28, color: theme.palette.primary.main }} />
          <Typography variant="h3" fontWeight="bold">
            Password Generator
          </Typography>
        </Stack>
        <Typography variant="body1" color="text.secondary">
          Generate secure, random passwords, API keys, UUIDs, and passphrases. Everything runs locally in your browser.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left Col: Main Generator */}
        <Grid size={{ xs: 12, md: 8 }}>
          <MainCard>
            {/* Output Display */}
            <Box
              sx={{
                p: 3,
                bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
                borderRadius: 2,
                border: '1px solid',
                borderColor: theme.palette.divider,
                mb: 3,
                position: 'relative',
                minHeight: 120,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Typography
                variant={password.length > 32 ? "h5" : "h3"}
                sx={{
                  fontFamily: 'monospace',
                  wordBreak: 'break-all',
                  textAlign: 'center',
                  color: password ? 'text.primary' : 'text.disabled',
                  pr: 5,
                  pl: 1
                }}
              >
                {password || 'Generating...'}
              </Typography>

              <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', flexDirection: 'column' }}>
                <Tooltip title="Copy password">
                  <IconButton color="primary" onClick={() => handleCopy(password)}>
                    <CopyOutlined />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Generate new">
                  <IconButton color="primary" onClick={generatePassword}>
                    <SyncOutlined />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* Strength Meter */}
            <Box sx={{ mb: 4 }}>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="subtitle2">Password Strength</Typography>
                <Typography variant="subtitle2" color={`${strength.color}.main`}>
                  {strength.label}
                </Typography>
              </Stack>
              <LinearProgress 
                variant="determinate" 
                value={strength.value} 
                color={strength.color}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Presets and Options */}
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth size="small" sx={{ mb: 3 }}>
                  <InputLabel>Preset</InputLabel>
                  <Select
                    value={preset}
                    label="Preset"
                    onChange={(e) => setPreset(e.target.value)}
                  >
                    {PRESETS.map((p) => (
                      <MenuItem key={p} value={p}>{p}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Box sx={{ opacity: isCustomOrPronounceable ? 1 : 0.4, pointerEvents: isCustomOrPronounceable ? 'auto' : 'none', transition: '0.2s' }}>
                  <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1 }}>
                    Password Length: {length}
                  </Typography>
                  <Slider
                    value={length}
                    min={4}
                    max={128}
                    onChange={(_, val) => setLength(val)}
                    valueLabelDisplay="auto"
                    marks={[
                      { value: 4, label: '4' },
                      { value: 64, label: '64' },
                      { value: 128, label: '128' }
                    ]}
                  />
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ opacity: preset === 'Custom' ? 1 : 0.4, pointerEvents: preset === 'Custom' ? 'auto' : 'none', transition: '0.2s' }}>
                  <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1 }}>
                    Characters
                  </Typography>
                  <Grid container spacing={0}>
                    <Grid size={6}>
                      <FormControlLabel control={<Checkbox size="small" checked={options.uppercase} onChange={handleOptionChange('uppercase')} />} label="A-Z" />
                    </Grid>
                    <Grid size={6}>
                      <FormControlLabel control={<Checkbox size="small" checked={options.lowercase} onChange={handleOptionChange('lowercase')} />} label="a-z" />
                    </Grid>
                    <Grid size={6}>
                      <FormControlLabel control={<Checkbox size="small" checked={options.numbers} onChange={handleOptionChange('numbers')} />} label="0-9" />
                    </Grid>
                    <Grid size={6}>
                      <FormControlLabel control={<Checkbox size="small" checked={options.symbols} onChange={handleOptionChange('symbols')} />} label="!@#$%" />
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            </Grid>

            <Box sx={{ mt: 3 }}>
              <Button 
                variant="contained" 
                size="large" 
                fullWidth 
                startIcon={<SyncOutlined />}
                onClick={generatePassword}
              >
                Generate Password
              </Button>
            </Box>
          </MainCard>
        </Grid>

        {/* Right Col: QR & History */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={3}>
            {/* QR Code Panel */}
            <MainCard 
              title={
                <Stack direction="row" alignItems="center" gap={1}>
                  <QrcodeOutlined />
                  <Typography variant="h5">QR Code</Typography>
                </Stack>
              }
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 1 }}>
                <Box 
                  onClick={() => setQrDialogOpen(true)}
                  sx={{ 
                    bgcolor: '#fff', 
                    p: 2, 
                    borderRadius: 2, 
                    border: '1px solid', 
                    borderColor: 'divider',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'scale(1.05)' }
                  }}
                >
                  <QRCodeSVG 
                    value={password || ' '} 
                    size={200} 
                    level="M"
                    includeMargin={false}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                  Click to enlarge or download
                </Typography>
              </Box>
            </MainCard>

            {/* History Panel */}
            <MainCard 
              title="History"
              secondary={
                history.length > 0 && (
                  <Tooltip title="Clear history">
                    <IconButton size="small" color="error" onClick={() => setHistory([])}>
                      <DeleteOutlined />
                    </IconButton>
                  </Tooltip>
                )
              }
            >
              {history.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 2, opacity: 0.5 }}>
                  <Typography variant="body2">No history yet</Typography>
                </Box>
              ) : (
                <Stack spacing={1.5}>
                  {history.map((histPass, index) => (
                    <Box 
                      key={index}
                      sx={{ 
                        p: 1.25, 
                        bgcolor: theme.palette.action.hover, 
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1
                      }}
                    >
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontFamily: 'monospace', 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: '0.8rem'
                        }}
                      >
                        {histPass}
                      </Typography>
                      <IconButton size="small" onClick={() => handleCopy(histPass)} sx={{ p: 0.5 }}>
                        <CopyOutlined fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Stack>
              )}
            </MainCard>
          </Stack>
        </Grid>
      </Grid>

      {/* Snackbar */}
      <Snackbar
        open={snackOpen}
        autoHideDuration={2000}
        onClose={() => setSnackOpen(false)}
        message={snackMsg}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      />
      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onClose={() => setQrDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold' }}>Scan Password</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pb: 1 }}>
          <Box sx={{ bgcolor: '#fff', p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', my: 2 }}>
            <QRCodeSVG 
              id="qr-code-svg"
              value={password || ' '} 
              size={300} 
              level="M"
              includeMargin={false}
            />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', wordBreak: 'break-all', textAlign: 'center', mt: 2, px: 2 }}>
            {password}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button onClick={() => setQrDialogOpen(false)} variant="outlined" color="secondary">
            Close
          </Button>
          <Button onClick={handleDownloadQR} variant="contained" startIcon={<DownloadOutlined />}>
            Download SVG
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
