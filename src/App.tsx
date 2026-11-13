import React, { useState, useEffect } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  Box,
  Container,
  Typography,
  LinearProgress,
  Stack,
  Alert,
  Tabs,
  Tab,
  Chip,
  useMediaQuery,
} from '@mui/material';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import ListAltIcon from '@mui/icons-material/ListAlt';
import GridViewIcon from '@mui/icons-material/GridView';
import HubIcon from '@mui/icons-material/Hub';

import { createAppTheme, type ThemeMode } from './theme/theme';
import { Navbar } from './components/Navbar';
import { DrugInput } from './components/DrugInput';
import { InteractionCard } from './components/InteractionCard';
import { InteractionMatrix } from './components/InteractionMatrix';
import { DoctorWarningBanner } from './components/DoctorWarningBanner';
import { RecreationalAdvisory } from './components/RecreationalAdvisory';
import { SymptomSelector } from './components/SymptomSelector';
import { DoctorReportModal } from './components/DoctorReportModal';

import {
  checkPolypharmacyInteractions,
  extractSymptomsFromRecords,
  fetchAuthoritativeUsage,
} from './services/rxCheckApi';
import type { EvaluatedDrugPair, RxCheckPolypharmacySummary } from './types/rxcheck';
import type { PresetScenario } from './data/presets';

