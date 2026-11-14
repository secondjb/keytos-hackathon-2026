import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Tooltip,
  useTheme,
} from '@mui/material';
import DarkModeIcon from '@mui/icons-material/Brightness4';
import LightModeIcon from '@mui/icons-material/Brightness7';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';

interface NavbarProps {
  themeMode: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ themeMode, onToggleTheme }) => {
  const theme = useTheme();
  const isDark = themeMode === 'dark';

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: isDark ? '#242428' : '#ffffff',
        borderBottom: `1px solid ${theme.palette.divider}`,
        color: theme.palette.text.primary,
        boxShadow: 'none',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 3 } }}>
        {/* Logo & Title: Exactly identical font family and size */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <HealthAndSafetyIcon fontSize="small" />
          </Box>

          <Typography
            sx={{
              fontFamily: theme.typography.fontFamily,
              fontSize: { xs: '0.95rem', sm: '1.2rem' },
              letterSpacing: '-0.2px',
              color: 'text.primary',
              lineHeight: 1,
            }}
          >
            <strong style={{ fontWeight: 800 }}>CheckPoint</strong>{' '}
            <span style={{ fontWeight: 400 }}>Drug Interaction Checker</span>
          </Typography>
        </Box>

        {/* Right Action Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 } }}>
          {/* Emergency & Poison Numbers (Plain text, not clickable) */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              userSelect: 'text',
              cursor: 'default',
            }}
          >
            <PhoneInTalkIcon fontSize="small" sx={{ color: isDark ? '#f07777' : 'error.main' }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
              <Typography
                component="span"
                sx={{
                  fontWeight: 700,
                  color: isDark ? '#f07777' : 'error.main',
                  fontSize: { xs: '0.72rem', sm: '0.8rem' },
                  lineHeight: 1.25,
                }}
              >
                Emergency: Call 911
              </Typography>
              <Typography
                component="span"
                sx={{
                  color: 'text.secondary',
                  fontSize: { xs: '0.68rem', sm: '0.75rem' },
                  lineHeight: 1.25,
                }}
              >
                Poison Help: 1-800-222-1222
              </Typography>
            </Box>
          </Box>

          {/* Theme Toggle */}
          <Tooltip title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}>
            <IconButton onClick={onToggleTheme} color="inherit" size="small" sx={{ border: `1px solid ${theme.palette.divider}` }}>
              {isDark ? <LightModeIcon fontSize="small" sx={{ color: 'text.primary' }} /> : <DarkModeIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
