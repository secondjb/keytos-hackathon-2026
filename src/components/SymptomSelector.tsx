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
} from '@mui/material';
import HealingIcon from '@mui/icons-material/Healing';
import EmergencyIcon from '@mui/icons-material/Emergency';
import { COMMON_SYMPTOMS } from '../data/symptomsDb';
import type { SymptomCorrelation } from '../types/rxcheck';

interface SymptomSelectorProps {
  selectedSymptoms: string[];
  onChangeSymptoms: (ids: string[]) => void;
  correlations: SymptomCorrelation[];
}

export const SymptomSelector: React.FC<SymptomSelectorProps> = ({
  selectedSymptoms,
  onChangeSymptoms,
  correlations,
}) => {
  const handleToggleSymptom = (id: string) => {
    if (selectedSymptoms.includes(id)) {
      onChangeSymptoms(selectedSymptoms.filter(s => s !== id));
    } else {
      onChangeSymptoms([...selectedSymptoms, id]);
    }
  };

  return (
    <Card elevation={0} sx={{ mb: 3 }}>
      <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <HealingIcon color="primary" fontSize="large" />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Symptom Checker & Red-Flag Clinical Correlation
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Are you currently experiencing any unusual physical sensations or adverse effects? Select any that apply:
            </Typography>
          </Box>
        </Box>

        {/* Symptom Selection Chips */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, my: 2 }}>
          {COMMON_SYMPTOMS.map(symptom => {
            const isSelected = selectedSymptoms.includes(symptom.id);
            return (
              <Chip
                key={symptom.id}
                label={symptom.label}
                clickable
                color={
                  isSelected
                    ? symptom.isRedFlag
                      ? 'error'
                      : 'primary'
                    : 'default'
                }
                variant={isSelected ? 'filled' : 'outlined'}
                onClick={() => handleToggleSymptom(symptom.id)}
                icon={symptom.isRedFlag ? <EmergencyIcon fontSize="small" /> : undefined}
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

        {/* Clinical Correlation Warning Banners */}
        {correlations.length > 0 && (
          <Stack spacing={1.5} sx={{ mt: 3 }}>
            {correlations.map((corr, idx) => (
              <Alert
                key={idx}
                severity={corr.severity === 'emergency' ? 'error' : 'warning'}
                variant={corr.severity === 'emergency' ? 'filled' : 'standard'}
                sx={{
                  borderRadius: 2,
                  boxShadow: corr.severity === 'emergency'
                    ? '0 6px 18px rgba(220, 38, 38, 0.3)'
                    : undefined,
                }}
              >
                <AlertTitle sx={{ fontWeight: 800 }}>
                  {corr.severity === 'emergency' ? 'CRITICAL SYMPTOM ALERT: ' : 'ADVERSE EFFECT WARNING: '}
                  {corr.symptomName}
                </AlertTitle>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                  {corr.alertMessage}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9, display: 'block', fontWeight: 600 }}>
                  Potential interaction link: {corr.relatedDrugs.join(', ')} &bull; Action required: {corr.actionRequired}
                </Typography>
              </Alert>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};
