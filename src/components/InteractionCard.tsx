import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Collapse,
  Button,
  Divider,
  Stack,
  useTheme,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import type { EvaluatedDrugPair, SeverityLevel } from '../types/rxcheck';

interface InteractionCardProps {
  item: EvaluatedDrugPair;
}

export const InteractionCard: React.FC<InteractionCardProps> = ({ item }) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(item.severity === 'major');

  const isUnresolved =
    item.status === 'error' ||
    (item.clinicalSignificance && item.clinicalSignificance.toLowerCase().includes('could not resolve'));

  const getSeverityBadge = (severity: SeverityLevel, isPriority: boolean) => {
    const chipSx = {
      height: 26,
      fontSize: '0.72rem',
      fontWeight: 800,
      borderRadius: 1,
      px: 0.5,
    };

    if (isUnresolved) {
      return (
        <Chip
          icon={<HelpOutlineOutlinedIcon fontSize="small" />}
          label="UNRESOLVED CONCEPT"
          color="warning"
          variant="outlined"
          sx={chipSx}
        />
      );
    }
    if (isPriority || severity === 'major') {
      return (
        <Chip
          label="MAJOR RISK"
          color="error"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 26,
            borderRadius: '13px',
            fontSize: '0.72rem',
            fontWeight: 800,
            color: theme.palette.error.contrastText,
            px: 1.2,
            '& .MuiChip-label': {
              p: 0,
              color: theme.palette.error.contrastText,
              lineHeight: 1,
            },
          }}
        />
      );
    }
    if (severity === 'moderate') {
      return (
        <Chip
          label="MODERATE RISK"
          color="warning"
          sx={chipSx}
        />
      );
    }
    if (severity === 'minor') {
      return (
        <Chip
          icon={<InfoOutlinedIcon fontSize="small" />}
          label="MINOR / MONITOR"
          color="info"
          sx={chipSx}
        />
      );
    }
    return (
      <Chip
        icon={<CheckCircleOutlinedIcon fontSize="small" />}
        label="NO INTERACTION FOUND"
        variant="outlined"
        color="default"
        sx={{ ...chipSx, borderColor: theme.palette.divider, color: 'text.secondary' }}
      />
    );
  };

  const getCardBorder = (severity: SeverityLevel, isPriority: boolean) => {
    if (isUnresolved) {
      return `1.5px dashed ${theme.palette.warning.main}`;
    }
    if (isPriority || severity === 'major') {
      return `2px solid ${theme.palette.error.main}`;
    }
    if (severity === 'moderate') {
      return `1.5px solid ${theme.palette.warning.main}`;
    }
    return `1px solid ${theme.palette.divider}`;
  };

  return (
    <Card
      elevation={0}
      sx={{
        border: getCardBorder(item.severity, item.isHighPriority),
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        },
      }}
    >
      <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
        {/* Header Row: Drug Names & Final 2 Chips of identical height */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {item.drug1}
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                +
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {item.drug2}
              </Typography>
            </Box>
          </Box>

          {/* Final 2 chips: same height and size, cached badge removed */}
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            {item.isHighPriority && (
              <Chip
                label="ONC High Priority"
                color="error"
                variant="outlined"
                sx={{
                  height: 26,
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  borderRadius: 1,
                  px: 0.5,
                }}
              />
            )}
            {getSeverityBadge(item.severity, item.isHighPriority)}
          </Stack>
        </Box>

        {/* Clinical Significance / Summary */}
        <Typography variant="body1" sx={{ fontWeight: 500, lineHeight: 1.6, color: 'text.primary', mb: 1.5 }}>
          {item.clinicalSignificance ||
            (item.status === 'no_record_found'
              ? 'No documented interaction was found between these medications. Remember: lack of documented data does not guarantee safety. Always verify with your doctor or pharmacist.'
              : 'Consult clinical literature for specific pharmacology.')}
        </Typography>

        {/* Management Guidance Pill / Highlight */}
        {item.management && (
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: isUnresolved
                ? theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(254, 243, 199, 0.7)'
                : item.severity === 'major'
                ? theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(254, 242, 242, 0.9)'
                : theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 251, 235, 0.9)',
              borderLeft: `4px solid ${
                isUnresolved
                  ? theme.palette.warning.main
                  : item.severity === 'major'
                  ? theme.palette.error.main
                  : theme.palette.warning.main
              }`,
              mb: 2,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                display: 'block',
                mb: 0.5,
                color: isUnresolved ? 'warning.main' : item.severity === 'major' ? 'error.main' : 'warning.main',
              }}
            >
              {isUnresolved ? 'Resolution Advice:' : 'Clinical Management & Patient Advice:'}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
              {item.management}
            </Typography>
          </Box>
        )}

        {/* Expandable Mechanism & Details */}
        {!isUnresolved && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button
                size="small"
                color="inherit"
                onClick={() => setExpanded(!expanded)}
                endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                sx={{ fontWeight: 600, color: 'text.secondary' }}
              >
                {expanded ? 'Hide Mechanism & Details' : 'View Biological Mechanism & Evidence'}
              </Button>

              {item.sources && item.sources.length > 0 && (
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Sources: {item.sources.join(', ')}
                </Typography>
              )}
            </Box>

            <Collapse in={expanded}>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {item.mechanism && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main', mb: 0.5 }}>
                      Pharmacological Mechanism of Action:
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      {item.mechanism}
                    </Typography>
                  </Box>
                )}

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', pt: 1 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    <strong>Evidence Level:</strong> {item.evidenceLevel || 'Clinical Review'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    <strong>Severity:</strong> {item.status === 'no_record_found' || item.severity === 'none' ? 'None Documented' : (item.severity.charAt(0).toUpperCase() + item.severity.slice(1))}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    <strong>Evaluated:</strong> {new Date(item.timestamp).toLocaleTimeString()}
                  </Typography>
                </Box>
              </Box>
            </Collapse>
          </>
        )}
      </CardContent>
    </Card>
  );
};
