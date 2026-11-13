import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Autocomplete,
  TextField,
  Chip,
  Button,
  Card,
  CardContent,
  CircularProgress,
  List,
  ListItem,
  IconButton,
  Divider,
  Alert,
  useTheme,
} from '@mui/material';
import MedicationIcon from '@mui/icons-material/Medication';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import SearchIcon from '@mui/icons-material/Search';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { searchDrugsFromRxCheck } from '../services/rxCheckApi';
import type { RxCheckDrugSearchResult } from '../types/rxcheck';

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

  // Live dynamic search from RxCheck dataset
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
      const results = await searchDrugsFromRxCheck(query);
      setOptions(results);
      setIsSearching(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [inputValue]);

  const handleAddDrug = (candidate: string | RxCheckDrugSearchResult) => {
    setInputError('');
    const nameToAdd = typeof candidate === 'string' ? candidate.trim() : candidate.name.trim();
    if (!nameToAdd) return;

    if (drugs.some(d => d.toLowerCase() === nameToAdd.toLowerCase())) {
      setInputError(`"${nameToAdd}" is already in your regimen list.`);
      return;
    }

    onChangeDrugs([...drugs, nameToAdd]);
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <MedicationIcon color="primary" fontSize="large" />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Medication Search
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Direct live RxCheck dataset candidate search
            </Typography>
          </Box>
        </Box>

        {/* Autocomplete Input */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
          <Autocomplete
            freeSolo
            fullWidth
            // CRITICAL: disable client-side filter so server-resolved brand/generic names aren't dropped!
            filterOptions={x => x}
            options={options}
            getOptionLabel={option => {
              if (typeof option === 'string') return option;
              if (option.generic_name && option.generic_name.toLowerCase() !== option.name.toLowerCase()) {
                return `${option.name} (${option.generic_name})`;
              }
              return option.name;
            }}
            inputValue={inputValue}
            onInputChange={(_, newInputValue) => {
              setInputValue(newInputValue);
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
                  placeholder="Search drug (e.g. aspirin, warfarin, ethanol)..."
                  helperText="Click a matching record or press Enter / + to add"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && inputValue.trim()) {
                      e.preventDefault();
                      // If there is an exact or top option from search, prefer that resolved candidate
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
              const isObj = typeof option !== 'string';
              const name = isObj ? option.name : option;
              const generic = isObj ? option.generic_name : null;
              const rxcui = isObj ? option.rxcui : null;

              return (
                <Box
                  key={key}
                  component="li"
                  {...restProps}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                    py: 1,
                    px: 1.5,
                  }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {name}
                    </Typography>
                    {generic && generic.toLowerCase() !== name.toLowerCase() && (
                      <Typography variant="caption" color="text.secondary">
                        Generic: {generic}
                      </Typography>
                    )}
                  </Box>
                  {rxcui && (
                    <Chip
                      label={`RxCUI ${rxcui}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ fontSize: '0.65rem', height: 20 }}
                    />
                  )}
                </Box>
              );
            }}
            noOptionsText={
              inputValue.trim().length >= 2
                ? isSearching
                  ? 'Searching RxCheck dataset...'
                  : 'No dataset records found. Press Enter or + to add as custom drug.'
                : 'Type at least 2 characters to search'
            }
          />

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
            sx={{ minWidth: 48, px: 2, height: 40, mt: 0.2 }}
          >
            <AddCircleIcon />
          </Button>
        </Box>

        {inputError && (
          <Alert severity="warning" sx={{ mt: 1, py: 0.5, fontSize: '0.8rem' }}>
            {inputError}
          </Alert>
        )}

        {/* Selected Regimen List */}
        <Box sx={{ mt: 3 }}>
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
            <List disablePadding sx={{ maxHeight: 300, overflowY: 'auto' }}>
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
            sx={{ py: 1.3, fontWeight: 800 }}
          >
            {isLoading
              ? 'Analyzing Interactions...'
              : drugs.length < 2
              ? 'Add at least 2 Drugs to Check'
              : `Check Interactions (${numPairs} pair${numPairs === 1 ? '' : 's'})`}
          </Button>

          {drugs.length >= 2 && (
            <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: 'text.secondary', mt: 1 }}>
              Evaluates all {numPairs} N-choose-2 pairwise interaction combinations
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};
