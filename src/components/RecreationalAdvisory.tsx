import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Alert,
  Stack,
  useTheme,
} from '@mui/material';
import ShieldIcon from '@mui/icons-material/Shield';
import type { EvaluatedDrugPair } from '../types/rxcheck';

interface RecreationalAdvisoryProps {
  results: EvaluatedDrugPair[];
  drugs: string[];
}

const RECREATIONAL_SUBSTANCE_NAMES = [
  'ethanol',
  'alcohol',
  'cannabis',
  'marijuana',
  'thc',
  'cbd',
  'cocaine',
  'mdma',
  'nicotine',
  'caffeine',
  'kratom',
  'psilocybin',
];

export const RecreationalAdvisory: React.FC<RecreationalAdvisoryProps> = ({ results, drugs }) => {
  const theme = useTheme();

  // Detect which active drugs are recreational/lifestyle substances
  const recreationalInRegimen = drugs.filter(d =>
    RECREATIONAL_SUBSTANCE_NAMES.some(sub => d.toLowerCase().includes(sub))
  );

  if (recreationalInRegimen.length === 0) return null;

  // Filter pairs that involve a recreational substance
  const relevantPairs = results.filter(r =>
    recreationalInRegimen.some(
      sub =>
        r.drug1.toLowerCase().includes(sub.toLowerCase()) ||
        r.drug2.toLowerCase().includes(sub.toLowerCase())
    )
  );

  return (
    <Card
      elevation={0}
      sx={{
        mb: 3,
        border: `1.5px solid ${theme.palette.secondary.main}`,
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(244, 63, 94, 0.05)' : 'rgba(255, 241, 242, 0.6)',
      }}
    >
      <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <ShieldIcon color="secondary" fontSize="large" />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: 'secondary.main' }}>
              Lifestyle & Recreational Substance Advisory (RxCheck Analysis)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Evaluating clinical dataset records for: {recreationalInRegimen.join(', ')}
            </Typography>
          </Box>
        </Box>

        <Alert severity="info" variant="outlined" sx={{ mb: 2.5, bgcolor: 'background.paper' }}>
          RxCheck dataset note: Clinical trials for prescription drugs frequently exclude recreational substances.
          When RxCheck returns <code>no_record_found</code>, remember that lack of documented trial data does <strong>NOT</strong> establish safety.
        </Alert>

        <Stack spacing={2}>
          {relevantPairs.map(item => (
            <Box
              key={item.id}
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: 'background.paper',
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {item.drug1} + {item.drug2}
                </Typography>
                <Chip
                  label={item.severity === 'major' ? 'MAJOR RISK' : item.severity === 'moderate' ? 'MODERATE RISK' : item.status === 'no_record_found' ? 'NO RECORD IN DATASET' : 'EVALUATED'}
                  color={item.severity === 'major' ? 'error' : item.severity === 'moderate' ? 'warning' : 'default'}
                  size="small"
                  sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                />
              </Box>

              <Typography variant="body2" sx={{ color: 'text.primary', mb: 1 }}>
                {item.clinicalSignificance || 'No clinical interaction record found in the current RxCheck dataset.'}
              </Typography>

              {item.management && (
                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontWeight: 600 }}>
                  Clinical Guidance: {item.management}
                </Typography>
              )}
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
};
