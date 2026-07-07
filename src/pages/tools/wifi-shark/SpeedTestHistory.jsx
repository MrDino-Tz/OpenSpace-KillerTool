import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Box, Typography, Grid2, Button, Slider, Paper, Stack, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Alert, Tooltip, IconButton, LinearProgress, Select, MenuItem,
  FormControl, InputLabel, CircularProgress
} from '@mui/material';
import {
  LineChartOutlined, DeleteOutlined, DownloadOutlined, ReloadOutlined,
  ArrowUpOutlined, ArrowDownOutlined, PauseCircleOutlined, CloseCircleOutlined
} from '@ant-design/icons';
import MainCard from 'components/MainCard';
import { useTheme } from '@mui/material/styles';

let LineChart;
try {
  LineChart = require('@mui/x-charts/LineChart').LineChart;
} catch { LineChart = null; }

const STORAGE_KEY = 'speed-test-history';
const MAX_HISTORY = 100;
const DL_SAMPLES = 15;
const DEFAULT_INTERVAL = 10;

function loadHistory() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}
function saveHistory(h) { localStorage.setItem(STORAGE_KEY, JSON.stringify(h)); }
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

function fmtDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
    ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function avg(a) { return a.reduce((s, v) => s + v, 0) / a.length; }
function stddev(a) { const m = avg(a); return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / a.length); }

function LiveSparkline({ data, color, height, width }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs || data.length < 2) return;
    const ctx = cvs.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    cvs.width = width * dpr;
    cvs.height = height * dpr;
    ctx.scale(dpr, dpr);
    const w = width, h = height;
    ctx.clearRect(0, 0, w, h);

    const max = Math.max(...data, 0.1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    const pad = 4;
    const drawW = w - pad * 2;
    const drawH = h - pad * 2;

    const pts = data.map((v, i) => ({
      x: pad + (i / (data.length - 1)) * drawW,
      y: pad + drawH - ((v - min) / range) * drawH
    }));

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      const cx = (pts[i - 1].x + pts[i].x) / 2;
      ctx.quadraticCurveTo(pts[i - 1].x, pts[i - 1].y, cx, (pts[i - 1].y + pts[i].y) / 2);
      ctx.quadraticCurveTo(cx, (pts[i - 1].y + pts[i].y) / 2, pts[i].x, pts[i].y);
    }
    ctx.stroke();

    ctx.fillStyle = color + '20';
    ctx.beginPath();
    ctx.moveTo(pts[0].x, h - pad);
    for (let i = 0; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.lineTo(pts[pts.length - 1].x, h - pad);
    ctx.closePath();
    ctx.fill();
  }, [data, color, height, width]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height, borderRadius: 4 }}
    />
  );
}

function SpeedGauge({ value, label, unit, max }) {
  const angle = Math.min(value / (max || 100), 1) * 180;
  const rad = (angle * Math.PI) / 180;
  const theme = useTheme();

  return (
    <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Box sx={{ position: 'relative', width: 200, height: 120, overflow: 'hidden' }}>
        <svg width="200" height="120" viewBox="0 0 200 140">
          <path d="M 20 120 A 80 80 0 0 1 180 120" fill="none" stroke={theme.palette.divider} strokeWidth="12" strokeLinecap="round" />
          <path
            d={`M 20 120 A 80 80 0 0 1 ${20 + 160 * Math.sin(Math.min(rad, Math.PI))} ${120 - 80 + 80 * Math.cos(Math.min(rad, Math.PI))}`}
            fill="none"
            stroke={value > max * 0.7 ? theme.palette.success.main : value > max * 0.3 ? theme.palette.warning.main : theme.palette.primary.main}
            strokeWidth="12"
            strokeLinecap="round"
            style={{ transition: 'all 0.3s ease' }}
          />
          <line
            x1="100" y1="120"
            x2={100 + 65 * Math.sin(Math.min(rad, Math.PI))}
            y2={120 - 65 + 65 * Math.cos(Math.min(rad, Math.PI))}
            stroke={theme.palette.text.primary}
            strokeWidth="2"
            strokeLinecap="round"
            style={{ transition: 'all 0.3s ease' }}
          />
        </svg>
        <Box sx={{
          position: 'absolute', top: 52, left: '50%', transform: 'translateX(-50%)',
          textAlign: 'center'
        }}>
          <Typography variant="h3" sx={{ fontWeight: 700, fontFamily: '"Inter", monospace', lineHeight: 1 }}>
            {typeof value === 'number' ? value.toFixed(1) : '---'}
          </Typography>
          <Typography variant="caption" color="text.secondary">{unit}</Typography>
        </Box>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mt: -1 }}>{label}</Typography>
    </Box>
  );
}

