import React, { useState } from 'react';
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
  useMediaQuery,
  IconButton,
  Collapse,
} from '@mui/material';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { createAppTheme, type ThemeMode } from './theme/theme';
import { Navbar } from './components/Navbar';
import { DrugInput } from './components/DrugInput';
import { TutorialCard } from './components/TutorialCard';
import { InteractionCard } from './components/InteractionCard';
import { DrugsComReportCard } from './components/DrugsComReportCard';
import { DoctorWarningBanner } from './components/DoctorWarningBanner';
import { RecreationalAdvisory } from './components/RecreationalAdvisory';
import { SymptomSelector } from './components/SymptomSelector';
import { DoctorReportModal } from './components/DoctorReportModal';
import { LifestyleDietaryRadar } from './components/LifestyleDietaryRadar';

import {
  fetchDrugsComInteractions,
  convertDrugsComReportToPairs,
  extractSymptomsFromRecords,
} from './services/scraperApi';
import type { EvaluatedDrugPair, ScrapedInteractionReport } from './types/rxcheck';

export const App: React.FC = () => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('rxcheck_theme_mode');
    return (saved as ThemeMode) || (prefersDarkMode ? 'dark' : 'light');
  });

  const [drugs, setDrugs] = useState<string[]>([]);
  const [selectedSymptomIds, setSelectedSymptomIds] = useState<string[]>([]);
  const [results, setResults] = useState<EvaluatedDrugPair[]>([]);
  const [scrapedReport, setScrapedReport] = useState<ScrapedInteractionReport | null>(null);
  const [hasEvaluated, setHasEvaluated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDrugsCom, setIsLoadingDrugsCom] = useState(false);
  const [progress, setProgress] = useState<{ completed: number; total: number } | null>(null);
  const [doctorModalOpen, setDoctorModalOpen] = useState(false);
  const [evaluatedPairsOpen, setEvaluatedPairsOpen] = useState(false);

  const theme = createAppTheme(themeMode);

  const toggleTheme = () => {
    const next = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(next);
    localStorage.setItem('rxcheck_theme_mode', next);
  };

  // Evaluation powered directly by Drugs.com webscraper
  const handleEvaluate = async (drugList = drugs) => {
    if (drugList.length < 2) return;
    const totalPairs = (drugList.length * (drugList.length - 1)) / 2;
    setIsLoading(true);
    setIsLoadingDrugsCom(true);
    setProgress({ completed: 0, total: totalPairs });

    try {
      const report = await fetchDrugsComInteractions(drugList);
      if (report) {
        setScrapedReport(report);
        const pairs = convertDrugsComReportToPairs(drugList, report);
        setProgress({ completed: totalPairs, total: totalPairs });
        setResults(pairs);
        setHasEvaluated(true);
      } else {
        const fallbackReport: ScrapedInteractionReport = {
          url: '',
          title: 'Drug Interaction Report',
          drug_interactions: [],
          duplications: [],
          food_interactions: [],
          disease_interactions: [],
        };
        setScrapedReport(fallbackReport);
        setResults(convertDrugsComReportToPairs(drugList, fallbackReport));
        setHasEvaluated(true);
      }
    } catch (err) {
      console.error('Drugs.com evaluation error:', err);
    } finally {
      setIsLoading(false);
      setIsLoadingDrugsCom(false);
    }
  };

  // Dynamically extract clinical symptoms directly from records
  const dynamicSymptoms = extractSymptomsFromRecords(results);

  // If a drug is deleted or cleared, reset results
  const handleDrugsChange = (newDrugs: string[]) => {
    if (newDrugs.length < drugs.length || newDrugs.length < 2) {
      setHasEvaluated(false);
      setResults([]);
      setScrapedReport(null);
      setSelectedSymptomIds([]);
    }
    setDrugs(newDrugs);
  };

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
        <Navbar themeMode={themeMode} onToggleTheme={toggleTheme} />

        {/* Main 2-Column Application Layout */}
        <Container maxWidth="xl" sx={{ py: 3, flex: 1 }}>
          <Grid container spacing={3}>
            {/* LEFT COLUMN: Drug Search & Regimen Management */}
            <Grid size={{ xs: 12, md: 4.5, lg: 4 }}>
              <Box sx={{ position: { md: 'sticky' }, top: 80 }}>
                <DrugInput
                  drugs={drugs}
                  onChangeDrugs={handleDrugsChange}
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
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
                  }}
                >
                  <CircularProgress size={44} sx={{ color: 'primary.main', mb: 2.5 }} />
                  <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                    Analyzing Medication Regimen...
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 460, mx: 'auto' }}>
                    Reviewing clinical interactions, safety warnings, and drug guidance.
                    {progress && (
                      <Box component="span" sx={{ display: 'block', mt: 1, fontWeight: 700, color: 'primary.main' }}>
                        Evaluated {progress.completed} of {progress.total} pairs
                      </Box>
                    )}
                  </Typography>
                </Box>
              )}

              {/* State B: Initial Onboarding Tutorial */}
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

                  {/* 2. Drugs.com Clinical Report (Loaded or streaming) */}
                  {(scrapedReport || isLoadingDrugsCom) && (
                    <DrugsComReportCard report={scrapedReport} isLoading={isLoadingDrugsCom} />
                  )}

                  {/* 3. Adverse Signs & Symptoms */}
                  <SymptomSelector
                    symptoms={dynamicSymptoms}
                    selectedSymptomIds={selectedSymptomIds}
                    onToggleSymptom={handleToggleSymptom}
                  />

                  {/* 4. Lifestyle & Recreational Advisory */}
                  <RecreationalAdvisory results={results} drugs={drugs} />

                  {/* 5. Evaluated Pairs List */}
                  {results.length > 0 && (
                    <Box
                      sx={{
                        p: { xs: 2.2, md: 2.8 },
                        borderRadius: 2.5,
                        bgcolor: 'background.paper',
                        border: `1px solid ${theme.palette.divider}`,
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
                      }}
                    >
                      <Box
                        onClick={() => setEvaluatedPairsOpen(!evaluatedPairsOpen)}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                          userSelect: 'none',
                          mb: evaluatedPairsOpen ? 2 : 0,
                        }}
                      >
                        <Box>
                          <Typography variant="h5" sx={{ fontWeight: 800 }}>
                            Evaluated Pairs ({results.length})
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Pairwise clinical interaction records and mechanisms.
                          </Typography>
                        </Box>
                        <IconButton
                          size="medium"
                          onClick={e => {
                            e.stopPropagation();
                            setEvaluatedPairsOpen(!evaluatedPairsOpen);
                          }}
                          aria-label={evaluatedPairsOpen ? 'Collapse Evaluated Pairs' : 'Expand Evaluated Pairs'}
                          sx={{
                            color: 'text.secondary',
                            transform: evaluatedPairsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.25s ease-in-out',
                          }}
                        >
                          <ExpandMoreIcon />
                        </IconButton>
                      </Box>

                      <Collapse in={evaluatedPairsOpen} timeout="auto">
                        <Stack spacing={2}>
                          {results.map(item => (
                            <InteractionCard key={item.id} item={item} />
                          ))}
                        </Stack>
                      </Collapse>
                    </Box>
                  )}

                  {/* 4. Lifestyle & Dietary Risk Radar ("Can I have a drink, coffee, grapefruit, or dairy?") */}
                  <LifestyleDietaryRadar
                    drugs={drugs}
                    drugsComReport={scrapedReport}
                    results={results}
                  />

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
                      <strong>Clinical Disclaimer:</strong> Data is compiled for informational and consultation review, and does not replace professional clinical judgment. Always consult a qualified physician or licensed pharmacist before altering any medication regimen.
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
          drugsComReport={scrapedReport}
        />
      </Box>
    </ThemeProvider>
  );
};

export default App;
