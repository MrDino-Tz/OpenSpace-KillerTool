import { useState, useEffect } from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

// project imports
import Search from './Search';
import MobileSection from './MobileSection';
import { useThemeMode } from 'contexts/ThemeContext';

// icons
import { GithubOutlined, InfoCircleOutlined, MoonOutlined, SunOutlined, StarOutlined } from '@ant-design/icons';

// ==============================|| HEADER - CONTENT ||============================== //

export default function HeaderContent() {
  const downLG = useMediaQuery((theme) => theme.breakpoints.down('lg'));
  const { mode, toggleTheme } = useThemeMode();
  const [aboutOpen, setAboutOpen] = useState(false);
  const [starCount, setStarCount] = useState(null);
  const [starLoading, setStarLoading] = useState(false);

  const handleOpenAbout = () => setAboutOpen(true);
  const handleCloseAbout = () => setAboutOpen(false);

  useEffect(() => {
    let mounted = true;
    setStarLoading(true);
    fetch('https://api.github.com/repos/MrDino-Tz/OpenSpace-KillerTool')
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        if (mounted && data && typeof data.stargazers_count === 'number') {
          setStarCount(data.stargazers_count);
        }
      })
      .catch(() => {
        if (mounted) setStarCount(null);
      })
      .finally(() => {
        if (mounted) setStarLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleToggleTheme = (event) => {
    const isAppearanceTransition = document.startViewTransition
      && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!isAppearanceTransition) {
      toggleTheme();
      return;
    }

    const x = event.clientX;
    const y = event.clientY;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = document.startViewTransition(() => {
      toggleTheme();
    });

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`
      ];
      document.documentElement.animate(
        {
          clipPath: mode === 'light' ? clipPath : clipPath.reverse()
        },
        {
          duration: 500,
          easing: 'ease-in-out',
          pseudoElement: mode === 'light'
            ? '::view-transition-new(root)'
            : '::view-transition-old(root)'
        }
      );
    });
  };

  return (
    <>
      {!downLG && <Search />}
      {downLG && <Box sx={{ width: '100%', ml: 1 }} />}

      {/* GitHub Repo Icon */}
      <IconButton
        component={Link}
        href="https://github.com/MrDino-Tz/OpenSpace-KillerTool"
        target="_blank"
        color="secondary"
        title="GitHub Repository"
        sx={{ color: 'text.primary', bgcolor: mode === 'dark' ? 'grey.200' : 'grey.100', width: 38, height: 38, ml: 1.5 }}
      >
        <GithubOutlined style={{ fontSize: '18px' }} />
      </IconButton>

      {/* Star count next to GitHub icon */}
      <Box sx={{ display: 'flex', alignItems: 'center', ml: 0.5 }}>
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', fontSize: 13 }}>
          <StarOutlined style={{ fontSize: 14 }} />
          {starLoading ? '…' : (starCount != null ? starCount : '—')}
        </Box>
      </Box>

      {/* Theme Toggler */}
      <IconButton
        color="secondary"
        onClick={handleToggleTheme}
        title={mode === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        sx={{ color: 'text.primary', bgcolor: mode === 'dark' ? 'grey.200' : 'grey.100', width: 38, height: 38, ml: 1.5 }}
      >
        {mode === 'light' ? <MoonOutlined style={{ fontSize: '18px' }} /> : <SunOutlined style={{ fontSize: '18px' }} />}
      </IconButton>

      {/* About Icon */}
      <IconButton
        color="secondary"
        onClick={handleOpenAbout}
        title="About Platform"
        sx={{ color: 'text.primary', bgcolor: mode === 'dark' ? 'grey.200' : 'grey.100', width: 38, height: 38, ml: 1.5, mr: downLG ? 0 : 2 }}
      >
        <InfoCircleOutlined style={{ fontSize: '18px' }} />
      </IconButton>

      {downLG && <MobileSection />}

      {/* About Dialog */}
      <Dialog open={aboutOpen} onClose={handleCloseAbout} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', pb: 1 }}>About OpenSpace - KillerTools</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Typography variant="body1">
              <strong>OpenSpace - KillerTools</strong> is a free, open-source, client-side offline-first utility suite designed for developers, designers, and security professionals.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              All tools run entirely within your local browser sandbox. No sensitive information, file data, or passwords are ever transmitted to external servers, ensuring complete privacy.
            </Typography>
            <Typography variant="subtitle2" sx={{ mt: 1 }}>
              Key Features:
            </Typography>
            <Typography variant="body2" component="ul" sx={{ pl: 2, m: 0 }}>
              <li>Cryptographically secure Password Generator</li>
              <li>Local zxcvbn Password Strength Analyzer</li>
              <li>Client-side PDF Signature Certificate Checker</li>
              <li>Aesthetic Color Converter and Palette Builder</li>
              <li>Markdown-to-HTML parser, Text to Binary, Emoji Picker, and ASCII Art generator</li>
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ gap: 1 }}>
          <Button
            component={Link}
            href="https://github.com/MrDino-Tz/OpenSpace-KillerTool"
            target="_blank"
            rel="noopener noreferrer"
            startIcon={<GithubOutlined />}
            variant="outlined"
            color="inherit"
          >
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
              <StarOutlined />
              {starLoading ? '…' : (starCount != null ? starCount : 'Star')}
            </Box>
          </Button>
          <Button onClick={handleCloseAbout} color="primary" variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