function PingPhase({ done, current }) {
  return (
    <Stack spacing={1} alignItems="center" sx={{ py: 2 }}>
      <CircularProgress size={28} />
      <Typography variant="body1" fontWeight={600}>Measuring Ping</Typography>
      <Typography variant="body2" color="text.secondary">
        Sample {current} of 3
      </Typography>
      {done && (
        <Alert severity="success" icon={false} sx={{ py: 0 }}>
          Ping: {done.toFixed(1)} ms
        </Alert>
      )}
    </Stack>
  );
}

function DownloadPhase({ samples, liveSpeed, progress }) {
  const theme = useTheme();
  return (
    <Stack spacing={2} alignItems="center" sx={{ py: 2 }}>
      <SpeedGauge value={liveSpeed} label="Download Speed" unit="Mbps" max={1000} />
      <Box sx={{ width: '100%', maxWidth: 400 }}>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{ height: 8, borderRadius: 4 }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', textAlign: 'center' }}>
          Sample {samples.length} of {DL_SAMPLES}
        </Typography>
      </Box>
      <Box sx={{ width: '100%', maxWidth: 500 }}>
        <LiveSparkline
          data={samples.map(s => s.Mbps)}
          color={theme.palette.primary.main}
          height={80}
          width={500}
        />
      </Box>
    </Stack>
  );
}

