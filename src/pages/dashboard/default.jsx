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
import ALL_TOOLS from 'data/tools';

// assets
import logo from 'assets/images/logo1.png';

const categories = [...new Set(ALL_TOOLS.map((t) => t.category))];

const CATEGORY_COLORS = {
  'Text Tools': 'primary',
  'Conversion Tools': 'secondary',
  'CryptOK': 'success',
  'Image/Video': 'info',
  'Currency': 'warning',
  'OpenDoc': 'error'
};

export default function DashboardDefault() {
  const theme = useTheme();

  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      <Grid size={12}>
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            component="img"
            src={logo}
            alt="OpenSpace KillerTools Logo"
            sx={{ width: 60, height: 60, borderRadius: 2 }}
          />
          <Box>
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              OpenSpace-KillerTool
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Browser-based developer tools and utilities. Everything runs client-side in your browser. Fast, secure, and open-source.
            </Typography>
          </Box>
        </Box>
      </Grid>

      {/* Stats row */}
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <AnalyticEcommerce title="Total Tools Available" count={ALL_TOOLS.length.toString()} percentage={100} extra="Ready to use" />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <AnalyticEcommerce title="Client-Side Processing" count="100%" percentage={0} color="success" extra="Zero server lag" />
      </Grid>
      <Grid size={{ xs: 12, sm: 12, md: 4 }}>
        <AnalyticEcommerce title="Categories" count={categories.length.toString()} percentage={0} extra={categories.join(', ')} />
      </Grid>

      {/* Tools Grid */}
      <Grid size={12}>
        <Typography variant="h4" sx={{ mt: 2, mb: 3 }} fontWeight="bold">
          All Tools
        </Typography>
        <Grid container spacing={3}>
          {ALL_TOOLS.map((tool, index) => (
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
                      color={CATEGORY_COLORS[tool.category] || 'default'}
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
