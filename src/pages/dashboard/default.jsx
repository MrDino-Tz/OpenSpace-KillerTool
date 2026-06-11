import { Link } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';

// project imports
import AnalyticEcommerce from 'components/cards/statistics/AnalyticEcommerce';

const tools = [
  { name: 'ASCII Word Art Generator', desc: 'Create ASCII text banners', path: '/tools/text/ascii-generator', category: 'Text Tools' },
  { name: 'Emoji Picker', desc: 'Browse and copy emojis', path: '/tools/text/emoji-picker', category: 'Text Tools' },
  { name: 'Text to ASCII Binary', desc: 'Convert text to binary and binary to text', path: '/tools/conversion/text-to-binary', category: 'Conversion Tools' },
  { name: 'Color Converter', desc: 'Convert colors between HEX, RGB, HSL, CMYK...', path: '/tools/conversion/color-converter', category: 'Conversion Tools' },
  { name: 'Password Generator', desc: 'Generate secure random passwords', path: '/tools/crypto/password-generator', category: 'CryptOK' },
  { name: 'Password Analyzer', desc: 'Check password strength & crack time', path: '/tools/crypto/password-analyzer', category: 'CryptOK' },
  { name: 'PDF Signature Checker', desc: 'Validate digital signatures in PDFs', path: '/tools/crypto/pdf-signature-checker', category: 'CryptOK' }
];

export default function DashboardDefault() {
  const theme = useTheme();

  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      <Grid size={12}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            Welcome to OpenSpace-KillerTools
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Browser-based developer tools and utilities. Everything runs client-side in your browser. Fast, secure, and open-source.
          </Typography>
        </Box>
      </Grid>

      {/* Stats row */}
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <AnalyticEcommerce title="Total Tools Available" count={tools.length.toString()} percentage={100} extra="Ready to use" />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <AnalyticEcommerce title="Client-Side Processing" count="100%" percentage={0} color="success" extra="Zero server lag" />
      </Grid>
      <Grid size={{ xs: 12, sm: 12, md: 4 }}>
        <AnalyticEcommerce title="Categories" count="2" percentage={0} extra="Text, Conversion" />
      </Grid>

      {/* Tools Grid */}
      <Grid size={12}>
        <Typography variant="h4" sx={{ mt: 2, mb: 3 }} fontWeight="bold">
          All Tools
        </Typography>
        <Grid container spacing={3}>
          {tools.map((tool, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={index}>
              <Card
                component={Link}
                to={tool.path}
                sx={{
                  textDecoration: 'none',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 2,
                  boxShadow: theme.customShadows?.z1 || 1,
                  border: '1px solid',
                  borderColor: theme.palette.divider,
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: theme.customShadows?.z2 || 4,
                    borderColor: theme.palette.primary.main,
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1, p: 3, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h5" color="text.primary" fontWeight="600" sx={{ mb: 1 }}>
                    {tool.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3, flexGrow: 1 }}>
                    {tool.desc}
                  </Typography>
                  <Box>
                    <Chip 
                      label={tool.category} 
                      size="small" 
                      color={tool.category === 'Text Tools' ? 'primary' : 'secondary'} 
                      variant="outlined" 
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Grid>
    </Grid>
  );
}