export default function SpeedTestHistory() {
  const theme = useTheme();
  const [history, setHistory] = useState(loadHistory);
  const [phase, setPhase] = useState('idle');
  const [pingSamples, setPingSamples] = useState([]);
  const [dlLiveSamples, setDlLiveSamples] = useState([]);
  const [liveSpeed, setLiveSpeed] = useState(0);
  const [currentPing, setCurrentPing] = useState(0);
  const [testResult, setTestResult] = useState(null);
  const [error, setError] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [continuous, setContinuous] = useState(false);
  const [testInterval, setTestInterval] = useState(DEFAULT_INTERVAL);
  const actionRef = useRef(null);

  const runPing = useCallback(async () => {
    const start = performance.now();
    await fetch(`/logo.png?_t=${Date.now()}`, { method: 'HEAD', cache: 'no-store', mode: 'same-origin' });
    return performance.now() - start;
  }, []);

  const runDownloadSample = useCallback(async () => {
    const start = performance.now();
    const resp = await fetch(`/logo.png?_t=${Date.now()}`, { cache: 'no-store', mode: 'same-origin' });
    const blob = await resp.blob();
    const dur = (performance.now() - start) / 1000;
    const Mbps = (blob.size * 8) / dur / 1_000_000;
    return { Mbps, bytes: blob.size, dur };
  }, []);

  const finishTest = useCallback((pings, dlSamples, partial) => {
    const pingAvg = pings.length ? avg(pings) : 0;
    const jitter = pings.length > 1 ? stddev(pings) : 0;
    const dlAvg = dlSamples.length ? avg(dlSamples.map(r => r.Mbps)) : 0;
    const result = {
      id: genId(),
      timestamp: Date.now(),
      ping: Math.round(pingAvg * 100) / 100,
      download: Math.round(dlAvg * 100) / 100,
      jitter: Math.round(jitter * 100) / 100,
      upload: 'N/A',
      partial,
      dlSamples: dlSamples.map((r, i) => ({ sample: i + 1, speed: Math.round(r.Mbps * 100) / 100 }))
    };
    setTestResult(result);
    setHistory(prev => [result, ...prev].slice(0, MAX_HISTORY));
  }, []);

  const runSingleTest = useCallback(async () => {
    setError(null);
    setDlLiveSamples([]);
    setPingSamples([]);
    setLiveSpeed(0);

    setPhase('ping');
    const pings = [];
    for (let i = 0; i < 3; i++) {
      if (actionRef.current === 'reset') { setPhase('idle'); return 'reset'; }
      if (actionRef.current === 'pause') { finishTest(pings, [], true); setPhase('idle'); return 'pause'; }
      setCurrentPing(i + 1);
      pings.push(await runPing());
      setPingSamples([...pings]);
    }

    setPhase('download');
    const dlSamples = [];
    for (let i = 0; i < DL_SAMPLES; i++) {
      if (actionRef.current === 'reset') { setPhase('idle'); return 'reset'; }
      if (actionRef.current === 'pause') { finishTest(pings, dlSamples, true); setPhase('idle'); return 'pause'; }
      const sample = await runDownloadSample();
      dlSamples.push(sample);
      setDlLiveSamples([...dlSamples]);
      setLiveSpeed(sample.Mbps);
    }

    finishTest(pings, dlSamples, false);
    return 'done';
  }, [runPing, runDownloadSample, finishTest]);

  const sleep = useCallback(ms => new Promise(r => setTimeout(r, ms)), []);

  const handleRunTest = useCallback(async () => {
    actionRef.current = null;
    setContinuous(true);
    setTestResult(null);
    while (actionRef.current === null) {
      const status = await runSingleTest();
      if (actionRef.current === 'pause') break;
      if (status !== 'done') break;
      // wait between tests
      if (testInterval > 0 && actionRef.current === null) {
        setPhase('idle');
        await sleep(testInterval * 1000);
      }
    }
    setContinuous(false);
    if (actionRef.current === 'reset') {
      setPhase('idle');
      setTestResult(null);
      setDlLiveSamples([]);
      setPingSamples([]);
      setLiveSpeed(0);
      setCurrentPing(0);
    }
  }, [runSingleTest, testInterval, sleep]);

  const handlePause = useCallback(() => {
    if (actionRef.current === null) actionRef.current = 'pause';
  }, []);

  const handleReset = useCallback(() => {
    actionRef.current = 'reset';
    setContinuous(false);
    setPhase('idle');
    setTestResult(null);
    setDlLiveSamples([]);
    setPingSamples([]);
    setLiveSpeed(0);
    setCurrentPing(0);
  }, []);

  useEffect(() => { saveHistory(history); }, [history]);

  const handleClear = useCallback(() => {
    setHistory([]);
    setTestResult(null);
    setShowClearConfirm(false);
  }, []);

  const handleExport = useCallback(() => {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `speed-test-history-${Date.now()}.json`;
    a.click(); URL.revokeObjectURL(url);
  }, [history]);

  const stats = useMemo(() => {
    if (history.length === 0) return null;
    const pings = history.map(r => r.ping);
    const dls = history.map(r => r.download);
    return {
      ping: { min: Math.min(...pings), max: Math.max(...pings), avg: avg(pings) },
      download: { min: Math.min(...dls), max: Math.max(...dls), avg: avg(dls) }
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
        {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <Button
            variant="contained"
            startIcon={<ReloadOutlined />}
            onClick={handleRunTest}
            disabled={continuous}
          >
            {continuous ? 'Running...' : 'Run Speed Test'}
          </Button>
          {continuous && (
            <>
              <Button variant="outlined" color="warning" startIcon={<PauseCircleOutlined />}
                onClick={handlePause}>
                Pause
              </Button>
              <Button variant="outlined" color="error" startIcon={<CloseCircleOutlined />}
                onClick={handleReset}>
                Reset
              </Button>
            </>
          )}
          {history.length > 0 && !continuous && (
            <>
              <Button variant="outlined" color="error" startIcon={<DeleteOutlined />}
                onClick={() => setShowClearConfirm(v => !v)}>Clear History</Button>
              <Button variant="outlined" startIcon={<DownloadOutlined />}
                onClick={handleExport}>Export JSON</Button>
            </>
          )}
        </Stack>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={1}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              Test Interval: {testInterval}s
            </Typography>
            <Slider
              size="small"
              value={testInterval}
              onChange={(_, v) => setTestInterval(v)}
              min={0}
              max={120}
              step={1}
              marks={[
                { value: 0, label: 'None' },
                { value: 10, label: '10s' },
                { value: 30, label: '30s' },
                { value: 60, label: '1m' },
                { value: 120, label: '2m' }
              ]}
              disabled={continuous}
            />
          </Stack>
        </Paper>

        {showClearConfirm && (
          <Paper variant="outlined" sx={{ p: 2, borderColor: theme.palette.error.main }}>
            <Typography variant="body2" color="error" gutterBottom>
              Are you sure you want to delete all speed test history? This cannot be undone.
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button size="small" variant="contained" color="error" onClick={handleClear}>Yes, Clear All</Button>
              <Button size="small" variant="outlined" onClick={() => setShowClearConfirm(false)}>Cancel</Button>
            </Stack>
          </Paper>
        )}

        {phase === 'ping' && <PingPhase done={pingSamples.length === 3 ? avg(pingSamples) : null} current={currentPing} />}

        {phase === 'download' && (
          <DownloadPhase
            samples={dlLiveSamples}
            liveSpeed={liveSpeed}
            progress={(dlLiveSamples.length / DL_SAMPLES) * 100}
          />
        )}

        {testResult && phase === 'idle' && (
          <Paper elevation={0} sx={{
            p: 3, background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
            color: '#fff', borderRadius: 2
          }}>
            <Typography variant="overline" sx={{ opacity: 0.8, letterSpacing: 1 }}>Latest Speed Test</Typography>
            <Typography variant="body2" sx={{ opacity: 0.7, mb: 2 }}>{fmtDate(testResult.timestamp)}</Typography>
            <Grid2 container spacing={3}>
              <Grid2 size={{ xs: 6, md: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <ArrowDownOutlined style={{ fontSize: 28, opacity: 0.8 }} />
                  <Typography variant="h3" sx={{ fontWeight: 700, mt: 0.5 }}>
                    {testResult.download}
                    <Typography component="span" variant="body1" sx={{ ml: 0.5, opacity: 0.7 }}>Mbps</Typography>
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>Download</Typography>
                </Box>
              </Grid2>
              <Grid2 size={{ xs: 6, md: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <ArrowUpOutlined style={{ fontSize: 28, opacity: 0.8 }} />
                  <Typography variant="h3" sx={{ fontWeight: 700, mt: 0.5 }}>
                    {testResult.upload}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>Upload</Typography>
                </Box>
              </Grid2>
              <Grid2 size={{ xs: 6, md: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" sx={{ fontWeight: 700, mt: 0.5 }}>
                    {testResult.ping}
                    <Typography component="span" variant="body1" sx={{ ml: 0.5, opacity: 0.7 }}>ms</Typography>
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>Ping</Typography>
                </Box>
              </Grid2>
              <Grid2 size={{ xs: 6, md: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" sx={{ fontWeight: 700, mt: 0.5 }}>
                    {testResult.jitter}
                    <Typography component="span" variant="body1" sx={{ ml: 0.5, opacity: 0.7 }}>ms</Typography>
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>Jitter</Typography>
                </Box>
              </Grid2>
            </Grid2>

            {testResult.dlSamples && testResult.dlSamples.length > 1 && (
              <Box sx={{ mt: 2 }}>
                <Box sx={{ width: '100%', height: 60 }}>
                  <LiveSparkline
                    data={testResult.dlSamples.map(s => s.speed)}
                    color="#fff"
                    height={60}
                    width={600}
                  />
                </Box>
              </Box>
            )}
          </Paper>
        )}

        {history.length > 0 && (
          <>
            {stats && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Summary Statistics</Typography>
                  <Grid2 container spacing={2}>
                    <Grid2 size={{ xs: 12, md: 6 }}>
                      <Paper variant="outlined" sx={{ p: 1.5 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>Ping (ms)</Typography>
                        <Grid2 container>
                          <Grid2 size={4}><StatBox label="Min" value={stats.ping.min.toFixed(1)} unit="ms" color="success.main" /></Grid2>
                          <Grid2 size={4}><StatBox label="Avg" value={stats.ping.avg.toFixed(1)} unit="ms" /></Grid2>
                          <Grid2 size={4}><StatBox label="Max" value={stats.ping.max.toFixed(1)} unit="ms" color="error.main" /></Grid2>
                        </Grid2>
                      </Paper>
                    </Grid2>
                    <Grid2 size={{ xs: 12, md: 6 }}>
                      <Paper variant="outlined" sx={{ p: 1.5 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>Download (Mbps)</Typography>
                        <Grid2 container>
                          <Grid2 size={4}><StatBox label="Min" value={stats.download.min.toFixed(1)} unit="Mbps" color="error.main" /></Grid2>
                          <Grid2 size={4}><StatBox label="Avg" value={stats.download.avg.toFixed(1)} unit="Mbps" /></Grid2>
                          <Grid2 size={4}><StatBox label="Max" value={stats.download.max.toFixed(1)} unit="Mbps" color="success.main" /></Grid2>
                        </Grid2>
                      </Paper>
                    </Grid2>
                  </Grid2>
                </CardContent>
              </Card>
            )}

            {history.length >= 2 && LineChart && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Speed Trend (Last 30 Tests)</Typography>
                  <ChartView history={history} />
                </CardContent>
              </Card>
            )}

            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Test History</Typography>
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
                          <TableCell><Tooltip title={new Date(r.timestamp).toLocaleString()}><span>{fmtDate(r.timestamp)}</span></Tooltip></TableCell>
                          <TableCell align="right">
                            <Chip size="small" label={r.ping}
                              color={r.ping < 50 ? 'success' : r.ping < 150 ? 'warning' : 'error'} variant="outlined" />
                          </TableCell>
                          <TableCell align="right">{r.download}</TableCell>
                          <TableCell align="right">{r.jitter}</TableCell>
                          <TableCell align="right">{r.upload}</TableCell>
                        </TableRow>
                      ))}
                      {paginatedHistory.length === 0 && (
                        <TableRow><TableCell colSpan={5} align="center"><Typography color="text.secondary">No results on this page.</Typography></TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                {totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 2, gap: 1 }}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select value={page} onChange={(e) => setPage(Number(e.target.value))}>
                        {Array.from({ length: totalPages }, (_, i) => (
                          <MenuItem key={i} value={i}>Page {i + 1} of {totalPages}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Button size="small" disabled={page <= 0} onClick={() => setPage(p => Math.max(0, p - 1))}>Prev</Button>
                    <Button size="small" disabled={page >= totalPages - 1} onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}>Next</Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {history.length === 0 && !continuous && phase === 'idle' && !testResult && (
          <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
            <LineChartOutlined style={{ fontSize: 48, opacity: 0.3 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>No speed tests recorded yet</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Click "Run Speed Test" to measure your network performance.
            </Typography>
          </Paper>
        )}
      </Stack>
    </MainCard>
  );
}

function StatBox({ label, value, unit, color }) {
  return (
    <Box sx={{ textAlign: 'center', p: 1 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>{label}</Typography>
      <Typography variant="h4" color={color || 'text.primary'} sx={{ fontWeight: 700, mt: 0.5 }}>
        {value}
        <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>{unit}</Typography>
      </Typography>
    </Box>
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

  if (!LineChart || history.length < 2) return null;

  return (
    <Box sx={{ width: '100%', height: 300 }}>
      <LineChart
        series={[
          { data: chartData.ping, label: 'Ping (ms)', color: theme.palette.warning.main, yAxisKey: 'ping' },
          { data: chartData.download, label: 'Download (Mbps)', color: theme.palette.success.main, yAxisKey: 'download' }
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
