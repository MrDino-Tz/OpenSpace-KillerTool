// material-ui
import { useTheme } from '@mui/material/styles';

/**
 * if you want to use image instead of <svg> uncomment following.
 *
 * import logoDark from 'assets/images/logo-dark.svg';
 * import logo from 'assets/images/logo.svg';
 *
 */

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import logo from 'assets/images/logo.png';

// ==============================|| LOGO MAIN ||============================== //

export default function LogoMain() {
  const theme = useTheme();
  return (
    /**
     * if you want to use image instead of svg uncomment following, and comment out <svg> element.
     *
     * <img src={theme.palette.mode === ThemeMode.DARK ? logoDark : logo} alt="OpenSpace-KillerTools" width="100" />
     *
     */
    <Stack direction="row" alignItems="center" spacing={1.5}>
      <img src={logo} alt="OpenSpace-KillerTools" width="40" height="40" style={{ borderRadius: '8px' }} />
      <Stack direction="column" alignItems="flex-start">
        <Typography variant="h4" fontWeight="bold" sx={{ color: theme.palette.text.primary, lineHeight: 1.1 }}>
          OpenSpace
        </Typography>
        <Typography variant="subtitle2" fontWeight="bold" sx={{ color: theme.palette.text.secondary, lineHeight: 1.1 }}>
          KillerTools
        </Typography>
      </Stack>
    </Stack>
  );
}
