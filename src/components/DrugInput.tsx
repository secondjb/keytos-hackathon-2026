import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Autocomplete,
  TextField,
  Button,
  Card,
  CardContent,
  CircularProgress,
  List,
  ListItem,
  IconButton,
  Divider,
  Alert,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  FormControlLabel,
  Switch,
  useTheme,
} from '@mui/material';
import MedicationIcon from '@mui/icons-material/Medication';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DatasetIcon from '@mui/icons-material/Dataset';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

import { searchDrugsUnified, checkScraperHealth } from '../services/scraperApi';
import type { RxCheckDrugSearchResult } from '../types/rxcheck';

export type SearchSourceMode = 'all' | 'drugscom' | 'rxcheck';

interface DrugInputProps {
  drugs: string[];
  onChangeDrugs: (drugs: string[]) => void;
  onEvaluate: () => void;
  isLoading: boolean;
  includeDrugsComScrape?: boolean;
  onToggleDrugsComScrape?: (include: boolean) => void;
}

const formatDrugLabel = (option: string | RxCheckDrugSearchResult): string => {
  if (typeof option === 'string') return option;
  if (option.generic_name && option.generic_name.trim()) {
    const genericCap = option.generic_name.charAt(0).toUpperCase() + option.generic_name.slice(1);
    if (genericCap.toLowerCase() !== option.name.toLowerCase()) {
      return `${genericCap} (${option.name})`;
    }
  }
  return option.name;
};

