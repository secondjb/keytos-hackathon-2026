import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Autocomplete,
  TextField,
  Chip,
  Button,
  Stack,
  Card,
  CardContent,
  CircularProgress,
  useTheme,
} from '@mui/material';
import MedicationIcon from '@mui/icons-material/Medication';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SearchIcon from '@mui/icons-material/Search';
import {
  searchDrugsFromRxCheck,
  getStoredDrugCatalog,
  bootstrapCatalogFromRxCheck,
} from '../services/rxCheckApi';
import type { RxCheckDrugSearchResult } from '../types/rxcheck';
import { PRESET_SCENARIOS, type PresetScenario } from '../data/presets';

interface DrugInputProps {
  drugs: string[];
  onChangeDrugs: (drugs: string[]) => void;
  onEvaluate: () => void;
  isLoading: boolean;
  onSelectPreset?: (preset: PresetScenario) => void;
}

export const DrugInput: React.FC<DrugInputProps> = ({
  drugs,
  onChangeDrugs,
  onEvaluate,
  isLoading,
  onSelectPreset,
}) => {
  const theme = useTheme();
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<RxCheckDrugSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Initialize catalog once from RxCheck dataset
  useEffect(() => {
    bootstrapCatalogFromRxCheck().then(catalog => {
      setOptions(catalog);
    });
  }, []);

  // Search RxCheck dynamically as user types
  useEffect(() => {
    if (inputValue.trim().length < 2) {
      setOptions(getStoredDrugCatalog());
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      const results = await searchDrugsFromRxCheck(inputValue);
      setOptions(results);
      setIsSearching(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [inputValue]);

  const numPairs = drugs.length >= 2 ? (drugs.length * (drugs.length - 1)) / 2 : 0;

  return (
    <Card elevation={0}>
      <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MedicationIcon color="primary" fontSize="large" />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Medication & Substance Regimen
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Search RxCheck dataset for 2 or more medications, substances, or lifestyle items.
              </Typography>
            </Box>
          </Box>

          {drugs.length > 0 && (
            <Button
              size="small"
              color="inherit"
              startIcon={<DeleteOutlinedIcon />}
              onClick={() => onChangeDrugs([])}
              sx={{ color: 'text.secondary' }}
            >
              Clear All
            </Button>
          )}
        </Box>

        {/* Autocomplete Multi-Input drawn from RxCheck */}
        <Autocomplete
          multiple
          freeSolo
          options={options.map(o => o.name)}
          value={drugs}
          inputValue={inputValue}
          onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
          onChange={(_, newValue) => {
            onChangeDrugs(newValue as string[]);
          }}
          renderInput={params => {
            const { slotProps, ...restParams } = params;
            return (
              <TextField
                {...restParams}
                placeholder={drugs.length === 0 ? "Search RxCheck dataset (e.g. Warfarin, Aspirin, Ethanol, Sertraline)..." : "Add another drug from RxCheck dataset..."}
                helperText={
                  drugs.length < 2
                    ? "Select at least 2 drugs to evaluate n-choose-2 pairs via RxCheck Polypharmacy API."
                    : `Evaluating ${drugs.length} drugs: RxCheck evaluates ${numPairs} n-choose-2 pair${numPairs === 1 ? '' : 's'}.`
                }
                slotProps={{
                  ...slotProps,
                  input: {
                    ...slotProps?.input,
                    endAdornment: (
                      <>
                        {isSearching ? <CircularProgress color="inherit" size={18} sx={{ mr: 1 }} /> : <SearchIcon color="action" sx={{ mr: 1 }} />}
                        {slotProps?.input?.endAdornment}
                      </>
                    ),
                  },
                }}
              />
            );
          }}
          renderValue={(value, getItemProps) =>
            value.map((item, index) => {
              const strName = item as string;
              const found = options.find(o => o.name.toLowerCase() === strName.toLowerCase());
              const itemProps = getItemProps({ index });
              return (
                <Chip
                  {...itemProps}
                  key={strName + index}
                  label={strName}
                  color={found?.rxcui ? 'primary' : 'default'}
                  variant="filled"
                  sx={{ fontWeight: 600, m: 0.5 }}
                />
              );
            })
          }
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
        />

        {/* Action Button */}
        <Box sx={{ mt: 2.5, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            disabled={drugs.length < 2 || isLoading}
            startIcon={<PlayArrowIcon />}
            onClick={onEvaluate}
            sx={{ px: 4, py: 1.2, fontWeight: 700 }}
          >
            {isLoading ? 'Running Polypharmacy Check...' : `Evaluate Polypharmacy (${numPairs} pair${numPairs === 1 ? '' : 's'})`}
          </Button>
        </Box>

        {/* Preset Scenarios drawn from real RxCheck dataset pairs */}
        <Box sx={{ mt: 3, pt: 2, borderTop: `1px dashed ${theme.palette.divider}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
            <AutoAwesomeIcon fontSize="small" sx={{ color: 'secondary.main' }} />
            <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'text.secondary' }}>
              Sample Regimens for RxCheck Evaluation:
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            {PRESET_SCENARIOS.map(preset => (
              <Chip
                key={preset.id}
                label={preset.title}
                clickable
                variant="outlined"
                color="primary"
                onClick={() => {
                  onChangeDrugs(preset.drugs);
                  if (onSelectPreset) onSelectPreset(preset);
                }}
                sx={{
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  mb: 1,
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                  },
                }}
              />
            ))}
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
};
