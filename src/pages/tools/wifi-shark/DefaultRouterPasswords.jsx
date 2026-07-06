import { useState, useMemo } from 'react';
import { Box, Typography, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Stack, Alert, TablePagination } from '@mui/material';
import { SearchOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import MainCard from 'components/MainCard';
import { useTheme } from '@mui/material/styles';

const DEFAULT_CREDENTIALS = [
  { brand: 'TP-Link', model: 'Archer AX6000', username: 'admin', password: 'admin', ip: '192.168.0.1', type: 'Admin' },
  { brand: 'TP-Link', model: 'Archer C7', username: 'admin', password: 'admin', ip: '192.168.0.1', type: 'Admin' },
  { brand: 'TP-Link', model: 'TL-WR841N', username: 'admin', password: 'admin', ip: '192.168.0.1', type: 'Admin' },
  { brand: 'TP-Link', model: 'TL-WR940N', username: 'admin', password: 'admin', ip: '192.168.0.1', type: 'Admin' },
  { brand: 'TP-Link', model: 'Archer C50', username: 'admin', password: 'admin', ip: '192.168.0.1', type: 'Admin' },
  { brand: 'TP-Link', model: 'Archer MR200', username: 'admin', password: 'admin', ip: '192.168.0.1', type: 'Admin' },
  { brand: 'TP-Link', model: 'TL-WR740N', username: 'admin', password: 'admin', ip: '192.168.0.1', type: 'Admin' },
  { brand: 'TP-Link', model: 'Deco M5', username: 'admin', password: 'admin', ip: '192.168.0.1', type: 'Admin' },
  { brand: 'Linksys', model: 'EA9500', username: 'admin', password: 'admin', ip: '192.168.1.1', type: 'Admin' },
  { brand: 'Linksys', model: 'WRT3200ACM', username: 'root', password: 'admin', ip: '192.168.1.1', type: 'Admin' },
  { brand: 'Linksys', model: 'WRT54G', username: '', password: 'admin', ip: '192.168.1.1', type: 'Admin' },
  { brand: 'Linksys', model: 'EA7500', username: 'admin', password: 'admin', ip: '192.168.1.1', type: 'Admin' },
  { brand: 'Linksys', model: 'EA8300', username: 'admin', password: 'admin', ip: '192.168.1.1', type: 'Admin' },
  { brand: 'Linksys', model: 'MR7350', username: 'admin', password: 'admin', ip: '192.168.1.1', type: 'Admin' },
  { brand: 'D-Link', model: 'DIR-880L', username: 'admin', password: '', ip: '192.168.0.1', type: 'Admin' },
  { brand: 'D-Link', model: 'DIR-885L', username: 'admin', password: '', ip: '192.168.0.1', type: 'Admin' },
  { brand: 'D-Link', model: 'DIR-615', username: 'admin', password: '', ip: '192.168.0.1', type: 'Admin' },
  { brand: 'D-Link', model: 'DIR-842', username: 'admin', password: 'admin', ip: '192.168.0.1', type: 'Admin' },
  { brand: 'D-Link', model: 'COVR-1100', username: 'admin', password: '', ip: '192.168.0.1', type: 'Admin' },
  { brand: 'D-Link', model: 'DIR-867', username: 'admin', password: '', ip: '192.168.0.1', type: 'Admin' },
  { brand: 'Netgear', model: 'Nighthawk RAX120', username: 'admin', password: 'password', ip: '192.168.1.1', type: 'Admin' },
  { brand: 'Netgear', model: 'Orbi RBK50', username: 'admin', password: 'password', ip: '192.168.1.1', type: 'Admin' },
  { brand: 'Netgear', model: 'R7000', username: 'admin', password: 'password', ip: '192.168.1.1', type: 'Admin' },
  { brand: 'Netgear', model: 'R6250', username: 'admin', password: 'password', ip: '192.168.1.1', type: 'Admin' },
  { brand: 'Netgear', model: 'GS108E', username: 'admin', password: 'password', ip: '192.168.0.239', type: 'Admin' },
  { brand: 'Netgear', model: 'R6400', username: 'admin', password: 'password', ip: '192.168.1.1', type: 'Admin' },
  { brand: 'Netgear', model: 'R8500', username: 'admin', password: 'password', ip: '192.168.1.1', type: 'Admin' },
  { brand: 'ASUS', model: 'RT-AX88U', username: 'admin', password: 'admin', ip: '192.168.1.1', type: 'Admin' },
  { brand: 'ASUS', model: 'RT-AC86U', username: 'admin', password: 'admin', ip: '192.168.1.1', type: 'Admin' },
  { brand: 'ASUS', model: 'RT-N66U', username: 'admin', password: 'admin', ip: '192.168.1.1', type: 'Admin' },
  { brand: 'ASUS', model: 'RT-AC68U', username: 'admin', password: 'admin', ip: '192.168.1.1', type: 'Admin' },
  { brand: 'ASUS', model: 'RT-AX86U', username: 'admin', password: 'admin', ip: '192.168.1.1', type: 'Admin' },
  { brand: 'ASUS', model: 'RT-AC3200', username: 'admin', password: 'admin', ip: '192.168.1.1', type: 'Admin' },
  { brand: 'Huawei', model: 'HG8245H', username: 'root', password: 'admin', ip: '192.168.100.1', type: 'Admin' },
  { brand: 'Huawei', model: 'B525', username: 'admin', password: 'admin', ip: '192.168.8.1', type: 'Admin' },
  { brand: 'Huawei', model: 'E5577', username: 'admin', password: 'admin', ip: '192.168.8.1', type: 'Admin' },
  { brand: 'Huawei', model: 'HG659', username: 'admin', password: 'admin', ip: '192.168.1.1', type: 'Admin' },
  { brand: 'Huawei', model: 'B618', username: 'admin', password: 'admin', ip: '192.168.8.1', type: 'Admin' },
  { brand: 'ZTE', model: 'F660', username: 'admin', password: 'admin', ip: '192.168.1.1', type: 'Admin' },
  { brand: 'ZTE', model: 'MF283', username: 'admin', password: 'admin', ip: '192.168.0.1', type: 'Admin' },
  { brand: 'ZTE', model: 'F609', username: 'admin', password: 'admin', ip: '192.168.1.1', type: 'Admin' },
  { brand: 'ZTE', model: 'MF910', username: 'admin', password: 'admin', ip: '192.168.0.1', type: 'Admin' },
  { brand: 'Belkin', model: 'RT3200', username: '', password: '', ip: '192.168.2.1', type: 'Admin' },
  { brand: 'Belkin', model: 'N750 DB', username: '', password: '', ip: '192.168.2.1', type: 'Admin' },
  { brand: 'Belkin', model: 'AC1800DB', username: '', password: '', ip: '192.168.2.1', type: 'Admin' },
  { brand: 'Belkin', model: 'F9K1113', username: '', password: '', ip: '192.168.2.1', type: 'Admin' },
  { brand: 'Cisco', model: 'RV340', username: 'cisco', password: 'cisco', ip: '192.168.1.1', type: 'Admin' },
  { brand: 'Cisco', model: 'Linksys E1200', username: 'admin', password: 'admin', ip: '192.168.1.1', type: 'Admin' },
  { brand: 'Cisco', model: 'RV260', username: 'cisco', password: 'cisco', ip: '192.168.1.1', type: 'Admin' },
  { brand: 'Cisco', model: 'WAP581', username: 'admin', password: 'Cisco123', ip: '192.168.1.1', type: 'Admin' },
  { brand: 'MikroTik', model: 'hAP ac2', username: 'admin', password: '', ip: '192.168.88.1', type: 'Admin' },
  { brand: 'MikroTik', model: 'RB951G', username: 'admin', password: '', ip: '192.168.88.1', type: 'Admin' },
  { brand: 'MikroTik', model: 'hAP lite', username: 'admin', password: '', ip: '192.168.88.1', type: 'Admin' },
  { brand: 'MikroTik', model: 'RB750Gr3', username: 'admin', password: '', ip: '192.168.88.1', type: 'Admin' },
  { brand: 'Ubiquiti', model: 'UniFi Dream Machine', username: 'root', password: 'ubnt', ip: '192.168.1.1', type: 'Admin' },
  { brand: 'Ubiquiti', model: 'EdgeRouter X', username: 'ubnt', password: 'ubnt', ip: '192.168.1.1', type: 'Admin' },
  { brand: 'Ubiquiti', model: 'UniFi AP AC Pro', username: 'ubnt', password: 'ubnt', ip: '192.168.1.20', type: 'Admin' },
  { brand: 'Ubiquiti', model: 'UniFi Switch', username: 'ubnt', password: 'ubnt', ip: '192.168.1.20', type: 'Admin' },
  { brand: 'Zyxel', model: 'VMG8825', username: 'admin', password: '1234', ip: '192.168.1.1', type: 'Admin' },
  { brand: 'Zyxel', model: 'NBG6617', username: 'admin', password: '1234', ip: '192.168.1.1', type: 'Admin' },
  { brand: 'Zyxel', model: 'VMG1312', username: 'admin', password: '1234', ip: '192.168.1.1', type: 'Admin' },
  { brand: 'Zyxel', model: 'SBG3300', username: 'admin', password: '1234', ip: '192.168.1.1', type: 'Admin' },
  { brand: 'Arris', model: 'SBG8300', username: 'admin', password: 'password', ip: '192.168.0.1', type: 'Admin' },
  { brand: 'Arris', model: 'TG2482', username: 'admin', password: 'password', ip: '192.168.0.1', type: 'Admin' },
  { brand: 'Arris', model: 'SB8200', username: 'admin', password: 'password', ip: '192.168.100.1', type: 'Admin' },
  { brand: 'Arris', model: 'NVG468MQ', username: 'admin', password: 'password', ip: '192.168.1.1', type: 'Admin' },
  { brand: 'Motorola', model: 'MG7700', username: 'admin', password: 'motorola', ip: '192.168.0.1', type: 'Admin' },
  { brand: 'Motorola', model: 'MB8600', username: 'admin', password: 'motorola', ip: '192.168.100.1', type: 'Admin' },
  { brand: 'Motorola', model: 'MG7315', username: 'admin', password: 'motorola', ip: '192.168.0.1', type: 'Admin' },
  { brand: 'Technicolor', model: 'TG799vac', username: 'admin', password: 'admin', ip: '192.168.1.1', type: 'Admin' },
  { brand: 'Technicolor', model: 'DJA0231', username: 'admin', password: 'admin', ip: '192.168.1.1', type: 'Admin' },
  { brand: 'Technicolor', model: 'TG389ac', username: 'admin', password: 'admin', ip: '192.168.1.1', type: 'Admin' },
  { brand: 'Actiontec', model: 'T3200', username: 'admin', password: 'password', ip: '192.168.1.1', type: 'Admin' },
  { brand: 'Actiontec', model: 'GT784WN', username: 'admin', password: 'password', ip: '192.168.1.1', type: 'Admin' },
  { brand: 'Actiontec', model: 'C1000A', username: 'admin', password: 'password', ip: '192.168.1.1', type: 'Admin' },
  { brand: 'Xiaomi', model: 'Mi Router AX3600', username: 'admin', password: '', ip: '192.168.31.1', type: 'Admin' },
  { brand: 'Xiaomi', model: 'Mi Router 4C', username: 'admin', password: '', ip: '192.168.31.1', type: 'Admin' },
  { brand: 'Xiaomi', model: 'Mi Router 3', username: 'admin', password: '', ip: '192.168.31.1', type: 'Admin' },
  { brand: 'Xiaomi', model: 'Mi Router 4A', username: 'admin', password: '', ip: '192.168.31.1', type: 'Admin' },
  { brand: 'Mercusys', model: 'AC12G', username: 'admin', password: 'admin', ip: '192.168.1.1', type: 'Admin' },
  { brand: 'Mercusys', model: 'MW325R', username: 'admin', password: 'admin', ip: '192.168.1.1', type: 'Admin' },
  { brand: 'Mercusys', model: 'AC12', username: 'admin', password: 'admin', ip: '192.168.1.1', type: 'Admin' },
  { brand: 'Tenda', model: 'AC9', username: 'admin', password: 'admin', ip: '192.168.0.1', type: 'Admin' },
  { brand: 'Tenda', model: 'AC15', username: 'admin', password: 'admin', ip: '192.168.0.1', type: 'Admin' },
  { brand: 'Tenda', model: 'F3', username: 'admin', password: 'admin', ip: '192.168.0.1', type: 'Admin' },
  { brand: 'Tenda', model: 'AC10', username: 'admin', password: 'admin', ip: '192.168.0.1', type: 'Admin' },
  { brand: 'Tenda', model: 'AC6', username: 'admin', password: 'admin', ip: '192.168.0.1', type: 'Admin' },
  { brand: 'Tenda', model: 'N301', username: 'admin', password: 'admin', ip: '192.168.0.1', type: 'Admin' },
];

const DefaultRouterPasswords = () => {
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filtered = useMemo(() => {
    if (!search.trim()) return DEFAULT_CREDENTIALS;
    const q = search.toLowerCase();
    return DEFAULT_CREDENTIALS.filter(
      (entry) =>
        entry.brand.toLowerCase().includes(q) ||
        entry.model.toLowerCase().includes(q) ||
        entry.username.toLowerCase().includes(q) ||
        entry.password.toLowerCase().includes(q)
    );
  }, [search]);

  const paginated = useMemo(
    () => filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filtered, page, rowsPerPage]
  );

  return (
    <MainCard>
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <SafetyCertificateOutlined style={{ fontSize: 28, color: theme.palette.primary.main }} />
          <Typography variant="h4">Default Router Passwords</Typography>
        </Stack>

        <Alert severity="info" sx={{ fontSize: 13 }}>
          Search a comprehensive database of known default credentials for routers and networking equipment. Use this only on devices you own.
        </Alert>

        <TextField
          fullWidth
          placeholder="Search by brand, model, username or password..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          InputProps={{
            startAdornment: <SearchOutlined style={{ marginRight: 8, color: theme.palette.text.secondary }} />,
          }}
        />

        <Typography variant="body2" color="text.secondary">
          {filtered.length} result{filtered.length !== 1 && 's'} found
        </Typography>

        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Brand</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Model</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Username</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Password</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>IP Address</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginated.map((row, i) => (
                <TableRow key={i}>
                  <TableCell>{row.brand}</TableCell>
                  <TableCell>{row.model}</TableCell>
                  <TableCell>
                    <Typography fontFamily="monospace" fontSize={13}>
                      {row.username || <Box component="span" color="text.disabled">(blank)</Box>}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography fontFamily="monospace" fontSize={13}>
                      {row.password || <Box component="span" color="text.disabled">(blank)</Box>}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography fontFamily="monospace" fontSize={13}>
                      {row.ip}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={row.type}
                      size="small"
                      color={row.type === 'Admin' ? 'warning' : 'default'}
                      variant="outlined"
                    />
                  </TableCell>
                </TableRow>
              ))}
              {paginated.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography color="text.secondary" py={3}>
                      No matching credentials found.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 15, 25, 50]}
        />
      </Stack>
    </MainCard>
  );
};

export default DefaultRouterPasswords;
