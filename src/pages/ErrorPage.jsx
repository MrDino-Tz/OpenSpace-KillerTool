import { useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import logo from 'assets/images/logo.png';

export default function ErrorPage() {
  const theme = useTheme();
  const error = useRouteError();
  let title = 'Something went wrong';
  let message = 'An unexpected error occurred.';
  let code = '';

  if (isRouteErrorResponse(error)) {
    code = `${error.status}`;
    title = `${error.status} ${error.statusText}`;
    message = error.data?.message || message;
  } else if (error instanceof Error) {
    code = 'ERROR';
    message = error.message;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 3, p: 4, textAlign: 'center' }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
        <img src={logo} alt="OpenSpace-KillerTools" width={48} height={48} style={{ borderRadius: '10px' }} />
        <Stack direction="column" alignItems="flex-start">
          <Typography variant="h4" fontWeight="bold" sx={{ color: theme.palette.text.primary, lineHeight: 1.1 }}>
            OpenSpace
          </Typography>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ color: theme.palette.text.secondary, lineHeight: 1.1 }}>
            KillerTools
          </Typography>
        </Stack>
      </Stack>

      {code && (
        <Typography variant="h2" fontWeight={800} sx={{ color: theme.palette.error.main, letterSpacing: 4 }}>
          {code}
        </Typography>
      )}

      <Typography variant="h4" fontWeight={700}>{title}</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500 }}>{message}</Typography>
      <Button variant="contained" onClick={() => window.location.reload()}>Reload Page</Button>
    </Box>
  );
}
