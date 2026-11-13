import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Button,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloseIcon from '@mui/icons-material/Close';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import type { EvaluatedDrugPair, SymptomCorrelation } from '../types/rxcheck';

interface DoctorReportModalProps {
  open: boolean;
  onClose: () => void;
  drugs: string[];
  results: EvaluatedDrugPair[];
  correlations: SymptomCorrelation[];
}

export const DoctorReportModal: React.FC<DoctorReportModalProps> = ({
  open,
  onClose,
  drugs,
  results,
  correlations,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const lines = [
      '=== PATIENT MEDICATION & INTERACTION SUMMARY FOR CLINICIAN ===',
      `Date Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
      '',
      `CURRENT REGIMEN (${drugs.length} substances):`,
      ...drugs.map(d => `- ${d}`),
      '',
      'DETECTED CLINICAL INTERACTIONS:',
      ...results.map(
        r =>
          `[${r.severity.toUpperCase()}] ${r.drug1} + ${r.drug2}: ${r.clinicalSignificance || 'No recorded interaction'}\nManagement: ${r.management}`
      ),
      '',
      'REPORTED PATIENT SYMPTOMS:',
      ...(correlations.length > 0
        ? correlations.map(c => `[! ${c.severity.toUpperCase()}] ${c.symptomName} -> ${c.actionRequired}`)
        : ['No adverse symptoms reported.']),
      '',
      'CLINICAL DISCUSSION QUESTIONS FOR PRESCRIBER:',
      '1. Are any of the detected drug interactions safe to continue, or are dosage adjustments required?',
      '2. Are there alternative medications with lower interaction profiles for my condition?',
      '3. Do I require routine laboratory monitoring (e.g. INR, liver enzymes, potassium levels)?',
      '4. What specific symptoms should prompt me to stop taking this medication immediately?',
      '',
      'Disclaimer: RxCheck provides clinical dataset records and does not replace medical professional judgment.',
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    alert('Summary copied to clipboard!');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MedicalServicesIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Physician Consultation & Medication Review Summary
          </Typography>
        </Box>
        <Button onClick={onClose} color="inherit" size="small" startIcon={<CloseIcon />}>
          Close
        </Button>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 4 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Bring this summary to your doctor or pharmacist. Never discontinue, start, or modify doses of
          prescription medications without direct clinical guidance.
        </Alert>

        {/* Section 1: Regimen */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main', mb: 1 }}>
            1. Current Patient Regimen ({drugs.length} items):
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {drugs.map(d => (
              <Chip key={d} label={d} variant="outlined" sx={{ fontWeight: 600 }} />
            ))}
          </Box>
        </Box>

        <Divider sx={{ my: 2.5 }} />

        {/* Section 2: Interactions Found */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main', mb: 1.5 }}>
            2. Detected Potential Interactions:
          </Typography>
          {results.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No interactions evaluated yet.
            </Typography>
          ) : (
            <List disablePadding>
              {results.map((res, idx) => (
                <ListItem
                  key={idx}
                  disableGutters
                  sx={{
                    mb: 1.5,
                    p: 1.5,
                    borderRadius: 1.5,
                    bgcolor: 'action.hover',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.5, width: '100%' }}>
                    <Chip
                      label={res.severity.toUpperCase()}
                      size="small"
                      color={
                        res.severity === 'major'
                          ? 'error'
                          : res.severity === 'moderate'
                          ? 'warning'
                          : 'default'
                      }
                      sx={{ fontWeight: 800, fontSize: '0.68rem' }}
                    />
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                      {res.drug1} + {res.drug2}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    {res.clinicalSignificance || 'No matching interaction found in current dataset (safety unverified).'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    Recommended Management: {res.management}
                  </Typography>
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        <Divider sx={{ my: 2.5 }} />

        {/* Section 3: Reported Symptoms */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main', mb: 1 }}>
            3. Patient-Reported Symptoms:
          </Typography>
          {correlations.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              None selected or reported.
            </Typography>
          ) : (
            <List disablePadding>
              {correlations.map((c, i) => (
                <ListItem key={i} disableGutters sx={{ py: 0.5 }}>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ fontWeight: 700, color: c.severity === 'emergency' ? 'error.main' : 'text.primary' }}>
                        &bull; {c.symptomName}
                      </Typography>
                    }
                    secondary={c.alertMessage}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        <Divider sx={{ my: 2.5 }} />

        {/* Section 4: Questions to Ask */}
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main', mb: 1 }}>
            4. Suggested Discussion Checklist for Your Doctor:
          </Typography>
          <List disablePadding>
            {[
              'Are these medications safe to take simultaneously with my current health conditions?',
              'Should I take any of these pills at different times of the day to minimize interaction risks?',
              'Are there safer alternative medications or lower dosage options available?',
              'What specific warning signs should cause me to seek emergency care?',
              'Do any lifestyle factors (alcohol, supplements, caffeine) interfere with my prescriptions?',
            ].map((q, idx) => (
              <ListItem key={idx} disableGutters sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <CheckBoxIcon fontSize="small" color="primary" />
                </ListItemIcon>
                <ListItemText primary={<Typography variant="body2">{q}</Typography>} />
              </ListItem>
            ))}
          </List>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, justifyContent: 'space-between' }}>
        <Button startIcon={<ContentCopyIcon />} onClick={handleCopyText} color="inherit">
          Copy Text
        </Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" onClick={onClose}>
            Close
          </Button>
          <Button variant="contained" startIcon={<PrintIcon />} onClick={handlePrint}>
            Print Summary
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};
