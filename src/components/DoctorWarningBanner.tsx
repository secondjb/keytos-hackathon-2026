import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, Chip, useTheme, IconButton, Collapse } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import PrintIcon from '@mui/icons-material/Print';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type { EvaluatedDrugPair } from '../types/rxcheck';

interface DoctorWarningBannerProps {
  results: EvaluatedDrugPair[];
  onOpenReport: () => void;
  defaultExpanded?: boolean;
}

export const DoctorWarningBanner: React.FC<DoctorWarningBannerProps> = ({
  results,
  onOpenReport,
  defaultExpanded = false,
}) => {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(defaultExpanded);
  if (results.length === 0) return null;

  const hasMajor = results.some(r => r.severity === 'major' || r.isHighPriority);
  const hasNoRecord = results.some(r => r.status === 'no_record_found');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Dangerous Interaction Card: Same red outline, bigger title */}
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
          <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
            {/* Top Row: Bigger Title + Horizontal Doctor Summary Chip + Dropdown Arrow */}
            <Box
              onClick={() => setIsOpen(!isOpen)}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 1.5,
                mb: isOpen ? 1.5 : 0,
                width: '100%',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                <WarningAmberIcon color="error" sx={{ fontSize: 32 }} />
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    color: 'error.main',
                    fontSize: { xs: '1.05rem', sm: '1.25rem' },
                    letterSpacing: '-0.3px',
                    lineHeight: 1.2,
                  }}
                >
                  DANGEROUS INTERACTIONS DETECTED — CONSULT YOUR DOCTOR
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  icon={<PrintIcon fontSize="small" />}
                  label="Doctor Summary"
                  clickable
                  onClick={e => {
                    e.stopPropagation();
                    onOpenReport();
                  }}
                  size="small"
                  variant="outlined"
                  color="error"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    height: 28,
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                />
                <IconButton
                  size="medium"
                  onClick={e => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                  }}
                  aria-label={isOpen ? 'Collapse Warning Banner' : 'Expand Warning Banner'}
                  sx={{
                    color: 'error.main',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.25s ease-in-out',
                  }}
                >
                  <ExpandMoreIcon />
                </IconButton>
              </Box>
            </Box>

            <Collapse in={isOpen} timeout="auto">
              <Typography variant="body2" color="text.primary" sx={{ fontSize: '0.92rem', lineHeight: 1.6, pl: { sm: 5 } }}>
                One or more high-risk clinical interactions were detected in your regimen that could cause severe adverse events (e.g., hemorrhaging, arrhythmia, or organ toxicity).
                <strong> Never discontinue or alter prescription medications without professional clinical supervision. </strong>
                Contact your doctor or pharmacist right away.
              </Typography>
            </Collapse>
          </CardContent>
        </Card>
      )}

      {/* Cautionary note when no interactions are flagged in the dataset */}
      {hasNoRecord && !hasMajor && (
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
            <Box
              onClick={() => setIsOpen(!isOpen)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                userSelect: 'none',
                mb: isOpen ? 0.5 : 0,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <HealthAndSafetyIcon color="warning" fontSize="medium" />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                  Unverified Combination (No Record Found) — Consult Your Doctor
                </Typography>
              </Box>
              <IconButton
                size="small"
                onClick={e => {
                  e.stopPropagation();
                  setIsOpen(!isOpen);
                }}
                sx={{
                  color: 'text.secondary',
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.25s ease-in-out',
                }}
              >
                <ExpandMoreIcon />
              </IconButton>
            </Box>
            <Collapse in={isOpen} timeout="auto">
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', lineHeight: 1.5, pl: { sm: 4.2 }, mt: 0.5 }}>
                No documented interaction was found for one or more pairs.
                <strong> The absence of an interaction record does NOT establish clinical safety. </strong>
                Always verify safety with your healthcare provider.
              </Typography>
            </Collapse>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
