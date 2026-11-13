import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  Button,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import CoronavirusIcon from '@mui/icons-material/Coronavirus';
import BoltIcon from '@mui/icons-material/Bolt';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import SpaIcon from '@mui/icons-material/Spa';
import BedtimeIcon from '@mui/icons-material/Bedtime';
import MedicationLiquidIcon from '@mui/icons-material/MedicationLiquid';
import ClearIcon from '@mui/icons-material/Clear';

import { OTC_CATEGORIES } from '../services/openFdaService';

interface OtcAilmentSelectorProps {
  selectedAilmentId: string | null;
  onSelectAilment: (ailmentId: string) => void;
  activeRegimenCount: number;
}

export const OtcAilmentSelector: React.FC<OtcAilmentSelectorProps> = ({
  selectedAilmentId,
  onSelectAilment,
  activeRegimenCount,
}) => {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    cold_flu: true,
    pain_inflammation: true,
    digestive_gi: false,
    allergies_sinus: false,
    sleep_stress: false,
    topical_firstaid: false,
  });

  // Category Icon Resolver
  const getCategoryIcon = (iconName: string) => {
    const iconProps = { fontSize: 'small' as const, color: 'primary' as const };
    switch (iconName) {
      case 'CoronavirusIcon':
        return <CoronavirusIcon {...iconProps} />;
      case 'BoltIcon':
        return <BoltIcon {...iconProps} />;
      case 'RestaurantIcon':
        return <RestaurantIcon {...iconProps} />;
      case 'SpaIcon':
        return <SpaIcon {...iconProps} />;
      case 'BedtimeIcon':
        return <BedtimeIcon {...iconProps} />;
      case 'MedicationLiquidIcon':
        return <MedicationLiquidIcon {...iconProps} />;
      default:
        return <LocalPharmacyIcon {...iconProps} />;
    }
  };

  const handleToggleCategory = (catId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  // Filter ailments based on search term
  const filteredCategories = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return OTC_CATEGORIES;

    return OTC_CATEGORIES.map(category => {
      const matchingAilments = category.ailments.filter(ailment => {
        const matchesName = ailment.name.toLowerCase().includes(term);
        const matchesSummary = ailment.summary.toLowerCase().includes(term);
        const matchesCandidate = ailment.recommendedCandidates.some(
          c =>
            c.name.toLowerCase().includes(term) ||
            c.genericName.toLowerCase().includes(term) ||
            c.brandExamples.some(b => b.toLowerCase().includes(term))
        );
        return matchesName || matchesSummary || matchesCandidate;
      });

      return {
        ...category,
        ailments: matchingAilments,
      };
    }).filter(category => category.ailments.length > 0);
  }, [searchTerm]);

  const totalMatchingAilments = filteredCategories.reduce((acc, cat) => acc + cat.ailments.length, 0);

  return (
    <Card
      elevation={0}
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        mt: 3,
        bgcolor: 'background.paper',
        borderRadius: 2.5,
      }}
    >
      <CardContent sx={{ p: { xs: 2.2, md: 2.8 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <LocalPharmacyIcon color="primary" sx={{ fontSize: 30 }} />
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                Safe OTC Matcher
              </Typography>
              <Chip
                label="openFDA Live"
                size="small"
                variant="outlined"
                color="primary"
                sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.3 }}>
              Find safe over-the-counter options for common ailments
            </Typography>
          </Box>
        </Box>

        {/* Search Bar */}
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search ailment (e.g. Headache, Flu, Reflux)..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: searchTerm ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm('')} edge="end">
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              },
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                fontSize: '0.85rem',
              },
            }}
          />
          {searchTerm && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.8, px: 0.5 }}>
              Found {totalMatchingAilments} matching condition{totalMatchingAilments === 1 ? '' : 's'}
            </Typography>
          )}
        </Box>

        {/* Categorized Ailments List */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {filteredCategories.length === 0 ? (
            <Box
              sx={{
                p: 2.5,
                textAlign: 'center',
                borderRadius: 2,
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                border: `1px dashed ${theme.palette.divider}`,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                No matching ailments found.
              </Typography>
              <Button size="small" onClick={() => setSearchTerm('')} sx={{ mt: 1 }}>
                Clear Search
              </Button>
            </Box>
          ) : (
            filteredCategories.map(category => {
              const isCategoryOpen = searchTerm ? true : Boolean(expandedCategories[category.id]);

              return (
                <Accordion
                  key={category.id}
                  expanded={isCategoryOpen}
                  onChange={() => handleToggleCategory(category.id)}
                  disableGutters
                  elevation={0}
                  sx={{
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: '10px !important',
                    mb: 1,
                    '&:before': { display: 'none' },
                    overflow: 'hidden',
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon fontSize="small" />}
                    sx={{
                      minHeight: 46,
                      py: 0.8,
                      px: 1.5,
                      bgcolor:
                        theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, width: '100%', pr: 1 }}>
                      {getCategoryIcon(category.iconName)}
                      <Typography variant="body2" sx={{ fontWeight: 700, flex: 1 }}>
                        {category.name}
                      </Typography>
                      <Chip
                        label={category.ailments.length}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          bgcolor: 'action.hover',
                        }}
                      />
                    </Box>
                  </AccordionSummary>

                  <AccordionDetails sx={{ p: 1, bgcolor: 'background.paper' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                      {category.ailments.map(ailment => {
                        const isSelected = selectedAilmentId === ailment.id;

                        return (
                          <Box
                            key={ailment.id}
                            onClick={() => onSelectAilment(ailment.id)}
                            sx={{
                              p: 1.2,
                              borderRadius: 1.5,
                              cursor: 'pointer',
                              border: `1px solid ${
                                isSelected ? theme.palette.primary.main : theme.palette.divider
                              }`,
                              bgcolor: isSelected
                                ? theme.palette.mode === 'dark'
                                  ? 'rgba(66, 133, 244, 0.12)'
                                  : 'rgba(25, 118, 210, 0.08)'
                                : 'background.paper',
                              transition: 'all 0.18s ease-in-out',
                              '&:hover': {
                                bgcolor: isSelected
                                  ? undefined
                                  : theme.palette.mode === 'dark'
                                  ? 'rgba(255,255,255,0.04)'
                                  : 'rgba(0,0,0,0.03)',
                                borderColor: isSelected
                                  ? theme.palette.primary.main
                                  : theme.palette.text.secondary,
                              },
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'space-between',
                              gap: 1,
                            }}
                          >
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.4 }}>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: isSelected ? 800 : 700,
                                    color: isSelected ? 'primary.main' : 'text.primary',
                                    fontSize: '0.85rem',
                                  }}
                                >
                                  {ailment.name}
                                </Typography>
                              </Box>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  lineHeight: 1.3,
                                  fontSize: '0.74rem',
                                }}
                              >
                                {ailment.summary}
                              </Typography>

                              <Box sx={{ display: 'flex', gap: 0.6, mt: 0.8, flexWrap: 'wrap' }}>
                                <Chip
                                  size="small"
                                  label={`${ailment.recommendedCandidates.length} Options`}
                                  sx={{
                                    height: 18,
                                    fontSize: '0.62rem',
                                    fontWeight: 600,
                                    bgcolor: 'action.selected',
                                  }}
                                />
                                {activeRegimenCount > 0 && (
                                  <Chip
                                    size="small"
                                    label="Cross-checked"
                                    color="success"
                                    variant="outlined"
                                    sx={{
                                      height: 18,
                                      fontSize: '0.62rem',
                                      fontWeight: 600,
                                    }}
                                  />
                                )}
                              </Box>
                            </Box>

                            {/* Top-Right Indicator Button */}
                            <Tooltip title="View Safe OTC Options on Right" arrow placement="top">
                              <IconButton
                                size="small"
                                onClick={e => {
                                  e.stopPropagation();
                                  onSelectAilment(ailment.id);
                                }}
                                sx={{
                                  color: isSelected ? 'primary.main' : 'text.secondary',
                                  bgcolor: isSelected
                                    ? theme.palette.mode === 'dark'
                                      ? 'rgba(66, 133, 244, 0.2)'
                                      : 'rgba(25, 118, 210, 0.12)'
                                    : 'action.hover',
                                  '&:hover': {
                                    bgcolor: 'primary.main',
                                    color: 'primary.contrastText',
                                  },
                                  p: 0.6,
                                  mt: 0.2,
                                  flexShrink: 0,
                                }}
                                aria-label={`Open ${ailment.name} on right panel`}
                              >
                                {isSelected ? (
                                  <ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />
                                ) : (
                                  <OpenInNewRoundedIcon sx={{ fontSize: 16 }} />
                                )}
                              </IconButton>
                            </Tooltip>
                          </Box>
                        );
                      })}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              );
            })
          )}
        </Box>
      </CardContent>
    </Card>
  );
};
