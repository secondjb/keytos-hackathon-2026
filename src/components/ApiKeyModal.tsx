import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Button,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Chip,
  Alert,
  Divider,
} from '@mui/material';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import AddCircleOutlinedIcon from '@mui/icons-material/AddCircleOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { apiKeysManager } from '../services/apiKeysManager';

interface ApiKeyModalProps {
  open: boolean;
  onClose: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ open, onClose }) => {
  const [newKey, setNewKey] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const keys = apiKeysManager.getAllKeys();
  const activeIndex = apiKeysManager.getActiveIndex();

  const handleSelectKey = (indexStr: string) => {
    const idx = parseInt(indexStr, 10);
    apiKeysManager.setActiveIndex(idx);
  };

  const handleAddKey = () => {
    setErrorMsg('');
    setSuccessMsg('');
    if (!newKey.trim().startsWith('rxck_')) {
      setErrorMsg('API keys typically begin with rxck_live_');
      return;
    }
    const added = apiKeysManager.addKey(newKey.trim());
    if (added) {
      setSuccessMsg('Key successfully added to fallback pool!');
      setNewKey('');
    } else {
      setErrorMsg('This key has already been added.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <VpnKeyIcon color="primary" />
        <Typography variant="h6" component="span" sx={{ fontWeight: 700 }}>
          RxCheck API Key & Fallback Management
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Alert severity="info" sx={{ mb: 2.5 }}>
          The free tier includes <strong>100 queries/month</strong> per key. If an active key hits 429
          or exhausts its quota, RxCheck automatically rotates to the next available fallback key.
        </Alert>

        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
          Configured Keys ({keys.length}):
        </Typography>

        <FormControl component="fieldset" fullWidth>
          <RadioGroup
            value={activeIndex.toString()}
            onChange={e => handleSelectKey(e.target.value)}
          >
            {keys.map((k, idx) => (
              <Box
                key={k.key}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1.5,
                  mb: 1,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: idx === activeIndex ? 'primary.main' : 'divider',
                  bgcolor: idx === activeIndex ? 'action.selected' : 'background.paper',
                }}
              >
                <FormControlLabel
                  value={idx.toString()}
                  control={<Radio size="small" />}
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                        {k.maskedKey}
                      </Typography>
                      {idx === 0 && (
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Primary key from .env
                        </Typography>
                      )}
                    </Box>
                  }
                />
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  {idx === activeIndex && (
                    <Chip label="ACTIVE" color="primary" size="small" icon={<CheckCircleIcon />} />
                  )}
                  {k.queriesRemaining !== undefined && (
                    <Chip
                      label={`${k.queriesRemaining} left`}
                      size="small"
                      color={k.queriesRemaining > 10 ? 'success' : 'warning'}
                      variant="outlined"
                    />
                  )}
                  {k.isExhausted && (
                    <Chip label="EXHAUSTED" color="error" size="small" />
                  )}
                </Box>
              </Box>
            ))}
          </RadioGroup>
        </FormControl>

        <Divider sx={{ my: 2.5 }} />

        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
          Add Extra Fallback API Key:
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            size="small"
            fullWidth
            placeholder="rxck_live_..."
            value={newKey}
            onChange={e => setNewKey(e.target.value)}
          />
          <Button
            variant="contained"
            startIcon={<AddCircleOutlinedIcon />}
            onClick={handleAddKey}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Add Key
          </Button>
        </Box>

        {errorMsg && (
          <Alert severity="error" sx={{ mt: 1.5 }}>
            {errorMsg}
          </Alert>
        )}
        {successMsg && (
          <Alert severity="success" sx={{ mt: 1.5 }}>
            {successMsg}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained">
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
};
