import { useState, useMemo, useCallback, useRef } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Snackbar from '@mui/material/Snackbar';
import Divider from '@mui/material/Divider';
import Badge from '@mui/material/Badge';

// icons
import {
  SearchOutlined,
  SmileOutlined,
  CopyOutlined,
  ClearOutlined,
  HeartOutlined,
  CoffeeOutlined,
  CarOutlined,
  BulbOutlined,
  FlagOutlined,
  TrophyOutlined,
  SkinOutlined,
  StarOutlined
} from '@ant-design/icons';

// project imports
import MainCard from 'components/MainCard';

// emoji data
import emojiData from 'emoji-datasource-apple';

// ==============================|| EMOJI CATEGORIES ||============================== //

const CATEGORIES = [
  { key: 'all', label: 'All', icon: <StarOutlined /> },
  { key: 'Smileys & Emotion', label: 'Smileys', icon: <SmileOutlined /> },
  { key: 'People & Body', label: 'People', icon: <SkinOutlined /> },
  { key: 'Animals & Nature', label: 'Animals', icon: <CoffeeOutlined /> },
  { key: 'Food & Drink', label: 'Food', icon: <CoffeeOutlined /> },
  { key: 'Travel & Places', label: 'Travel', icon: <CarOutlined /> },
  { key: 'Activities', label: 'Activities', icon: <TrophyOutlined /> },
  { key: 'Objects', label: 'Objects', icon: <BulbOutlined /> },
  { key: 'Symbols', label: 'Symbols', icon: <HeartOutlined /> },
  { key: 'Flags', label: 'Flags', icon: <FlagOutlined /> }
];

// Convert unified code to native emoji character
function unifiedToNative(unified) {
  return unified
    .split('-')
    .map((hex) => String.fromCodePoint(parseInt(hex, 16)))
    .join('');
}

// Process emoji data once
const processedEmojis = emojiData
  .filter((e) => e.has_img_apple && e.category !== 'Component')
  .sort((a, b) => a.sort_order - b.sort_order)
  .map((e) => ({
    unified: e.unified,
    native: unifiedToNative(e.unified),
    name: e.name,
    shortName: e.short_name,
    shortNames: e.short_names || [],
    category: e.category,
    subcategory: e.subcategory || ''
  }));

// ==============================|| EMOJI PICKER ||============================== //

