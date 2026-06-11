import { useState, useEffect, useCallback } from 'react';
import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';
import cmykPlugin from 'colord/plugins/cmyk';
import hwbPlugin from 'colord/plugins/hwb';
import a11yPlugin from 'colord/plugins/a11y';

extend([namesPlugin, cmykPlugin, hwbPlugin, a11yPlugin]);

// material-ui
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Snackbar from '@mui/material/Snackbar';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

// icons
import { BgColorsOutlined, CopyOutlined } from '@ant-design/icons';

// project imports
import MainCard from 'components/MainCard';

// ==============================|| COLOR CONVERTER ||============================== //

export default function ColorConverter() {
  const theme = useTheme();
  
  const [inputColor, setInputColor] = useState('#1890ff');
  const [parsedColor, setParsedColor] = useState(colord('#1890ff'));
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');

  // Handle color change from any input
  const handleColorChange = useCallback((value) => {
    setInputColor(value);
    const color = colord(value);
    if (color.isValid()) {
      setParsedColor(color);
    }
  }, []);

  useEffect(() => {
    handleColorChange(inputColor);
  }, [inputColor, handleColorChange]);

  const handleCopy = (text, format) => {
    navigator.clipboard.writeText(text).then(() => {
      setSnackMsg(`${format} copied to clipboard!`);
      setSnackOpen(true);
    });
  };

  const ColorField = ({ label, value, format }) => (
    <TextField
      fullWidth
      label={label}
      value={value}
      onChange={(e) => handleColorChange(e.target.value)}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton edge="end" onClick={() => handleCopy(value, format)} size="small" title="Copy to clipboard">
              <CopyOutlined />
            </IconButton>
          </InputAdornment>
        ),
        sx: { fontFamily: 'monospace' }
      }}
    />
  );

  const isLight = parsedColor.isLight();
  const textColor = isLight ? '#000000' : '#ffffff';

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" gap={1.5} sx={{ mb: 1 }}>
          <BgColorsOutlined style={{ fontSize: 28, color: theme.palette.primary.main }} />
          <Typography variant="h3" fontWeight="bold">
            Color Converter
          </Typography>
        </Stack>
        <Typography variant="body1" color="text.secondary">
          Instantly convert colors between HEX, RGB, HSL, HSV, CMYK, and CSS Names. Edit any field to see live updates.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column: Visuals & Picker */}
        <Grid size={{ xs: 12, md: 5 }}>
          <MainCard title="Color Preview" sx={{ height: '100%' }}>
            <Box
              sx={{
                width: '100%',
                height: 200,
                borderRadius: 2,
                bgcolor: parsedColor.toHex(),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                transition: 'background-color 0.2s',
                boxShadow: theme.customShadows?.z1 || 1,
                mb: 3,
                border: '1px solid',
                borderColor: theme.palette.divider
              }}
            >
              <Typography variant="h3" sx={{ color: textColor, textTransform: 'uppercase', fontWeight: 'bold' }}>
                {parsedColor.toHex()}
              </Typography>
              {parsedColor.toName() && (
                <Typography variant="h6" sx={{ color: textColor, mt: 1, opacity: 0.8 }}>
                  {parsedColor.toName()}
                </Typography>
              )}
            </Box>

            <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1.5 }}>
              Native Color Picker
            </Typography>
            <Box
              component="input"
              type="color"
              value={parsedColor.toHex()}
              onChange={(e) => handleColorChange(e.target.value)}
              sx={{
                width: '100%',
                height: 50,
                p: 0,
                border: 'none',
                borderRadius: 1,
                cursor: 'pointer',
                bgcolor: 'transparent'
              }}
            />
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1.5 }}>
              Color Analysis
            </Typography>
            <Stack spacing={1.5}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Brightness</Typography>
                <Typography variant="body2" fontWeight="600">{(parsedColor.brightness() * 100).toFixed(0)}%</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Luminance</Typography>
                <Typography variant="body2" fontWeight="600">{(parsedColor.luminance() * 100).toFixed(0)}%</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Contrast (on white)</Typography>
                <Typography variant="body2" fontWeight="600">{parsedColor.contrast().toFixed(2)}:1</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Contrast (on black)</Typography>
                <Typography variant="body2" fontWeight="600">{parsedColor.contrast('#000000').toFixed(2)}:1</Typography>
              </Box>
            </Stack>
          </MainCard>
        </Grid>

        {/* Right Column: Conversions */}
        <Grid size={{ xs: 12, md: 7 }}>
          <MainCard title="Formats & Conversions" sx={{ height: '100%' }}>
            <Stack spacing={3}>
              <ColorField 
                label="HEX" 
                value={parsedColor.toHex()} 
                format="HEX" 
              />
              <ColorField 
                label="RGB" 
                value={parsedColor.toRgbString()} 
                format="RGB" 
              />
              <ColorField 
                label="HSL" 
                value={parsedColor.toHslString()} 
                format="HSL" 
              />
              <ColorField 
                label="HSV" 
                value={`hsv(${parsedColor.toHsv().h.toFixed(0)}, ${parsedColor.toHsv().s.toFixed(0)}%, ${parsedColor.toHsv().v.toFixed(0)}%)`} 
                format="HSV" 
              />
              <ColorField 
                label="HWB" 
                value={parsedColor.toHwbString()} 
                format="HWB" 
              />
              <ColorField 
                label="CMYK" 
                value={parsedColor.toCmykString()} 
                format="CMYK" 
              />
              <ColorField 
                label="CSS Name" 
                value={parsedColor.toName() || 'No exact match'} 
                format="CSS Name" 
              />
            </Stack>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1.5 }}>
              Variations
            </Typography>
            <Grid container spacing={1}>
              <Grid size={4}>
                <Box sx={{ p: 1, bgcolor: parsedColor.lighten(0.2).toHex(), color: parsedColor.lighten(0.2).isLight() ? '#000' : '#fff', borderRadius: 1, textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>Lighter</Typography>
                  <Typography variant="caption" fontWeight="bold">{parsedColor.lighten(0.2).toHex()}</Typography>
                </Box>
              </Grid>
              <Grid size={4}>
                <Box sx={{ p: 1, bgcolor: parsedColor.toHex(), color: textColor, borderRadius: 1, textAlign: 'center', border: '1px solid', borderColor: theme.palette.divider }}>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>Base</Typography>
                  <Typography variant="caption" fontWeight="bold">{parsedColor.toHex()}</Typography>
                </Box>
              </Grid>
              <Grid size={4}>
                <Box sx={{ p: 1, bgcolor: parsedColor.darken(0.2).toHex(), color: parsedColor.darken(0.2).isLight() ? '#000' : '#fff', borderRadius: 1, textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>Darker</Typography>
                  <Typography variant="caption" fontWeight="bold">{parsedColor.darken(0.2).toHex()}</Typography>
                </Box>
              </Grid>
            </Grid>
          </MainCard>
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
    </Box>
  );
}
