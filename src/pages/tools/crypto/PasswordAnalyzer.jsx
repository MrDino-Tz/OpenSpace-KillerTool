import { useState } from 'react';
import zxcvbn from 'zxcvbn';

// material-ui
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Alert from '@mui/material/Alert';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

// icons
import { LockOutlined, InfoCircleOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';

// project imports
import MainCard from 'components/MainCard';

// ==============================|| PASSWORD ANALYZER ||============================== //

export default function PasswordAnalyzer() {
  const theme = useTheme();
  const [password, setPassword] = useState('');

  const result = zxcvbn(password);

  const getScoreColor = (score) => {
    switch (score) {
      case 0:
      case 1:
        return 'error';
      case 2:
        return 'warning';
      case 3:
        return 'info';
      case 4:
        return 'success';
      default:
        return 'inherit';
    }
  };

  const getScoreLabel = (score) => {
    if (!password) return 'None';
    switch (score) {
      case 0: return 'Very Weak';
      case 1: return 'Weak';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Strong';
      default: return 'None';
    }
  };

  const scoreColor = getScoreColor(result.score);
  const scoreLabel = getScoreLabel(result.score);
  const value = password ? (result.score === 0 ? 10 : result.score * 25) : 0;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" gap={1.5} sx={{ mb: 1 }}>
          <LockOutlined style={{ fontSize: 28, color: theme.palette.primary.main }} />
          <Typography variant="h3" fontWeight="bold">
            Password Analyzer
          </Typography>
        </Stack>
        <Typography variant="body1" color="text.secondary">
          Check your password strength and estimated crack time using the industry-standard zxcvbn algorithm. 
          Everything runs entirely in your browser — your password is never sent anywhere.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <MainCard title="Analyze Password">
            <TextField
              fullWidth
              type="text"
              label="Enter password to analyze"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Start typing..."
              autoComplete="off"
              sx={{ mb: 3 }}
            />

            <Box sx={{ mb: 4 }}>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Overall Strength
                </Typography>
                <Typography variant="subtitle1" color={`${scoreColor}.main`} fontWeight="bold">
                  {scoreLabel}
                </Typography>
              </Stack>
              <LinearProgress 
                variant="determinate" 
                value={value} 
                color={scoreColor}
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Box>

            {/* Massive Brute Force Crack Time Display */}
            <Box 
              sx={{ 
                p: 3, 
                mb: 3, 
                bgcolor: scoreColor === 'error' ? 'error.lighter' : scoreColor === 'warning' ? 'warning.lighter' : scoreColor === 'success' ? 'success.lighter' : theme.palette.action.hover, 
                borderRadius: 2,
                border: '2px solid',
                borderColor: scoreColor === 'inherit' ? theme.palette.divider : `${scoreColor}.main`,
                textAlign: 'center'
              }}
            >
              <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 'bold', letterSpacing: 2 }}>
                BRUTE FORCE CRACK TIME (FAST GPU)
              </Typography>
              <Typography 
                variant="h2" 
                sx={{ 
                  my: 1, 
                  fontWeight: 900, 
                  color: scoreColor === 'error' || scoreColor === 'warning' ? 'error.main' : 'success.main',
                  wordBreak: 'break-word'
                }}
              >
                {password ? result.crack_times_display.offline_fast_hashing_1e10_per_second.toUpperCase() : 'N/A'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Time required for a cluster of GPUs to guess this password using MD5/SHA1 hashing (10 billion guesses/second)
              </Typography>
            </Box>

            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 'bold' }}>
              Other Attack Scenarios
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={{ p: 2, bgcolor: theme.palette.action.hover, borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Online Attack
                  </Typography>
                  <Typography variant="h5" color={scoreColor === 'error' ? 'warning.main' : 'success.main'}>
                    {password ? result.crack_times_display.online_no_throttling_10_per_second : 'N/A'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    (10 guesses per second)
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={{ p: 2, bgcolor: theme.palette.action.hover, borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Slow Hashing (Bcrypt)
                  </Typography>
                  <Typography variant="h5" color={scoreColor === 'error' ? 'warning.main' : 'success.main'}>
                    {password ? result.crack_times_display.offline_slow_hashing_1e4_per_second : 'N/A'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    (10,000 guesses per second)
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {password && (
              <Box sx={{ mt: 3 }}>
                <Stack direction="row" gap={1} flexWrap="wrap">
                  <Chip label={`${password.length} characters`} size="small" />
                  <Chip label={`Score: ${result.score}/4`} size="small" color={scoreColor} />
                  <Chip label={`Guesses required: ${result.guesses}`} size="small" variant="outlined" />
                </Stack>
              </Box>
            )}
          </MainCard>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Stack spacing={3}>
            <MainCard title="Feedback & Suggestions">
              {!password ? (
                <Box sx={{ textAlign: 'center', py: 4, opacity: 0.5 }}>
                  <InfoCircleOutlined style={{ fontSize: 40, marginBottom: 16 }} />
                  <Typography variant="body2">
                    Enter a password to see security feedback
                  </Typography>
                </Box>
              ) : (
                <Box>
                  {result.feedback.warning && (
                    <Alert severity="error" icon={<WarningOutlined />} sx={{ mb: 2 }}>
                      {result.feedback.warning}
                    </Alert>
                  )}
                  
                  {result.feedback.suggestions && result.feedback.suggestions.length > 0 ? (
                    <List disablePadding>
                      {result.feedback.suggestions.map((suggestion, idx) => (
                        <ListItem key={idx} disablePadding sx={{ mb: 1 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <InfoCircleOutlined style={{ color: theme.palette.info.main }} />
                          </ListItemIcon>
                          <ListItemText primary={suggestion} primaryTypographyProps={{ variant: 'body2' }} />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Alert severity="success" icon={<CheckCircleOutlined />}>
                      Your password looks great! No immediate suggestions.
                    </Alert>
                  )}
                </Box>
              )}
            </MainCard>

            {password && result.sequence.length > 0 && (
              <MainCard title="Pattern Analysis">
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  zxcvbn identified the following patterns in your password:
                </Typography>
                <Stack direction="row" gap={1} flexWrap="wrap">
                  {result.sequence.map((seq, idx) => (
                    <Chip 
                      key={idx} 
                      label={`${seq.pattern} (${seq.token})`} 
                      size="small" 
                      variant="outlined" 
                      color={seq.pattern === 'dictionary' ? 'error' : 'default'}
                    />
                  ))}
                </Stack>
              </MainCard>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
