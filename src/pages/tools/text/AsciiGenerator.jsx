import { useState, useCallback, useEffect } from 'react';
import figlet from 'figlet';

// material-ui
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Slider from '@mui/material/Slider';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';

// icons
import {
  CopyOutlined,
  DownloadOutlined,
  ClearOutlined,
  SyncOutlined,
  FontSizeOutlined
} from '@ant-design/icons';

// project imports
import MainCard from 'components/MainCard';

// Figlet fonts available via CDN (loaded dynamically)
const FONTS = [
  'Standard',
  'Big',
  'Block',
  'Banner',
  'Banner3',
  'Banner4',
  'Slant',
  'Shadow',
  'Speed',
  'Doom',
  'Ogre',
  'Colossal',
  'Roman',
  'Star Wars',
  'Graffiti',
  'Bubble',
  'Digital',
  'Alligator',
  'Alligator2',
  'Lean',
  'Small',
  'Mini',
  'Isometric1',
  'Isometric2',
  'Isometric3',
  'Isometric4',
  'Larry 3D',
  'Larry 3D 2',
  'DOS Rebel',
  'Epic',
  'Chunky',
  'Doh',
  'Electronic',
  'Elite',
  'Fuzzy',
  'Ghost',
  'Gothic',
  'Hollywood',
  'Italic',
  'Jacky',
  'Keyboard',
  'LCD',
  'Letters',
  'Linux',
  'Modular',
  'NScript',
  'Puffy',
  'Rammstein',
  'Rebel',
  'Script',
  'Soft',
  'Stick Letters',
  'Stop',
  'Thick',
  'Train',
  'Trek',
  'Twisted',
  'Univers',
  'Varsity',
  'Whimsy'
];

const FONT_CDN_BASE = 'https://unpkg.com/figlet@1.8.0/fonts/';

// Load a figlet font from CDN
function loadFont(fontName) {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (figlet.defaults.fonts && figlet.defaults.fonts[fontName]) {
      return resolve();
    }
    // Font filenames use spaces (URL-encoded), not underscores
    const fontFile = encodeURIComponent(fontName);
    fetch(`${FONT_CDN_BASE}${fontFile}.flf`)
      .then((res) => {
        if (!res.ok) throw new Error(`Font not found: ${fontName}`);
        return res.text();
      })
      .then((fontData) => {
        figlet.parseFont(fontName, fontData);
        resolve();
      })
      .catch(reject);
  });
}

// ==============================|| ASCII WORD ART GENERATOR ||============================== //

