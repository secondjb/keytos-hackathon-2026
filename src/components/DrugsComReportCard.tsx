import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Button,
  CircularProgress,
  useTheme,
  Alert,
  Collapse,
  IconButton,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import type { ScrapedInteractionReport } from '../types/rxcheck';

interface DrugsComReportCardProps {
  report: ScrapedInteractionReport | null;
  isLoading?: boolean;
}

export const DrugsComReportCard: React.FC<DrugsComReportCardProps> = ({ report, isLoading }) => {
  const theme = useTheme();
  const [isCardOpen, setIsCardOpen] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | false>('drug-interactions');

  if (isLoading) {
    return (
      <Card
        elevation={0}
        sx={{
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(14, 165, 233, 0.4)'}`,
          borderRadius: 2.5,
          bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : 'rgba(240, 249, 255, 0.6)',
        }}
      >
        <CardContent sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={24} color="primary" />
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              Compiling Drugs.com Clinical Report...
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Reviewing multi-drug warnings, duplications, and dietary precautions
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!report) return null;

  const drugInteractions = report.drug_interactions || [];
  const duplications = report.duplications || [];
  const foodInteractions = report.food_interactions || [];

  const totalInteractions =
    drugInteractions.length +
    duplications.length +
    foodInteractions.length;

  const handleAccordionChange = (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedSection(isExpanded ? panel : false);
  };

  const getSeverityChip = (severity?: string) => {
    switch (severity?.toLowerCase()) {
      case 'major':
        return (
          <Chip
            size="small"
            label="MAJOR"
            color="error"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.72rem',
              color: theme.palette.error.contrastText,
              px: 1.2,
              '& .MuiChip-label': { p: 0, color: theme.palette.error.contrastText, lineHeight: 1 },
            }}
          />
        );
      case 'moderate':
        return <Chip size="small" label="MODERATE" color="warning" sx={{ fontWeight: 800, px: 0.5 }} />;
      case 'minor':
        return <Chip size="small" label="MINOR" color="info" sx={{ fontWeight: 800, px: 0.5 }} />;
      default:
        return <Chip size="small" label={severity || 'NOTE'} variant="outlined" sx={{ fontWeight: 700 }} />;
    }
  };

  return (
    <Card
      elevation={0}
      sx={{
        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(14, 165, 233, 0.4)'}`,
        borderRadius: 2.5,
        bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : 'rgba(240, 249, 255, 0.6)',
      }}
    >
      <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
        {/* Header */}
        <Box
          onClick={() => setIsCardOpen(!isCardOpen)}
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1.5,
            cursor: 'pointer',
            userSelect: 'none',
            mb: isCardOpen ? 2 : 0,
            borderRadius: 1.5,
            transition: 'background-color 0.2s',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(14, 165, 233, 0.15)',
                color: theme.palette.mode === 'dark' ? 'primary.main' : '#0284c7',
                display: 'flex',
              }}
            >
              <TravelExploreIcon sx={{ fontSize: 28 }} />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                  Drugs.com Clinical Report
                </Typography>
                {totalInteractions > 0 && (
                  <Chip
                    size="small"
                    label={`${totalInteractions} Warning${totalInteractions === 1 ? '' : 's'}`}
                    color="primary"
                    sx={{ fontWeight: 700, fontSize: '0.72rem', height: 22 }}
                  />
                )}
              </Box>
              <Typography variant="caption" color="text.secondary">
                Comprehensive interaction warnings, precautions, and dietary advisories
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {report.url && (
              <Button
                size="small"
                variant="outlined"
                endIcon={<OpenInNewIcon />}
                href={report.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5 }}
              >
                View on Drugs.com
              </Button>
            )}
            <IconButton
              size="medium"
              onClick={e => {
                e.stopPropagation();
                setIsCardOpen(!isCardOpen);
              }}
              aria-label={isCardOpen ? 'Collapse Drugs.com Report' : 'Expand Drugs.com Report'}
              sx={{
                transform: isCardOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.25s ease-in-out',
                color: 'text.secondary',
              }}
            >
              <ExpandMoreIcon />
            </IconButton>
          </Box>
        </Box>

        <Collapse in={isCardOpen} timeout="auto">

        {report.error && (
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
            {report.error}
          </Alert>
        )}

        {totalInteractions === 0 && !report.error ? (
          <Alert severity="success" sx={{ borderRadius: 2 }}>
            No significant drug interactions or warnings reported on Drugs.com for this regimen.
          </Alert>
        ) : (
          <Stack spacing={1.5}>
            {/* 1. Drug-Drug Interactions */}
            {drugInteractions.length > 0 && (
              <Accordion
                expanded={expandedSection === 'drug-interactions'}
                onChange={handleAccordionChange('drug-interactions')}
                elevation={0}
                sx={{
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: '12px !important',
                  '&:before': { display: 'none' },
                  overflow: 'hidden',
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                    <WarningAmberIcon color="error" fontSize="small" />
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                      Drug-to-Drug Interactions ({drugInteractions.length})
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0 }}>
                  <Stack spacing={1.5}>
                    {drugInteractions.map((item, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: 'background.paper',
                          border: `1px solid ${theme.palette.divider}`,
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, gap: 1 }}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 800 }}>
                              {item.title}
                            </Typography>
                            {item.subtitle && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }}>
                                {item.subtitle}
                              </Typography>
                            )}
                          </Box>
                          {getSeverityChip(item.severity)}
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                          {item.text}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            )}

            {/* 2. Therapeutic Duplication */}
            {duplications.length > 0 && (
              <Accordion
                expanded={expandedSection === 'duplications'}
                onChange={handleAccordionChange('duplications')}
                elevation={0}
                sx={{
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: '12px !important',
                  '&:before': { display: 'none' },
                  overflow: 'hidden',
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                    <ContentCopyIcon color="warning" fontSize="small" />
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                      Therapeutic Duplication Warnings ({duplications.length})
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0 }}>
                  <Stack spacing={1.5}>
                    {duplications.map((item, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: 'background.paper',
                          border: `1px solid ${theme.palette.divider}`,
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 800, mb: 0.5 }}>
                          {item.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                          {item.text}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            )}

            {/* 3. Food & Lifestyle Warnings */}
            {foodInteractions.length > 0 && (
              <Accordion
                expanded={expandedSection === 'food'}
                onChange={handleAccordionChange('food')}
                elevation={0}
                sx={{
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: '12px !important',
                  '&:before': { display: 'none' },
                  overflow: 'hidden',
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                    <RestaurantIcon color="primary" fontSize="small" />
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                      Food, Alcohol & Lifestyle Interactions ({foodInteractions.length})
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0 }}>
                  <Stack spacing={1.5}>
                    {foodInteractions.map((item, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: 'background.paper',
                          border: `1px solid ${theme.palette.divider}`,
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 800, mb: 0.5 }}>
                          {item.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                          {item.text}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            )}
          </Stack>
        )}
        </Collapse>
      </CardContent>
    </Card>
  );
};
