import { useState, useCallback } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import Snackbar from '@mui/material/Snackbar';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Alert from '@mui/material/Alert';

// icons
import {
  CopyOutlined,
  SwapOutlined,
  ClearOutlined,
  FieldBinaryOutlined,
  DownloadOutlined
} from '@ant-design/icons';

// project imports
import MainCard from 'components/MainCard';

// ==============================|| CONVERSION FUNCTIONS ||============================== //

function textToBinary(text, separator = ' ') {
  return text
    .split('')
    .map((char) => char.charCodeAt(0).toString(2).padStart(8, '0'))
    .join(separator);
}

function binaryToText(binary) {
  // Clean input: remove anything that isn't 0 or 1 or whitespace
  const cleaned = binary.replace(/[^01\s]/g, '');
  // Split by whitespace or by groups of 8
  let bytes;
  if (cleaned.includes(' ') || cleaned.includes('\n') || cleaned.includes('\t')) {
    bytes = cleaned.split(/\s+/).filter(Boolean);
  } else {
    // No separators — split into 8-bit chunks
    bytes = cleaned.match(/.{1,8}/g) || [];
  }
  return bytes.map((byte) => String.fromCharCode(parseInt(byte, 2))).join('');
}

function textToOctal(text, separator = ' ') {
  return text
    .split('')
    .map((char) => char.charCodeAt(0).toString(8).padStart(3, '0'))
    .join(separator);
}

function octalToText(octal) {
  const cleaned = octal.replace(/[^0-7\s]/g, '');
  const bytes = cleaned.split(/\s+/).filter(Boolean);
  return bytes.map((byte) => String.fromCharCode(parseInt(byte, 8))).join('');
}

function textToDecimal(text, separator = ' ') {
  return text
    .split('')
    .map((char) => char.charCodeAt(0).toString(10))
    .join(separator);
}

function decimalToText(decimal) {
  const cleaned = decimal.replace(/[^0-9\s]/g, '');
  const bytes = cleaned.split(/\s+/).filter(Boolean);
  return bytes.map((byte) => String.fromCharCode(parseInt(byte, 10))).join('');
}

function textToHex(text, separator = ' ') {
  return text
    .split('')
    .map((char) => char.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase())
    .join(separator);
}

function hexToText(hex) {
  const cleaned = hex.replace(/[^0-9a-fA-F\s]/g, '');
  let bytes;
  if (cleaned.includes(' ') || cleaned.includes('\n') || cleaned.includes('\t')) {
    bytes = cleaned.split(/\s+/).filter(Boolean);
  } else {
    bytes = cleaned.match(/.{1,2}/g) || [];
  }
  return bytes.map((byte) => String.fromCharCode(parseInt(byte, 16))).join('');
}

const MODES = [
  { key: 'binary', label: 'Binary (Base 2)', encode: textToBinary, decode: binaryToText },
  { key: 'octal', label: 'Octal (Base 8)', encode: textToOctal, decode: octalToText },
  { key: 'decimal', label: 'Decimal (Base 10)', encode: textToDecimal, decode: decimalToText },
  { key: 'hex', label: 'Hexadecimal (Base 16)', encode: textToHex, decode: hexToText }
];

const SEPARATORS = [
  { key: ' ', label: 'Space' },
  { key: '\n', label: 'Newline' },
  { key: ', ', label: 'Comma' },
  { key: ' | ', label: 'Pipe' },
  { key: '', label: 'None' }
];

// ==============================|| TEXT TO ASCII BINARY ||============================== //

