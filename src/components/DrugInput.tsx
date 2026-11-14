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
  useTheme,
} from '@mui/material';
import MedicationIcon from '@mui/icons-material/Medication';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';

import { searchDrugsStreaming } from '../services/scraperApi';
import type { RxCheckDrugSearchResult } from '../types/rxcheck';
import {
  formatDisplayDrugName,
  formatDrugLabel,
  findRegimenDuplicate,
} from '../utils/drugUtils';

interface DrugInputProps {
  drugs: string[];
  onChangeDrugs: (drugs: string[]) => void;
  onEvaluate: () => void;
  isLoading: boolean;
}

export const DrugInput: React.FC<DrugInputProps> = ({
  drugs,
  onChangeDrugs,
  onEvaluate,
  isLoading,
}) => {
  const theme = useTheme();
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<RxCheckDrugSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [inputError, setInputError] = useState('');

  // Progressive streaming search:
  // Immediately populates local instant matches (<10ms), then streams in live Drugs.com/RxCheck results
  useEffect(() => {
    const query = inputValue.trim();
    if (query.length < 2) {
      setOptions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setInputError('');

    const controller = new AbortController();

    searchDrugsStreaming(
      query,
      (incomingResults, isDone) => {
        if (controller.signal.aborted) return;
        setOptions(incomingResults);
        if (isDone) {
          setIsSearching(false);
        }
      },
      controller.signal
    );

    return () => {
      controller.abort();
    };
  }, [inputValue]);

  const handleAddDrug = (candidate: string | RxCheckDrugSearchResult) => {
    setInputError('');
    const label = formatDrugLabel(candidate).trim();
    if (!label) return;

    const dupCheck = findRegimenDuplicate(candidate, drugs);
    if (dupCheck.isDuplicate) {
      setInputError(dupCheck.reason || `"${label}" is already represented in your regimen list.`);
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

  return (
    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
      <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <MedicationIcon color="primary" sx={{ fontSize: 32 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              Medication Search
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.2 }}>
              Search medications, brand names, or active substances
            </Typography>
          </Box>
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
                if (newInputValue.trim().length < 2) {
                  setOptions([]);
                  setIsSearching(false);
                }
              } else if (reason === 'reset') {
                setInputValue('');
                setOptions([]);
                setIsSearching(false);
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
                  placeholder="Search medication (e.g. Aspirin, Warfarin, Metformin)..."
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
            slotProps={{
              popper: {
                sx: {
                  '& .MuiAutocomplete-paper': {
                    textAlign: 'left',
                  },
                  '& .MuiAutocomplete-listbox': {
                    textAlign: 'left',
                    '& .MuiAutocomplete-option': {
                      textAlign: 'left !important',
                      justifyContent: 'flex-start !important',
                      alignItems: 'flex-start !important',
                    },
                  },
                },
              },
            }}
            renderOption={(props, option) => {
              const { key, ...restProps } = props;
              const primaryName = formatDisplayDrugName(option.name);
              const genericName = option.generic_name ? formatDisplayDrugName(option.generic_name) : null;
              const isBrand = Boolean(genericName && genericName.toLowerCase() !== primaryName.toLowerCase());
              const dupCheck = findRegimenDuplicate(option, drugs);

              return (
                <Box
                  key={key}
                  component="li"
                  {...restProps}
                  sx={{
                    py: 1.2,
                    px: 2,
                    width: '100%',
                    display: 'flex !important',
                    flexDirection: 'row !important',
                    alignItems: 'center !important',
                    justifyContent: 'space-between !important',
                    textAlign: 'left !important',
                    opacity: dupCheck.isDuplicate ? 0.6 : 1,
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', textAlign: 'left', minWidth: 0, flex: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        textAlign: 'left !important',
                        width: '100%',
                        color: dupCheck.isDuplicate ? 'text.secondary' : 'text.primary',
                      }}
                    >
                      {primaryName}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        textAlign: 'left !important',
                        width: '100%',
                        mt: 0.2,
                      }}
                    >
                      {isBrand
                        ? `Brand Name · Contains ${genericName}`
                        : 'Active Substance / Generic'}
                    </Typography>
                  </Box>

                  {dupCheck.isDuplicate && (
                    <Chip
                      label="In Regimen"
                      size="small"
                      variant="outlined"
                      sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600, ml: 1 }}
                    />
                  )}
                </Box>
              );
            }}
            noOptionsText={
              inputValue.trim().length >= 2
                ? isSearching
                  ? 'Searching medications...'
                  : 'No matching medications found. Press Enter or + to add.'
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
                Add at least 2 medications to check interactions and safety advisories.
              </Typography>
            </Box>
          ) : (
            <List disablePadding sx={{ maxHeight: 280, overflowY: 'auto' }}>
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

        <Divider sx={{ my: 2.5 }} />

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
              ? 'Analyzing Interactions...'
              : drugs.length < 2
              ? 'Add at least 2 Drugs to Check'
              : `Check Interactions (${numPairs} pair${numPairs === 1 ? '' : 's'})`}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};
