import PropTypes from 'prop-types';
import { useMemo } from 'react';

// material-ui
import StyledEngineProvider from '@mui/material/StyledEngineProvider';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// project imports
import Palette from './palette';
import Typography from './typography';
import CustomShadows from './shadows';
import componentsOverride from './overrides';

import { useThemeMode } from 'contexts/ThemeContext';

// ==============================|| DEFAULT THEME - MAIN ||============================== //

export default function ThemeCustomization({ children }) {
  const { mode } = useThemeMode();
  const theme = useMemo(() => Palette(mode, 'default'), [mode]);

  const themeTypography = Typography(`'Public Sans', sans-serif`);
  const themeCustomShadows = useMemo(() => CustomShadows(theme), [theme]);

  const themeOptions = useMemo(
    () => ({
      breakpoints: {
        values: {
          xs: 0,
          sm: 768,
          md: 1024,
          lg: 1266,
          xl: 1440
        }
      },
      direction: 'ltr',
      mixins: {
        toolbar: {
          minHeight: 60,
          paddingTop: 8,
          paddingBottom: 8
        }
      },
      palette: theme.palette,
      customShadows: themeCustomShadows,
      typography: themeTypography
    }),
    [theme, themeTypography, themeCustomShadows]
  );

  const themes = createTheme(themeOptions);
  themes.components = componentsOverride(themes);

  // Dark mode overrides for components that may not pick up palette changes automatically
  if (mode === 'dark') {
    themes.components = {
      ...themes.components,
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: themes.palette.background.default,
            color: themes.palette.text.primary
          }
        }
      },
      MuiAppBar: {
        ...(themes.components?.MuiAppBar || {}),
        styleOverrides: {
          ...(themes.components?.MuiAppBar?.styleOverrides || {}),
          root: {
            ...(themes.components?.MuiAppBar?.styleOverrides?.root || {}),
            backgroundColor: themes.palette.background.paper,
            color: themes.palette.text.primary
          }
        }
      },
      MuiPaper: {
        ...(themes.components?.MuiPaper || {}),
        styleOverrides: {
          ...(themes.components?.MuiPaper?.styleOverrides || {}),
          root: {
            ...(themes.components?.MuiPaper?.styleOverrides?.root || {}),
            backgroundImage: 'none'
          }
        }
      },
      MuiCard: {
        ...(themes.components?.MuiCard || {}),
        styleOverrides: {
          ...(themes.components?.MuiCard?.styleOverrides || {}),
          root: {
            ...(themes.components?.MuiCard?.styleOverrides?.root || {}),
            backgroundColor: themes.palette.background.paper,
            backgroundImage: 'none'
          }
        }
      },
      MuiOutlinedInput: {
        ...(themes.components?.MuiOutlinedInput || {}),
        styleOverrides: {
          ...(themes.components?.MuiOutlinedInput?.styleOverrides || {}),
          root: {
            ...(themes.components?.MuiOutlinedInput?.styleOverrides?.root || {}),
            backgroundColor: 'transparent'
          },
          notchedOutline: {
            ...(themes.components?.MuiOutlinedInput?.styleOverrides?.notchedOutline || {}),
            borderColor: themes.palette.grey[300]
          }
        }
      },
      MuiDialog: {
        ...(themes.components?.MuiDialog || {}),
        styleOverrides: {
          ...(themes.components?.MuiDialog?.styleOverrides || {}),
          paper: {
            backgroundColor: themes.palette.background.paper,
            backgroundImage: 'none'
          }
        }
      },
      MuiDrawer: {
        ...(themes.components?.MuiDrawer || {}),
        styleOverrides: {
          ...(themes.components?.MuiDrawer?.styleOverrides || {}),
          paper: {
            ...(themes.components?.MuiDrawer?.styleOverrides?.paper || {}),
            backgroundColor: themes.palette.background.paper,
            backgroundImage: 'none'
          }
        }
      },
      MuiListItemButton: {
        ...(themes.components?.MuiListItemButton || {}),
        styleOverrides: {
          ...(themes.components?.MuiListItemButton?.styleOverrides || {}),
          root: {
            ...(themes.components?.MuiListItemButton?.styleOverrides?.root || {}),
            '&:hover': {
              backgroundColor: themes.palette.grey[200]
            }
          }
        }
      },
      MuiTableHead: {
        ...(themes.components?.MuiTableHead || {}),
        styleOverrides: {
          root: {
            backgroundColor: themes.palette.grey[100],
            borderTop: '1px solid',
            borderTopColor: themes.palette.divider,
            borderBottom: '2px solid',
            borderBottomColor: themes.palette.divider
          }
        }
      }
    };
  }

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={themes}>
        <CssBaseline enableColorScheme />
        {children}
      </ThemeProvider>
    </StyledEngineProvider>
  );
}

ThemeCustomization.propTypes = { children: PropTypes.node };