export const App: React.FC = () => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('rxcheck_theme_mode');
    return (saved as ThemeMode) || (prefersDarkMode ? 'dark' : 'light');
  });

  const [drugs, setDrugs] = useState<string[]>(['Warfarin', 'Aspirin']);
  const [selectedSymptomIds, setSelectedSymptomIds] = useState<string[]>([]);
  const [results, setResults] = useState<EvaluatedDrugPair[]>([]);
  const [summary, setSummary] = useState<RxCheckPolypharmacySummary | null>(null);
  const [tierMode, setTierMode] = useState<string>('n_choose_2_evaluated');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<{ completed: number; total: number } | null>(null);
  const [doctorModalOpen, setDoctorModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'cards' | 'matrix'>('cards');

  const theme = createAppTheme(themeMode);

  const toggleTheme = () => {
    const next = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(next);
    localStorage.setItem('rxcheck_theme_mode', next);
  };

  // Run Polypharmacy Evaluation
  const handleEvaluate = async (drugList = drugs) => {
    if (drugList.length < 2) return;
    setIsLoading(true);
    setProgress({ completed: 0, total: (drugList.length * (drugList.length - 1)) / 2 });

    try {
      const response = await checkPolypharmacyInteractions(drugList, (completed, total) => {
        setProgress({ completed, total });
      });

      setResults(response.results);
      setSummary(response.summary);
      setTierMode(response.tier_mode);
      fetchAuthoritativeUsage();
    } catch (err) {
      console.error('Polypharmacy evaluation failed:', err);
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  };

  // Handle Preset Selection
  const handleSelectPreset = (preset: PresetScenario) => {
    setDrugs(preset.drugs);
    setSelectedSymptomIds([]);
    handleEvaluate(preset.drugs);
  };

  // Initial evaluation on mount
  useEffect(() => {
    handleEvaluate(['Warfarin', 'Aspirin']);
    fetchAuthoritativeUsage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dynamically extract clinical symptoms directly from RxCheck records
  const dynamicSymptoms = extractSymptomsFromRecords(results);

  const handleToggleSymptom = (id: string) => {
    if (selectedSymptomIds.includes(id)) {
      setSelectedSymptomIds(selectedSymptomIds.filter(s => s !== id));
    } else {
      setSelectedSymptomIds([...selectedSymptomIds, id]);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
        {/* Top Navigation */}
        <Navbar themeMode={themeMode} onToggleTheme={toggleTheme} />

        {/* Hero Header */}
        <Box
          sx={{
            py: { xs: 3, md: 5 },
            borderBottom: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(34, 211, 238, 0.03)' : 'rgba(2, 132, 199, 0.03)',
          }}
        >
          <Container maxWidth="lg">
            <Box sx={{ maxWidth: 840, mx: 'auto', textAlign: 'center' }}>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 2, py: 0.5, borderRadius: 5, bgcolor: 'action.hover', mb: 2 }}>
                <VerifiedUserIcon color="primary" sx={{ fontSize: 18 }} />
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                  KEYTOS HACK 2026 &bull; HEALTH QUEST TRACK
                </Typography>
              </Box>

              <Typography variant="h3" component="h1" sx={{ fontWeight: 800, mb: 1.5, letterSpacing: '-1px' }}>
                RxCheck Polypharmacy & Drug Interaction Engine
              </Typography>

              <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem', lineHeight: 1.6 }}>
                Direct integration with the RxCheck Clinical Dataset. Evaluates multi-medication N-choose-2 pairs,
                surfaces clinical symptoms, and flags high-risk combinations.
              </Typography>
            </Box>
          </Container>
        </Box>

        {/* Main Application Body */}
        <Container maxWidth="lg" sx={{ py: 4, flex: 1 }}>
          <Stack spacing={3}>
            {/* 1. Medication & Substance Input */}
            <DrugInput
              drugs={drugs}
              onChangeDrugs={setDrugs}
              onEvaluate={() => handleEvaluate(drugs)}
              isLoading={isLoading}
              onSelectPreset={handleSelectPreset}
            />

            {/* Progress Bar when computing multiple pairs */}
            {isLoading && progress && (
              <Box sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Evaluating RxCheck dataset records...
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    {progress.completed} of {progress.total} pairs
                  </Typography>
                </Box>
                <LinearProgress variant="determinate" value={(progress.completed / progress.total) * 100} sx={{ height: 8, borderRadius: 4 }} />
              </Box>
            )}

            {/* Polypharmacy Evaluation Summary Banner */}
            {summary && results.length > 0 && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 1.5,
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HubIcon color="primary" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    RxCheck Polypharmacy Evaluation: {summary.total_pairs} N-Choose-2 Pair{summary.total_pairs === 1 ? '' : 's'} Evaluated
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Chip
                    label={`${summary.interactions_found} Interaction${summary.interactions_found === 1 ? '' : 's'} Found`}
                    color={summary.interactions_found > 0 ? 'warning' : 'success'}
                    size="small"
                    sx={{ fontWeight: 700 }}
                  />
                  {summary.onc_high_priority_count > 0 && (
                    <Chip
                      label={`${summary.onc_high_priority_count} ONC High Priority`}
                      color="error"
                      size="small"
                      sx={{ fontWeight: 800 }}
                    />
                  )}
                  <Chip
                    label={
                      tierMode === 'native_growth_api'
                        ? 'Polypharmacy API (Server-Side)'
                        : 'Evaluated N-Choose-2 Pairs (/v1/interactions)'
                    }
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem' }}
                  />
                </Box>
              </Box>
            )}

            {/* 2. Doctor Warning Banner */}
            <DoctorWarningBanner
              results={results}
              onOpenReport={() => setDoctorModalOpen(true)}
            />

            {/* 3. Dynamic Symptoms Extracted from RxCheck Records */}
            <SymptomSelector
              symptoms={dynamicSymptoms}
              selectedSymptomIds={selectedSymptomIds}
              onToggleSymptom={handleToggleSymptom}
            />

            {/* 4. Lifestyle & Recreational Substance Advisory */}
            <RecreationalAdvisory results={results} drugs={drugs} />

            {/* 5. Interaction Results (Card & Matrix Views) */}
            {results.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                      Evaluated Pairs ({results.length})
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Records retrieved directly from RxCheck dataset.
                    </Typography>
                  </Box>

                  {drugs.length >= 3 && (
                    <Tabs
                      value={activeTab}
                      onChange={(_, val) => setActiveTab(val)}
                      textColor="primary"
                      indicatorColor="primary"
                      sx={{ minHeight: 40 }}
                    >
                      <Tab icon={<ListAltIcon fontSize="small" />} iconPosition="start" label="Card View" value="cards" sx={{ minHeight: 40, py: 0.5 }} />
                      <Tab icon={<GridViewIcon fontSize="small" />} iconPosition="start" label="Matrix View" value="matrix" sx={{ minHeight: 40, py: 0.5 }} />
                    </Tabs>
                  )}
                </Box>

                {drugs.length >= 3 && activeTab === 'matrix' ? (
                  <InteractionMatrix drugs={drugs} results={results} />
                ) : (
                  <Stack spacing={2}>
                    {results.map(item => (
                      <InteractionCard key={item.id} item={item} />
                    ))}
                  </Stack>
                )}
              </Box>
            )}

            {/* Clinical Disclaimer Footer */}
            <Alert
              severity="info"
              icon={<HealthAndSafetyIcon />}
              sx={{
                bgcolor: 'background.paper',
                border: `1px solid ${theme.palette.divider}`,
                mt: 4,
              }}
            >
              <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: 'text.secondary', lineHeight: 1.6 }}>
                <strong>Clinical Disclaimer:</strong> RxCheck provides interaction records from active medical datasets and does not replace professional clinical judgment. Coverage and field detail vary by record and dataset release. Always consult a qualified physician or licensed pharmacist before initiating, altering, or discontinuing any medication regimen.
              </Typography>
            </Alert>
          </Stack>
        </Container>

        {/* Doctor Consultation Summary Modal */}
        <DoctorReportModal
          open={doctorModalOpen}
          onClose={() => setDoctorModalOpen(false)}
          drugs={drugs}
          results={results}
          selectedSymptoms={dynamicSymptoms.filter(s => selectedSymptomIds.includes(s.id))}
        />
      </Box>
    </ThemeProvider>
  );
};

export default App;
