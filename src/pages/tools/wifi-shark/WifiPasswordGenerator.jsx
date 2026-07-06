import { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid2,
  TextField,
  Button,
  Slider,
  Paper,
  Stack,
  Chip,
  Alert,
  Tooltip,
  IconButton,
  LinearProgress,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { KeyOutlined, CopyOutlined, ReloadOutlined, DownloadOutlined } from '@ant-design/icons';
import MainCard from 'components/MainCard';
import { useTheme } from '@mui/material/styles';

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SYMBOLS = "!@#$%^&*()_+-=[]{}|;':\",./<>?~";

function getStrengthInfo(entropy) {
  if (entropy < 60) return { label: 'Weak', color: 'error' };
  if (entropy < 80) return { label: 'Fair', color: 'warning' };
  if (entropy < 120) return { label: 'Strong', color: 'info' };
  return { label: 'Very Strong', color: 'success' };
}

function calcEntropy(length, poolSize) {
  return length * Math.log2(poolSize);
}

function generatePassword(length, pools) {
  const activePools = pools.filter(Boolean);
  if (activePools.length === 0) return '';
  const fullCharset = activePools.join('');
  const charsetLen = fullCharset.length;
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  let password = '';
  for (let i = 0; i < length; i++) {
    password += fullCharset[arr[i] % charsetLen];
  }
  const guaranteed = [];
  for (const pool of activePools) {
    const c = pool[arr[activePools.indexOf(pool)] % pool.length];
    guaranteed.push(c);
  }
  const result = guaranteed.join('') + password.slice(guaranteed.length);
  const mixed = result.split('');
  for (let i = mixed.length - 1; i > 0; i--) {
    const j = arr[i] % (i + 1);
    [mixed[i], mixed[j]] = [mixed[j], mixed[i]];
  }
  return mixed.join('');
}

export default function WifiPasswordGenerator() {
  const theme = useTheme();
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(false);
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('WPA2');

  const pools = [];
  if (includeUppercase) pools.push(UPPERCASE);
  if (includeLowercase) pools.push(LOWERCASE);
  if (includeNumbers) pools.push(NUMBERS);
  if (includeSymbols) pools.push(SYMBOLS);

  const poolSize = pools.reduce((sum, p) => sum + p.length, 0);
  const anySelected = poolSize > 0;
  const entropy = length * Math.log2(poolSize || 1);
  const strength = getStrengthInfo(entropy);
  const strengthPercent = Math.min((entropy / 150) * 100, 100);

  const handleGenerate = useCallback(() => {
    if (!anySelected) return;
    setPassword(generatePassword(length, pools));
  }, [length, pools, anySelected]);

  const handleCopy = useCallback(async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
    } catch {
      // fallback
    }
  }, [password]);

  const handleDownload = useCallback(() => {
    if (!password) return;
    const blob = new Blob([password], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wifi-password.txt';
    a.click();
    URL.revokeObjectURL(url);
  }, [password]);

  return (
    <MainCard>
      <Stack spacing={3}>
        <Stack direction="row" spacing={1} alignItems="center">
          <KeyOutlined style={{ fontSize: 24 }} />
          <Typography variant="h4">WiFi Password Generator</Typography>
        </Stack>

        <Stack direction="row" spacing={1}>
          <Chip
            label="WPA2"
            variant={mode === 'WPA2' ? 'filled' : 'outlined'}
            color={mode === 'WPA2' ? 'primary' : 'default'}
            onClick={() => setMode('WPA2')}
          />
          <Chip
            label="WPA3"
            variant={mode === 'WPA3' ? 'filled' : 'outlined'}
            color={mode === 'WPA3' ? 'primary' : 'default'}
            onClick={() => setMode('WPA3')}
          />
        </Stack>

        <Box>
          <Typography gutterBottom>
            Length: {length}
          </Typography>
          <Slider
            value={length}
            min={8}
            max={63}
            step={1}
            onChange={(_, v) => setLength(v)}
            marks={[
              { value: 8, label: '8' },
              { value: 63, label: '63' },
            ]}
          />
          <Typography variant="caption" color="text.secondary">
            {mode} maximum is 63 characters
          </Typography>
        </Box>

        <Box>
          <Typography gutterBottom>Character Types</Typography>
          <Grid2 container spacing={1}>
            <Grid2 item xs={6} sm={3}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={includeUppercase}
                    onChange={(e) => setIncludeUppercase(e.target.checked)}
                  />
                }
                label="A–Z (Uppercase)"
              />
            </Grid2>
            <Grid2 item xs={6} sm={3}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={includeLowercase}
                    onChange={(e) => setIncludeLowercase(e.target.checked)}
                  />
                }
                label="a–z (Lowercase)"
              />
            </Grid2>
            <Grid2 item xs={6} sm={3}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={includeNumbers}
                    onChange={(e) => setIncludeNumbers(e.target.checked)}
                  />
                }
                label="0–9 (Numbers)"
              />
            </Grid2>
            <Grid2 item xs={6} sm={3}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={includeSymbols}
                    onChange={(e) => setIncludeSymbols(e.target.checked)}
                  />
                }
                label="!@#$… (Symbols)"
              />
            </Grid2>
          </Grid2>
          {!anySelected && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              At least one character type must be selected
            </Alert>
          )}
        </Box>

        <Box>
          <TextField
            fullWidth
            variant="outlined"
            value={password}
            readOnly
            multiline
            minRows={2}
            maxRows={4}
            sx={{ fontFamily: 'monospace', fontSize: '1.25rem' }}
            InputProps={{
              sx: { fontFamily: 'monospace', fontSize: '1.25rem' },
            }}
          />
        </Box>

        <Box>
          <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2">
                Password Strength: <strong>{strength.label}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {entropy.toFixed(0)} bits
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={strengthPercent}
              color={strength.color}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Stack>
        </Box>

        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <Button
            variant="contained"
            startIcon={<ReloadOutlined />}
            onClick={handleGenerate}
            disabled={!anySelected}
          >
            Generate
          </Button>
          <Tooltip title="Copy to clipboard">
            <span>
              <IconButton onClick={handleCopy} disabled={!password} color="primary">
                <CopyOutlined />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Download as .txt">
            <span>
              <IconButton onClick={handleDownload} disabled={!password} color="primary">
                <DownloadOutlined />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>
    </MainCard>
  );
}
