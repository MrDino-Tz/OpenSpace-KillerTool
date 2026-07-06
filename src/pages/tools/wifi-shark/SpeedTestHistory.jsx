import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid2,
  Button,
  Slider,
  Paper,
  Stack,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Tooltip,
  IconButton,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  LineChartOutlined,
  DeleteOutlined,
  DownloadOutlined,
  ReloadOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';
import MainCard from 'components/MainCard';
import { useTheme } from '@mui/material/styles';

let LineChart;
try {
  LineChart = require('@mui/x-charts/LineChart').LineChart;
} catch {
  LineChart = null;
}

const STORAGE_KEY = 'speed-test-history';
const MAX_HISTORY = 100;
const SAMPLES = 3;

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

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
    ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function avg(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stddev(arr) {
  const m = avg(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
}

async function runPing() {
  const start = performance.now();
  await fetch(`/logo.png?_t=${Date.now()}`, {
    method: 'HEAD',
    cache: 'no-store',
    mode: 'same-origin'
  });
  return performance.now() - start;
}

async function runDownload() {
  const url = `/logo.png?_t=${Date.now()}`;
  const start = performance.now();
  const resp = await fetch(url, { cache: 'no-store', mode: 'same-origin' });
  const blob = await resp.blob();
  const duration = (performance.now() - start) / 1000;
  const bits = blob.size * 8;
  const Mbps = bits / duration / 1_000_000;
  return { Mbps, bytes: blob.size, duration };
}

async function measureAll() {
  const pings = [];
  for (let i = 0; i < SAMPLES; i++) {
    pings.push(await runPing());
  }

  const dlResults = [];
  for (let i = 0; i < SAMPLES; i++) {
    dlResults.push(await runDownload());
  }

  const pingAvg = avg(pings);
  const jitter = stddev(pings);
  const dlAvg = avg(dlResults.map(r => r.Mbps));

  return {
    id: generateId(),
    timestamp: Date.now(),
    ping: Math.round(pingAvg * 100) / 100,
    download: Math.round(dlAvg * 100) / 100,
    jitter: Math.round(jitter * 100) / 100,
    upload: 'N/A'
  };
}

function SummaryStat({ label, value, unit, color }) {
  return (
    <Box sx={{ textAlign: 'center', p: 1 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
        {label}
      </Typography>
      <Typography variant="h4" color={color || 'text.primary'} sx={{ fontWeight: 700, mt: 0.5 }}>
        {value}
        <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
          {unit}
        </Typography>
      </Typography>
    </Box>
  );
}

function LatestResult({ result }) {
  const theme = useTheme();
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
        color: '#fff',
        borderRadius: 2,
        mb: 3
      }}
    >
      <Typography variant="overline" sx={{ opacity: 0.8, letterSpacing: 1 }}>
        Latest Speed Test
      </Typography>
      <Typography variant="body2" sx={{ opacity: 0.7, mb: 2 }}>
        {formatDate(result.timestamp)}
      </Typography>
      <Grid2 container spacing={3}>
        <Grid2 size={{ xs: 6, md: 3 }}>
          <Box sx={{ textAlign: 'center' }}>
            <ArrowDownOutlined style={{ fontSize: 28, opacity: 0.8 }} />
            <Typography variant="h3" sx={{ fontWeight: 700, mt: 0.5 }}>
              {result.download}
              <Typography component="span" variant="body1" sx={{ ml: 0.5, opacity: 0.7 }}>
                Mbps
              </Typography>
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>Download</Typography>
          </Box>
        </Grid2>
        <Grid2 size={{ xs: 6, md: 3 }}>
          <Box sx={{ textAlign: 'center' }}>
            <ArrowUpOutlined style={{ fontSize: 28, opacity: 0.8 }} />
            <Typography variant="h3" sx={{ fontWeight: 700, mt: 0.5 }}>
              {result.upload}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>Upload</Typography>
          </Box>
        </Grid2>
        <Grid2 size={{ xs: 6, md: 3 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h3" sx={{ fontWeight: 700, mt: 0.5 }}>
              {result.ping}
              <Typography component="span" variant="body1" sx={{ ml: 0.5, opacity: 0.7 }}>
                ms
              </Typography>
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>Ping</Typography>
          </Box>
        </Grid2>
        <Grid2 size={{ xs: 6, md: 3 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h3" sx={{ fontWeight: 700, mt: 0.5 }}>
              {result.jitter}
              <Typography component="span" variant="body1" sx={{ ml: 0.5, opacity: 0.7 }}>
                ms
              </Typography>
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>Jitter</Typography>
          </Box>
        </Grid2>
      </Grid2>
    </Paper>
  );
}

function ChartView({ history }) {
  const theme = useTheme();
  const chartData = useMemo(() => {
    const sliced = history.slice(-30);
    return {
      dates: sliced.map(r => new Date(r.timestamp)),
      ping: sliced.map(r => r.ping),
      download: sliced.map(r => r.download),
      jitter: sliced.map(r => r.jitter)
    };
  }, [history]);

  if (!LineChart) {
    return (
      <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">
          Chart library not available. Install @mui/x-charts to see the speed trend chart.
        </Typography>
      </Paper>
    );
  }

  if (history.length < 2) {
    return null;
  }

  return (
    <Box sx={{ width: '100%', height: 300, mb: 3 }}>
      <LineChart
        series={[
          {
            data: chartData.ping,
            label: 'Ping (ms)',
            color: theme.palette.warning.main,
            yAxisKey: 'ping'
          },
          {
            data: chartData.download,
            label: 'Download (Mbps)',
            color: theme.palette.success.main,
            yAxisKey: 'download'
          }
        ]}
        xAxis={[{ data: chartData.dates, scaleType: 'time', tickNumber: 5 }]}
        yAxis={[
          { id: 'ping', scaleType: 'linear', label: 'Ping (ms)' },
          { id: 'download', scaleType: 'linear', label: 'Download (Mbps)' }
        ]}
        leftAxis="ping"
        rightAxis="download"
        slotProps={{ legend: { hidden: false } }}
        margin={{ left: 60, right: 60, top: 20, bottom: 40 }}
      />
    </Box>
  );
}

export default function SpeedTestHistory() {
  const theme = useTheme();
  const [history, setHistory] = useState(loadHistory);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    saveHistory(history);
  }, [history]);

  const handleRunTest = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await measureAll();
      setHistory(prev => [result, ...prev].slice(0, MAX_HISTORY));
    } catch (err) {
      setError('Speed test failed: ' + (err.message || 'unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleClear = useCallback(() => {
    setHistory([]);
    setShowClearConfirm(false);
  }, []);

  const handleExport = useCallback(() => {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `speed-test-history-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [history]);

  const stats = useMemo(() => {
    if (history.length === 0) return null;
    const pings = history.map(r => r.ping);
    const dls = history.map(r => r.download);
    return {
      ping: {
        min: Math.min(...pings),
        max: Math.max(...pings),
        avg: avg(pings)
      },
      download: {
        min: Math.min(...dls),
        max: Math.max(...dls),
        avg: avg(dls)
      }
    };
  }, [history]);

  const paginatedHistory = useMemo(() => {
    const start = page * rowsPerPage;
    return history.slice(start, start + rowsPerPage);
  }, [history, page, rowsPerPage]);

  const totalPages = Math.ceil(history.length / rowsPerPage);

  return (
    <MainCard title={
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <LineChartOutlined />
        Speed Test History
      </Box>
    }>
      <Stack spacing={3}>
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <Button
            variant="contained"
            startIcon={<ReloadOutlined />}
            onClick={handleRunTest}
            disabled={loading}
          >
            {loading ? 'Running...' : 'Run Speed Test'}
          </Button>
          {history.length > 0 && (
            <>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteOutlined />}
                onClick={() => setShowClearConfirm(v => !v)}
              >
                Clear History
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadOutlined />}
                onClick={handleExport}
              >
                Export JSON
              </Button>
            </>
          )}
        </Stack>

        {showClearConfirm && (
          <Paper variant="outlined" sx={{ p: 2, borderColor: theme.palette.error.main }}>
            <Typography variant="body2" color="error" gutterBottom>
              Are you sure you want to delete all speed test history? This cannot be undone.
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button size="small" variant="contained" color="error" onClick={handleClear}>
                Yes, Clear All
              </Button>
              <Button size="small" variant="outlined" onClick={() => setShowClearConfirm(false)}>
                Cancel
              </Button>
            </Stack>
          </Paper>
        )}

        {loading && (
          <Box>
            <LinearProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Measuring ping and download speed...
            </Typography>
          </Box>
        )}

        {history.length > 0 && (
          <>
            <LatestResult result={history[0]} />

            {stats && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    Summary Statistics
                  </Typography>
                  <Grid2 container spacing={2}>
                    <Grid2 size={{ xs: 12, md: 6 }}>
                      <Paper variant="outlined" sx={{ p: 1.5 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
                          Ping (ms)
                        </Typography>
                        <Grid2 container>
                          <Grid2 size={4}>
                            <SummaryStat label="Min" value={Math.round(stats.ping.min * 100) / 100} unit="ms" color="success.main" />
                          </Grid2>
                          <Grid2 size={4}>
                            <SummaryStat label="Avg" value={Math.round(stats.ping.avg * 100) / 100} unit="ms" />
                          </Grid2>
                          <Grid2 size={4}>
                            <SummaryStat label="Max" value={Math.round(stats.ping.max * 100) / 100} unit="ms" color="error.main" />
                          </Grid2>
                        </Grid2>
                      </Paper>
                    </Grid2>
                    <Grid2 size={{ xs: 12, md: 6 }}>
                      <Paper variant="outlined" sx={{ p: 1.5 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
                          Download (Mbps)
                        </Typography>
                        <Grid2 container>
                          <Grid2 size={4}>
                            <SummaryStat label="Min" value={Math.round(stats.download.min * 100) / 100} unit="Mbps" color="error.main" />
                          </Grid2>
                          <Grid2 size={4}>
                            <SummaryStat label="Avg" value={Math.round(stats.download.avg * 100) / 100} unit="Mbps" />
                          </Grid2>
                          <Grid2 size={4}>
                            <SummaryStat label="Max" value={Math.round(stats.download.max * 100) / 100} unit="Mbps" color="success.main" />
                          </Grid2>
                        </Grid2>
                      </Paper>
                    </Grid2>
                  </Grid2>
                </CardContent>
              </Card>
            )}

            {history.length >= 2 && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    Speed Trend (Last 30 Tests)
                  </Typography>
                  <ChartView history={history} />
                </CardContent>
              </Card>
            )}

            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  Test History
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Date/Time</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Ping (ms)</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Download (Mbps)</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Jitter (ms)</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Upload</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedHistory.map((r) => (
                        <TableRow key={r.id} hover>
                          <TableCell>
                            <Tooltip title={new Date(r.timestamp).toLocaleString()}>
                              <span>{formatDate(r.timestamp)}</span>
                            </Tooltip>
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              size="small"
                              label={r.ping}
                              color={r.ping < 50 ? 'success' : r.ping < 150 ? 'warning' : 'error'}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="right">{r.download}</TableCell>
                          <TableCell align="right">{r.jitter}</TableCell>
                          <TableCell align="right">{r.upload}</TableCell>
                        </TableRow>
                      ))}
                      {paginatedHistory.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            <Typography color="text.secondary">No results on this page.</Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 2, gap: 1 }}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select
                        value={page}
                        onChange={(e) => setPage(Number(e.target.value))}
                      >
                        {Array.from({ length: totalPages }, (_, i) => (
                          <MenuItem key={i} value={i}>
                            Page {i + 1} of {totalPages}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Button
                      size="small"
                      disabled={page <= 0}
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                    >
                      Prev
                    </Button>
                    <Button
                      size="small"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    >
                      Next
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {history.length === 0 && !loading && (
          <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
            <LineChartOutlined style={{ fontSize: 48, opacity: 0.3 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
              No speed tests recorded yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Click "Run Speed Test" to measure your network performance.
            </Typography>
          </Paper>
        )}
      </Stack>
    </MainCard>
  );
}
