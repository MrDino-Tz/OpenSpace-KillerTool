import { useState, useEffect, useCallback, useRef } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Autocomplete from '@mui/material/Autocomplete';
import Snackbar from '@mui/material/Snackbar';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';

// icons
import { MoneyCollectOutlined, SwapOutlined, CopyOutlined } from '@ant-design/icons';

// project imports
import MainCard from 'components/MainCard';

const ER_API = 'https://open.er-api.com/v6/latest';

const POPULAR_PAIRS = [
  { from: 'USD', to: 'EUR' },
  { from: 'EUR', to: 'USD' },
  { from: 'GBP', to: 'USD' },
  { from: 'USD', to: 'TZS' },
  { from: 'TZS', to: 'USD' },
  { from: 'USD', to: 'KES' },
  { from: 'KES', to: 'USD' },
  { from: 'USD', to: 'NGN' },
  { from: 'USD', to: 'ZAR' },
  { from: 'USD', to: 'JPY' }
];

const CURRENCY_NAMES = {
  AED: 'UAE Dirham', AFN: 'Afghan Afghani', ALL: 'Albanian Lek', AMD: 'Armenian Dram',
  ANG: 'Netherlands Antillean Guilder', AOA: 'Angolan Kwanza', ARS: 'Argentine Peso',
  AUD: 'Australian Dollar', AWG: 'Aruban Florin', AZN: 'Azerbaijani Manat',
  BAM: 'Bosnia-Herzegovina Convertible Mark', BBD: 'Barbadian Dollar', BDT: 'Bangladeshi Taka',
  BGN: 'Bulgarian Lev', BHD: 'Bahraini Dinar', BIF: 'Burundian Franc', BMD: 'Bermudian Dollar',
  BND: 'Brunei Dollar', BOB: 'Bolivian Boliviano', BRL: 'Brazilian Real', BSD: 'Bahamian Dollar',
  BTN: 'Bhutanese Ngultrum', BWP: 'Botswana Pula', BYN: 'Belarusian Ruble', BZD: 'Belize Dollar',
  CAD: 'Canadian Dollar', CDF: 'Congolese Franc', CHF: 'Swiss Franc', CLP: 'Chilean Peso',
  CNY: 'Chinese Yuan', COP: 'Colombian Peso', CRC: 'Costa Rican Colón', CUP: 'Cuban Peso',
  CVE: 'Cape Verdean Escudo', CZK: 'Czech Koruna', DJF: 'Djiboutian Franc', DKK: 'Danish Krone',
  DOP: 'Dominican Peso', DZD: 'Algerian Dinar', EGP: 'Egyptian Pound', ERN: 'Eritrean Nakfa',
  ETB: 'Ethiopian Birr', EUR: 'Euro', FJD: 'Fijian Dollar', FKP: 'Falkland Islands Pound',
  FOK: 'Faroese Króna', GBP: 'British Pound', GEL: 'Georgian Lari', GGP: 'Guernsey Pound',
  GHS: 'Ghanaian Cedi', GIP: 'Gibraltar Pound', GMD: 'Gambian Dalasi', GNF: 'Guinean Franc',
  GTQ: 'Guatemalan Quetzal', GYD: 'Guyanese Dollar', HKD: 'Hong Kong Dollar', HNL: 'Honduran Lempira',
  HRK: 'Croatian Kuna', HTG: 'Haitian Gourde', HUF: 'Hungarian Forint', IDR: 'Indonesian Rupiah',
  ILS: 'Israeli Shekel', IMP: 'Isle of Man Pound', INR: 'Indian Rupee', IQD: 'Iraqi Dinar',
  IRR: 'Iranian Rial', ISK: 'Icelandic Króna', JEP: 'Jersey Pound', JMD: 'Jamaican Dollar',
  JOD: 'Jordanian Dinar', JPY: 'Japanese Yen', KES: 'Kenyan Shilling', KGS: 'Kyrgyzstani Som',
  KHR: 'Cambodian Riel', KID: 'Kiribati Dollar', KMF: 'Comorian Franc', KRW: 'South Korean Won',
  KWD: 'Kuwaiti Dinar', KYD: 'Cayman Islands Dollar', KZT: 'Kazakhstani Tenge',
  LAK: 'Lao Kip', LBP: 'Lebanese Pound', LKR: 'Sri Lankan Rupee', LRD: 'Liberian Dollar',
  LSL: 'Lesotho Loti', LYD: 'Libyan Dinar', MAD: 'Moroccan Dirham', MDL: 'Moldovan Leu',
  MGA: 'Malagasy Ariary', MKD: 'Macedonian Denar', MMK: 'Myanmar Kyat', MNT: 'Mongolian Tögrög',
  MOP: 'Macanese Pataca', MRU: 'Mauritanian Ouguiya', MUR: 'Mauritian Rupee', MVR: 'Maldivian Rufiyaa',
  MWK: 'Malawian Kwacha', MXN: 'Mexican Peso', MYR: 'Malaysian Ringgit', MZN: 'Mozambican Metical',
  NAD: 'Namibian Dollar', NGN: 'Nigerian Naira', NIO: 'Nicaraguan Córdoba', NOK: 'Norwegian Krone',
  NPR: 'Nepalese Rupee', NZD: 'New Zealand Dollar', OMR: 'Omani Rial', PAB: 'Panamanian Balboa',
  PEN: 'Peruvian Sol', PGK: 'Papua New Guinean Kina', PHP: 'Philippine Peso', PKR: 'Pakistani Rupee',
  PLN: 'Polish Złoty', PYG: 'Paraguayan Guaraní', QAR: 'Qatari Riyal', RON: 'Romanian Leu',
  RSD: 'Serbian Dinar', RUB: 'Russian Ruble', RWF: 'Rwandan Franc', SAR: 'Saudi Riyal',
  SBD: 'Solomon Islands Dollar', SCR: 'Seychellois Rupee', SDG: 'Sudanese Pound',
  SEK: 'Swedish Krona', SGD: 'Singapore Dollar', SHP: 'Saint Helena Pound', SLE: 'Sierra Leonean Leone',
  SLL: 'Sierra Leonean Leone', SOS: 'Somali Shilling', SRD: 'Surinamese Dollar', SSP: 'South Sudanese Pound',
  STN: 'São Tomé and Príncipe Dobra', SYP: 'Syrian Pound', SZL: 'Swazi Lilangeni',
  THB: 'Thai Baht', TJS: 'Tajikistani Somoni', TMT: 'Turkmenistani Manat', TND: 'Tunisian Dinar',
  TOP: 'Tongan Paʻanga', TRY: 'Turkish Lira', TTD: 'Trinidad and Tobago Dollar', TVD: 'Tuvaluan Dollar',
  TWD: 'New Taiwan Dollar', TZS: 'Tanzanian Shilling', UAH: 'Ukrainian Hryvnia', UGX: 'Ugandan Shilling',
  USD: 'United States Dollar', UYU: 'Uruguayan Peso', UZS: 'Uzbekistani Som',
  VES: 'Venezuelan Bolívar', VND: 'Vietnamese Đồng', VUV: 'Vanuatu Vatu', WST: 'Samoan Tālā',
  XAF: 'Central African CFA Franc', XCD: 'East Caribbean Dollar', XDR: 'Special Drawing Rights',
  XOF: 'West African CFA Franc', XPF: 'CFP Franc', YER: 'Yemeni Rial', ZAR: 'South African Rand',
  ZMW: 'Zambian Kwacha', ZWL: 'Zimbabwean Dollar'
};

