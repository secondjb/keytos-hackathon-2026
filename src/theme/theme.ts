import { createTheme, responsiveFontSizes, type Theme } from '@mui/material/styles';

export type ThemeMode = 'light' | 'dark';

export const createAppTheme = (mode: ThemeMode): Theme => {
  const isDark = mode === 'dark';

  const theme = createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? '#38bdf8' : '#0284c7',
        light: isDark ? '#7dd3fc' : '#38bdf8',
        dark: isDark ? '#0369a1' : '#075985',
        contrastText: '#ffffff',
      },
      secondary: {
        main: isDark ? '#fb7185' : '#e11d48',
        light: '#fda4af',
        dark: '#9f1239',
        contrastText: '#ffffff',
      },
      error: {
        main: isDark ? '#f87171' : '#b91c1c', // Muted clinical red
        light: '#fca5a5',
        dark: '#991b1b',
        contrastText: '#ffffff',
      },
      warning: {
        main: isDark ? '#fbbf24' : '#d97706',
        light: '#fde68a',
        dark: '#b45309',
      },
      info: {
        main: isDark ? '#38bdf8' : '#0284c7',
        light: '#7dd3fc',
        dark: '#0369a1',
      },
      success: {
        main: isDark ? '#34d399' : '#059669',
        light: '#6ee7b7',
        dark: '#047857',
      },
      background: {
        default: isDark ? '#0b1120' : '#f8fafc',
        paper: isDark ? '#131e33' : '#ffffff',
      },
      text: {
        primary: isDark ? '#f1f5f9' : '#0f172a',
        secondary: isDark ? '#94a3b8' : '#475569',
      },
      divider: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    },
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
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
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
            fontWeight: 600,
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
  });

  return responsiveFontSizes(theme);
};