export default function TextToBinary() {
  const theme = useTheme();

  const [inputText, setInputText] = useState('Hello, World!');
  const [outputText, setOutputText] = useState('');
  const [direction, setDirection] = useState('encode'); // encode = text→binary, decode = binary→text
  const [mode, setMode] = useState('binary');
  const [separator, setSeparator] = useState(' ');
  const [error, setError] = useState('');
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');

  const currentMode = MODES.find((m) => m.key === mode);

  const handleConvert = useCallback(() => {
    setError('');
    if (!inputText.trim()) {
      setOutputText('');
      return;
    }
    try {
      if (direction === 'encode') {
        setOutputText(currentMode.encode(inputText, separator));
      } else {
        setOutputText(currentMode.decode(inputText));
      }
    } catch (e) {
      setError(`Conversion error: ${e.message}`);
      setOutputText('');
    }
  }, [inputText, direction, mode, separator, currentMode]);

  // Auto-convert on every change
  const handleInputChange = (val) => {
    setInputText(val);
    setError('');
    if (!val.trim()) {
      setOutputText('');
      return;
    }
    try {
      if (direction === 'encode') {
        setOutputText(currentMode.encode(val, separator));
      } else {
        setOutputText(currentMode.decode(val));
      }
    } catch (e) {
      setError(`Conversion error: ${e.message}`);
      setOutputText('');
    }
  };

  // Re-convert when settings change
  const handleModeChange = (newMode) => {
    setMode(newMode);
    const m = MODES.find((mo) => mo.key === newMode);
    setError('');
    if (!inputText.trim()) return;
    try {
      if (direction === 'encode') {
        setOutputText(m.encode(inputText, separator));
      } else {
        setOutputText(m.decode(inputText));
      }
    } catch (e) {
      setError(`Conversion error: ${e.message}`);
    }
  };

  const handleSeparatorChange = (newSep) => {
    setSeparator(newSep);
    setError('');
    if (!inputText.trim() || direction !== 'encode') return;
    try {
      setOutputText(currentMode.encode(inputText, newSep));
    } catch (e) {
      setError(`Conversion error: ${e.message}`);
    }
  };

  const handleSwap = () => {
    const newDirection = direction === 'encode' ? 'decode' : 'encode';
    setDirection(newDirection);
    // Swap input/output
    const oldOutput = outputText;
    setInputText(oldOutput);
    setError('');
    try {
      if (newDirection === 'encode') {
        setOutputText(currentMode.encode(oldOutput, separator));
      } else {
        setOutputText(currentMode.decode(oldOutput));
      }
    } catch (e) {
      setError(`Conversion error: ${e.message}`);
      setOutputText('');
    }
  };

  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setSnackMsg('Copied to clipboard!');
      setSnackOpen(true);
    });
  };

  const handleDownload = () => {
    if (!outputText) return;
    const blob = new Blob([outputText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${direction === 'encode' ? mode : 'text'}-output.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setSnackMsg('Downloaded!');
    setSnackOpen(true);
  };

  const handleClear = () => {
    setInputText('');
    setOutputText('');
    setError('');
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" gap={1.5} sx={{ mb: 1 }}>
          <FieldBinaryOutlined style={{ fontSize: 28, color: theme.palette.primary.main }} />
          <Typography variant="h3" fontWeight="bold">
            Text to ASCII Binary
          </Typography>
        </Stack>
        <Typography variant="body1" color="text.secondary">
          Convert text to binary, octal, decimal, or hexadecimal — and back. Instant real-time conversion with customizable separators.
        </Typography>
      </Box>

      {/* Settings Bar */}
      <MainCard sx={{ mb: 3 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          flexWrap="wrap"
        >
          {/* Direction toggle */}
          <ToggleButtonGroup
            value={direction}
            exclusive
            onChange={(_, val) => {
              if (val) {
                setDirection(val);
                handleInputChange(inputText);
              }
            }}
            size="small"
          >
            <ToggleButton value="encode">Text → Code</ToggleButton>
            <ToggleButton value="decode">Code → Text</ToggleButton>
          </ToggleButtonGroup>

          {/* Mode Chips */}
          <Stack direction="row" gap={0.5} flexWrap="wrap">
            {MODES.map((m) => (
              <Chip
                key={m.key}
                label={m.label}
                clickable
                size="small"
                color={mode === m.key ? 'primary' : 'default'}
                variant={mode === m.key ? 'filled' : 'outlined'}
                onClick={() => handleModeChange(m.key)}
              />
            ))}
          </Stack>

          {/* Separator (only for encode) */}
          {direction === 'encode' && (
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Separator</InputLabel>
              <Select
                value={separator}
                label="Separator"
                onChange={(e) => handleSeparatorChange(e.target.value)}
              >
                {SEPARATORS.map((s) => (
                  <MenuItem key={s.label} value={s.key}>
                    {s.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Stack>
      </MainCard>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Input / Output Panels */}
      <Grid container spacing={3}>
        {/* Input */}
        <Grid size={{ xs: 12, md: 5 }}>
          <MainCard
            title={
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ width: '100%' }}>
                <Typography variant="h5" fontWeight="600">
                  {direction === 'encode' ? 'Text Input' : `${currentMode.label} Input`}
                </Typography>
                <Tooltip title="Copy input">
                  <IconButton size="small" onClick={() => handleCopy(inputText)}>
                    <CopyOutlined />
                  </IconButton>
                </Tooltip>
              </Stack>
            }
            sx={{ height: '100%' }}
          >
            <TextField
              fullWidth
              multiline
              rows={14}
              value={inputText}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={direction === 'encode' ? 'Type your text here...' : `Paste ${mode} codes here...`}
              InputProps={{
                sx: {
                  fontFamily: '"Courier New", Courier, monospace',
                  fontSize: '0.9rem'
                }
              }}
            />
            <Stack direction="row" gap={1} sx={{ mt: 1.5 }}>
              <Chip label={`${inputText.length} chars`} size="small" variant="outlined" />
              <Chip label={`${inputText.split(/\s+/).filter(Boolean).length} words`} size="small" variant="outlined" />
            </Stack>
          </MainCard>
        </Grid>

        {/* Swap Button */}
        <Grid
          size={{ xs: 12, md: 2 }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Stack spacing={1.5} alignItems="center">
            <Button
              variant="contained"
              onClick={handleSwap}
              sx={{
                minWidth: 56,
                minHeight: 56,
                borderRadius: '50%',
                p: 0
              }}
            >
              <SwapOutlined style={{ fontSize: 24 }} />
            </Button>
            <Typography variant="caption" color="text.secondary">
              Swap
            </Typography>
            <Divider sx={{ width: '100%' }} />
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<ClearOutlined />}
              onClick={handleClear}
            >
              Clear
            </Button>
          </Stack>
        </Grid>

        {/* Output */}
        <Grid size={{ xs: 12, md: 5 }}>
          <MainCard
            title={
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ width: '100%' }}>
                <Typography variant="h5" fontWeight="600">
                  {direction === 'encode' ? `${currentMode.label} Output` : 'Text Output'}
                </Typography>
                <Stack direction="row" gap={0.5}>
                  <Tooltip title="Copy output">
                    <IconButton size="small" onClick={() => handleCopy(outputText)} disabled={!outputText}>
                      <CopyOutlined />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Download as .txt">
                    <IconButton size="small" onClick={handleDownload} disabled={!outputText}>
                      <DownloadOutlined />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
            }
            sx={{ height: '100%' }}
          >
            <Box
              sx={{
                minHeight: 310,
                p: 2,
                borderRadius: 1.5,
                bgcolor: theme.palette.mode === 'dark' ? 'grey.100' : 'grey.50',
                border: '1px solid',
                borderColor: theme.palette.divider,
                overflowY: 'auto',
                overflowX: 'auto',
                fontFamily: '"Courier New", Courier, monospace',
                fontSize: '0.9rem',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                color: outputText ? theme.palette.primary.main : theme.palette.text.disabled
              }}
            >
              {outputText || (direction === 'encode' ? 'Binary output will appear here...' : 'Decoded text will appear here...')}
            </Box>
            {outputText && (
              <Stack direction="row" gap={1} sx={{ mt: 1.5 }}>
                <Chip label={`${outputText.length} chars`} size="small" variant="outlined" />
                {direction === 'encode' && (
                  <Chip
                    label={`${inputText.length} bytes encoded`}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                )}
              </Stack>
            )}
          </MainCard>
        </Grid>
      </Grid>

      {/* Quick Reference */}
      <MainCard title="Quick Reference" sx={{ mt: 3 }}>
        <Grid container spacing={2}>
          {['A', 'B', 'C', '0', '1', ' ', '!', '@'].map((char) => (
            <Grid size={{ xs: 6, sm: 3, md: 1.5 }} key={char}>
              <Box
                sx={{
                  textAlign: 'center',
                  p: 1.5,
                  borderRadius: 1.5,
                  bgcolor: theme.palette.action.hover,
                  border: '1px solid',
                  borderColor: theme.palette.divider
                }}
              >
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>
                  {char === ' ' ? '␣' : char}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', display: 'block', fontSize: '0.65rem' }}>
                  {char.charCodeAt(0).toString(2).padStart(8, '0')}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', display: 'block', fontSize: '0.65rem' }}>
                  {char.charCodeAt(0)}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </MainCard>

      {/* Snackbar */}
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
