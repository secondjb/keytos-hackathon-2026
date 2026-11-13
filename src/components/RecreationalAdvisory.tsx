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
import type { RecreationalAdvisoryItem } from '../types/rxcheck';

interface RecreationalAdvisoryProps {
  advisories: RecreationalAdvisoryItem[];
}

export const RecreationalAdvisory: React.FC<RecreationalAdvisoryProps> = ({ advisories }) => {
  const theme = useTheme();

  if (advisories.length === 0) return null;

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
              Harm Reduction Advisory: Recreational & Lifestyle Substances
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Evidence-based, non-judgmental safety guidance for substance and medication combinations.
            </Typography>
          </Box>
        </Box>

        <Alert severity="info" variant="outlined" sx={{ mb: 2.5, bgcolor: 'background.paper' }}>
          Standard clinical trial datasets frequently omit recreational drugs.
          The warnings below are compiled from toxicology, emergency medicine, and public health harm reduction literature.
        </Alert>

        <Stack spacing={2}>
          {advisories.map(adv => (
            <Box
              key={adv.id}
              sx={{
                p: 2.5,
                borderRadius: 2,
                bgcolor: 'background.paper',
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: theme.palette.mode === 'dark' ? '0 2px 12px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
                  {adv.substance1} &bull; {adv.substance2}
                </Typography>
                <Chip
                  label={adv.severity === 'critical' ? 'CRITICAL RISK' : 'HIGH RISK'}
                  color={adv.severity === 'critical' ? 'error' : 'secondary'}
                  size="small"
                  sx={{ fontWeight: 800, fontSize: '0.72rem' }}
                />
              </Box>

              <Typography variant="body2" sx={{ fontWeight: 700, color: 'error.main', mb: 1 }}>
                {adv.riskTitle}
              </Typography>

              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5, lineHeight: 1.6 }}>
                <strong>Biological Risk:</strong> {adv.mechanism}
              </Typography>

              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 1.5,
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(34, 211, 238, 0.08)' : 'rgba(240, 253, 250, 1)',
                  borderLeft: `3px solid ${theme.palette.primary.main}`,
                  mb: 1.5,
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', color: 'primary.main', display: 'block', mb: 0.5 }}>
                  Harm Reduction Guidance:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {adv.harmReductionAdvice}
                </Typography>
              </Box>

              {adv.symptomsToWatch.length > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                    Critical Signs to Watch:
                  </Typography>
                  {adv.symptomsToWatch.map(sym => (
                    <Chip
                      key={sym}
                      label={sym}
                      size="small"
                      variant="outlined"
                      color="error"
                      sx={{ fontSize: '0.7rem' }}
                    />
                  ))}
                </Box>
              )}
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
};
