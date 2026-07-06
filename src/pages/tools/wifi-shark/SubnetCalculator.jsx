import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  Grid2,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Chip,
  Tooltip,
  Alert,
} from '@mui/material';
import MainCard from 'components/MainCard';
import { useTheme } from '@mui/material/styles';

function isValidIp(value) {
  const parts = value.split('.');
  if (parts.length !== 4) return false;
  return parts.every((p) => {
    const n = Number(p);
    return !Number.isNaN(n) && String(n) === p && n >= 0 && n <= 255;
  });
}

function isValidCidr(value) {
  const n = Number(value);
  return !Number.isNaN(n) && Number.isInteger(n) && n >= 0 && n <= 32;
}

function toBinaryOctet(n) {
  return n.toString(2).padStart(8, '0');
}

function toBinaryIp(int) {
  const o1 = (int >>> 24) & 0xff;
  const o2 = (int >>> 16) & 0xff;
  const o3 = (int >>> 8) & 0xff;
  const o4 = int & 0xff;
  return `${toBinaryOctet(o1)}.${toBinaryOctet(o2)}.${toBinaryOctet(o3)}.${toBinaryOctet(o4)}`;
}

function intToIp(int) {
  const o1 = (int >>> 24) & 0xff;
  const o2 = (int >>> 16) & 0xff;
  const o3 = (int >>> 8) & 0xff;
  const o4 = int & 0xff;
  return `${o1}.${o2}.${o3}.${o4}`;
}

function detectIpClass(ip) {
  const first = Number(ip.split('.')[0]);
  if (first >= 1 && first <= 126) return 'A';
  if (first >= 128 && first <= 191) return 'B';
  if (first >= 192 && first <= 223) return 'C';
  if (first >= 224 && first <= 239) return 'D';
  if (first >= 240 && first <= 255) return 'E';
  return null;
}

const CLASS_COLORS = {
  A: 'success',
  B: 'primary',
  C: 'warning',
  D: 'info',
  E: 'error',
};

function isPrivateIp(ip, cidr) {
  const ipInt = ip.split('.').reduce((acc, oct) => (acc << 8) + Number(oct), 0) >>> 0;
  const mask = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
  const network = (ipInt & mask) >>> 0;

  const p10_0 = ((10 << 24) | (0 << 16) | (0 << 8) | 0) >>> 0;
  const p10m = (~0 << 8) >>> 0;
  if ((network & p10m) === (p10_0 & p10m) && cidr >= 8) return true;

  const p172_16 = ((172 << 24) | (16 << 16) | (0 << 8) | 0) >>> 0;
  const p172m = (~0 << 12) >>> 0;
  if ((network & p172m) === (p172_16 & p172m) && cidr >= 12) return true;

  const p192_168 = ((192 << 24) | (168 << 16) | (0 << 8) | 0) >>> 0;
  const p192m = (~0 << 16) >>> 0;
  if ((network & p192m) === (p192_168 & p192m) && cidr >= 16) return true;

  return false;
}