export default function EmojiPicker() {
  const theme = useTheme();

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [copied, setCopied] = useState([]);
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(null);
  const [recentEmojis, setRecentEmojis] = useState([]);
  const [emojiSize, setEmojiSize] = useState(32);
  const gridRef = useRef(null);

  // Filter emojis based on search and category
  const filteredEmojis = useMemo(() => {
    let result = processedEmojis;

    if (activeCategory !== 'all') {
      result = result.filter((e) => e.category === activeCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.shortName.toLowerCase().includes(q) ||
          e.shortNames.some((sn) => sn.toLowerCase().includes(q)) ||
          e.subcategory.toLowerCase().includes(q)
      );
    }

    return result;
  }, [search, activeCategory]);

  // Group by category for display
  const groupedEmojis = useMemo(() => {
    if (activeCategory !== 'all' || search.trim()) return null;

    const groups = {};
    filteredEmojis.forEach((e) => {
      if (!groups[e.category]) groups[e.category] = [];
      groups[e.category].push(e);
    });
    return groups;
  }, [filteredEmojis, activeCategory, search]);

  const handleCopy = useCallback(
    (emoji) => {
      navigator.clipboard.writeText(emoji.native).then(() => {
        setCopied((prev) => [...prev, emoji]);
        setSelectedEmoji(emoji);
        setSnackMsg(`Copied ${emoji.native} to clipboard!`);
        setSnackOpen(true);

        // Add to recent
        setRecentEmojis((prev) => {
          const filtered = prev.filter((e) => e.unified !== emoji.unified);
          return [emoji, ...filtered].slice(0, 30);
        });
      });
    },
    []
  );

  const handleCopyCopiedList = () => {
    const text = copied.map((e) => e.native).join('');
    navigator.clipboard.writeText(text).then(() => {
      setSnackMsg(`Copied ${copied.length} emojis to clipboard!`);
      setSnackOpen(true);
    });
  };

  const handleClearCopied = () => {
    setCopied([]);
  };

  const handleCategoryChange = (_, newValue) => {
    setActiveCategory(newValue);
    if (gridRef.current) {
      gridRef.current.scrollTop = 0;
    }
  };

  // Render an emoji button
  const EmojiButton = ({ emoji }) => (
    <Tooltip
      title={`:${emoji.shortName}: — ${emoji.name.toLowerCase()}`}
      placement="top"
      arrow
      enterDelay={300}
    >
      <Box
        onClick={() => handleCopy(emoji)}
        sx={{
          width: emojiSize + 12,
          height: emojiSize + 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          borderRadius: 1.5,
          fontSize: `${emojiSize}px`,
          lineHeight: 1,
          transition: 'all 0.15s ease-in-out',
          userSelect: 'none',
          '&:hover': {
            bgcolor: theme.palette.action.hover,
            transform: 'scale(1.25)'
          },
          '&:active': {
            transform: 'scale(0.95)'
          }
        }}
      >
        {emoji.native}
      </Box>
    </Tooltip>
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" gap={1.5} sx={{ mb: 1 }}>
          <SmileOutlined style={{ fontSize: 28, color: theme.palette.primary.main }} />
          <Typography variant="h3" fontWeight="bold">
            Emoji Picker
          </Typography>
        </Stack>
        <Typography variant="body1" color="text.secondary">
          Browse, search, and copy emojis to your clipboard. Click any emoji to copy it instantly.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Main Emoji Grid */}
        <Grid size={{ xs: 12, md: 8 }}>
          <MainCard
            title={
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ width: '100%' }}>
                <Typography variant="h5" fontWeight="600">
                  {activeCategory === 'all' ? 'All Emojis' : activeCategory}
                  <Chip label={filteredEmojis.length} size="small" sx={{ ml: 1 }} />
                </Typography>
                {/* Size controls */}
                <Stack direction="row" alignItems="center" gap={0.5}>
                  {[24, 32, 40].map((s) => (
                    <Chip
                      key={s}
                      label={s === 24 ? 'S' : s === 32 ? 'M' : 'L'}
                      size="small"
                      clickable
                      color={emojiSize === s ? 'primary' : 'default'}
                      variant={emojiSize === s ? 'filled' : 'outlined'}
                      onClick={() => setEmojiSize(s)}
                    />
                  ))}
                </Stack>
              </Stack>
            }
            sx={{ height: '100%' }}
          >
            {/* Search bar */}
            <TextField
              fullWidth
              placeholder="Search emojis... (e.g. smile, heart, flag, pizza)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlined />
                  </InputAdornment>
                ),
                endAdornment: search && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearch('')}>
                      <ClearOutlined />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            {/* Category Tabs */}
            <Box sx={{ mb: 2 }}>
              <Tabs
                value={activeCategory}
                onChange={handleCategoryChange}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  minHeight: 40,
                  '& .MuiTab-root': {
                    minHeight: 40,
                    minWidth: 'auto',
                    px: 1.5,
                    py: 0.5,
                    fontSize: '0.8rem'
                  }
                }}
              >
                {CATEGORIES.map((cat) => (
                  <Tab
                    key={cat.key}
                    value={cat.key}
                    icon={cat.icon}
                    iconPosition="start"
                    label={cat.label}
                  />
                ))}
              </Tabs>
            </Box>

            {/* Emoji Grid */}
            <Box
              ref={gridRef}
              sx={{
                maxHeight: 480,
                overflowY: 'auto',
                overflowX: 'hidden',
                pr: 1,
                '&::-webkit-scrollbar': { width: 6 },
                '&::-webkit-scrollbar-thumb': {
                  borderRadius: 3,
                  bgcolor: theme.palette.divider
                }
              }}
            >
              {filteredEmojis.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6, opacity: 0.5 }}>
                  <SmileOutlined style={{ fontSize: 48 }} />
                  <Typography variant="h6" sx={{ mt: 2 }}>
                    No emojis found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Try a different search term
                  </Typography>
                </Box>
              ) : groupedEmojis ? (
                // Grouped by category
                Object.entries(groupedEmojis).map(([category, emojis]) => (
                  <Box key={category} sx={{ mb: 3 }}>
                    <Typography
                      variant="subtitle2"
                      fontWeight="700"
                      color="text.secondary"
                      sx={{
                        mb: 1,
                        textTransform: 'uppercase',
                        fontSize: '0.7rem',
                        letterSpacing: '0.08em'
                      }}
                    >
                      {category}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.25 }}>
                      {emojis.map((emoji) => (
                        <EmojiButton key={emoji.unified} emoji={emoji} />
                      ))}
                    </Box>
                  </Box>
                ))
              ) : (
                // Flat list (filtered or single category)
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.25 }}>
                  {filteredEmojis.map((emoji) => (
                    <EmojiButton key={emoji.unified} emoji={emoji} />
                  ))}
                </Box>
              )}
            </Box>
          </MainCard>
        </Grid>

        {/* Right Sidebar */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={3}>
            {/* Selected Emoji Detail */}
            <MainCard title="Details">
              {selectedEmoji ? (
                <Stack spacing={2} alignItems="center">
                  <Box sx={{ fontSize: 72, lineHeight: 1 }}>{selectedEmoji.native}</Box>
                  <Typography variant="h5" fontWeight="bold" textAlign="center">
                    {selectedEmoji.name.toLowerCase()}
                  </Typography>
                  <Stack spacing={1} sx={{ width: '100%' }}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">
                        Shortcode
                      </Typography>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                        :{selectedEmoji.shortName}:
                      </Typography>
                    </Stack>
                    <Divider />
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">
                        Category
                      </Typography>
                      <Typography variant="caption">{selectedEmoji.category}</Typography>
                    </Stack>
                    <Divider />
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">
                        Unicode
                      </Typography>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                        U+{selectedEmoji.unified}
                      </Typography>
                    </Stack>
                    {selectedEmoji.subcategory && (
                      <>
                        <Divider />
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="caption" color="text.secondary">
                            Subcategory
                          </Typography>
                          <Typography variant="caption">{selectedEmoji.subcategory}</Typography>
                        </Stack>
                      </>
                    )}
                  </Stack>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<CopyOutlined />}
                    onClick={() => handleCopy(selectedEmoji)}
                    size="small"
                  >
                    Copy Emoji
                  </Button>
                </Stack>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4, opacity: 0.4 }}>
                  <SmileOutlined style={{ fontSize: 40 }} />
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Click an emoji to see details
                  </Typography>
                </Box>
              )}
            </MainCard>

            {/* Copied Emojis Collection */}
            <MainCard
              title={
                <Stack direction="row" alignItems="center" gap={1}>
                  <Typography variant="h5" fontWeight="600">
                    Copied
                  </Typography>
                  <Badge badgeContent={copied.length} color="primary" />
                </Stack>
              }
              secondary={
                copied.length > 0 && (
                  <Stack direction="row" gap={0.5}>
                    <Tooltip title="Copy all">
                      <IconButton size="small" onClick={handleCopyCopiedList}>
                        <CopyOutlined />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Clear all">
                      <IconButton size="small" onClick={handleClearCopied}>
                        <ClearOutlined />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                )
              }
            >
              {copied.length > 0 ? (
                <>
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 0.5,
                      mb: 2,
                      p: 1.5,
                      bgcolor: theme.palette.action.hover,
                      borderRadius: 2,
                      minHeight: 50
                    }}
                  >
                    {copied.map((emoji, i) => (
                      <Box key={`${emoji.unified}-${i}`} sx={{ fontSize: 24, cursor: 'default' }}>
                        {emoji.native}
                      </Box>
                    ))}
                  </Box>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<CopyOutlined />}
                    onClick={handleCopyCopiedList}
                    size="small"
                  >
                    Copy All ({copied.length})
                  </Button>
                </>
              ) : (
                <Box sx={{ textAlign: 'center', py: 3, opacity: 0.4 }}>
                  <Typography variant="body2">
                    Emojis you click will appear here
                  </Typography>
                </Box>
              )}
            </MainCard>

            {/* Recent Emojis */}
            {recentEmojis.length > 0 && (
              <MainCard title="Recently Used">
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {recentEmojis.map((emoji) => (
                    <EmojiButton key={`recent-${emoji.unified}`} emoji={emoji} />
                  ))}
                </Box>
              </MainCard>
            )}
          </Stack>
        </Grid>
      </Grid>

      {/* Snackbar */}
      <Snackbar
        open={snackOpen}
        autoHideDuration={1500}
        onClose={() => setSnackOpen(false)}
        message={snackMsg}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      />
    </Box>
  );
}
