import React from 'react';
import { Box, Alert, Typography, Chip, useTheme } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import PrintIcon from '@mui/icons-material/Print';
import type { EvaluatedDrugPair } from '../types/rxcheck';

interface DoctorWarningBannerProps {
  results: EvaluatedDrugPair[];
  onOpenReport: () => void;
}

export const DoctorWarningBanner: React.FC<DoctorWarningBannerProps> = ({
  results,
  onOpenReport,
}) => {
  const theme = useTheme();
  if (results.length === 0) return null;

  const hasMajor = results.some(r => r.severity === 'major' || r.isHighPriority);
  const hasNoRecord = results.some(r => r.status === 'no_record_found');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Dangerous Interaction Warning */}
      {hasMajor && (
        <Alert
          severity="error"
          variant="filled"
          icon={<WarningAmberIcon fontSize="medium" />}
          sx={{
            py: 1.5,
            px: 2,
            boxShadow: 'none',
            border: 'none',
            bgcolor: theme.palette.mode === 'dark' ? '#991b1b' : '#b91c1c', // Muted dark red
            color: '#ffffff',
            borderRadius: 2.5,
          }}
        >
          {/* Top Row: Title + Horizontal Doctor Summary Chip */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 0.5, width: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.2px' }}>
              DANGEROUS INTERACTIONS DETECTED — CONSULT YOUR DOCTOR
            </Typography>

            <Chip
              icon={<PrintIcon fontSize="small" sx={{ color: '#ffffff !important' }} />}
              label="Doctor Summary"
              clickable
              onClick={onOpenReport}
              size="small"
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.75rem',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.35)',
                },
              }}
            />
          </Box>

          <Typography variant="body2" sx={{ opacity: 0.95, fontSize: '0.85rem', lineHeight: 1.5 }}>
            One or more high-risk clinical interactions were detected in your regimen that could cause severe adverse events (e.g., hemorrhaging, arrhythmia, or organ toxicity).
            <strong> Never discontinue or alter prescription medications without professional clinical supervision. </strong>
            Contact your doctor or pharmacist right away.
          </Typography>
        </Alert>
      )}

      {/* No Record Found Alert */}
      {hasNoRecord && (
        <Alert
          severity="warning"
          variant="outlined"
          icon={<HealthAndSafetyIcon fontSize="medium" />}
          sx={{
            bgcolor: 'background.paper',
            py: 1.2,
            px: 2,
            boxShadow: 'none',
            borderRadius: 2.5,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.9rem', mb: 0.3 }}>
            Unverified Combination (No Record Found) — Consult Your Doctor
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem', lineHeight: 1.5 }}>
            No matching record exists in the active RxCheck dataset for one or more pairs.
            <strong> The absence of an interaction record does NOT establish clinical safety. </strong>
            Always verify safety with your healthcare provider.
          </Typography>
        </Alert>
      )}
    </Box>
  );
};
