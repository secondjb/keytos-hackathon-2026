import React, { useState } from 'react';
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
  useTheme,
} from '@mui/material';
import MedicationIcon from '@mui/icons-material/Medication';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { COMMON_DRUGS } from '../data/commonDrugs';
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

  const numPairs = drugs.length >= 2 ? (drugs.length * (drugs.length - 1)) / 2 : 0;

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'recreational':
        return 'secondary';
      case 'supplement':
        return 'warning';
      case 'otc':
        return 'success';
      case 'prescription':
      default:
        return 'primary';
    }
  };

  const drugOptions = COMMON_DRUGS.map(d => d.name);

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
                Enter 2 or more prescription drugs, OTC remedies, supplements, or recreational substances.
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

        {/* Autocomplete Multi-Input */}
        <Autocomplete
          multiple
          freeSolo
          options={drugOptions}
          value={drugs}
          inputValue={inputValue}
          onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
          onChange={(_, newValue) => {
            onChangeDrugs(newValue as string[]);
          }}
          renderInput={params => (
            <TextField
              {...params}
              placeholder={drugs.length === 0 ? "Type drug name (e.g. Warfarin, Aspirin, Sertraline, Alcohol)..." : "Add another drug or substance..."}
              helperText={
                drugs.length < 2
                  ? "Add at least 2 substances to evaluate pairwise interactions."
                  : `Evaluating ${drugs.length} substances = ${numPairs} pairwise interaction check${numPairs === 1 ? '' : 's'}.`
              }
            />
          )}
          renderValue={(value, getItemProps) =>
            value.map((item, index) => {
              const strName = item as string;
              const found = COMMON_DRUGS.find(
                d => d.name.toLowerCase() === strName.toLowerCase()
              );
              const itemProps = getItemProps({ index });
              return (
                <Chip
                  {...itemProps}
                  key={strName + index}
                  label={strName}
                  color={getCategoryColor(found?.category)}
                  variant="filled"
                  sx={{ fontWeight: 600, m: 0.5 }}
                />
              );
            })
          }
          renderOption={(props, option) => {
            const { key, ...restProps } = props;
            const found = COMMON_DRUGS.find(
              d => d.name.toLowerCase() === option.toLowerCase()
            );
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
                  {found?.commonUses && (
                    <Typography variant="caption" color="text.secondary">
                      {found.commonUses}
                    </Typography>
                  )}
                </Box>
                {found?.category && (
                  <Chip
                    label={found.category.toUpperCase()}
                    size="small"
                    color={getCategoryColor(found.category)}
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
            {isLoading ? 'Analyzing Interactions...' : `Check Interactions (${numPairs} pair${numPairs === 1 ? '' : 's'})`}
          </Button>
        </Box>

        {/* Preset Scenarios for Hackathon Judges & Fast Testing */}
        <Box sx={{ mt: 3, pt: 2, borderTop: `1px dashed ${theme.palette.divider}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
            <AutoAwesomeIcon fontSize="small" sx={{ color: 'secondary.main' }} />
            <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'text.secondary' }}>
              Test Preset Scenarios (Zero-Quota / Instant Evaluation):
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            {PRESET_SCENARIOS.map(preset => (
              <Chip
                key={preset.id}
                label={preset.title}
                clickable
                variant="outlined"
                color={
                  preset.badge === 'major'
                    ? 'error'
                    : preset.badge === 'harm_reduction'
                    ? 'secondary'
                    : preset.badge === 'multi_drug'
                    ? 'primary'
                    : 'default'
                }
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
