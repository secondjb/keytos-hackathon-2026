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
  useTheme,
} from '@mui/material';
import MedicationIcon from '@mui/icons-material/Medication';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import SearchIcon from '@mui/icons-material/Search';
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

  // ONLY populate options when user types a query (at least 2 chars), and cache per query
  useEffect(() => {
    const query = inputValue.trim();
    if (query.length < 2) {
      setOptions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      const results = await searchDrugsFromRxCheck(query);
      setOptions(results);
      setIsSearching(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [inputValue]);

  const handleAddDrug = (name: string) => {
    const clean = name.trim();
    if (!clean) return;
    if (!drugs.some(d => d.toLowerCase() === clean.toLowerCase())) {
      onChangeDrugs([...drugs, clean]);
    }
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
              Search live RxCheck dataset records
            </Typography>
          </Box>
        </Box>

        {/* Autocomplete Input: ONLY populates from user queries */}
        <Autocomplete
          freeSolo
          options={options.map(o => o.name)}
          inputValue={inputValue}
          onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
          onChange={(_, value) => {
            if (value && typeof value === 'string') {
              handleAddDrug(value);
            }
          }}
          renderInput={params => {
            const { slotProps, ...restParams } = params;
            return (
              <TextField
                {...restParams}
                placeholder="Type drug name (min 2 characters)..."
                helperText="Dropdown populates live from RxCheck dataset"
                onKeyDown={e => {
                  if (e.key === 'Enter' && inputValue.trim()) {
                    e.preventDefault();
                    handleAddDrug(inputValue);
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
            const found = options.find(o => o.name.toLowerCase() === option.toLowerCase());
            return (
              <Box
                key={key}
                component="li"
                {...restProps}
                sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', py: 1 }}
              >
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {option}
                  </Typography>
                  {found?.generic_name && (
                    <Typography variant="caption" color="text.secondary">
                      Generic: {found.generic_name}
                    </Typography>
                  )}
                </Box>
                {found?.rxcui && (
                  <Chip
                    label={`RxCUI ${found.rxcui}`}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.65rem', height: 20 }}
                  />
                )}
              </Box>
            );
          }}
          noOptionsText={inputValue.trim().length >= 2 ? (isSearching ? "Searching RxCheck..." : "No matching records in dataset") : "Type at least 2 characters to search"}
        />

        {/* Selected Medication List */}
        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
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
                Type in the search box above to add 2 or more drugs to evaluate.
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
                  <Typography variant="body2" sx={{ fontWeight: 600, pl: 0.5 }}>
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
              ? 'Add at least 2 Drugs'
              : `Check Interactions (${numPairs} pair${numPairs === 1 ? '' : 's'})`}
          </Button>

          {drugs.length >= 2 && (
            <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: 'text.secondary', mt: 1 }}>
              Calculates all {numPairs} N-choose-2 pair combinations
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};
