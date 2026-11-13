import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Alert,
  AlertTitle,
  Stack,
  useTheme,
} from '@mui/material';
import HealingIcon from '@mui/icons-material/Healing';
import EmergencyIcon from '@mui/icons-material/Emergency';
import type { ExtractedClinicalSymptom } from '../types/rxcheck';

interface SymptomSelectorProps {
  symptoms: ExtractedClinicalSymptom[];
  selectedSymptomIds: string[];
  onToggleSymptom: (id: string) => void;
}

export const SymptomSelector: React.FC<SymptomSelectorProps> = ({
  symptoms,
  selectedSymptomIds,
  onToggleSymptom,
}) => {
  const theme = useTheme();

  if (symptoms.length === 0) {
    return (
      <Card elevation={0} sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <HealingIcon color="primary" fontSize="large" />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Clinical Adverse Signs & Symptoms (RxCheck Dataset)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Adverse symptoms and warning signs will be dynamically extracted directly from the RxCheck
                clinical interaction records for your active drug list.
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const selectedSymptomsList = symptoms.filter(s => selectedSymptomIds.includes(s.id));
  const hasSelectedRedFlag = selectedSymptomsList.some(s => s.isRedFlag);

  return (
    <Card elevation={0} sx={{ mb: 3 }}>
      <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <HealingIcon color="primary" fontSize="large" />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Clinical Symptoms & Adverse Warning Signs ({symptoms.length} Extracted from RxCheck Records)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              The following symptoms are documented in the active RxCheck records for your regimen.
              Select any symptoms you are experiencing to evaluate urgency:
            </Typography>
          </Box>
        </Box>

        {/* Dynamic Symptom Chips Extracted From RxCheck Records */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, my: 2 }}>
          {symptoms.map(s => {
            const isSelected = selectedSymptomIds.includes(s.id);
            return (
              <Chip
                key={s.id}
                label={s.symptomName}
                clickable
                color={
                  isSelected
                    ? s.isRedFlag
                      ? 'error'
                      : 'primary'
                    : 'default'
                }
                variant={isSelected ? 'filled' : 'outlined'}
                onClick={() => onToggleSymptom(s.id)}
                icon={s.isRedFlag ? <EmergencyIcon fontSize="small" /> : undefined}
                sx={{
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '0.8rem',
                  py: 2,
                  px: 0.5,
                  borderRadius: 2,
                }}
              />
            );
          })}
        </Box>

        {/* Red Flag Alert if User Checked Any Critical Symptoms */}
        {hasSelectedRedFlag && (
          <Alert
            severity="error"
            variant="filled"
            sx={{
              borderRadius: 2,
              mt: 2,
              boxShadow: '0 6px 18px rgba(220, 38, 38, 0.35)',
            }}
          >
            <AlertTitle sx={{ fontWeight: 800 }}>
              CRITICAL EMERGENCY SYMPTOM DETECTED
            </AlertTitle>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              You selected symptoms flagged as critical adverse reactions in the RxCheck clinical record.
              Seek immediate emergency medical evaluation (call 911 or visit the nearest ER) and inform the
              clinical team of your current medications.
            </Typography>
          </Alert>
        )}

        {/* Selected Symptoms Breakdown with Evidence from RxCheck */}
        {selectedSymptomsList.length > 0 && (
          <Stack spacing={1.5} sx={{ mt: 2.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' }}>
              RxCheck Clinical Dataset Excerpt:
            </Typography>
            {selectedSymptomsList.map(s => (
              <Box
                key={s.id}
                sx={{
                  p: 1.5,
                  borderRadius: 1.5,
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                  borderLeft: `3px solid ${s.isRedFlag ? theme.palette.error.main : theme.palette.primary.main}`,
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: s.isRedFlag ? 'error.main' : 'primary.main' }}>
                  {s.symptomName} &bull; Related to {s.sourcePair}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.5 }}>
                  &ldquo;{s.contextSnippet}&rdquo;
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};