export default function CurrencyConverter() {
  const theme = useTheme();
  const [currencyList, setCurrencyList] = useState([]);
  const [rates, setRates] = useState({});
  const [fromCurr, setFromCurr] = useState('TZS');
  const [toCurr, setToCurr] = useState('USD');
  const [amount, setAmount] = useState('1');
  const [result, setResult] = useState(null);
  const [rate, setRate] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');
  const debounceRef = useRef(null);

  useEffect(() => {
    const codes = Object.keys(CURRENCY_NAMES);
    const list = codes.map((code) => ({ code, name: CURRENCY_NAMES[code] }));
    list.sort((a, b) => a.code.localeCompare(b.code));
    setCurrencyList(list);
  }, []);

  const fetchRates = useCallback(() => {
    fetch(`${ER_API}/USD`)
      .then((res) => {
        if (!res.ok) throw new Error('API error');
        return res.json();
      })
      .then((data) => {
        setRates(data.rates);
        setLastUpdated(data.time_last_update_utc);
      })
      .catch(() => {
        setSnackMsg('Failed to fetch exchange rates');
        setSnackOpen(true);
      });
  }, []);

  useEffect(() => {
    fetchRates();
    const interval = setInterval(fetchRates, 600000);
    return () => clearInterval(interval);
  }, [fetchRates]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (!fromCurr || !toCurr || !amount || Number(amount) <= 0 || !rates[fromCurr] || !rates[toCurr]) {
        setResult(null);
        setRate(null);
        return;
      }
      setLoading(true);
      const num = Number(amount);
      const usdToFrom = 1 / rates[fromCurr];
      const usdToTo = 1 / rates[toCurr];
      const crossRate = usdToTo / usdToFrom;
      setResult(crossRate * num);
      setRate(crossRate);
      setLoading(false);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fromCurr, toCurr, amount, rates]);

  const handleSwap = () => {
    setFromCurr(toCurr);
    setToCurr(fromCurr);
  };

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(String(text)).then(() => {
      setSnackMsg(`${label} copied!`);
      setSnackOpen(true);
    });
  };

  const currencyOptions = currencyList.map((c) => ({
    label: `${c.code} — ${c.name}`,
    code: c.code
  }));

  const selectedFrom = currencyOptions.find((o) => o.code === fromCurr) || null;
  const selectedTo = currencyOptions.find((o) => o.code === toCurr) || null;

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return '—';
    if (val < 0.01) return val.toFixed(8);
    if (val < 1) return val.toFixed(6);
    if (val < 1000) return val.toFixed(4);
    return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" gap={1.5} sx={{ mb: 1 }}>
          <MoneyCollectOutlined style={{ fontSize: 28, color: theme.palette.primary.main }} />
          <Typography variant="h3" fontWeight="bold">
            Currency Converter
          </Typography>
        </Stack>
        <Typography variant="body1" color="text.secondary">
          Convert currencies in real-time with support for 160+ world currencies including Tanzanian Shilling (TZS) and Kenyan Shilling (KES).
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5 }}>
          <MainCard title="Convert" sx={{ height: '100%' }}>
            <Stack spacing={2.5}>
              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                slotProps={{ input: { inputProps: { min: 0, step: 'any' } } }}
              />

              <Autocomplete
                options={currencyOptions}
                value={selectedFrom}
                onChange={(e, newVal) => setFromCurr(newVal ? newVal.code : 'TZS')}
                renderInput={(params) => <TextField {...params} label="From" />}
                size="medium"
                disableClearable
                isOptionEqualToValue={(o, v) => o.code === v.code}
              />

              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Button
                  variant="outlined"
                  onClick={handleSwap}
                  sx={{ minWidth: 40, borderRadius: '50%', p: 1 }}
                >
                  <SwapOutlined />
                </Button>
              </Box>

              <Autocomplete
                options={currencyOptions}
                value={selectedTo}
                onChange={(e, newVal) => setToCurr(newVal ? newVal.code : 'USD')}
                renderInput={(params) => <TextField {...params} label="To" />}
                size="medium"
                disableClearable
                isOptionEqualToValue={(o, v) => o.code === v.code}
              />

              {rate !== null && !loading && (
                <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center', borderRadius: 1.5 }}>
                  <Typography variant="h6" fontWeight={700} sx={{ fontFamily: 'monospace', color: theme.palette.primary.main }}>
                    1 {fromCurr} = {formatCurrency(rate)} {toCurr}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    1 {toCurr} = {formatCurrency(1 / rate)} {fromCurr}
                  </Typography>
                </Paper>
              )}

              <Divider />

              <Typography variant="subtitle2" fontWeight={600}>Popular Pairs</Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.5}>
                {POPULAR_PAIRS.map((pair) => (
                  <Chip
                    key={`${pair.from}-${pair.to}`}
                    label={`${pair.from}/${pair.to}`}
                    size="small"
                    variant={fromCurr === pair.from && toCurr === pair.to ? 'filled' : 'outlined'}
                    color={fromCurr === pair.from && toCurr === pair.to ? 'primary' : 'default'}
                    onClick={() => { setFromCurr(pair.from); setToCurr(pair.to); }}
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Stack>
            </Stack>
          </MainCard>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <MainCard title="Conversion Result" sx={{ height: '100%' }}>
            <Stack spacing={3}>
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  textAlign: 'center',
                  borderRadius: 2
                }}
              >
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {formatCurrency(Number(amount || 0))} {fromCurr} =
                </Typography>
                <Typography variant="h3" fontWeight="bold" sx={{ color: theme.palette.primary.main, fontFamily: 'monospace', my: 1 }}>
                  {loading ? <CircularProgress size={32} /> : `${formatCurrency(result)} ${toCurr}`}
                </Typography>
                {rate !== null && !loading && (
                  <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      1 {fromCurr} = {formatCurrency(rate)} {toCurr}
                    </Typography>
                    <Button size="small" onClick={() => handleCopy(formatCurrency(rate), 'Rate')} sx={{ minWidth: 30, p: 0.5 }}>
                      <CopyOutlined style={{ fontSize: 12 }} />
                    </Button>
                  </Stack>
                )}
                {rate !== null && !loading && (
                  <Typography variant="body2" color="text.secondary">
                    1 {toCurr} = {formatCurrency(1 / rate)} {fromCurr}
                  </Typography>
                )}
                {lastUpdated && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    Rates updated {lastUpdated}
                  </Typography>
                )}
              </Paper>

              <Divider />

              <Stack direction="row" justifyContent="center" spacing={2}>
                <Button
                  size="small"
                  variant="text"
                  startIcon={<CopyOutlined />}
                  onClick={() => handleCopy(`${formatCurrency(result)} ${toCurr}`, 'Result')}
                  disabled={result === null}
                >
                  Copy Result
                </Button>
                <Button
                  size="small"
                  variant="text"
                  startIcon={<CopyOutlined />}
                  onClick={() => handleCopy(`${formatCurrency(rate)}`, 'Rate')}
                  disabled={rate === null}
                >
                  Copy Rate
                </Button>
              </Stack>
            </Stack>
          </MainCard>
        </Grid>
      </Grid>

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
