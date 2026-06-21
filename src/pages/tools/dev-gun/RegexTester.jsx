import { useState, useMemo, useCallback } from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';

import { AuditOutlined, CopyOutlined, ClearOutlined, SwapOutlined } from '@ant-design/icons';

import MainCard from 'components/MainCard';

const FLAGS = [
  { key: 'g', label: 'g', tooltip: 'Global' },
  { key: 'i', label: 'i', tooltip: 'Case insensitive' },
  { key: 'm', label: 'm', tooltip: 'Multiline' },
  { key: 's', label: 's', tooltip: 'Dotall' },
  { key: 'u', label: 'u', tooltip: 'Unicode' },
  { key: 'y', label: 'y', tooltip: 'Sticky' }
];

const DEFAULT_TEST = `The quick brown fox jumps over the lazy dog.
Contact: support@example.com or hello@world.com
Date: 2024-06-21, another date: 2025-01-15
Call +1-555-123-4567 or +44 20 7946 0958
Visit https://example.com/path?q=search#anchor
IP: 192.168.1.1, 10.0.0.255
The quick brown fox jumps again!`;

export default function RegexTester() {
  const theme = useTheme();
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState(['g']);
  const [testString, setTestString] = useState(DEFAULT_TEST);
  const [replaceText, setReplaceText] = useState('');
  const [showReplace, setShowReplace] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleFlagsChange = (_, newFlags) => {
    if (newFlags?.length) setFlags(newFlags);
  };

  const regex = useMemo(() => {
    if (!pattern.trim()) return null;
    try {
      return new RegExp(pattern, flags.join(''));
    } catch {
      return null;
    }
  }, [pattern, flags]);

  const regexError = useMemo(() => {
    if (!pattern.trim()) return null;
    try {
      new RegExp(pattern, flags.join(''));
      return null;
    } catch (e) {
      return e.message;
    }
  }, [pattern, flags]);

  const matches = useMemo(() => {
    if (!regex || !testString) return [];
    const results = [];
    try {
      if (flags.includes('g')) {
        let m;
        while ((m = regex.exec(testString)) !== null) {
          results.push({ match: m[0], index: m.index, groups: m.groups, all: [...m] });
          if (m.index === regex.lastIndex) regex.lastIndex++;
        }
      } else {
        const m = regex.exec(testString);
        if (m) results.push({ match: m[0], index: m.index, groups: m.groups, all: [...m] });
      }
    } catch {}
    return results;
  }, [regex, testString, flags]);

  const highlighted = useMemo(() => {
    if (!regex || !testString || matches.length === 0) return null;
    const segments = [];
    let lastEnd = 0;
    for (const m of matches) {
      if (m.index > lastEnd)
        segments.push({ text: testString.slice(lastEnd, m.index), match: false });
      segments.push({ text: m.match, match: true, index: m.index });
      lastEnd = m.index + m.match.length;
    }
    if (lastEnd < testString.length)
      segments.push({ text: testString.slice(lastEnd), match: false });
    return segments;
  }, [regex, testString, matches]);

  const replaceResult = useMemo(() => {
    if (!regex || !testString) return '';
    try {
      return testString.replace(regex, replaceText);
    } catch {
      return '';
    }
  }, [regex, testString, replaceText]);

  const handleClear = () => {
    setPattern('');
    setFlags(['g']);
    setTestString(DEFAULT_TEST);
    setReplaceText('');
  };

  const handleCopyResult = useCallback(() => {
    navigator.clipboard.writeText(replaceResult || testString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [replaceResult, testString]);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" gap={1.5} sx={{ mb: 1 }}>
          <AuditOutlined style={{ fontSize: 28, color: theme.palette.primary.main }} />
          <Typography variant="h3" fontWeight="bold">
            Regex Tester
          </Typography>
        </Stack>
        <Typography variant="body1" color="text.secondary">
          Test regular expressions in real-time against sample text. Supports all standard flags, group capture, and replace.
        </Typography>
      </Box>

      <MainCard sx={{ mb: 3 }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <TextField
              size="small"
              placeholder="/pattern/flags or just the pattern"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              sx={{ flex: 1, minWidth: 200 }}
              InputProps={{
                sx: { fontFamily: '"Courier New", Courier, monospace' }
              }}
            />
            <ToggleButtonGroup value={flags} onChange={handleFlagsChange} size="small" aria-label="regex flags">
              {FLAGS.map((f) => (
                <ToggleButton key={f.key} value={f.key} sx={{ px: 1.5 }}>
                  <Tooltip title={f.tooltip}>
                    <Typography variant="caption" fontWeight={700}>{f.label}</Typography>
                  </Tooltip>
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Stack>

          {regexError && (
            <Alert severity="error" sx={{ py: 0, '& .MuiAlert-message': { py: 0.5 } }}>
              {regexError}
            </Alert>
          )}
        </Stack>
      </MainCard>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: showReplace ? 7 : 12 }}>
          <MainCard
            title={
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ width: '100%' }}>
                <Typography variant="h5" fontWeight="600">
                  Test String
                </Typography>
                <Stack direction="row" gap={1} alignItems="center">
                  <Chip
                    label={`${matches.length} match${matches.length !== 1 ? 'es' : ''}`}
                    size="small"
                    color={matches.length > 0 ? 'primary' : 'default'}
                    variant={matches.length > 0 ? 'filled' : 'outlined'}
                  />
                  <Tooltip title="Copy test string">
                    <IconButton size="small" onClick={() => { navigator.clipboard.writeText(testString); }}>
                      <CopyOutlined />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Clear">
                    <IconButton size="small" onClick={handleClear}>
                      <ClearOutlined />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
            }
            sx={{ height: '100%' }}
          >
            {highlighted ? (
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  minHeight: 320,
                  fontFamily: '"Courier New", Courier, monospace',
                  fontSize: '0.85rem',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  maxHeight: 400,
                  overflow: 'auto'
                }}
              >
                {highlighted.map((seg, i) => (
                  <Box
                    key={i}
                    component="span"
                    sx={{
                      bgcolor: seg.match ? 'primary.light' : 'transparent',
                      color: seg.match ? 'primary.contrastText' : 'inherit',
                      borderRadius: '2px',
                      px: seg.match ? 0.25 : 0
                    }}
                  >
                    {seg.text}
                  </Box>
                ))}
              </Paper>
            ) : (
              <TextField
                fullWidth
                multiline
                rows={12}
                value={testString}
                onChange={(e) => setTestString(e.target.value)}
                placeholder="Enter test string here..."
                InputProps={{
                  sx: { fontFamily: '"Courier New", Courier, monospace', fontSize: '0.85rem' }
                }}
              />
            )}

            {matches.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Match Details
                </Typography>
                <Paper variant="outlined" sx={{ maxHeight: 200, overflow: 'auto', p: 1 }}>
                  {matches.slice(0, 200).map((m, i) => (
                    <Stack key={i} direction="row" spacing={1} sx={{ py: 0.25, fontSize: '0.8rem', fontFamily: 'monospace' }}>
                      <Chip label={`#${i}`} size="small" sx={{ height: 18, fontSize: '0.65rem', minWidth: 28 }} />
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary', minWidth: 60 }}>
                        pos {m.index}
                      </Typography>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600 }} noWrap>
                        &ldquo;{m.match.length > 80 ? m.match.slice(0, 80) + '...' : m.match}&rdquo;
                      </Typography>
                      {m.groups && Object.keys(m.groups).length > 0 && (
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }} noWrap>
                          groups: {JSON.stringify(m.groups)}
                        </Typography>
                      )}
                    </Stack>
                  ))}
                  {matches.length > 200 && (
                    <Typography variant="caption" color="text.secondary">
                      ...and {matches.length - 200} more matches
                    </Typography>
                  )}
                </Paper>
              </Box>
            )}
          </MainCard>
        </Grid>

        {showReplace && (
          <Grid size={{ xs: 12, md: 5 }}>
            <MainCard
              title={
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ width: '100%' }}>
                  <Typography variant="h5" fontWeight="600">
                    Replace
                  </Typography>
                  <Stack direction="row" gap={0.5}>
                    <Tooltip title={copied ? 'Copied!' : 'Copy result'}>
                      <IconButton size="small" onClick={handleCopyResult}>
                        <CopyOutlined />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
              }
              sx={{ height: '100%' }}
            >
              <TextField
                fullWidth
                size="small"
                placeholder="Replacement text (use $1, $&, $` etc.)"
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                  sx: { fontFamily: '"Courier New", Courier, monospace' }
                }}
              />
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  minHeight: 320,
                  fontFamily: '"Courier New", Courier, monospace',
                  fontSize: '0.85rem',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  maxHeight: 400,
                  overflow: 'auto',
                  bgcolor: 'action.hover'
                }}
              >
                {replaceResult || (
                  <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                    Replace result will appear here...
                  </Typography>
                )}
              </Paper>
            </MainCard>
          </Grid>
        )}
      </Grid>

      <Stack direction="row" spacing={1.5} sx={{ mt: 3, justifyContent: 'flex-end' }}>
        <Button
          variant={showReplace ? 'outlined' : 'contained'}
          size="small"
          startIcon={<SwapOutlined />}
          onClick={() => setShowReplace((v) => !v)}
        >
          {showReplace ? 'Hide Replace' : 'Replace'}
        </Button>
        <Button variant="outlined" color="error" size="small" startIcon={<ClearOutlined />} onClick={handleClear}>
          Reset
        </Button>
      </Stack>
    </Box>
  );
}