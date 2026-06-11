// material-ui
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export default function Footer() {
  return (
    <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'flex-start', p: '24px 16px 0px', mt: 'auto' }}>
      <Typography variant="caption">
        &copy; {new Date().getFullYear()} All rights reserved &mdash; DTC Team
      </Typography>
    </Stack>
  );
}
