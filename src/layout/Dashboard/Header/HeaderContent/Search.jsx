import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';

// icons
import SearchOutlined from '@ant-design/icons/SearchOutlined';
import {
  BgColorsOutlined,
  KeyOutlined,
  SafetyCertificateOutlined,
  FontSizeOutlined,
  SmileOutlined,
  NumberOutlined,
  FileTextOutlined,
  LockOutlined,
  ScissorOutlined,
  EditOutlined,
  MoneyCollectOutlined
} from '@ant-design/icons';

// shared data
import ALL_TOOLS from 'data/tools';

const ICON_MAP = {
  FontSizeOutlined: <FontSizeOutlined />,
  SmileOutlined: <SmileOutlined />,
  NumberOutlined: <NumberOutlined />,
  FileTextOutlined: <FileTextOutlined />,
  BgColorsOutlined: <BgColorsOutlined />,
  MoneyCollectOutlined: <MoneyCollectOutlined />,
  KeyOutlined: <KeyOutlined />,
  LockOutlined: <LockOutlined />,
  SafetyCertificateOutlined: <SafetyCertificateOutlined />,
  ScissorOutlined: <ScissorOutlined />,
  EditOutlined: <EditOutlined />
};

export default function Search() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredTools = ALL_TOOLS.filter(
    (tool) =>
      !query ||
      tool.name.toLowerCase().includes(query.toLowerCase()) ||
      tool.desc.toLowerCase().includes(query.toLowerCase()) ||
      tool.category.toLowerCase().includes(query.toLowerCase())
  );

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

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleClose = () => {
    setOpen(false);
  };

  const handleSelect = (path) => {
    navigate(path);
    handleClose();
  };

  const handleKeyDown = (event) => {
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
      <FormControl sx={{ width: { xs: '100%', md: 224 } }}>
        <OutlinedInput
          size="small"
          onClick={() => { setQuery(''); setOpen(true); }}
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

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', pb: 1 }}>
          <Stack direction="row" alignItems="center" gap={1.5}>
            <SearchOutlined style={{ fontSize: 20 }} />
            Search Tools
          </Stack>
        </DialogTitle>
        <DialogContent dividers onKeyDown={handleKeyDown}>
          <Stack spacing={2}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Type to search tools... (arrows to navigate, Enter to open)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              size="small"
            />
            {filteredTools.length > 0 ? (
              <Box sx={{ maxHeight: 320, overflowY: 'auto' }}>
                {filteredTools.map((tool, index) => (
                  <Box
                    key={tool.path}
                    onClick={() => handleSelect(tool.path)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    sx={{
                      p: 1.5,
                      borderRadius: 1,
                      cursor: 'pointer',
                      bgcolor: index === selectedIndex ? 'action.selected' : 'transparent',
                      borderLeft: index === selectedIndex ? '3px solid' : '3px solid transparent',
                      borderColor: index === selectedIndex ? 'primary.main' : 'transparent',
                      transition: 'all 0.15s',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                  >
                    <Stack direction="row" alignItems="center" gap={1.5}>
                      <Box sx={{ color: index === selectedIndex ? 'primary.main' : 'text.secondary', fontSize: 18, display: 'flex' }}>
                        {ICON_MAP[tool.icon] || <SearchOutlined />}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {tool.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {tool.desc}
                        </Typography>
                      </Box>
                      <Chip label={tool.category} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem', flexShrink: 0 }} />
                    </Stack>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No tools found for &ldquo;{query}&rdquo;
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary" variant="text">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
