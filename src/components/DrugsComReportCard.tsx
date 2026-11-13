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
  useTheme,
  Alert,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import type { ScrapedInteractionReport } from '../types/rxcheck';

interface DrugsComReportCardProps {
  report?: ScrapedInteractionReport | null;
}

export const DrugsComReportCard: React.FC<DrugsComReportCardProps> = ({ report }) => {
  const theme = useTheme();
  const [expandedSection, setExpandedSection] = useState<string | false>('drug-interactions');

  if (!report || typeof report !== 'object') {
    return null;
  }

  const drugInteractions = Array.isArray(report.drug_interactions) ? report.drug_interactions : [];
  const duplications = Array.isArray(report.duplications) ? report.duplications : [];
  const foodInteractions = Array.isArray(report.food_interactions) ? report.food_interactions : [];

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
        return <Chip size="small" label="MAJOR" color="error" icon={<PriorityHighIcon fontSize="small" />} sx={{ fontWeight: 800 }} />;
      case 'moderate':
        return <Chip size="small" label="MODERATE" color="warning" icon={<WarningAmberIcon fontSize="small" />} sx={{ fontWeight: 800 }} />;
      case 'minor':
        return <Chip size="small" label="MINOR" color="info" icon={<InfoOutlinedIcon fontSize="small" />} sx={{ fontWeight: 800 }} />;
      default:
        return <Chip size="small" label={severity || 'NOTE'} variant="outlined" sx={{ fontWeight: 700 }} />;
    }
  };

  return (
    <Card
      elevation={0}
      sx={{
        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(56, 189, 248, 0.3)' : 'rgba(14, 165, 233, 0.4)'}`,
        borderRadius: 2.5,
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.6)' : 'rgba(240, 249, 255, 0.6)',
      }}
    >
      <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(14, 165, 233, 0.15)',
                color: theme.palette.mode === 'dark' ? '#38bdf8' : '#0284c7',
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
                <Chip
                  size="small"
                  label="Verified Scraping"
                  sx={{
                    bgcolor: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    height: 22,
                  }}
                />
              </Box>
              <Typography variant="caption" color="text.secondary">
                Aggregated reports from Drugs.com dataset
              </Typography>
            </Box>
          </Box>

          {report.url && (
            <Button
              size="small"
              variant="outlined"
              endIcon={<OpenInNewIcon />}
              href={report.url}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5 }}
            >
              View on Drugs.com
            </Button>
          )}
        </Box>

        {totalInteractions === 0 ? (
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
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 800 }}>
                            {item.title}
                          </Typography>
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
      </CardContent>
    </Card>
  );
};