export default function SubnetCalculator() {
  const theme = useTheme();
  const [ip, setIp] = useState('');
  const [cidrStr, setCidrStr] = useState('');

  const ipValid = ip.length > 0 && isValidIp(ip);
  const cidrValid = cidrStr.length > 0 && isValidCidr(cidrStr);
  const bothValid = ipValid && cidrValid;

  const result = useMemo(() => {
    if (!bothValid) return null;

    const parts = ip.split('.').map(Number);
    const ipInt = ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
    const cidr = Number(cidrStr);
    const mask = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
    const network = (ipInt & mask) >>> 0;
    const broadcast = (network | (~mask >>> 0)) >>> 0;

    const totalIps = Math.pow(2, 32 - cidr);
    const usableHosts = cidr >= 31 ? 0 : totalIps - 2;

    let firstUsable = null;
    let lastUsable = null;
    if (cidr === 31) {
      firstUsable = intToIp(network);
      lastUsable = intToIp(broadcast);
    } else if (cidr === 32) {
      firstUsable = null;
      lastUsable = null;
    } else {
      if (totalIps > 2) {
        firstUsable = intToIp((network + 1) >>> 0);
        lastUsable = intToIp((broadcast - 1) >>> 0);
      } else {
        firstUsable = null;
        lastUsable = null;
      }
    }

    const ipClass = detectIpClass(ip);
    const privateRange = isPrivateIp(ip, cidr);

    return {
      subnetMask: intToIp(mask),
      wildcardMask: intToIp((~mask >>> 0)),
      networkAddress: intToIp(network),
      broadcastAddress: intToIp(broadcast),
      firstUsable,
      lastUsable,
      totalIps,
      usableHosts,
      networkBinary: toBinaryIp(network),
      broadcastBinary: toBinaryIp(broadcast),
      ipClass,
      privateRange,
      cidr,
    };
  }, [ip, cidrStr, bothValid]);

  const ipError = ip.length > 0 && !ipValid ? 'Invalid IPv4 address' : null;
  const cidrError = cidrStr.length > 0 && !cidrValid ? 'CIDR must be 0–32' : null;

  return (
    <MainCard title="Subnet Calculator">
      <Stack spacing={3}>
        <Paper sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Enter an IP address and CIDR prefix to calculate subnet details.
            </Typography>

            <Grid2 container spacing={2}>
              <Grid2 size={{ xs: 12, sm: 8 }}>
                <TextField
                  fullWidth
                  label="IP Address"
                  placeholder="192.168.1.0"
                  value={ip}
                  onChange={(e) => setIp(e.target.value)}
                  error={!!ipError}
                  helperText={ipError || ''}
                />
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="CIDR Prefix"
                  placeholder="24"
                  value={cidrStr}
                  onChange={(e) => setCidrStr(e.target.value)}
                  error={!!cidrError}
                  helperText={cidrError || ''}
                />
              </Grid2>
            </Grid2>
          </Stack>
        </Paper>

        {bothValid && result && (
          <>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              {result.ipClass && (
                <Chip
                  label={`Class ${result.ipClass}`}
                  color={CLASS_COLORS[result.ipClass]}
                  size="small"
                />
              )}
              {result.privateRange && (
                <Chip label="Private" color="secondary" size="small" />
              )}
              {result.cidr === 31 && (
                <Chip label="RFC 3021" color="info" size="small" variant="outlined" />
              )}
              {result.cidr === 32 && (
                <Chip label="Host Route" color="info" size="small" variant="outlined" />
              )}
            </Stack>

            {(result.cidr === 31 || result.cidr === 32) && (
              <Alert severity="info" sx={{ '& .MuiAlert-message': { width: '100%' } }}>
                {result.cidr === 31
                  ? 'RFC 3021: /31 networks have no dedicated broadcast address; both addresses are usable as point-to-point links.'
                  : 'This is a single host route (/32). There are no usable host addresses in this subnet.'}
              </Alert>
            )}

            <TableContainer component={Paper}>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, width: 200 }}>Subnet Mask</TableCell>
                    <TableCell>
                      <Typography fontFamily="monospace">{result.subnetMask}</Typography>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Wildcard Mask</TableCell>
                    <TableCell>
                      <Typography fontFamily="monospace">{result.wildcardMask}</Typography>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Network Address</TableCell>
                    <TableCell>
                      <Typography fontFamily="monospace">{result.networkAddress}</Typography>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Broadcast Address</TableCell>
                    <TableCell>
                      <Typography fontFamily="monospace">
                        {result.cidr === 31 ? (
                          <Typography component="span" variant="body2" color="text.secondary">
                            N/A (/31 has no broadcast)
                          </Typography>
                        ) : (
                          result.broadcastAddress
                        )}
                      </Typography>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>First Usable Host</TableCell>
                    <TableCell>
                      {result.firstUsable ? (
                        <Typography fontFamily="monospace">{result.firstUsable}</Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          {result.cidr === 32 ? 'N/A' : 'N/A'}
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Last Usable Host</TableCell>
                    <TableCell>
                      {result.lastUsable ? (
                        <Typography fontFamily="monospace">{result.lastUsable}</Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          {result.cidr === 32 ? 'N/A' : 'N/A'}
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Total IPs</TableCell>
                    <TableCell>{result.totalIps.toLocaleString()}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Usable Hosts</TableCell>
                    <TableCell>{result.usableHosts.toLocaleString()}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Network (Binary)</TableCell>
                    <TableCell>
                      <Typography
                        fontFamily="monospace"
                        fontSize="0.75rem"
                        sx={{ wordBreak: 'break-all' }}
                      >
                        {result.networkBinary}
                      </Typography>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Broadcast (Binary)</TableCell>
                    <TableCell>
                      <Typography
                        fontFamily="monospace"
                        fontSize="0.75rem"
                        sx={{ wordBreak: 'break-all' }}
                      >
                        {result.cidr === 31 ? (
                          <Typography component="span" variant="body2" color="text.secondary">
                            N/A
                          </Typography>
                        ) : (
                          result.broadcastBinary
                        )}
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}

        {!bothValid && (ip.length > 0 || cidrStr.length > 0) && (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            Enter a valid IP address and CIDR prefix to see results.
          </Typography>
        )}
      </Stack>
    </MainCard>
  );
}
