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
  useMediaQuery,
} from '@mui/material';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import ListAltIcon from '@mui/icons-material/ListAlt';
import GridViewIcon from '@mui/icons-material/GridView';

import { createAppTheme, type ThemeMode } from './theme/theme';
import { Navbar } from './components/Navbar';
import { DrugInput } from './components/DrugInput';
import { InteractionCard } from './components/InteractionCard';
import { InteractionMatrix } from './components/InteractionMatrix';
import { DoctorWarningBanner } from './components/DoctorWarningBanner';
import { RecreationalAdvisory } from './components/RecreationalAdvisory';
import { SymptomSelector } from './components/SymptomSelector';
import { DoctorReportModal } from './components/DoctorReportModal';

import { evaluateAllDrugPairs } from './services/rxCheckApi';
import { checkRecreationalAdvisories } from './data/recreationalDb';
import { correlateSymptoms } from './data/symptomsDb';
import type { EvaluatedDrugPair } from './types/rxcheck';
import type { PresetScenario } from './data/presets';

export const App: React.FC = () => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('rxcheck_theme_mode');
    return (saved as ThemeMode) || (prefersDarkMode ? 'dark' : 'light');
  });

  const [drugs, setDrugs] = useState<string[]>(['Warfarin', 'Aspirin']);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [results, setResults] = useState<EvaluatedDrugPair[]>([]);
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

  // Run evaluation
  const handleEvaluate = async (drugList = drugs) => {
    if (drugList.length < 2) return;
    setIsLoading(true);
    setProgress({ completed: 0, total: (drugList.length * (drugList.length - 1)) / 2 });

    try {
      const evaluated = await evaluateAllDrugPairs(drugList, (completed, total) => {
        setProgress({ completed, total });
      });
      setResults(evaluated);
    } catch (err) {
      console.error('Evaluation failed:', err);
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  };

  // Handle Preset Selection
  const handleSelectPreset = (preset: PresetScenario) => {
    setDrugs(preset.drugs);
    if (preset.suggestedSymptoms) {
      setSelectedSymptoms(preset.suggestedSymptoms);
    }
    handleEvaluate(preset.drugs);
  };

  // Automatic evaluation for initial state
  useEffect(() => {
    handleEvaluate(['Warfarin', 'Aspirin']);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compute recreational advisories
  const recreationalAdvisories = checkRecreationalAdvisories(drugs);

  // Compute symptom correlations
  const interactionMechanisms = results.map(r => `${r.clinicalSignificance} ${r.mechanism}`);
  const symptomCorrelations = correlateSymptoms(selectedSymptoms, drugs, interactionMechanisms);

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
                Intelligent Drug Interaction & Harm Reduction Checker
              </Typography>

              <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem', lineHeight: 1.6 }}>
                Safeguarding patient well-being with multi-medication pairwise verification,
                lifestyle & recreational harm-reduction advisories, and symptom-risk triage.
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
                    Evaluating clinical pairwise records...
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    {progress.completed} of {progress.total} pairs
                  </Typography>
                </Box>
                <LinearProgress variant="determinate" value={(progress.completed / progress.total) * 100} sx={{ height: 8, borderRadius: 4 }} />
              </Box>
            )}

            {/* 2. Doctor Warning Banner (Prominent Alert for Dangerous Drugs or No Results) */}
            <DoctorWarningBanner
              results={results}
              onOpenReport={() => setDoctorModalOpen(true)}
            />

            {/* 3. Symptom Checker & Red-Flag Clinical Correlation */}
            <SymptomSelector
              selectedSymptoms={selectedSymptoms}
              onChangeSymptoms={setSelectedSymptoms}
              correlations={symptomCorrelations}
            />

            {/* 4. Recreational & Lifestyle Harm Reduction Advisory */}
            <RecreationalAdvisory advisories={recreationalAdvisories} />

            {/* 5. Results Section */}
            {results.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                      Interaction Results ({results.length} Pair{results.length === 1 ? '' : 's'})
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Ranked by clinical severity and ONC High Priority guidance.
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

                {/* Matrix View (when 3+ substances and user picked matrix) */}
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

            {/* Clinical Disclaimer Footer Banner */}
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
          correlations={symptomCorrelations}
        />
      </Box>
    </ThemeProvider>
  );
};

export default App;
