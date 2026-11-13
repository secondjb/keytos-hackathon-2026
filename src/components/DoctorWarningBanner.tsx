import React from 'react';
import { Box, Alert, AlertTitle, Typography, Button } from '@mui/material';
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
  if (results.length === 0) return null;

  const hasMajor = results.some(r => r.severity === 'major' || r.isHighPriority);
  const hasNoRecord = results.some(r => r.status === 'no_record_found');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, my: 3 }}>
      {/* Dangerous Interaction Warning */}
      {hasMajor && (
        <Alert
          severity="error"
          variant="filled"
          icon={<WarningAmberIcon fontSize="large" />}
          action={
            <Button
              color="inherit"
              size="small"
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={onOpenReport}
              sx={{
                bgcolor: 'rgba(255,255,255,0.15)',
                borderColor: 'rgba(255,255,255,0.4)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
                fontWeight: 700,
              }}
            >
              Doctor Summary
            </Button>
          }
          sx={{
            py: 1.5,
            px: 2.5,
            boxShadow: '0 8px 24px rgba(220, 38, 38, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <AlertTitle sx={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.2px' }}>
            DANGEROUS INTERACTIONS DETECTED — CONSULT YOUR DOCTOR
          </AlertTitle>
          <Typography variant="body2" sx={{ opacity: 0.95, mt: 0.5 }}>
            One or more high-risk clinical interactions were detected in your regimen that could cause
            severe adverse events (e.g., hemorrhaging, arrhythmia, or organ toxicity).
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
          icon={<HealthAndSafetyIcon fontSize="large" />}
          sx={{
            bgcolor: 'background.paper',
            py: 1.5,
            px: 2.5,
            borderWidth: 2,
          }}
        >
          <AlertTitle sx={{ fontWeight: 700, fontSize: '0.98rem' }}>
            Unverified Combination (No Record Found) — Consult Your Doctor
          </AlertTitle>
          <Typography variant="body2" color="text.secondary">
            No matching record exists in the active RxCheck dataset for one or more pairs.
            <strong> The absence of an interaction record does NOT establish clinical safety. </strong>
            Dietary supplements, herbal extracts, and rare drug combinations frequently lack cataloged
            clinical interaction trials. Always verify safety with your healthcare provider.
          </Typography>
        </Alert>
      )}
    </Box>
  );
};
