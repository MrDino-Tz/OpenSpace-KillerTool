import { useState, useEffect } from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import MainCard from 'components/MainCard';
import Tooltip from '@mui/material/Tooltip';

import Grid from '@mui/material/Grid2';

import androidIcon from 'assets/images/OS-icons/android.png';
import freeBsdIcon from 'assets/images/OS-icons/free-bsd.png';
import linuxIcon from 'assets/images/OS-icons/linux.png';
import macOsIcon from 'assets/images/OS-icons/mac-os-logo.png';
import windowsIcon from 'assets/images/OS-icons/microsoft.png';
import chromeIcon from 'assets/images/browser-icons/chrome.png';
import firefoxIcon from 'assets/images/browser-icons/firefox.png';
import operaIcon from 'assets/images/browser-icons/opera.png';
import edgeIcon from 'assets/images/browser-icons/microsoft.png';
import safariIcon from 'assets/images/browser-icons/safari.png';

import { CopyOutlined } from '@ant-design/icons';

const OS_MAP = {
  Android: { icon: androidIcon, label: 'Android' },
  FreeBSD: { icon: freeBsdIcon, label: 'FreeBSD' },
  Linux: { icon: linuxIcon, label: 'Linux' },
  macOS: { icon: macOsIcon, label: 'macOS' },
  Windows: { icon: windowsIcon, label: 'Windows', iconFilter: 'brightness(0) invert(27%) sepia(98%) saturate(1000%) hue-rotate(190deg)' }
};

const BROWSER_MAP = {
  Chrome: { icon: chromeIcon, label: 'Chrome' },
  Firefox: { icon: firefoxIcon, label: 'Firefox' },
  Opera: { icon: operaIcon, label: 'Opera' },
  Edge: { icon: edgeIcon, label: 'Edge' },
  Safari: { icon: safariIcon, label: 'Safari' }
};

function detectBrowser() {
  const ua = navigator.userAgent;
  if (ua.includes('OPR') || ua.includes('Opera')) return 'Opera';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  return 'Unknown';
}

function detectOS() {
  const ua = navigator.userAgent;
  if (ua.includes('Android')) {
    const m = ua.match(/Android\s([\d.]+)/);
    return { key: 'Android', detail: m ? `Android ${m[1]}` : 'Android' };
  }
  if (ua.includes('FreeBSD')) return { key: 'FreeBSD', detail: 'FreeBSD' };
  const p = navigator.platform;
  if (p.includes('Win')) {
    const m = ua.match(/Windows NT\s([\d.]+)/);
    const versions = { '10.0': 'Windows 10/11', '6.3': 'Windows 8.1', '6.2': 'Windows 8', '6.1': 'Windows 7' };
    const ver = m ? (versions[m[1]] || `Windows ${m[1]}`) : 'Windows';
    return { key: 'Windows', detail: ver };
  }
  if (p.includes('Mac')) {
    const m = ua.match(/Mac OS X\s([\d_]+)/);
    return { key: 'macOS', detail: m ? `macOS ${m[1].replace(/_/g, '.')}` : 'macOS' };
  }
  if (p.includes('Linux')) {
    const distros = ['Ubuntu', 'Fedora', 'Debian', 'Arch', 'Manjaro', 'Mint', 'openSUSE', 'Gentoo', 'Solus', 'Zorin', 'Pop', 'Elementary'];
    const found = distros.find(d => ua.includes(d));
    return { key: 'Linux', detail: found ? `Linux ${found}` : 'Linux' };
  }
  if (p.includes('iPhone') || p.includes('iPad')) {
    const m = ua.match(/iPhone OS\s([\d_]+)/);
    return { key: 'iOS', detail: m ? `iOS ${m[1].replace(/_/g, '.')}` : 'iOS' };
  }
  return { key: p, detail: p };
}

export default function SystemInfoCard() {
  const [ip, setIp] = useState('Fetching...');
  const [downlink, setDownlink] = useState(null);
  const [direction, setDirection] = useState('stable');

  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(r => r.json())
      .then(d => setIp(d.ip))
      .catch(() => setIp('Unavailable'));
  }, []);

  useEffect(() => {
    let cancelled = false;

    const measure = async () => {
      const url = `${import.meta.env.BASE_URL}assets/images/logo.png`;
      const start = performance.now();
      try {
        const res = await fetch(url, { cache: 'no-store' });
        const blob = await res.blob();
        if (cancelled) return;
        const duration = (performance.now() - start) / 1000;
        const bits = blob.size * 8;
        const Mbps = bits / duration / 1_000_000;

        setDownlink(prev => {
          if (prev === null) return Mbps;
          if (Mbps > prev * 1.02) setDirection('up');
          else if (Mbps < prev * 0.98) setDirection('down');
          else setDirection('stable');
          return Mbps;
        });
      } catch {
        if (!cancelled) setDownlink(null);
      }
    };

    measure();
    const interval = setInterval(measure, 3000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const os = detectOS();
  const osInfo = OS_MAP[os.key];
  const browserKey = detectBrowser();
  const browserInfo = BROWSER_MAP[browserKey];
  const [copied, setCopied] = useState(false);

  const copyIp = () => {
    if (ip && ip !== 'Fetching...' && ip !== 'Unavailable') {
      navigator.clipboard.writeText(ip);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const arrowColor = direction === 'up' ? 'success.main' : direction === 'down' ? 'error.main' : 'text.disabled';

  return (
    <MainCard contentSX={{ p: 2.25 }}>
      <Stack sx={{ gap: 0.75 }}>
        <Typography variant="h6" color="text.secondary">
          System Details
        </Typography>
        <Grid container spacing={1}>
          <Grid size={6}>
            <Typography variant="body2"><strong>Browser:</strong></Typography>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              {browserInfo?.icon ? (
                <Box component="img" src={browserInfo.icon} alt={browserInfo.label}
                  sx={{ width: 16, height: 16 }} />
              ) : null}
              <Typography variant="body2">{browserKey}</Typography>
            </Stack>
          </Grid>
          <Grid size={6}>
            <Typography variant="body2"><strong>OS:</strong></Typography>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              {osInfo ? (
                <Box component="img" src={osInfo.icon} alt={osInfo.label}
                  sx={{ width: 16, height: 16, filter: osInfo.iconFilter || 'none' }} />
              ) : null}
              <Typography variant="body2">{os.detail}</Typography>
            </Stack>
          </Grid>
          <Grid size={6}>
            <Typography variant="body2"><strong>IP:</strong></Typography>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Typography variant="body2">{ip}</Typography>
              <Tooltip title={copied ? 'Copied!' : 'Copy IP'}>
                <Box component="span" onClick={copyIp}
                  sx={{ cursor: 'pointer', display: 'flex', color: copied ? 'success.main' : 'text.secondary', '&:hover': { color: 'primary.main' } }}>
                  <CopyOutlined style={{ fontSize: 14 }} />
                </Box>
              </Tooltip>
            </Stack>
          </Grid>
          <Grid size={6}>
            <Typography variant="body2"><strong>Network:</strong></Typography>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Typography variant="body2" sx={{ color: arrowColor }}>
                {downlink !== null ? `${downlink.toFixed(2)} Mbps` : 'Measuring...'}
              </Typography>
              <Typography variant="body2" sx={{ color: arrowColor, fontWeight: 700, lineHeight: 1, fontSize: '0.75rem' }}>
                {direction === 'up' ? '↑' : direction === 'down' ? '↓' : '−'}
              </Typography>
            </Stack>
          </Grid>
        </Grid>
      </Stack>
    </MainCard>
  );
}
