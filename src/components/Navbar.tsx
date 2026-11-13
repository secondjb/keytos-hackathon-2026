import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  useTheme,
} from '@mui/material';
import DarkModeIcon from '@mui/icons-material/Brightness4';
import LightModeIcon from '@mui/icons-material/Brightness7';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import { apiKeysManager } from '../services/apiKeysManager';
import { ApiKeyModal } from './ApiKeyModal';

interface NavbarProps {
  themeMode: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ themeMode, onToggleTheme }) => {
  const theme = useTheme();
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [keyInfo, setKeyInfo] = useState(apiKeysManager.getActiveKeyInfo());
  const allKeys = apiKeysManager.getAllKeys();

  useEffect(() => {
    const unsubscribe = apiKeysManager.subscribe(() => {
      setKeyInfo(apiKeysManager.getActiveKeyInfo());
    });
    return unsubscribe;
  }, []);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleOpenApiKeys = () => {
    handleMenuClose();
    setApiKeyModalOpen(true);
  };

  const remaining = keyInfo?.queriesRemaining;
  const isDark = themeMode === 'dark';

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: isDark ? 'rgba(11, 17, 32, 0.95)' : '#ffffff',
          borderBottom: `1px solid ${theme.palette.divider}`,
          color: theme.palette.text.primary,
          boxShadow: 'none',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 3 } }}>
          {/* Logo & Clean Title */}
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
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: { xs: '1rem', sm: '1.2rem' }, letterSpacing: '-0.3px' }}>
              RxCheck Clinical Interaction Engine
            </Typography>
          </Box>

          {/* Right Action Controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Theme Toggle */}
            <Tooltip title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}>
              <IconButton onClick={onToggleTheme} color="inherit" size="small" sx={{ border: `1px solid ${theme.palette.divider}` }}>
                {isDark ? <LightModeIcon fontSize="small" sx={{ color: 'warning.main' }} /> : <DarkModeIcon fontSize="small" />}
              </IconButton>
            </Tooltip>

            {/* 3-Dot Menu */}
            <Tooltip title="Settings & Options">
              <IconButton onClick={handleMenuOpen} color="inherit" size="small" sx={{ border: `1px solid ${theme.palette.divider}` }}>
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Menu
              anchorEl={menuAnchorEl}
              open={Boolean(menuAnchorEl)}
              onClose={handleMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              slotProps={{
                paper: {
                  elevation: 2,
                  sx: { minWidth: 220, borderRadius: 2, mt: 1 },
                },
              }}
            >
              <MenuItem onClick={handleOpenApiKeys}>
                <ListItemIcon>
                  <VpnKeyIcon fontSize="small" color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="RxCheck API Keys"
                  secondary={
                    remaining !== undefined
                      ? `Quota: ${remaining}/100 remaining`
                      : `${allKeys.length} key${allKeys.length > 1 ? 's' : ''} configured`
                  }
                />
              </MenuItem>

              <MenuItem
                component="a"
                href="tel:911"
                onClick={handleMenuClose}
                sx={{ color: 'error.main' }}
              >
                <ListItemIcon>
                  <PhoneInTalkIcon fontSize="small" color="error" />
                </ListItemIcon>
                <ListItemText primary="Emergency: Call 911" secondary="Poison Help: 1-800-222-1222" />
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <ApiKeyModal open={apiKeyModalOpen} onClose={() => setApiKeyModalOpen(false)} />
    </>
  );
};