export const DrugInput: React.FC<DrugInputProps> = ({
  drugs,
  onChangeDrugs,
  onEvaluate,
  isLoading,
  includeDrugsComScrape = true,
  onToggleDrugsComScrape,
}) => {
  const theme = useTheme();
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<RxCheckDrugSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [inputError, setInputError] = useState('');
  const [searchMode, setSearchMode] = useState<SearchSourceMode>('all');
  const [scraperAvailable, setScraperAvailable] = useState<boolean>(true);

  // Check scraper health on mount
  useEffect(() => {
    checkScraperHealth().then(status => {
      setScraperAvailable(status.available);
    });
  }, []);

  // Dynamic live search unified with Scrapling Drugs.com scraper & RxCheck
  useEffect(() => {
    const query = inputValue.trim();
    if (query.length < 2) {
      setOptions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setInputError('');
    const timer = setTimeout(async () => {
      const results = await searchDrugsUnified(query, searchMode);
      setOptions(results);
      setIsSearching(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [inputValue, searchMode]);

  const handleAddDrug = (candidate: string | RxCheckDrugSearchResult) => {
    setInputError('');
    const label = formatDrugLabel(candidate).trim();
    if (!label) return;

    if (drugs.some(d => d.toLowerCase() === label.toLowerCase())) {
      setInputError(`"${label}" is already in your regimen list.`);
      setInputValue('');
      setOptions([]);
      return;
    }

    onChangeDrugs([...drugs, label]);
    setInputValue('');
    setOptions([]);
  };

  const handleRemoveDrug = (indexToRemove: number) => {
    onChangeDrugs(drugs.filter((_, idx) => idx !== indexToRemove));
  };

  const numPairs = drugs.length >= 2 ? (drugs.length * (drugs.length - 1)) / 2 : 0;

  const renderSourceChip = (source?: 'rxcheck' | 'drugs.com' | 'both') => {
    if (source === 'drugs.com') {
      return (
        <Chip
          size="small"
          icon={<TravelExploreIcon sx={{ fontSize: '13px !important' }} />}
          label="Drugs.com"
          sx={{
            height: 20,
            fontSize: '0.65rem',
            fontWeight: 800,
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(147, 51, 234, 0.12)',
            color: theme.palette.mode === 'dark' ? '#c084fc' : '#7e22ce',
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(168, 85, 247, 0.3)' : 'rgba(147, 51, 234, 0.2)'}`,
          }}
        />
      );
    }
    if (source === 'both') {
      return (
        <Chip
          size="small"
          icon={<CheckCircleIcon sx={{ fontSize: '13px !important' }} />}
          label="Verified in Both"
          sx={{
            height: 20,
            fontSize: '0.65rem',
            fontWeight: 800,
            bgcolor: 'rgba(16, 185, 129, 0.15)',
            color: '#10b981',
            border: '1px solid rgba(16, 185, 129, 0.3)',
          }}
        />
      );
    }
    return (
      <Chip
        size="small"
        icon={<DatasetIcon sx={{ fontSize: '13px !important' }} />}
        label="RxCheck"
        sx={{
          height: 20,
          fontSize: '0.65rem',
          fontWeight: 800,
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.1)',
          color: theme.palette.mode === 'dark' ? '#38bdf8' : '#0284c7',
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(56, 189, 248, 0.3)' : 'rgba(2, 132, 199, 0.2)'}`,
        }}
      />
    );
  };

  return (
    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
      <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
        {/* Header: Centered vertically */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <MedicationIcon color="primary" sx={{ fontSize: 32 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                Medication Search
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.2 }}>
                Powered by Scrapling scraper + RxCheck dataset
              </Typography>
            </Box>
          </Box>

          {/* Engine Status Indicator */}
          <Tooltip title={scraperAvailable ? "Scrapling headless scraper engine is connected and bypassing Cloudflare" : "Scrapling scraper server offline, using fallback"}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.8,
                px: 1.2,
                py: 0.4,
                borderRadius: 4,
                bgcolor: scraperAvailable ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${scraperAvailable ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              }}
            >
              <Box
                sx={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  bgcolor: scraperAvailable ? '#10b981' : '#ef4444',
                  boxShadow: scraperAvailable ? '0 0 8px #10b981' : 'none',
                }}
              />
              <Typography variant="caption" sx={{ fontWeight: 700, color: scraperAvailable ? '#10b981' : '#ef4444', fontSize: '0.68rem' }}>
                {scraperAvailable ? 'Scraper Live' : 'Scraper Offline'}
              </Typography>
            </Box>
          </Tooltip>
        </Box>

        {/* Source Provider Selector inside Search Box */}
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.6 }}>
            SEARCH SOURCE:
          </Typography>
          <ToggleButtonGroup
            value={searchMode}
            exclusive
            onChange={(_, newMode) => {
              if (newMode) setSearchMode(newMode);
            }}
            size="small"
            fullWidth
            sx={{
              height: 32,
              '& .MuiToggleButton-root': {
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'none',
                py: 0,
              },
            }}
          >
            <ToggleButton value="all">
              <AutoAwesomeIcon sx={{ fontSize: 14, mr: 0.6 }} />
              All Sources
            </ToggleButton>
            <ToggleButton value="drugscom">
              <TravelExploreIcon sx={{ fontSize: 14, mr: 0.6 }} />
              Drugs.com (Scraper)
            </ToggleButton>
            <ToggleButton value="rxcheck">
              <DatasetIcon sx={{ fontSize: 14, mr: 0.6 }} />
              RxCheck
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Autocomplete Input */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Autocomplete
            freeSolo
            fullWidth
            value={null}
            filterOptions={x => x}
            options={options}
            getOptionLabel={formatDrugLabel}
            inputValue={inputValue}
            onInputChange={(_, newInputValue, reason) => {
              if (reason === 'input' || reason === 'clear') {
                setInputValue(newInputValue);
              } else if (reason === 'reset') {
                setInputValue('');
              }
              if (inputError) setInputError('');
            }}
            onChange={(_, value) => {
              if (value) {
                handleAddDrug(value);
              }
            }}
            renderInput={params => {
              const { slotProps, ...restParams } = params;
              return (
                <TextField
                  {...restParams}
                  placeholder="Search drug (e.g. aspirin, ibuprofen, warfarin)..."
                  helperText={
                    searchMode === 'drugscom'
                      ? 'Live autocomplete scraped directly from Drugs.com'
                      : searchMode === 'all'
                      ? 'Unified search: Drugs.com scraper + RxCheck dataset'
                      : 'Searching RxCheck clinical dataset'
                  }
                  onKeyDown={e => {
                    if (e.key === 'Enter' && inputValue.trim()) {
                      e.preventDefault();
                      if (options.length > 0) {
                        handleAddDrug(options[0]);
                      } else {
                        handleAddDrug(inputValue.trim());
                      }
                    }
                  }}
                  slotProps={{
                    ...slotProps,
                    input: {
                      ...slotProps?.input,
                      endAdornment: (
                        <>
                          {isSearching ? (
                            <CircularProgress color="inherit" size={18} sx={{ mr: 1 }} />
                          ) : (
                            <SearchIcon color="action" sx={{ mr: 1 }} />
                          )}
                          {slotProps?.input?.endAdornment}
                        </>
                      ),
                    },
                  }}
                />
              );
            }}
            renderOption={(props, option) => {
              const { key, ...restProps } = props;
              const formatted = formatDrugLabel(option);

              return (
                <Box
                  key={key}
                  component="li"
                  {...restProps}
                  sx={{
                    py: 1,
                    px: 1.5,
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1,
                  }}
                >
                  <Box sx={{ overflow: 'hidden' }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                      {formatted}
                    </Typography>
                    {option.generic_name && (
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {option.generic_name}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ flexShrink: 0 }}>
                    {renderSourceChip(option.source)}
                  </Box>
                </Box>
              );
            }}
            noOptionsText={
              inputValue.trim().length >= 2
                ? isSearching
                  ? 'Querying Drugs.com scraper & RxCheck...'
                  : 'No matching records found. Press Enter or + to add custom drug.'
                : 'Type at least 2 characters to search'
            }
          />

          {/* Plus icon flush with input box */}
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              if (options.length > 0) {
                handleAddDrug(options[0]);
              } else if (inputValue.trim()) {
                handleAddDrug(inputValue.trim());
              }
            }}
            disabled={!inputValue.trim()}
            sx={{
              height: 56,
              width: 56,
              minWidth: 56,
              borderRadius: 2,
              p: 0,
              mb: '23px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AddIcon fontSize="medium" />
          </Button>
        </Box>

        {inputError && (
          <Alert severity="warning" sx={{ mt: 1, py: 0.5, fontSize: '0.8rem' }}>
            {inputError}
          </Alert>
        )}

        {/* Selected Regimen List */}
        <Box sx={{ mt: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              Regimen List ({drugs.length})
            </Typography>
            {drugs.length > 0 && (
              <Button
                size="small"
                color="inherit"
                startIcon={<DeleteOutlinedIcon />}
                onClick={() => onChangeDrugs([])}
                sx={{ color: 'text.secondary', fontSize: '0.75rem', p: 0.5 }}
              >
                Clear
              </Button>
            )}
          </Box>

          {drugs.length === 0 ? (
            <Box
              sx={{
                p: 3,
                textAlign: 'center',
                borderRadius: 2,
                border: `1px dashed ${theme.palette.divider}`,
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                No medications added yet.
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                Search and add at least 2 medications or substances to evaluate pairwise interactions.
              </Typography>
            </Box>
          ) : (
            <List disablePadding sx={{ maxHeight: 260, overflowY: 'auto' }}>
              {drugs.map((drugName, idx) => (
                <ListItem
                  key={drugName + idx}
                  disableGutters
                  sx={{
                    p: 1.2,
                    mb: 1,
                    borderRadius: 1.5,
                    bgcolor: 'action.hover',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 700, pl: 0.5 }}>
                    {drugName}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveDrug(idx)}
                    sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                  >
                    <DeleteOutlinedIcon fontSize="small" />
                  </IconButton>
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Option: Include Drugs.com Web Scrape */}
        {onToggleDrugsComScrape && (
          <Box sx={{ mb: 2, px: 0.5 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={includeDrugsComScrape}
                  onChange={e => onToggleDrugsComScrape(e.target.checked)}
                  color="secondary"
                  size="small"
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.82rem' }}>
                    Include Drugs.com Clinical Scrape
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Scrapes full clinical reports, duplications, and food/disease risks
                  </Typography>
                </Box>
              }
            />
          </Box>
        )}

        {/* Evaluation Action Button */}
        <Box>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            disabled={drugs.length < 2 || isLoading}
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
            onClick={onEvaluate}
            sx={{ py: 1.4, fontWeight: 800 }}
          >
            {isLoading
              ? 'Analyzing & Scraping Interactions...'
              : drugs.length < 2
              ? 'Add at least 2 Drugs to Check'
              : `Check Interactions (${numPairs} pair${numPairs === 1 ? '' : 's'})`}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};
