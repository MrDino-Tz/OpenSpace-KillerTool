// material-ui
import { createTheme } from '@mui/material/styles';

// third-party
import { presetDarkPalettes, presetPalettes } from '@ant-design/colors';

// project imports
import ThemeOption from './theme';

// ==============================|| DEFAULT THEME - PALETTE ||============================== //

export default function Palette(mode, presetColor) {
  const colors = mode === 'dark' ? presetDarkPalettes : presetPalettes;

  let greyPrimary = mode === 'dark' ? [
    '#1e1e1e', // 0: paper background
    '#1e1e1e', // 50
    '#2d2d2d', // 100
    '#2d2d2d', // 200: divider
    '#4a4a4a', // 300
    '#7a7a7a', // 400: text.disabled
    '#a0a0a0', // 500: text.secondary
    '#c0c0c0', // 600
    '#f5f5f5', // 700: text.primary
    '#fafafa', // 800
    '#ffffff'  // 900
  ] : [
    '#ffffff',
    '#fafafa',
    '#f5f5f5',
    '#f0f0f0',
    '#d9d9d9',
    '#bfbfbf',
    '#8c8c8c',
    '#595959',
    '#262626',
    '#141414',
    '#000000'
  ];
  let greyAscent = mode === 'dark' ? ['#1e1e1e', '#c0c0c0', '#4a4a4a', '#1e1e1e'] : ['#fafafa', '#bfbfbf', '#434343', '#1f1f1f'];
  let greyConstant = mode === 'dark' ? ['#1c1c1c', '#121212'] : ['#fafafb', '#e6ebf1'];

  colors.grey = [...greyPrimary, ...greyAscent, ...greyConstant];

  const paletteColor = ThemeOption(colors, presetColor, mode);

  return createTheme({
    palette: {
      mode,
      common: {
        black: '#000',
        white: '#fff'
      },
      ...paletteColor,
      text: {
        primary: paletteColor.grey[700],
        secondary: paletteColor.grey[500],
        disabled: paletteColor.grey[400]
      },
      action: {
        disabled: paletteColor.grey[300]
      },
      divider: paletteColor.grey[200],
      background: {
        paper: paletteColor.grey[0],
        default: paletteColor.grey.A50
      }
    }
  });
}
