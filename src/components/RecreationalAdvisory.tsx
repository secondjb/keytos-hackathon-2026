import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Alert,
  Stack,
  useTheme,
  IconButton,
  Collapse,
} from '@mui/material';
import ShieldIcon from '@mui/icons-material/Shield';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type { EvaluatedDrugPair } from '../types/rxcheck';

interface RecreationalAdvisoryProps {
  results: EvaluatedDrugPair[];
  drugs: string[];
  defaultExpanded?: boolean;
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

export const RecreationalAdvisory: React.FC<RecreationalAdvisoryProps> = ({
  results,
  drugs,
  defaultExpanded = true,
}) => {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(defaultExpanded);

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
        <Box
          onClick={() => setIsOpen(!isOpen)}
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            userSelect: 'none',
            mb: isOpen ? 2 : 0,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <ShieldIcon color="secondary" fontSize="large" />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'secondary.main' }}>
                Lifestyle & Substance Safety Advisory
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Safety evaluation for: {recreationalInRegimen.join(', ')}
              </Typography>
            </Box>
          </Box>
          <IconButton
            size="medium"
            onClick={e => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            aria-label={isOpen ? 'Collapse Advisory' : 'Expand Advisory'}
            sx={{
              color: 'secondary.main',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.25s ease-in-out',
            }}
          >
            <ExpandMoreIcon />
          </IconButton>
        </Box>

        <Collapse in={isOpen} timeout="auto">

        <Alert severity="info" variant="outlined" sx={{ mb: 2.5, bgcolor: 'background.paper' }}>
          <strong>Clinical Advisory Note:</strong> Clinical trials for prescription medications frequently exclude recreational substances and alcohol. Even when no interaction record is found in the dataset, remember that a lack of documented trial data does <strong>NOT</strong> establish safety. Always consult your doctor or pharmacist.
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
                  label={item.severity === 'major' ? 'MAJOR RISK' : item.severity === 'moderate' ? 'MODERATE RISK' : item.status === 'no_record_found' ? 'NO INTERACTION' : 'EVALUATED'}
                  color={item.severity === 'major' ? 'error' : item.severity === 'moderate' ? 'warning' : 'default'}
                  size="small"
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.72rem',
                    ...(item.severity === 'major' ? {
                      color: theme.palette.error.contrastText,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      px: 1.2,
                      '& .MuiChip-label': {
                        p: 0,
                        color: theme.palette.error.contrastText,
                        lineHeight: 1,
                      },
                    } : {}),
                  }}
                />
              </Box>

              <Typography variant="body2" sx={{ color: 'text.primary', mb: 1 }}>
                {item.clinicalSignificance || 'No documented interaction found.'}
              </Typography>

              {item.management && (
                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontWeight: 600 }}>
                  Clinical Guidance: {item.management}
                </Typography>
              )}
            </Box>
          ))}
        </Stack>
        </Collapse>
      </CardContent>
    </Card>
  );
};