export default function AsciiGenerator() {
  const theme = useTheme();

  const [text, setText] = useState('OpenSpace');
  const [font, setFont] = useState('Standard');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fontSize, setFontSize] = useState(13);
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');

  const generateAscii = useCallback(async () => {
    if (!text.trim()) {
      setOutput('');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await loadFont(font);
      figlet.text(text, { font }, (err, result) => {
        if (err || !result) {
          setError(`Could not generate art for font "${font}". Try another font.`);
          setOutput('');
        } else {
          setOutput(result);
        }
        setLoading(false);
      });
    } catch (e) {
      setError(`Failed to load font "${font}". ${e.message}`);
      setLoading(false);
    }
  }, [text, font]);

  // Auto-generate whenever text or font changes
  useEffect(() => {
    const timer = setTimeout(() => {
      generateAscii();
    }, 400);
    return () => clearTimeout(timer);
  }, [generateAscii]);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output).then(() => {
      setSnackMsg('Copied to clipboard!');
      setSnackOpen(true);
    });
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ascii-art-${font.toLowerCase().replace(/ /g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setSnackMsg('Downloaded as .txt file!');
    setSnackOpen(true);
  };

  const handleClear = () => {
    setText('');
    setOutput('');
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" gap={1.5} sx={{ mb: 1 }}>
          <FontSizeOutlined style={{ fontSize: 28, color: theme.palette.primary.main }} />
          <Typography variant="h3" fontWeight="bold">
            ASCII Word Art Generator
          </Typography>
        </Stack>
        <Typography variant="body1" color="text.secondary">
          Convert your text into stunning ASCII art banners. Choose from 30+ fonts, preview in real-time, and copy or download your art.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Controls panel */}
        <Grid size={{ xs: 12, md: 4 }}>
          <MainCard title="Settings" sx={{ height: '100%' }}>
            <Stack spacing={3}>
              {/* Text Input */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }} fontWeight="600">
                  Your Text
                </Typography>
                <TextField
                  fullWidth
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type something..."
                  multiline
                  rows={3}
                  inputProps={{ maxLength: 100 }}
                  helperText={`${text.length}/100 characters`}
                />
              </Box>

              <Divider />

              {/* Font Selector */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }} fontWeight="600">
                  Font Style
                </Typography>
                <FormControl fullWidth>
                  <InputLabel>Select Font</InputLabel>
                  <Select
                    value={font}
                    label="Select Font"
                    onChange={(e) => setFont(e.target.value)}
                  >
                    {FONTS.map((f) => (
                      <MenuItem key={f} value={f}>
                        {f}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {['Standard', 'Big', 'Doom', 'Slant', 'Star Wars'].map((f) => (
                    <Chip
                      key={f}
                      label={f}
                      size="small"
                      clickable
                      color={font === f ? 'primary' : 'default'}
                      variant={font === f ? 'filled' : 'outlined'}
                      onClick={() => setFont(f)}
                    />
                  ))}
                </Box>
              </Box>

              <Divider />

              {/* Preview Font Size */}
              <Box>
                <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                  Preview Font Size: {fontSize}px
                </Typography>
                <Slider
                  value={fontSize}
                  min={8}
                  max={20}
                  step={1}
                  onChange={(_, val) => setFontSize(val)}
                  marks={[
                    { value: 8, label: '8' },
                    { value: 14, label: '14' },
                    { value: 20, label: '20' }
                  ]}
                />
              </Box>

              <Divider />

              {/* Action Buttons */}
              <Stack spacing={1.5}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<SyncOutlined />}
                  onClick={generateAscii}
                  disabled={loading || !text.trim()}
                >
                  {loading ? 'Generating...' : 'Generate'}
                </Button>
                <Stack direction="row" spacing={1}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<CopyOutlined />}
                    onClick={handleCopy}
                    disabled={!output}
                  >
                    Copy
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="secondary"
                    startIcon={<DownloadOutlined />}
                    onClick={handleDownload}
                    disabled={!output}
                  >
                    Download
                  </Button>
                </Stack>
                <Button
                  fullWidth
                  variant="text"
                  color="error"
                  startIcon={<ClearOutlined />}
                  onClick={handleClear}
                >
                  Clear
                </Button>
              </Stack>
            </Stack>
          </MainCard>
        </Grid>

        {/* Output Panel */}
        <Grid size={{ xs: 12, md: 8 }}>
          <MainCard
            title="Preview"
            secondary={
              output && (
                <Tooltip title="Copy to clipboard">
                  <IconButton size="small" onClick={handleCopy}>
                    <CopyOutlined />
                  </IconButton>
                </Tooltip>
              )
            }
            sx={{ height: '100%' }}
          >
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {loading && !output && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
                <Typography color="text.secondary">Generating ASCII art...</Typography>
              </Box>
            )}

            {!loading && !output && !error && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 300,
                  opacity: 0.4
                }}
              >
                <FontSizeOutlined style={{ fontSize: 48 }} />
                <Typography variant="h6" sx={{ mt: 2 }}>
                  Your ASCII art will appear here
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Type text and select a font to get started
                </Typography>
              </Box>
            )}

            {output && (
              <Box
                sx={{
                  position: 'relative',
                  bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: theme.palette.divider,
                  p: 2,
                  overflow: 'auto'
                }}
              >
                <pre
                  style={{
                    fontFamily: '"Courier New", Courier, monospace',
                    fontSize: `${fontSize}px`,
                    lineHeight: 1.3,
                    margin: 0,
                    color: theme.palette.primary.main,
                    whiteSpace: 'pre',
                    tabSize: 4
                  }}
                >
                  {output}
                </pre>
              </Box>
            )}

            {/* Info chips */}
            {output && (
              <Stack direction="row" gap={1} sx={{ mt: 2, flexWrap: 'wrap' }}>
                <Chip label={`Font: ${font}`} size="small" variant="outlined" />
                <Chip label={`${output.split('\n').length} lines`} size="small" variant="outlined" />
                <Chip label={`${output.length} characters`} size="small" variant="outlined" />
                <Chip label={`Width: ~${output.split('\n').reduce((max, l) => Math.max(max, l.length), 0)} chars`} size="small" variant="outlined" />
              </Stack>
            )}
          </MainCard>
        </Grid>
      </Grid>

      {/* Snackbar */}
      <Snackbar
        open={snackOpen}
        autoHideDuration={2500}
        onClose={() => setSnackOpen(false)}
        message={snackMsg}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      />
    </Box>
  );
}
