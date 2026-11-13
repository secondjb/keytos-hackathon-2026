import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Chip,
  Tooltip,
  useTheme,
} from '@mui/material';
import DarkModeIcon from '@mui/icons-material/Brightness4';
import LightModeIcon from '@mui/icons-material/Brightness7';
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
  const [keyInfo, setKeyInfo] = useState(apiKeysManager.getActiveKeyInfo());
  const allKeys = apiKeysManager.getAllKeys();

  useEffect(() => {
    const unsubscribe = apiKeysManager.subscribe(() => {
      setKeyInfo(apiKeysManager.getActiveKeyInfo());
    });
    return unsubscribe;
  }, []);

  const remaining = keyInfo?.queriesRemaining;
  const isDark = themeMode === 'dark';

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: isDark ? 'rgba(11, 17, 32, 0.85)' : 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${theme.palette.divider}`,
          color: theme.palette.text.primary,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 4 } }}>
          {/* Logo & Branding */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2.5,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 0 16px ${theme.palette.primary.main}60`,
              }}
            >
              <HealthAndSafetyIcon fontSize="medium" />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
                  RxCheck
                </Typography>
                <Chip
                  label="Health Quest"
                  size="small"
                  sx={{
                    bgcolor: 'secondary.main',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.68rem',
                    height: 20,
                  }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: -0.5 }}>
                Multi-Drug Interaction & Harm Reduction Engine
              </Typography>
            </Box>
          </Box>

          {/* Right Action Controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {/* Quota / API Key Chip */}
            <Tooltip title="Manage RxCheck API Keys & view remaining quota" arrow>
              <Chip
                icon={<VpnKeyIcon fontSize="small" />}
                label={
                  remaining !== undefined
                    ? `Quota: ${remaining}/100 left (${allKeys.length} keys)`
                    : `${keyInfo?.maskedKey || 'API Active'} (${allKeys.length} key${allKeys.length > 1 ? 's' : ''})`
                }
                color={remaining !== undefined && remaining <= 5 ? 'error' : 'primary'}
                variant="outlined"
                onClick={() => setApiKeyModalOpen(true)}
                clickable
                sx={{
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: { xs: 'none', sm: 'inline-flex' },
                }}
              />
            </Tooltip>

            {/* Emergency Hotline Alert */}
            <Tooltip title="Emergency Medical Services: 911 | Poison Control: 1-800-222-1222" arrow>
              <Chip
                icon={<PhoneInTalkIcon fontSize="small" />}
                label="911 / Poison Help"
                color="error"
                size="small"
                variant="filled"
                sx={{
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  display: { xs: 'none', md: 'inline-flex' },
                }}
              />
            </Tooltip>

            {/* Theme Toggle */}
            <Tooltip title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}>
              <IconButton onClick={onToggleTheme} color="inherit" sx={{ border: `1px solid ${theme.palette.divider}` }}>
                {isDark ? <LightModeIcon sx={{ color: 'warning.main' }} /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      <ApiKeyModal open={apiKeyModalOpen} onClose={() => setApiKeyModalOpen(false)} />
    </>
  );
};
