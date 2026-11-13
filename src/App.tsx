import React, { useState, useEffect } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  Box,
  Container,
  Typography,
  Grid,
  CircularProgress,
  Stack,
  Alert,
  Tabs,
  Tab,
  useMediaQuery,
} from '@mui/material';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import ListAltIcon from '@mui/icons-material/ListAlt';
import GridViewIcon from '@mui/icons-material/GridView';

import { createAppTheme, type ThemeMode } from './theme/theme';
import { Navbar } from './components/Navbar';
import { DrugInput } from './components/DrugInput';
import { TutorialCard } from './components/TutorialCard';
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
import type { EvaluatedDrugPair } from './types/rxcheck';

export const App: React.FC = () => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('rxcheck_theme_mode');
    return (saved as ThemeMode) || (prefersDarkMode ? 'dark' : 'light');
  });

  // Regimen list starts empty
  const [drugs, setDrugs] = useState<string[]>([]);
  const [selectedSymptomIds, setSelectedSymptomIds] = useState<string[]>([]);
  const [results, setResults] = useState<EvaluatedDrugPair[]>([]);
  const [hasEvaluated, setHasEvaluated] = useState(false);
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

  useEffect(() => {
    fetchAuthoritativeUsage();
  }, []);

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
      setHasEvaluated(true);
      fetchAuthoritativeUsage();
    } catch (err) {
      console.error('Polypharmacy evaluation failed:', err);
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  };

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
        {/* Top Bar with 'RxCheck Clinical Interaction Engine' and 3-dot menu */}
        <Navbar themeMode={themeMode} onToggleTheme={toggleTheme} />

        {/* Main 2-Column Application Layout */}
        <Container maxWidth="xl" sx={{ py: 3, flex: 1 }}>
          <Grid container spacing={3}>
            {/* LEFT COLUMN: Drug Search & Regimen Management */}
            <Grid size={{ xs: 12, md: 4.5, lg: 4 }}>
              <Box sx={{ position: { md: 'sticky' }, top: 80 }}>
                <DrugInput
                  drugs={drugs}
                  onChangeDrugs={setDrugs}
                  onEvaluate={() => handleEvaluate(drugs)}
                  isLoading={isLoading}
                />
              </Box>
            </Grid>

            {/* RIGHT COLUMN: Tutorial / Loading / Results */}
            <Grid size={{ xs: 12, md: 7.5, lg: 8 }}>
              {/* State A: Loading State */}
              {isLoading && (
                <Box
                  sx={{
                    p: { xs: 4, md: 8 },
                    textAlign: 'center',
                    borderRadius: 3,
                    border: `1px solid ${theme.palette.divider}`,
                    bgcolor: 'background.paper',
                  }}
                >
                  <CircularProgress size={48} sx={{ color: 'primary.main', mb: 2.5 }} />
                  <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                    Querying RxCheck Dataset...
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 440, mx: 'auto' }}>
                    Evaluating pairwise interactions for your active medications.
                    {progress && (
                      <Box component="span" sx={{ display: 'block', mt: 1, fontWeight: 700, color: 'primary.main' }}>
                        Evaluated {progress.completed} of {progress.total} pairs
                      </Box>
                    )}
                  </Typography>
                </Box>
              )}

              {/* State B: Initial Onboarding Tutorial & Disclaimers */}
              {!hasEvaluated && !isLoading && (
                <TutorialCard
                  onLoadExample={exampleDrugs => {
                    setDrugs(exampleDrugs);
                    handleEvaluate(exampleDrugs);
                  }}
                />
              )}

              {/* State C: Evaluated Results Display */}
              {hasEvaluated && !isLoading && (
                <Stack spacing={2.5}>
                  {/* 1. Doctor Warning Banner */}
                  <DoctorWarningBanner
                    results={results}
                    onOpenReport={() => setDoctorModalOpen(true)}
                  />

                  {/* 2. Dynamic Symptoms Extracted from RxCheck Records */}
                  <SymptomSelector
                    symptoms={dynamicSymptoms}
                    selectedSymptomIds={selectedSymptomIds}
                    onToggleSymptom={handleToggleSymptom}
                  />

                  {/* 3. Lifestyle & Recreational Substance Advisory */}
                  <RecreationalAdvisory results={results} drugs={drugs} />

                  {/* 4. Results List & Matrix */}
                  {results.length > 0 && (
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
                        <Box>
                          <Typography variant="h5" sx={{ fontWeight: 800 }}>
                            Evaluated Pairs ({results.length})
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Live records from the active RxCheck medical dataset.
                          </Typography>
                        </Box>

                        {drugs.length >= 3 && (
                          <Tabs
                            value={activeTab}
                            onChange={(_, val) => setActiveTab(val)}
                            textColor="primary"
                            indicatorColor="primary"
                            sx={{ minHeight: 36 }}
                          >
                            <Tab icon={<ListAltIcon fontSize="small" />} iconPosition="start" label="Cards" value="cards" sx={{ minHeight: 36, py: 0.5 }} />
                            <Tab icon={<GridViewIcon fontSize="small" />} iconPosition="start" label="Matrix" value="matrix" sx={{ minHeight: 36, py: 0.5 }} />
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
                      boxShadow: 'none',
                    }}
                  >
                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: 'text.secondary', lineHeight: 1.6 }}>
                      <strong>Clinical Disclaimer:</strong> RxCheck provides interaction records from active medical datasets and does not replace professional clinical judgment. Coverage and field detail vary by record and dataset release. Always consult a qualified physician or licensed pharmacist before initiating, altering, or discontinuing any medication regimen.
                    </Typography>
                  </Alert>
                </Stack>
              )}
            </Grid>
          </Grid>
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
