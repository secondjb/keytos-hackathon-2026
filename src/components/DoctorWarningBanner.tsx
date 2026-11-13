import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, Button, useTheme, IconButton, Collapse } from '@mui/material';
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
  defaultExpanded = true,
}) => {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(defaultExpanded);
  if (results.length === 0) return null;

  const hasMajor = results.some(r => r.severity === 'major' || r.isHighPriority);
  const hasNoRecord = results.some(r => r.status === 'no_record_found');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Normal looking consultation card - not red, accessible colors */}
      {hasMajor && (
        <Card
          elevation={0}
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: 'background.paper',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
            borderRadius: 2.5,
          }}
        >
          <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
            {/* Top Row: Title + Accessible Doctor Summary Button + Dropdown Arrow */}
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
                <HealthAndSafetyIcon color="primary" sx={{ fontSize: 28 }} />
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    color: 'text.primary',
                    fontSize: { xs: '1.02rem', sm: '1.18rem' },
                    letterSpacing: '-0.2px',
                    lineHeight: 1.25,
                  }}
                >
                  Clinical Regimen Alert &mdash; Doctor Consultation Advised
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  startIcon={<PrintIcon fontSize="small" />}
                  onClick={e => {
                    e.stopPropagation();
                    onOpenReport();
                  }}
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    textTransform: 'none',
                    borderRadius: 1.8,
                    py: 0.6,
                    px: 1.6,
                    boxShadow: 'none',
                  }}
                >
                  Doctor Summary
                </Button>
                <IconButton
                  size="medium"
                  onClick={e => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                  }}
                  aria-label={isOpen ? 'Collapse Warning Banner' : 'Expand Warning Banner'}
                  sx={{
                    color: 'text.secondary',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.25s ease-in-out',
                  }}
                >
                  <ExpandMoreIcon />
                </IconButton>
              </Box>
            </Box>

            <Collapse in={isOpen} timeout="auto">
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem', lineHeight: 1.6, pl: { sm: 4.8 } }}>
                One or more significant clinical interactions were detected in your regimen that could increase risk of adverse events.
                <Box component="strong" sx={{ color: 'text.primary', display: 'inline' }}>
                  {' '}Never discontinue or alter prescription medications without professional clinical supervision.{' '}
                </Box>
                Review this report with your prescribing doctor or licensed pharmacist.
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
            border: `1px solid ${theme.palette.divider}`,
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
                <HealthAndSafetyIcon color="primary" fontSize="medium" />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.95rem', color: 'text.primary' }}>
                  Unverified Combination (No Record Found) &mdash; Consult Your Doctor
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
                <Box component="strong" sx={{ color: 'text.primary', display: 'inline' }}>
                  {' '}The absence of an interaction record does NOT establish clinical safety.{' '}
                </Box>
                Always verify safety with your healthcare provider.
              </Typography>
            </Collapse>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
