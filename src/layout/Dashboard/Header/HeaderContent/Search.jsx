import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// material-ui
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';

// assets
import SearchOutlined from '@ant-design/icons/SearchOutlined';
import {
  BgColorsOutlined,
  KeyOutlined,
  SafetyCertificateOutlined,
  FilePdfOutlined,
  FontColorsOutlined,
  SmileOutlined,
  NumberOutlined,
  FileTextOutlined
} from '@ant-design/icons';

// list of tools
const TOOLS = [
  { name: 'Password Generator', desc: 'Generate secure random passwords', path: '/tools/crypto/password-generator', category: 'CryptOK', icon: <KeyOutlined /> },
  { name: 'Password Analyzer', desc: 'Check password strength & crack time', path: '/tools/crypto/password-analyzer', category: 'CryptOK', icon: <SafetyCertificateOutlined /> },
  { name: 'PDF Signature Checker', desc: 'Validate digital signatures in PDFs', path: '/tools/crypto/pdf-signature-checker', category: 'CryptOK', icon: <FilePdfOutlined /> },
  { name: 'Color Converter', desc: 'Convert colors between HEX, RGB, HSL, CMYK...', path: '/tools/conversion/color-converter', category: 'Conversion Tools', icon: <BgColorsOutlined /> },
  { name: 'ASCII Art Generator', desc: 'Convert text into ASCII art banners', path: '/tools/text/ascii-generator', category: 'Text Tools', icon: <FontColorsOutlined /> },
  { name: 'Emoji Picker', desc: 'Search and copy emojis easily', path: '/tools/text/emoji-picker', category: 'Text Tools', icon: <SmileOutlined /> },
  { name: 'Text to Binary', desc: 'Convert text to binary and vice versa', path: '/tools/conversion/text-to-binary', category: 'Conversion Tools', icon: <NumberOutlined /> },
  { name: 'Markdown to HTML', desc: 'Live preview Markdown parser', path: '/tools/conversion/markdown-to-html', category: 'Conversion Tools', icon: <FileTextOutlined /> }
];

export default function Search() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef(null);

  // Filter tools based on query
  const filteredTools = TOOLS.filter(
    (tool) =>
      tool.name.toLowerCase().includes(query.toLowerCase()) ||
      tool.desc.toLowerCase().includes(query.toLowerCase()) ||
      tool.category.toLowerCase().includes(query.toLowerCase())
  );

  // Handle keyboard shortcut Ctrl+K
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleOpen = () => {
    setOpen(true);
    setQuery('');
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSelect = (path) => {
    navigate(path);
    handleClose();
  };

  // Keyboard navigation within Dialog
  const handleDialogKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredTools.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredTools.length) % filteredTools.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (filteredTools[selectedIndex]) {
        handleSelect(filteredTools[selectedIndex].path);
      }
    } else if (event.key === 'Escape') {
      handleClose();
    }
  };

  return (
    <Box sx={{ width: '100%', ml: { xs: 0, md: 1 } }}>
      {/* Header Search Trigger */}
      <FormControl sx={{ width: { xs: '100%', md: 224 } }}>
        <OutlinedInput
          size="small"
          id="header-search"
          onClick={handleOpen}
          readOnly
          startAdornment={
            <InputAdornment position="start" sx={{ mr: -0.5 }}>
              <SearchOutlined />
            </InputAdornment>
          }
          placeholder="Ctrl + K"
          sx={{ cursor: 'pointer', '& input': { cursor: 'pointer' } }}
        />
      </FormControl>

      {/* Command Palette Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="sm"
        disableRestoreFocus
        sx={{
          '& .MuiDialog-paper': (theme) => ({
            borderRadius: theme.shape.borderRadius,
            position: 'absolute',
            top: '10%'
          })
        }}
      >
        <DialogContent sx={{ p: 0 }} onKeyDown={handleDialogKeyDown}>
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
            <SearchOutlined style={{ fontSize: '20px', color: '#8c8c8c', marginRight: '12px' }} />
            <TextField
              fullWidth
              variant="standard"
              placeholder="Search tools... (Use arrows to navigate)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              InputProps={{
                disableUnderline: true,
                style: { fontSize: '16px' }
              }}
            />
            <Chip label="ESC" size="small" variant="outlined" onClick={handleClose} />
          </Box>
          <Divider />
          <Box sx={{ maxHeight: '350px', overflowY: 'auto' }} ref={listRef}>
            {filteredTools.length > 0 ? (
              <List sx={{ py: 1 }}>
                {filteredTools.map((tool, index) => (
                  <ListItemButton
                    key={tool.path}
                    selected={index === selectedIndex}
                    onClick={() => handleSelect(tool.path)}
                    sx={{
                      py: 1.5,
                      px: 3,
                      '&.Mui-selected': {
                        bgcolor: 'primary.lighter',
                        borderLeft: '4px solid',
                        borderColor: 'primary.main',
                        pl: '20px' // adjust padding to balance the border
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40, color: index === selectedIndex ? 'primary.main' : 'inherit' }}>
                      {tool.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {tool.name}
                          </Typography>
                          <Chip label={tool.category} size="small" variant="light" color="primary" sx={{ height: 20, fontSize: '11px' }} />
                        </Box>
                      }
                      secondary={tool.desc}
                    />
                  </ListItemButton>
                ))}
              </List>
            ) : (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  No tools found for "{query}"
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
