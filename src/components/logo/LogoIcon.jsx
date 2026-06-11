// material-ui
import { useTheme } from '@mui/material/styles';

/**
 * if you want to use image instead of <svg> uncomment following.
 *
 * import logoIconDark from 'assets/images/logo-icon-dark.svg';
 * import logoIcon from 'assets/images/logo-icon.svg';
 * import { ThemeMode } from 'config';
 *
 */

import logo from 'assets/images/logo.png';

// ==============================|| LOGO ICON ||============================== //

export default function LogoIcon() {
  return (
    <img src={logo} alt="OpenSpace-KillerTools" width="30" height="30" style={{ borderRadius: '6px' }} />
  );
}

