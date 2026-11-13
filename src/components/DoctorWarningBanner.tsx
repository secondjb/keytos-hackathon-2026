import React from 'react';
import { Box, Card, CardContent, Typography, Chip, useTheme } from '@mui/material';
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
      {/* Dangerous Interaction Card: Same red outline as the other card, not red fill */}
      {hasMajor && (
        <Card
          elevation={0}
          sx={{
            border: `2px solid ${theme.palette.error.main}`,
            bgcolor: 'background.paper',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
            borderRadius: 2.5,
          }}
        >
          <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
            {/* Top Row: Title + Horizontal Doctor Summary Chip */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 1,
                mb: 1,
                width: '100%',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningAmberIcon color="error" fontSize="medium" />
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'error.main', fontSize: '0.95rem', letterSpacing: '-0.2px' }}>
                  DANGEROUS INTERACTIONS DETECTED — CONSULT YOUR DOCTOR
                </Typography>
              </Box>

              <Chip
                icon={<PrintIcon fontSize="small" />}
                label="Doctor Summary"
                clickable
                onClick={onOpenReport}
                size="small"
                variant="outlined"
                color="error"
                sx={{
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  height: 26,
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              />
            </Box>

            <Typography variant="body2" color="text.primary" sx={{ fontSize: '0.88rem', lineHeight: 1.6, pl: 0.5 }}>
              One or more high-risk clinical interactions were detected in your regimen that could cause severe adverse events (e.g., hemorrhaging, arrhythmia, or organ toxicity).
              <strong> Never discontinue or alter prescription medications without professional clinical supervision. </strong>
              Contact your doctor or pharmacist right away.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* No Record Found Alert */}
      {hasNoRecord && (
        <Card
          elevation={0}
          sx={{
            border: `1.5px solid ${theme.palette.warning.main}`,
            bgcolor: 'background.paper',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
            borderRadius: 2.5,
          }}
        >
          <CardContent sx={{ p: { xs: 2, md: 2.2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <HealthAndSafetyIcon color="warning" fontSize="medium" />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                Unverified Combination (No Record Found) — Consult Your Doctor
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.84rem', lineHeight: 1.5, pl: 0.5 }}>
              No matching record exists in the active RxCheck dataset for one or more pairs.
              <strong> The absence of an interaction record does NOT establish clinical safety. </strong>
              Always verify safety with your healthcare provider.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
