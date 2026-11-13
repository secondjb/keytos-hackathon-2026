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
  useMediaQuery,
} from '@mui/material';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';

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

import {
  checkPolypharmacyInteractions,
  extractSymptomsFromRecords,
  fetchAuthoritativeUsage,
} from './services/rxCheckApi';
import { fetchDrugsComInteractions } from './services/scraperApi';
import type { EvaluatedDrugPair, ScrapedInteractionReport } from './types/rxcheck';

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
  const [scrapedReport, setScrapedReport] = useState<ScrapedInteractionReport | null>(null);
  const [includeDrugsComScrape, setIncludeDrugsComScrape] = useState<boolean>(true);
  const [hasEvaluated, setHasEvaluated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<{ completed: number; total: number } | null>(null);
  const [doctorModalOpen, setDoctorModalOpen] = useState(false);

  const theme = createAppTheme(themeMode);

  const toggleTheme = () => {
    const next = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(next);
    localStorage.setItem('rxcheck_theme_mode', next);
  };

  useEffect(() => {
    fetchAuthoritativeUsage();
  }, []);

  // Run Polypharmacy & Drugs.com Evaluation
  const handleEvaluate = async (drugList = drugs) => {
    if (drugList.length < 2) return;
    setIsLoading(true);
    setProgress({ completed: 0, total: (drugList.length * (drugList.length - 1)) / 2 });

    try {
      // Evaluate RxCheck pairs & Drugs.com scraper concurrently
      const rxCheckPromise = checkPolypharmacyInteractions(drugList, (completed, total) => {
        setProgress({ completed, total });
      });

      const scraperPromise = includeDrugsComScrape
        ? fetchDrugsComInteractions(drugList)
        : Promise.resolve(null);

      const [rxResponse, scrapedResponse] = await Promise.all([rxCheckPromise, scraperPromise]);

      setResults(rxResponse.results);
      setScrapedReport(scrapedResponse);
      setHasEvaluated(true);
      fetchAuthoritativeUsage();
    } catch (err) {
      console.error('Evaluation failed:', err);
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  };

  // Dynamically extract clinical symptoms directly from RxCheck records
  const dynamicSymptoms = extractSymptomsFromRecords(results);

  // If a drug is deleted or cleared, reset right column
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
        {/* Top Bar with 'RxCheck' bold + 'Clinical Interaction Engine' regular */}
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
                  includeDrugsComScrape={includeDrugsComScrape}
                  onToggleDrugsComScrape={setIncludeDrugsComScrape}
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
                    Querying RxCheck & Drugs.com Scraper...
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 460, mx: 'auto' }}>
                    Evaluating pairwise interactions across the clinical datasets and scraping live Drugs.com reports.
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

                  {/* 2. Drugs.com Scraped Report (if enabled & available) */}
                  {scrapedReport && <DrugsComReportCard report={scrapedReport} />}

                  {/* 3. Dynamic Symptoms Extracted from RxCheck Records */}
                  <SymptomSelector
                    symptoms={dynamicSymptoms}
                    selectedSymptomIds={selectedSymptomIds}
                    onToggleSymptom={handleToggleSymptom}
                  />

                  {/* 4. Lifestyle & Recreational Substance Advisory */}
                  <RecreationalAdvisory results={results} drugs={drugs} />

                  {/* 5. Evaluated Pairs List */}
                  {results.length > 0 && (
                    <Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="h5" sx={{ fontWeight: 800 }}>
                          Evaluated Pairs ({results.length})
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Pairwise records from the active RxCheck medical dataset.
                        </Typography>
                      </Box>

                      <Stack spacing={2}>
                        {results.map(item => (
                          <InteractionCard key={item.id} item={item} />
                        ))}
                      </Stack>
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
                      <strong>Clinical Disclaimer:</strong> Data is aggregated from active medical datasets and Drugs.com live reports, and does not replace professional clinical judgment. Always consult a qualified physician or licensed pharmacist before altering any medication regimen.
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
