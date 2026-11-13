import { createTheme, responsiveFontSizes, type Theme, type ThemeOptions } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    chipText?: string;
  }
  interface PaletteOptions {
    chipText?: string;
  }
}

export type ThemeMode = 'light' | 'dark';

export const offWhite = '#fafafa';

export const getBaseOptions = (mode: ThemeMode): ThemeOptions => {
  const isDark = mode === 'dark';

  return {
    typography: {
      fontFamily: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
      h1: { fontWeight: 800, letterSpacing: '-0.025em' },
      h2: { fontWeight: 700, letterSpacing: '-0.02em' },
      h3: { fontWeight: 700, letterSpacing: '-0.02em' },
      h4: { fontWeight: 700, letterSpacing: '-0.015em' },
      h5: { fontWeight: 600, letterSpacing: '-0.01em' },
      h6: { fontWeight: 600 },
      subtitle1: { fontWeight: 500 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: {
      borderRadius: 10,
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            borderRadius: 12,
            border: isDark ? '1px solid rgba(255, 255, 255, 0.09)' : '1px solid rgba(0, 0, 0, 0.08)',
            boxShadow: 'none', // Remove all glows
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            boxShadow: 'none',
            padding: '8px 18px',
            '&:hover': {
              boxShadow: 'none',
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            fontWeight: 700,
          },
          filled: {
            '&.MuiChip-colorError': {
              color: isDark ? offWhite : '#ffffff',
            },
          },
          outlined: {
            '&.MuiChip-colorError': {
              color: isDark ? '#B30000' : '#b91c1c',
            },
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            boxShadow: 'none', // Remove alert glows
          },
        },
      },
    },
  };
};

export const dark_steel: Theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#928DAB',
      light: '#b2aecd',
      dark: '#6f6a87',
      contrastText: '#161618',
    },
    secondary: {
      main: '#9FA8DA',
      light: '#C5CAE9',
      dark: '#5C6BC0',
      contrastText: '#161618',
    },
    error: {
      main: '#B30000',
      light: '#e03a3a',
      dark: '#800000',
      contrastText: offWhite, // '#fafafa' offwhite inside dark mode chips & alerts
    },
    warning: {
      main: '#f59e0b',
      light: '#fde68a',
      dark: '#b45309',
    },
    info: {
      main: '#928DAB',
      light: '#b2aecd',
      dark: '#6f6a87',
    },
    success: {
      main: '#34d399',
      light: '#6ee7b7',
      dark: '#047857',
    },
    background: {
      default: '#161618', // Clean neutral charcoal steel gray (no purple)
      paper: '#1F1F22',   // Elevated dark surface
    },
    text: {
      primary: offWhite,
      secondary: offWhite,
    },
    divider: 'rgba(255, 255, 255, 0.09)',
    chipText: offWhite,
  },
  ...getBaseOptions('dark'),
});

// Alias for backwards compatibility if needed
export const dark_almond = dark_steel;

export const lightTheme: Theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0284c7',
      light: '#38bdf8',
      dark: '#075985',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#e11d48',
      light: '#fda4af',
      dark: '#9f1239',
      contrastText: '#ffffff',
    },
    error: {
      main: '#b91c1c',
      light: '#fca5a5',
      dark: '#991b1b',
      contrastText: '#ffffff', // Standard crisp white in light mode
    },
    warning: {
      main: '#d97706',
      light: '#fde68a',
      dark: '#b45309',
    },
    info: {
      main: '#0284c7',
      light: '#7dd3fc',
      dark: '#0369a1',
    },
    success: {
      main: '#059669',
      light: '#6ee7b7',
      dark: '#047857',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#475569',
    },
    divider: 'rgba(0, 0, 0, 0.08)',
    chipText: '#ffffff',
  },
  ...getBaseOptions('light'),
});

export const createAppTheme = (mode: ThemeMode): Theme => {
  return responsiveFontSizes(mode === 'dark' ? dark_steel : lightTheme);
};
