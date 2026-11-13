import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Chip,
  Button,
  Stack,
  Alert,
  IconButton,
  Collapse,
  CircularProgress,
  Divider,
  useTheme,
  Grid,
} from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import DangerousRoundedIcon from '@mui/icons-material/DangerousRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy';
import MedicationIcon from '@mui/icons-material/Medication';
import LaunchRoundedIcon from '@mui/icons-material/LaunchRounded';

import {
  getAilmentById,
  evaluateOtcAgainstRegimen,
  fetchOpenFdaDrugLabel,
} from '../services/openFdaService';
import type {
  OtcCandidateDrug,
  OpenFdaDrugLabel,
  OtcSafetyStatus,
} from '../types/rxcheck';

interface OtcMatcherDetailViewProps {
  selectedAilmentId: string | null;
  drugs: string[];
  onAddDrugToRegimen: (drugName: string) => void;
  onBackToRegimenView: () => void;
  onSelectAilment?: (ailmentId: string) => void;
}

export const OtcMatcherDetailView: React.FC<OtcMatcherDetailViewProps> = ({
  selectedAilmentId,
  drugs,
  onAddDrugToRegimen,
  onBackToRegimenView,
  onSelectAilment,
}) => {
  const theme = useTheme();
  const [safetyFilter, setSafetyFilter] = useState<'all' | OtcSafetyStatus>('all');
  const [expandedFdaCard, setExpandedFdaCard] = useState<string | null>(null);
  const [fdaLabels, setFdaLabels] = useState<Record<string, OpenFdaDrugLabel>>({});
  const [loadingFda, setLoadingFda] = useState<Record<string, boolean>>({});

  const ailment = selectedAilmentId ? getAilmentById(selectedAilmentId) : null;

  // Fetch openFDA live data for all candidates in the active ailment
  useEffect(() => {
    if (!ailment) return;

    let isMounted = true;
    ailment.recommendedCandidates.forEach(candidate => {
      fetchOpenFdaDrugLabel(candidate.fdaSubstanceQuery)
        .then(label => {
          if (isMounted) {
            setFdaLabels(prev => ({ ...prev, [candidate.id]: label }));
            setLoadingFda(prev => ({ ...prev, [candidate.id]: false }));
          }
        })
        .catch(() => {
          if (isMounted) {
            setLoadingFda(prev => ({ ...prev, [candidate.id]: false }));
          }
        });
    });

    return () => {
      isMounted = false;
    };
  }, [ailment]);

  // If no ailment is selected, show an inviting overview state
  if (!ailment) {
    return (
      <Card
        elevation={0}
        sx={{
          p: { xs: 3, md: 5 },
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: 'background.paper',
          textAlign: 'center',
        }}
      >
        <LocalPharmacyIcon color="primary" sx={{ fontSize: 56, mb: 1.5 }} />
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
          Safe OTC & Supplement Matcher
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 540, mx: 'auto', mb: 3 }}>
          Select an acute condition or common symptom from the left panel to discover over-the-counter medications and dietary supplements cross-checked in real-time against your active prescription regimen.
        </Typography>

        <Box sx={{ maxWidth: 600, mx: 'auto', mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, textAlign: 'left' }}>
            Popular Acute Conditions:
          </Typography>
          <Grid container spacing={1.5}>
            {[
              { id: 'tension_headache', label: 'Tension Headache', category: 'Pain & Headache' },
              { id: 'nasal_congestion', label: 'Nasal Congestion', category: 'Cold & Flu' },
              { id: 'heartburn_gerd', label: 'Acid Reflux / Heartburn', category: 'Digestive & GI' },
              { id: 'dry_cough', label: 'Dry Cough', category: 'Cold & Flu' },
              { id: 'occasional_insomnia', label: 'Occasional Insomnia', category: 'Sleep & Stress' },
              { id: 'seasonal_allergies', label: 'Seasonal Allergies', category: 'Allergies & Sinus' },
            ].map(item => (
              <Grid size={{ xs: 12, sm: 6 }} key={item.id}>
                <Box
                  onClick={() => onSelectAilment?.(item.id)}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    textAlign: 'left',
                    cursor: 'pointer',
                    border: `1px solid ${theme.palette.divider}`,
                    bgcolor: 'action.hover',
                    transition: 'all 0.18s ease',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(66, 133, 244, 0.1)' : 'rgba(25, 118, 210, 0.05)',
                    },
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {item.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.category}
                    </Typography>
                  </Box>
                  <LaunchRoundedIcon fontSize="small" sx={{ color: 'primary.main' }} />
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Button
          variant="outlined"
          color="primary"
          startIcon={<ArrowBackRoundedIcon />}
          onClick={onBackToRegimenView}
          sx={{ fontWeight: 700 }}
        >
          Return to Prescription Regimen View
        </Button>
      </Card>
    );
  }

  // Evaluate all candidates for the selected ailment against active regimen
  const evaluatedCandidates = ailment.recommendedCandidates.map(candidate => {
    const evaluation = evaluateOtcAgainstRegimen(candidate, drugs);
    return {
      ...candidate,
      evaluatedSafety: evaluation.safety,
      safetyReason: evaluation.reason,
      interactingRegimenDrugs: evaluation.interactingDrugs,
      fdaLabel: fdaLabels[candidate.id],
      isLoadingFda: loadingFda[candidate.id],
    };
  });

  const safeCount = evaluatedCandidates.filter(c => c.evaluatedSafety === 'safe').length;
  const cautionCount = evaluatedCandidates.filter(c => c.evaluatedSafety === 'caution').length;
  const contraindicatedCount = evaluatedCandidates.filter(c => c.evaluatedSafety === 'contraindicated').length;

  const filteredCandidates = evaluatedCandidates.filter(c => {
    if (safetyFilter === 'all') return true;
    return c.evaluatedSafety === safetyFilter;
  });

  const getSafetyIcon = (status: OtcSafetyStatus) => {
    switch (status) {
      case 'safe':
        return <CheckCircleRoundedIcon color="success" sx={{ fontSize: 20 }} />;
      case 'caution':
        return <WarningAmberRoundedIcon color="warning" sx={{ fontSize: 20 }} />;
      case 'contraindicated':
        return <DangerousRoundedIcon color="error" sx={{ fontSize: 20 }} />;
    }
  };

  const getSafetyBadge = (status: OtcSafetyStatus, interactingCount: number) => {
    switch (status) {
      case 'safe':
        return (
          <Chip
            size="small"
            icon={<CheckCircleRoundedIcon />}
            label="PREFERRED / SAFE ALTERNATIVE"
            color="success"
            sx={{ fontWeight: 800, fontSize: '0.72rem', px: 0.5 }}
          />
        );
      case 'caution':
        return (
          <Chip
            size="small"
            icon={<WarningAmberRoundedIcon />}
            label="USE WITH CAUTION / MONITOR"
            color="warning"
            sx={{ fontWeight: 800, fontSize: '0.72rem', px: 0.5 }}
          />
        );
      case 'contraindicated':
        return (
          <Chip
            size="small"
            icon={<DangerousRoundedIcon />}
            label={interactingCount > 0 ? "HIGH INTERACTION RISK / AVOID" : "CONTRAINDICATED"}
            color="error"
            sx={{ fontWeight: 800, fontSize: '0.72rem', px: 0.5 }}
          />
        );
    }
  };

  const isDrugInRegimen = (candidate: OtcCandidateDrug) => {
    const lowerName = candidate.name.toLowerCase();
    const lowerGeneric = candidate.genericName.toLowerCase();
    return drugs.some(d => {
      const reg = d.toLowerCase();
      return (
        reg.includes(lowerName) ||
        reg.includes(lowerGeneric) ||
        lowerGeneric.includes(reg) ||
        candidate.brandExamples.some(b => reg.includes(b.toLowerCase()))
      );
    });
  };

  return (
    <Stack spacing={2.5}>
      {/* Top Banner & Navigation */}
      <Card
        elevation={0}
        sx={{
          p: { xs: 2.2, md: 3 },
          borderRadius: 2.5,
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1.5, mb: 1.5 }}>
          <Box sx={{ flex: 1, minWidth: 260 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 0.5 }}>
              <LocalPharmacyIcon color="primary" sx={{ fontSize: 28 }} />
              <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                {ailment.name}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {ailment.summary}
            </Typography>
          </Box>

          <Button
            variant="outlined"
            size="small"
            color="inherit"
            startIcon={<ArrowBackRoundedIcon />}
            onClick={onBackToRegimenView}
            sx={{ fontWeight: 700, borderRadius: 2 }}
          >
            Back to Regimen Analysis
          </Button>
        </Box>

        {/* Active Regimen Context Bar */}
        <Alert
          severity={drugs.length > 0 ? 'info' : 'warning'}
          icon={<MedicationIcon />}
          sx={{
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor:
              theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
            py: 0.8,
          }}
        >
          {drugs.length > 0 ? (
            <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', lineHeight: 1.5 }}>
              <strong>Live Cross-Reference Active:</strong> Evaluating {evaluatedCandidates.length} options against your {drugs.length} active prescription medication{drugs.length === 1 ? '' : 's'}: <strong>{drugs.join(', ')}</strong>.
            </Typography>
          ) : (
            <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', lineHeight: 1.5 }}>
              <strong>Standard Clinical Guidance:</strong> No active prescriptions entered. Enter your daily medications in the left panel to test for live contraindications and organ clearance warnings.
            </Typography>
          )}
        </Alert>

        <Divider sx={{ my: 2 }} />

        {/* Safety Filter Tabs */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mr: 0.5 }}>
            Filter Options:
          </Typography>

          <Chip
            label={`All Options (${evaluatedCandidates.length})`}
            variant={safetyFilter === 'all' ? 'filled' : 'outlined'}
            color={safetyFilter === 'all' ? 'primary' : 'default'}
            onClick={() => setSafetyFilter('all')}
            size="small"
            sx={{ fontWeight: 700, cursor: 'pointer' }}
          />

          <Chip
            icon={<CheckCircleRoundedIcon />}
            label={`Safe / Preferred (${safeCount})`}
            variant={safetyFilter === 'safe' ? 'filled' : 'outlined'}
            color="success"
            onClick={() => setSafetyFilter('safe')}
            size="small"
            sx={{ fontWeight: 700, cursor: 'pointer' }}
          />

          {cautionCount > 0 && (
            <Chip
              icon={<WarningAmberRoundedIcon />}
              label={`Caution (${cautionCount})`}
              variant={safetyFilter === 'caution' ? 'filled' : 'outlined'}
              color="warning"
              onClick={() => setSafetyFilter('caution')}
              size="small"
              sx={{ fontWeight: 700, cursor: 'pointer' }}
            />
          )}

          {contraindicatedCount > 0 && (
            <Chip
              icon={<DangerousRoundedIcon />}
              label={`High Risk (${contraindicatedCount})`}
              variant={safetyFilter === 'contraindicated' ? 'filled' : 'outlined'}
              color="error"
              onClick={() => setSafetyFilter('contraindicated')}
              size="small"
              sx={{ fontWeight: 700, cursor: 'pointer' }}
            />
          )}
        </Box>
      </Card>

      {/* Candidates List */}
      <Stack spacing={2}>
        {filteredCandidates.map(candidate => {
          const inRegimen = isDrugInRegimen(candidate);
          const isFdaExpanded = expandedFdaCard === candidate.id;
          const fda = candidate.fdaLabel;

          return (
            <Card
              key={candidate.id}
              elevation={0}
              sx={{
                p: { xs: 2.2, md: 3 },
                borderRadius: 2.5,
                border: `1px solid ${
                  candidate.evaluatedSafety === 'contraindicated'
                    ? theme.palette.error.main
                    : candidate.evaluatedSafety === 'safe'
                    ? theme.palette.success.main
                    : theme.palette.divider
                }`,
                bgcolor: 'background.paper',
                boxShadow:
                  candidate.evaluatedSafety === 'safe'
                    ? '0 2px 8px rgba(46, 125, 50, 0.08)'
                    : '0 2px 6px rgba(0, 0, 0, 0.04)',
                transition: 'border-color 0.2s ease',
              }}
            >
              {/* Card Top: Title, Class & Safety Badge */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1.5, mb: 1.5 }}>
                <Box sx={{ flex: 1, minWidth: 240 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      {candidate.name}
                    </Typography>
                    {getSafetyBadge(candidate.evaluatedSafety, candidate.interactingRegimenDrugs.length)}
                  </Box>

                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                    {candidate.drugClass} · Brand Examples: <em>{candidate.brandExamples.join(', ')}</em>
                  </Typography>
                </Box>

                {/* Add to Regimen Button */}
                <Box>
                  {inRegimen ? (
                    <Button
                      size="small"
                      variant="outlined"
                      color="success"
                      disabled
                      startIcon={<CheckRoundedIcon />}
                      sx={{ fontWeight: 700, borderRadius: 2 }}
                    >
                      In Active Regimen
                    </Button>
                  ) : (
                    <Button
                      size="small"
                      variant="contained"
                      color={candidate.evaluatedSafety === 'contraindicated' ? 'inherit' : 'primary'}
                      startIcon={<AddRoundedIcon />}
                      onClick={() => onAddDrugToRegimen(candidate.name)}
                      sx={{
                        fontWeight: 800,
                        borderRadius: 2,
                        px: 2,
                        textAlign: 'center',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      Add to Regimen
                    </Button>
                  )}
                </Box>
              </Box>

              {/* Clinical Mechanism */}
              <Box sx={{ mb: 1.8 }}>
                <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                  <strong>How It Works:</strong> {candidate.mechanismSummary}
                </Typography>
              </Box>

              {/* Clinical Reasoning / Regimen Interaction Box */}
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  mb: 1.8,
                  bgcolor:
                    candidate.evaluatedSafety === 'contraindicated'
                      ? theme.palette.mode === 'dark'
                        ? 'rgba(211, 47, 47, 0.12)'
                        : 'rgba(211, 47, 47, 0.08)'
                      : candidate.evaluatedSafety === 'caution'
                      ? theme.palette.mode === 'dark'
                        ? 'rgba(237, 108, 2, 0.12)'
                        : 'rgba(237, 108, 2, 0.08)'
                      : theme.palette.mode === 'dark'
                      ? 'rgba(46, 125, 50, 0.1)'
                      : 'rgba(46, 125, 50, 0.06)',
                  border: `1px solid ${
                    candidate.evaluatedSafety === 'contraindicated'
                      ? theme.palette.error.light
                      : candidate.evaluatedSafety === 'caution'
                      ? theme.palette.warning.light
                      : theme.palette.success.light
                  }`,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  {getSafetyIcon(candidate.evaluatedSafety)}
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        display: 'block',
                        color:
                          candidate.evaluatedSafety === 'contraindicated'
                            ? 'error.main'
                            : candidate.evaluatedSafety === 'caution'
                            ? 'warning.main'
                            : 'success.main',
                      }}
                    >
                      {candidate.evaluatedSafety === 'contraindicated'
                        ? 'Clinical Hazard with Active Medication'
                        : candidate.evaluatedSafety === 'caution'
                        ? 'Clinical Monitoring Advisory'
                        : 'Regimen Compatibility Verified'}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.3, lineHeight: 1.45, fontWeight: 500 }}>
                      {candidate.safetyReason}
                    </Typography>
                    {candidate.cautionNotes && candidate.evaluatedSafety !== 'contraindicated' && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontStyle: 'italic' }}>
                        Note: {candidate.cautionNotes}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>

              {/* openFDA Drug Facts Accordion */}
              <Box
                sx={{
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 2,
                  overflow: 'hidden',
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                }}
              >
                <Box
                  onClick={() => setExpandedFdaCard(isFdaExpanded ? null : candidate.id)}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    px: 1.5,
                    py: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <VerifiedRoundedIcon color="primary" sx={{ fontSize: 18 }} />
                    <Typography variant="caption" sx={{ fontWeight: 800 }}>
                      openFDA Live Drug Facts
                    </Typography>
                    {fda?.isFdaVerified && (
                      <Chip
                        label="FDA Label Verified"
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700 }}
                      />
                    )}
                    {candidate.isLoadingFda && (
                      <CircularProgress size={12} color="inherit" sx={{ ml: 0.5 }} />
                    )}
                  </Box>

                  <IconButton size="small" sx={{ p: 0.5 }}>
                    <ExpandMoreIcon
                      sx={{
                        transform: isFdaExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                        fontSize: 18,
                      }}
                    />
                  </IconButton>
                </Box>

                <Collapse in={isFdaExpanded} timeout="auto">
                  <Box sx={{ p: 2, pt: 1, borderTop: `1px solid ${theme.palette.divider}` }}>
                    {fda ? (
                      <Grid container spacing={1.5}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>
                            FDA Purpose:
                          </Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.82rem', mt: 0.2 }}>
                            {fda.purpose || 'Over-the-counter active agent'}
                          </Typography>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>
                            Approved Uses & Indications:
                          </Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.82rem', mt: 0.2 }}>
                            {fda.indications || 'Temporarily relieves minor acute symptoms.'}
                          </Typography>
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>
                            FDA Drug Facts Warnings & Precautions:
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: '0.8rem',
                              mt: 0.2,
                              color: 'text.secondary',
                              lineHeight: 1.45,
                              p: 1.2,
                              borderRadius: 1.5,
                              bgcolor: 'action.hover',
                            }}
                          >
                            {fda.warnings || 'Consult your physician if symptoms worsen or persist beyond 7 days.'}
                          </Typography>
                        </Grid>
                      </Grid>
                    ) : (
                      <Box sx={{ py: 1, textAlign: 'center' }}>
                        <CircularProgress size={20} />
                        <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                          Retrieving openFDA label data...
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Collapse>
              </Box>
            </Card>
          );
        })}
      </Stack>
    </Stack>
  );
};
