import { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Stack,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Alert,
  Chip,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import { SearchOutlined, ClearOutlined, CopyOutlined } from '@ant-design/icons';
import MainCard from 'components/MainCard';
import { useTheme } from '@mui/material/styles';

const STORAGE_KEY = 'mac-lookup-history';
const MAX_HISTORY = 10;
const MAC_RE = /^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$/;
const MAC_RAW_RE = /^[0-9A-Fa-f]{12}$/;

function sanitizeMac(value) {
  return value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 12);
}

function formatMac(raw, separator = ':') {
  if (raw.length <= 2) return raw;
  return raw.match(/.{1,2}/g).join(separator);
}

function loadHistory() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveHistory(history) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export default function MacLookup() {
  const theme = useTheme();
  const [input, setInput] = useState('');
  const [separator, setSeparator] = useState(':');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState(loadHistory);

  const handleInputChange = useCallback((e) => {
    const raw = e.target.value;
    const detectedSep = raw.includes('-') ? '-' : ':';
    const hex = sanitizeMac(raw);
    const formatted = hex.length > 0 ? formatMac(hex, detectedSep) : '';
    setInput(formatted);
    setSeparator(detectedSep);
  }, []);

  const isValidMac = useCallback((value) => {
    return MAC_RE.test(value) || MAC_RAW_RE.test(value);
  }, []);

  const doLookup = useCallback(async () => {
    const clean = sanitizeMac(input);
    if (!MAC_RAW_RE.test(clean)) {
      setError('Invalid MAC address format. Use 00:11:22:33:44:55, 00-11-22-33-44-55, or 001122334455.');
      setResult(null);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`https://api.maclookup.app/v2/macs/${clean}`);
      if (!res.ok) {
        throw new Error(`API error: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();

      if (data.success === false) {
        throw new Error(data.error || 'MAC address not found.');
      }

      const lookupResult = {
        mac: formatMac(clean, separator),
        rawMac: clean,
        company: data.company || null,
        address: data.address || null,
        country: data.country || null,
        isPrivate: data.isPrivate === true,
        timestamp: new Date().toISOString(),
      };

      setResult(lookupResult);

      const newEntry = {
        mac: lookupResult.mac,
        company: lookupResult.company,
        timestamp: lookupResult.timestamp,
      };

      setHistory((prev) => {
        const updated = [newEntry, ...prev.filter((h) => h.mac !== newEntry.mac)].slice(0, MAX_HISTORY);
        saveHistory(updated);
        return updated;
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [input, separator]);

  const handleClear = useCallback(() => {
    setInput('');
    setResult(null);
    setError(null);
  }, []);

  const handleCopy = useCallback(async () => {
    if (result?.mac) {
      try {
        await navigator.clipboard.writeText(result.mac);
      } catch {
        // fallback
      }
    }
  }, [result]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && input.length > 0) {
        doLookup();
      }
    },
    [input, doLookup],
  );

  const handleHistoryClick = useCallback((entry) => {
    const formatted = formatMac(sanitizeMac(entry.mac), ':');
    setInput(formatted);
    setSeparator(':');
    setResult(null);
    setError(null);
  }, []);

  return (
    <MainCard title="MAC Address Lookup">
      <Stack spacing={3}>
        <Paper sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Enter a MAC address to identify its manufacturer. Supports formats:{' '}
              <Chip label="00:11:22:33:44:55" size="small" variant="outlined" sx={{ mx: 0.5 }} />
              <Chip label="00-11-22-33-44-55" size="small" variant="outlined" sx={{ mx: 0.5 }} />
              <Chip label="001122334455" size="small" variant="outlined" sx={{ mx: 0.5 }} />
            </Typography>

            <TextField
              fullWidth
              label="MAC Address"
              placeholder="00:11:22:33:44:55"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={loading}
              inputProps={{ maxLength: 17 }}
            />

            {loading && <LinearProgress />}

            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                startIcon={<SearchOutlined />}
                onClick={doLookup}
                disabled={loading || input.length === 0}
              >
                Lookup
              </Button>
              <Button
                variant="outlined"
                startIcon={<ClearOutlined />}
                onClick={handleClear}
                disabled={loading}
              >
                Clear
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {result && (
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6">Lookup Result</Typography>
                <Stack direction="row" spacing={1}>
                  <Tooltip title="Copy MAC address">
                    <Button size="small" variant="outlined" startIcon={<ContentCopyOutlined />} onClick={handleCopy}>
                      Copy
                    </Button>
                  </Tooltip>
                  <Chip
                    label={result.isPrivate ? 'Private' : 'Public'}
                    color={result.isPrivate ? 'warning' : 'success'}
                    size="small"
                  />
                </Stack>
              </Stack>

              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, width: 140 }}>MAC Address</TableCell>
                      <TableCell>
                        <Typography fontFamily="monospace">{result.mac}</Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Company / Vendor</TableCell>
                      <TableCell>{result.company || <Typography color="text.secondary" variant="body2">N/A</Typography>}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Address</TableCell>
                      <TableCell>{result.address || <Typography color="text.secondary" variant="body2">N/A</Typography>}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Country</TableCell>
                      <TableCell>{result.country || <Typography color="text.secondary" variant="body2">N/A</Typography>}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}

        {history.length > 0 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Recent Lookups
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableBody>
                  {history.map((entry, idx) => (
                    <TableRow
                      key={`${entry.mac}-${idx}`}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleHistoryClick(entry)}
                    >
                      <TableCell>
                        <Typography fontFamily="monospace">{entry.mac}</Typography>
                      </TableCell>
                      <TableCell>{entry.company || 'Unknown'}</TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(entry.timestamp).toLocaleString()}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </Stack>
    </MainCard>
  );
}
