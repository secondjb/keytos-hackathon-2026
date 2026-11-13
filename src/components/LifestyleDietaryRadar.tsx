import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Collapse,
  Stack,
  Grid,
  Alert,
  Divider,
  useTheme,
  Button,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import LocalBarIcon from '@mui/icons-material/LocalBar';
import CoffeeIcon from '@mui/icons-material/Coffee';
import LunchDiningIcon from '@mui/icons-material/LunchDining';
import ShieldIcon from '@mui/icons-material/Shield';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ScienceIcon from '@mui/icons-material/Science';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';

import type { ScrapedInteractionReport, EvaluatedDrugPair } from '../types/rxcheck';
import {
  evaluateLifestyleDietaryRadar,
  type DietarySubstanceRadar,
  type DietaryRiskLevel,
} from '../services/lifestyleDietaryService';

interface LifestyleDietaryRadarProps {
  drugs: string[];
  drugsComReport: ScrapedInteractionReport | null;
  results: EvaluatedDrugPair[];
  defaultExpanded?: boolean;
}

export const LifestyleDietaryRadar: React.FC<LifestyleDietaryRadarProps> = ({
  drugs,
  drugsComReport,
  results,
  defaultExpanded = false,
}) => {
  const theme = useTheme();
  const [isSectionOpen, setIsSectionOpen] = useState(defaultExpanded);
  const [expandedSubstance, setExpandedSubstance] = useState<string | null>(null);

  const radarReport = evaluateLifestyleDietaryRadar(drugs, drugsComReport, results);

  const getRiskChip = (level: DietaryRiskLevel) => {
    switch (level) {
      case 'avoid':
        return (
          <Chip
            size="small"
            label="AVOID / CRITICAL HAZARD"
            color="error"
            icon={<WarningAmberIcon fontSize="small" />}
            sx={{ fontWeight: 800, fontSize: '0.72rem' }}
          />
        );
      case 'major':
        return (
          <Chip
            size="small"
            label="MAJOR RISK"
            color="error"
            icon={<WarningAmberIcon fontSize="small" />}
            sx={{ fontWeight: 800, fontSize: '0.72rem' }}
          />
        );
      case 'moderate':
        return (
          <Chip
            size="small"
            label="MODERATE CAUTION"
            color="warning"
            icon={<WarningAmberIcon fontSize="small" />}
            sx={{ fontWeight: 800, fontSize: '0.72rem' }}
          />
        );
      case 'caution':
        return (
          <Chip
            size="small"
            label="MILD CAUTION"
            color="info"
            icon={<InfoOutlinedIcon fontSize="small" />}
            sx={{ fontWeight: 700, fontSize: '0.72rem' }}
          />
        );
      case 'safe':
      default:
        return (
          <Chip
            size="small"
            label="LIKELY SAFE"
            color="success"
            icon={<CheckCircleOutlinedIcon fontSize="small" />}
            sx={{ fontWeight: 700, fontSize: '0.72rem' }}
          />
        );
    }
  };

  const getSubstanceIcon = (cat: string) => {
    switch (cat) {
      case 'alcohol':
        return <LocalBarIcon fontSize="small" />;
      case 'caffeine':
        return <CoffeeIcon fontSize="small" />;
      case 'grapefruit':
        return <RestaurantMenuIcon fontSize="small" />;
      case 'dairy':
        return <LunchDiningIcon fontSize="small" />;
      default:
        return <ShieldIcon fontSize="small" />;
    }
  };

  const substances: Array<DietarySubstanceRadar & { sourceId: '(1)' | '(2)'; sourceName: string }> = [
    { ...radarReport.alcohol, sourceId: '(1)', sourceName: 'Drugs.com' },
    { ...radarReport.caffeine, sourceId: '(1)', sourceName: 'Drugs.com' },
    { ...radarReport.grapefruit, sourceId: '(2)', sourceName: 'openFDA' },
    { ...radarReport.dairy, sourceId: '(2)', sourceName: 'openFDA' },
  ];

  return (
    <Card
      elevation={0}
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2.5,
        bgcolor: 'background.paper',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
        overflow: 'hidden',
      }}
    >
      {/* Clickable Header with Dropdown Arrow */}
      <Box
        onClick={() => setIsSectionOpen(!isSectionOpen)}
        sx={{
          p: { xs: 2.2, md: 2.5 },
          cursor: 'pointer',
          userSelect: 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
          transition: 'background-color 0.2s',
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8 }}>
          <Box
            sx={{
              p: 1.2,
              borderRadius: 2,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.05)',
              color: 'text.primary',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RestaurantMenuIcon sx={{ fontSize: 26 }} />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, flexWrap: 'wrap' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.2px' }}>
                4. Lifestyle & Dietary Risk Radar
              </Typography>
              {radarReport.totalAlerts > 0 ? (
                <Chip
                  size="small"
                  label={`${radarReport.totalAlerts} WARNING${radarReport.totalAlerts === 1 ? '' : 'S'}`}
                  color="warning"
                  sx={{ fontWeight: 800, fontSize: '0.72rem', height: 22 }}
                />
              ) : (
                <Chip
                  size="small"
                  label="ALL LOW RISK"
                  color="success"
                  sx={{ fontWeight: 700, fontSize: '0.72rem', height: 22 }}
                />
              )}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3, fontStyle: 'italic' }}>
              "Can I have a drink, coffee, grapefruit, or dairy?"
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            size="medium"
            onClick={e => {
              e.stopPropagation();
              setIsSectionOpen(!isSectionOpen);
            }}
            aria-label={isSectionOpen ? 'Collapse Lifestyle & Dietary Radar' : 'Expand Lifestyle & Dietary Radar'}
            sx={{
              color: 'text.secondary',
              transform: isSectionOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.25s ease-in-out',
            }}
          >
            <ExpandMoreIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Collapsible Content */}
      <Collapse in={isSectionOpen} timeout="auto">
        <Divider />
        <CardContent sx={{ p: { xs: 2.2, md: 2.8 }, pt: { xs: 2.5, md: 2.5 } }}>
          {/* Authoritative Dual Sources Verified Box */}
          <Box
            sx={{
              p: 2,
              mb: 2.5,
              borderRadius: 2,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc',
              border: `1px solid ${theme.palette.divider}`,
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: 1.5,
            }}
          >
            <Box sx={{ width: '100%' }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', mb: 0.8 }}>
                Clinical Data Sources Verified:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.2 }}>
                <Chip
                  icon={<VerifiedUserIcon fontSize="small" />}
                  label="(1) Primary Source: Drugs.com Food & Lifestyle Section (Live Scraped)"
                  size="small"
                  variant="outlined"
                  color="primary"
                  sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1.6 }}
                />
                <Chip
                  icon={<ScienceIcon fontSize="small" />}
                  label="(2) Secondary Source: openFDA Food Interactions Section (FDA-Mandated Warnings)"
                  size="small"
                  variant="outlined"
                  color="secondary"
                  sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1.6 }}
                />
              </Box>
            </Box>
          </Box>

          {/* 4 Substance Radar Cards */}
          <Grid container spacing={2}>
            {substances.map(item => {
              const isExpanded = expandedSubstance === item.category;
              const hasAlert = item.riskLevel === 'avoid' || item.riskLevel === 'major' || item.riskLevel === 'moderate';

              return (
                <Grid size={{ xs: 12, sm: 6 }} key={item.category}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2.5,
                      bgcolor: 'background.paper',
                      border: `1.5px solid ${
                        hasAlert
                          ? item.riskLevel === 'avoid' || item.riskLevel === 'major'
                            ? theme.palette.error.main
                            : theme.palette.warning.main
                          : theme.palette.divider
                      }`,
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'border-color 0.2s',
                    }}
                  >
                    <Box>
                      {/* Top Header of Substance Card */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 1.2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              p: 0.8,
                              borderRadius: 1.5,
                              bgcolor: hasAlert ? 'error.light' : 'action.selected',
                              color: hasAlert ? 'error.contrastText' : 'text.primary',
                              display: 'flex',
                            }}
                          >
                            {getSubstanceIcon(item.category)}
                          </Box>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap' }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                                {item.title}
                              </Typography>
                              {/* Prominent Source (1) or (2) Label */}
                              <Chip
                                size="small"
                                label={`${item.sourceId} ${item.sourceName}`}
                                color={item.sourceId === '(1)' ? 'primary' : 'secondary'}
                                variant="filled"
                                sx={{
                                  fontWeight: 800,
                                  fontSize: '0.68rem',
                                  height: 20,
                                }}
                              />
                            </Box>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                              {item.question}
                            </Typography>
                          </Box>
                        </Box>
                        {getRiskChip(item.riskLevel)}
                      </Box>

                      {/* Direct Verdict */}
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 800,
                          color: hasAlert ? 'error.main' : 'text.primary',
                          mb: 0.8,
                        }}
                      >
                        {item.verdict}
                      </Typography>

                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, lineHeight: 1.5 }}>
                        {item.riskSummary}
                      </Typography>

                      {/* Triggering Regimen Drugs */}
                      {item.triggerDrugs.length > 0 && (
                        <Box sx={{ mb: 1.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.5 }}>
                            Medications Involved:
                          </Typography>
                          <Stack spacing={0.6}>
                            {item.triggerDrugs.map((trig, idx) => (
                              <Box
                                key={idx}
                                sx={{
                                  px: 1,
                                  py: 0.6,
                                  borderRadius: 1.5,
                                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                                  border: `1px solid ${theme.palette.divider}`,
                                }}
                              >
                                <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', display: 'block' }}>
                                  • {trig.drug}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
                                  {trig.hazard}
                                </Typography>
                              </Box>
                            ))}
                          </Stack>
                        </Box>
                      )}
                    </Box>

                    {/* Detailed Collapsible Drawer for this Substance */}
                    <Box sx={{ mt: 1.5 }}>
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => setExpandedSubstance(isExpanded ? null : item.category)}
                        endIcon={
                          <ExpandMoreIcon
                            sx={{
                              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.2s',
                            }}
                          />
                        }
                        sx={{ textTransform: 'none', fontWeight: 700, p: 0, fontSize: '0.78rem' }}
                      >
                        {isExpanded ? 'Hide Clinical Mechanism & Guidance' : 'View Clinical Mechanism & Guidance'}
                      </Button>

                      <Collapse in={isExpanded} timeout="auto">
                        <Box sx={{ mt: 1.5, pt: 1.5, borderTop: `1px dashed ${theme.palette.divider}` }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', color: 'text.primary', mb: 0.4 }}>
                            Biochemical Mechanism:
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.55, mb: 1.2 }}>
                            {item.clinicalMechanism}
                          </Typography>

                          <Alert severity={hasAlert ? 'warning' : 'info'} sx={{ py: 0.5, px: 1.2, mb: 1.2, borderRadius: 1.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', lineHeight: 1.4 }}>
                              <strong>Patient Action:</strong> {item.clinicalGuidance}
                            </Typography>
                          </Alert>

                          {/* Source Citations with (1) and (2) labels */}
                          <Box sx={{ bgcolor: 'action.hover', p: 1.2, borderRadius: 1.5, border: `1px solid ${theme.palette.divider}` }}>
                            {item.sourceId === '(1)' ? (
                              <>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', display: 'block' }}>
                                  Source (1) &mdash; Drugs.com Food & Lifestyle Section:
                                </Typography>
                                {item.primarySource.excerpts.map((ex, i) => (
                                  <Typography key={i} variant="caption" sx={{ display: 'block', color: 'text.secondary', fontSize: '0.72rem', mt: 0.3 }}>
                                    &ldquo;{ex}&rdquo;
                                  </Typography>
                                ))}
                              </>
                            ) : (
                              <>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: 'secondary.main', display: 'block' }}>
                                  Source (2) &mdash; openFDA Food Interactions Section:
                                </Typography>
                                {item.secondarySource.excerpts.map((ex, i) => (
                                  <Typography key={i} variant="caption" sx={{ display: 'block', color: 'text.secondary', fontSize: '0.72rem', mt: 0.3 }}>
                                    &ldquo;{ex}&rdquo;
                                  </Typography>
                                ))}
                              </>
                            )}
                          </Box>
                        </Box>
                      </Collapse>
                    </Box>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </CardContent>
      </Collapse>
    </Card>
  );
};
