import React, { useState, useRef, useEffect } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  Box,
  Container,
  Typography,
  Grid,
  CircularProgress,
  LinearProgress,
  Stack,
  Alert,
  useMediaQuery,
  IconButton,
  Collapse,
  Tabs,
  Tab,
  Chip,
  Button,
  Fade,
} from '@mui/material';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';

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
import { OtcAilmentSelector } from './components/OtcAilmentSelector';
import { OtcMatcherDetailView } from './components/OtcMatcherDetailView';

import {
  fetchDrugsComInteractions,
  convertDrugsComReportToPairs,
  extractSymptomsFromRecords,
  restartScraperBackend,
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
  const [progress, setProgress] = useState<{ completed: number; total: number; currentPair?: string } | null>(null);
  const [doctorModalOpen, setDoctorModalOpen] = useState(false);
  const [evaluatedPairsOpen, setEvaluatedPairsOpen] = useState(true);
  const [selectedAilmentId, setSelectedAilmentId] = useState<string | null>(null);
  const [activeRightTab, setActiveRightTab] = useState<'regimen' | 'otc_matcher'>('regimen');
  const [isRestartingScraper, setIsRestartingScraper] = useState(false);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleRestartScraper = async () => {
    setIsRestartingScraper(true);
    try {
      const res = await restartScraperBackend();
      if (res.available) {
        await handleEvaluate(drugs);
      }
    } catch (err) {
      console.error('Failed to restart scraper:', err);
    } finally {
      setIsRestartingScraper(false);
    }
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const theme = createAppTheme(themeMode);
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));

  const rightColumnRef = useRef<HTMLDivElement>(null);
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const [rightHeight, setRightHeight] = useState<number | null>(null);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const checkLeftScroll = () => {
    const el = leftScrollRef.current;
    if (!el) return;
    const hasMore = el.scrollHeight - el.scrollTop - el.clientHeight > 30;
    setCanScrollDown(hasMore);
  };

  const handleScrollDownLeft = () => {
    const el = leftScrollRef.current;
    if (el) {
      el.scrollBy({ top: 320, behavior: 'smooth' });
    }
  };

  // Sync left sidebar height dynamically to match right column height
  useEffect(() => {
    if (!rightColumnRef.current) return;
    const el = rightColumnRef.current;

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.contentRect.height > 0) {
          setRightHeight(Math.round(entry.target.clientHeight));
        }
      }
    });

    observer.observe(el);
    setRightHeight(el.clientHeight);

    return () => observer.disconnect();
  }, [activeRightTab, hasEvaluated, isLoading, results.length]);

  // Monitor left scroll container resizing to keep scroll indicator updated
  useEffect(() => {
    if (!leftScrollRef.current) return;
    const el = leftScrollRef.current;

    const observer = new ResizeObserver(() => {
      checkLeftScroll();
    });

    observer.observe(el);
    checkLeftScroll();

    return () => observer.disconnect();
  }, [rightHeight, drugs.length, selectedAilmentId]);

  const toggleTheme = () => {
    const next = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(next);
    localStorage.setItem('rxcheck_theme_mode', next);
  };

  // Evaluation powered directly by Drugs.com webscraper with real-time progressive updates
  const handleEvaluate = async (drugList = drugs) => {
    if (drugList.length < 2) return;

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    const totalPairs = (drugList.length * (drugList.length - 1)) / 2;

    // Generate list of all pairwise combination names
    const pairNames: string[] = [];
    for (let i = 0; i < drugList.length; i++) {
      for (let j = i + 1; j < drugList.length; j++) {
        pairNames.push(`${drugList[i]} + ${drugList[j]}`);
      }
    }

    setIsLoading(true);
    setIsLoadingDrugsCom(true);
    setProgress({ completed: 0, total: totalPairs, currentPair: pairNames[0] || '' });

    let currentCompleted = 0;
    // Step interval: advance pairs across 2.2s typical network latency
    const stepIntervalMs = Math.max(220, Math.min(500, Math.floor(2200 / totalPairs)));

    progressIntervalRef.current = setInterval(() => {
      if (currentCompleted < totalPairs - 1) {
        currentCompleted += 1;
        setProgress({
          completed: currentCompleted,
          total: totalPairs,
          currentPair: pairNames[currentCompleted] || '',
        });
      }
    }, stepIntervalMs);

    try {
      const report = await fetchDrugsComInteractions(drugList);

      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      // Smoothly advance through remaining pairs to 100% so user sees completion
      for (let i = currentCompleted + 1; i <= totalPairs; i++) {
        setProgress({
          completed: i,
          total: totalPairs,
          currentPair: pairNames[i - 1] || '',
        });
        await new Promise(r => setTimeout(r, 90));
      }

      // Short polish pause at 100%
      await new Promise(r => setTimeout(r, 180));

      if (report) {
        setScrapedReport(report);
        const pairs = convertDrugsComReportToPairs(drugList, report);
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
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setIsLoading(false);
      setIsLoadingDrugsCom(false);
    }
  };

  // Dynamically extract clinical symptoms directly from records
  const dynamicSymptoms = extractSymptomsFromRecords(results);

  // If a drug is deleted or cleared, reset results
  const handleDrugsChange = (newDrugs: string[]) => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
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

  const handleSelectAilment = (ailmentId: string) => {
    setSelectedAilmentId(ailmentId);
    setActiveRightTab('otc_matcher');
  };

  const handleAddDrugFromOtc = (drugName: string) => {
    const trimmed = drugName.trim();
    if (!trimmed) return;
    const exists = drugs.some(d => d.toLowerCase() === trimmed.toLowerCase());
    if (!exists) {
      const updated = [...drugs, trimmed];
      setDrugs(updated);
      if (hasEvaluated) {
        setHasEvaluated(false);
      }
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
            {/* LEFT COLUMN: Drug Search & Regimen Management + Safe OTC Matcher Search */}
            <Grid size={{ xs: 12, md: 4.5, lg: 4 }}>
              <Box
                sx={{
                  position: { xs: 'relative', md: 'sticky' },
                  top: 80,
                  height: isMdUp && rightHeight ? `${rightHeight}px` : 'auto',
                  maxHeight: isMdUp && rightHeight ? `${rightHeight}px` : 'calc(100vh - 100px)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Scrollable Content Container */}
                <Box
                  ref={leftScrollRef}
                  onScroll={checkLeftScroll}
                  sx={{
                    flex: 1,
                    overflowY: 'auto',
                    pr: { md: 0.8 },
                    pb: 6,
                    '&::-webkit-scrollbar': { width: 5 },
                    '&::-webkit-scrollbar-thumb': {
                      bgcolor: 'divider',
                      borderRadius: 3,
                    },
                  }}
                >
                  <DrugInput
                    drugs={drugs}
                    onChangeDrugs={handleDrugsChange}
                    onEvaluate={() => {
                      setActiveRightTab('regimen');
                      handleEvaluate(drugs);
                    }}
                    isLoading={isLoading}
                  />

                  <OtcAilmentSelector
                    selectedAilmentId={selectedAilmentId}
                    onSelectAilment={handleSelectAilment}
                    activeRegimenCount={drugs.length}
                  />
                </Box>

                {/* Floating Scroll Indicator / Action Button */}
                <Fade in={isMdUp && canScrollDown}>
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 12,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      zIndex: 10,
                      pointerEvents: 'none',
                    }}
                  >
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      onClick={handleScrollDownLeft}
                      startIcon={<KeyboardArrowDownRoundedIcon />}
                      sx={{
                        pointerEvents: 'auto',
                        borderRadius: 6,
                        px: 2,
                        py: 0.6,
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        textTransform: 'none',
                        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
                        whiteSpace: 'nowrap',
                        animation: 'floatBounce 2s ease-in-out infinite',
                        '@keyframes floatBounce': {
                          '0%, 100%': { transform: 'translateY(0)' },
                          '50%': { transform: 'translateY(3px)' },
                        },
                      }}
                    >
                      More in Catalog
                    </Button>
                  </Box>
                </Fade>
              </Box>
            </Grid>

            {/* RIGHT COLUMN: Mode Switcher & Content Views */}
            <Grid size={{ xs: 12, md: 7.5, lg: 8 }}>
              <Box ref={rightColumnRef}>
              {/* Top View Mode Navigation Tabs */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 2.5,
                  p: 0.6,
                  borderRadius: 2.5,
                  bgcolor: 'background.paper',
                  border: `1px solid ${theme.palette.divider}`,
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
                  flexWrap: 'wrap',
                  gap: 1,
                }}
              >
                <Tabs
                  value={activeRightTab}
                  onChange={(_, val) => setActiveRightTab(val)}
                  textColor="primary"
                  indicatorColor="primary"
                  sx={{
                    minHeight: 42,
                    '& .MuiTab-root': {
                      minHeight: 42,
                      fontWeight: 700,
                      textTransform: 'none',
                      fontSize: '0.88rem',
                      borderRadius: 2,
                      px: { xs: 1.5, sm: 2.2 },
                      py: 0.5,
                    },
                  }}
                >
                  <Tab
                    value="regimen"
                    icon={<CompareArrowsIcon sx={{ fontSize: 19 }} />}
                    iconPosition="start"
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <span>Regimen Interactions</span>
                        {results.length > 0 && (
                          <Chip
                            size="small"
                            label={`${results.length} pair${results.length === 1 ? '' : 's'}`}
                            color="primary"
                            sx={{ height: 18, fontSize: '0.65rem', fontWeight: 800 }}
                          />
                        )}
                      </Box>
                    }
                  />
                  <Tab
                    value="otc_matcher"
                    icon={<LocalPharmacyIcon sx={{ fontSize: 19 }} />}
                    iconPosition="start"
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <span>Safe OTC & Supplement Matcher</span>
                        {selectedAilmentId ? (
                          <Chip
                            size="small"
                            label="Active"
                            color="success"
                            variant="outlined"
                            sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                          />
                        ) : (
                          <Chip
                            size="small"
                            label="openFDA"
                            variant="outlined"
                            sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                          />
                        )}
                      </Box>
                    }
                  />
                </Tabs>
              </Box>

              {/* VIEW 1: Safe OTC Matcher Detail View */}
              {activeRightTab === 'otc_matcher' && (
                <OtcMatcherDetailView
                  selectedAilmentId={selectedAilmentId}
                  drugs={drugs}
                  onAddDrugToRegimen={handleAddDrugFromOtc}
                  onBackToRegimenView={() => setActiveRightTab('regimen')}
                  onSelectAilment={handleSelectAilment}
                />
              )}

              {/* VIEW 2: Regimen Interaction Analysis */}
              {activeRightTab === 'regimen' && (
                <>
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
                      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 460, mx: 'auto', mb: 2 }}>
                        Reviewing clinical interactions, safety warnings, and drug guidance.
                      </Typography>

                      {progress && (
                        <Box sx={{ maxWidth: 360, mx: 'auto' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                              Evaluated {progress.completed} of {progress.total} pairs
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>
                              {Math.round((progress.completed / Math.max(1, progress.total)) * 100)}%
                            </Typography>
                          </Box>

                          <LinearProgress
                            variant="determinate"
                            value={Math.round((progress.completed / Math.max(1, progress.total)) * 100)}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 3,
                                bgcolor: 'primary.main',
                                transition: 'transform 0.15s linear',
                              },
                            }}
                          />

                          {progress.currentPair && (
                            <Typography
                              variant="caption"
                              sx={{
                                display: 'block',
                                mt: 1.2,
                                color: 'text.secondary',
                                fontWeight: 600,
                                fontStyle: 'italic',
                              }}
                            >
                              Checking: {progress.currentPair}
                            </Typography>
                          )}
                        </Box>
                      )}
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
                        <DrugsComReportCard
                          report={scrapedReport}
                          isLoading={isLoadingDrugsCom}
                          onRestartScraper={handleRestartScraper}
                          isRestarting={isRestartingScraper}
                        />
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

                      {/* 6. Lifestyle & Dietary Risk Radar */}
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
                </>
              )}
              </Box>
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
