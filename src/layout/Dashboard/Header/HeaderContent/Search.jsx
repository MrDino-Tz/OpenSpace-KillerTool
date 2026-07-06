import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// material-ui
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
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';

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
  FilePdfOutlined,
  LockOutlined,
  ScissorOutlined,
  EditOutlined,
  MoneyCollectOutlined,
  CodeOutlined,
  ApiOutlined,
  AuditOutlined,
  QrcodeOutlined,
  ScanOutlined
} from '@ant-design/icons';
import DownOutlined from '@ant-design/icons/DownOutlined';

// shared data
import ALL_TOOLS from 'data/tools';

const ICON_MAP = {
  FontSizeOutlined: <FontSizeOutlined />,
  SmileOutlined: <SmileOutlined />,
  NumberOutlined: <NumberOutlined />,
  FileTextOutlined: <FileTextOutlined />,
  FilePdfOutlined: <FilePdfOutlined />,
  BgColorsOutlined: <BgColorsOutlined />,
  MoneyCollectOutlined: <MoneyCollectOutlined />,
  KeyOutlined: <KeyOutlined />,
  LockOutlined: <LockOutlined />,
  SafetyCertificateOutlined: <SafetyCertificateOutlined />,
  ScissorOutlined: <ScissorOutlined />,
  EditOutlined: <EditOutlined />,
  CodeOutlined: <CodeOutlined />,
  ApiOutlined: <ApiOutlined />,
  AuditOutlined: <AuditOutlined />,
  QrcodeOutlined: <QrcodeOutlined />,
  ScanOutlined: <ScanOutlined />
};

const CATEGORY_ICONS = {
  'Text Tools': <FontSizeOutlined />,
  'Conversion Tools': <BgColorsOutlined />,
  'CryptOK': <KeyOutlined />,
  'Image/Video': <ScissorOutlined />,
  'Currency': <MoneyCollectOutlined />,
  'OpenDoc': <FilePdfOutlined />,
  'Dev Gun': <ApiOutlined />,
  'WiFi Shark': <ScanOutlined />
};

function groupByCategory(tools) {
  const map = {};
  for (const tool of tools) {
    if (!map[tool.category]) map[tool.category] = [];
    map[tool.category].push(tool);
  }
  return map;
}

export default function Search() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState({});

  const filteredTools = ALL_TOOLS.filter(
    (tool) =>
      !query ||
      tool.name.toLowerCase().includes(query.toLowerCase()) ||
      tool.desc.toLowerCase().includes(query.toLowerCase()) ||
      tool.category.toLowerCase().includes(query.toLowerCase())
  );

  const grouped = groupByCategory(filteredTools);

  useEffect(() => {
    if (query) {
      const all = {};
      Object.keys(grouped).forEach((cat) => { all[cat] = true; });
      setExpanded(all);
    } else {
      setExpanded({});
    }
  }, [query]);

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

  const handleClose = () => {
    setOpen(false);
  };

  const handleSelect = (path) => {
    navigate(path);
    handleClose();
  };

  const toggleCategory = (cat) => {
    setExpanded((prev) => ({ ...prev, [cat]: !prev[cat] }));
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
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search by name, description, or category..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              size="small"
            />
            {filteredTools.length > 0 ? (
              <Box sx={{ maxHeight: 360, overflowY: 'auto' }}>
                {Object.entries(grouped).map(([cat, tools]) => (
                  <Accordion
                    key={cat}
                    expanded={!!expanded[cat]}
                    onChange={() => toggleCategory(cat)}
                    elevation={0}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: '8px !important',
                      mb: 1,
                      '&:before': { display: 'none' }
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<DownOutlined style={{ fontSize: 12 }} />}
                      sx={{ minHeight: 40, '& .MuiAccordionSummary-content': { my: 0.5 } }}
                    >
                      <Stack direction="row" alignItems="center" gap={1}>
                        <Box sx={{ color: 'text.secondary', fontSize: 16, display: 'flex' }}>
                          {CATEGORY_ICONS[cat] || null}
                        </Box>
                        <Typography variant="subtitle2" fontWeight={700}>
                          {cat}
                        </Typography>
                        <Chip label={tools.length} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 0.5 }}>
                      {tools.map((tool) => (
                        <Box
                          key={tool.path}
                          onClick={() => handleSelect(tool.path)}
                          sx={{
                            p: 1.5,
                            borderRadius: 1,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            '&:hover': { bgcolor: 'action.hover' }
                          }}
                        >
                          <Stack direction="row" alignItems="center" gap={1.5}>
                            <Box sx={{ color: 'text.secondary', fontSize: 16, display: 'flex' }}>
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
                          </Stack>
                        </Box>
                      ))}
                    </AccordionDetails>
                  </Accordion>
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
