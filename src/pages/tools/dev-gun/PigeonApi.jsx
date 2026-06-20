import React, { useState } from 'react';
import {
  Box,
  Button,
  Grid,
  MenuItem,
  Select,
  TextField,
  Typography,
  Paper,
  CircularProgress,
  Chip,
  Alert,
  Tooltip,
  IconButton
} from '@mui/material';
import { CopyOutlined, ClearOutlined, SendOutlined } from '@ant-design/icons';
import MainCard from 'components/MainCard';

const METHOD_COLORS = {
  GET: '#4caf50',
  POST: '#2196f3',
  PUT: '#ff9800',
  PATCH: '#9c27b0',
  DELETE: '#f44336'
};

const PLACEHOLDER_HEADERS = `Authorization: Bearer your_token\nContent-Type: application/json\nAccept: application/json`;
const PLACEHOLDER_BODY = `{\n  "key": "value"\n}`;

const PigeonApi = () => {
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('');
  const [headers, setHeaders] = useState('');
  const [body, setBody] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const parseHeaders = (raw) => {
    const result = {};
    raw.split('\n').forEach((line) => {
      const [key, ...val] = line.split(':');
      if (key && val.length) result[key.trim()] = val.join(':').trim();
    });
    return result;
  };

  const handleSend = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setResponse(null);
    try {
      const parsedHeaders = headers.trim() ? parseHeaders(headers) : {};
      const options = { method, headers: parsedHeaders };
      if (['POST', 'PUT', 'PATCH'].includes(method) && body.trim()) {
        options.body = body;
      }
      const startTime = performance.now();
      const res = await window.fetch(url, options);
      const endTime = performance.now();
      const text = await res.text();
      let formatted = text;
      try { formatted = JSON.stringify(JSON.parse(text), null, 2); } catch (_) {}
      setResponse({
        status: res.status,
        statusText: res.statusText,
        time: Math.round(endTime - startTime),
        size: new Blob([text]).size,
        data: formatted
      });
    } catch (err) {
      setResponse({ status: 'Error', statusText: err.message, time: 0, size: 0, data: '' });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (response?.data) {
      navigator.clipboard.writeText(response.data);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClear = () => {
    setUrl('');
    setHeaders('');
    setBody('');
    setResponse(null);
  };

  const isSuccess = typeof response?.status === 'number' && response.status >= 200 && response.status < 300;

  return (
    <MainCard title="🐦 Pigeon API">
      <Typography variant="body2" color="textSecondary" mb={2}>
        Browser-based API testing client. Send HTTP requests directly from the browser.{' '}
        <strong>Note:</strong> requests are subject to browser CORS restrictions. Use the{' '}
        <strong>Desktop Edition</strong> for CORS-free requests via the native Rust backend.
      </Typography>

      <Alert severity="info" sx={{ mb: 3, fontSize: '0.8rem' }}>
        💡 If a request fails with a network error, the target API may not allow cross-origin requests.
        Try using a CORS proxy or switch to the <strong>OpenSpace Desktop App</strong> for unrestricted access.
      </Alert>

      <Grid container spacing={2}>
        {/* URL Row */}
        <Grid item xs={12}>
          <Box display="flex" gap={1} alignItems="center">
            <Select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              size="small"
              sx={{
                minWidth: 105,
                fontWeight: 'bold',
                color: METHOD_COLORS[method],
                '& .MuiOutlinedInput-notchedOutline': { borderColor: METHOD_COLORS[method] },
              }}
            >
              {Object.keys(METHOD_COLORS).map((m) => (
                <MenuItem key={m} value={m} sx={{ color: METHOD_COLORS[m], fontWeight: 'bold' }}>{m}</MenuItem>
              ))}
            </Select>
            <TextField
              fullWidth
              size="small"
              placeholder="https://api.example.com/v1/users"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              InputProps={{ sx: { fontFamily: 'monospace' } }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleSend}
              disabled={loading || !url.trim()}
              startIcon={loading ? null : <SendOutlined />}
              sx={{ minWidth: 100, whiteSpace: 'nowrap' }}
            >
              {loading ? <CircularProgress size={20} color="inherit" /> : 'Send'}
            </Button>
            <Tooltip title="Clear all">
              <IconButton onClick={handleClear} color="default" size="small">
                <ClearOutlined />
              </IconButton>
            </Tooltip>
          </Box>
        </Grid>

        {/* Headers */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" gutterBottom fontWeight="bold">
            Headers
          </Typography>
          <Typography variant="caption" color="textSecondary" display="block" mb={0.5}>
            One per line — Key: Value
          </Typography>
          <TextField
            multiline
            rows={6}
            fullWidth
            placeholder={PLACEHOLDER_HEADERS}
            value={headers}
            onChange={(e) => setHeaders(e.target.value)}
            InputProps={{ sx: { fontFamily: 'monospace', fontSize: '0.82rem' } }}
          />
        </Grid>

        {/* Body */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" gutterBottom fontWeight="bold">
            Request Body
          </Typography>
          <Typography variant="caption" color="textSecondary" display="block" mb={0.5}>
            {['GET', 'DELETE'].includes(method) ? 'Not applicable for ' + method : 'JSON / raw body'}
          </Typography>
          <TextField
            multiline
            rows={6}
            fullWidth
            placeholder={PLACEHOLDER_BODY}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={['GET', 'DELETE'].includes(method)}
            InputProps={{ sx: { fontFamily: 'monospace', fontSize: '0.82rem' } }}
          />
        </Grid>

        {/* Response */}
        <Grid item xs={12}>
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              mt: 1,
              minHeight: 280,
              backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#0d1117' : '#1e1e1e',
              color: '#d4d4d4',
              overflowX: 'auto',
              position: 'relative'
            }}
          >
            {/* Response header bar */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="subtitle1" fontWeight="bold" color="#d4d4d4">
                Response
              </Typography>
              <Box display="flex" gap={1} alignItems="center">
                {response && (
                  <>
                    <Chip
                      label={`${response.status} ${response.statusText || ''}`}
                      color={isSuccess ? 'success' : 'error'}
                      size="small"
                    />
                    <Chip
                      label={`${response.time} ms`}
                      size="small"
                      sx={{ backgroundColor: '#30363d', color: '#8b949e' }}
                    />
                    {response.size > 0 && (
                      <Chip
                        label={response.size < 1024 ? `${response.size} B` : `${(response.size / 1024).toFixed(1)} KB`}
                        size="small"
                        sx={{ backgroundColor: '#30363d', color: '#8b949e' }}
                      />
                    )}
                    <Tooltip title={copied ? 'Copied!' : 'Copy response'}>
                      <IconButton size="small" onClick={handleCopy} sx={{ color: '#8b949e' }}>
                        <CopyOutlined />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </Box>
            </Box>

            {/* Response body */}
            {response ? (
              <pre style={{
                margin: 0,
                fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                fontSize: '0.82rem',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: isSuccess ? '#d4d4d4' : '#f85149'
              }}>
                {response.data || response.statusText}
              </pre>
            ) : (
              <Typography
                variant="body2"
                sx={{ color: '#484f58', fontStyle: 'italic', mt: 4, textAlign: 'center' }}
              >
                Enter a URL and press Send to see the response here.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </MainCard>
  );
};

export default PigeonApi;
