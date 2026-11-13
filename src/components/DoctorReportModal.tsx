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
  Alert,
  useTheme,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloseIcon from '@mui/icons-material/Close';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import type { EvaluatedDrugPair, ExtractedClinicalSymptom } from '../types/rxcheck';

interface DoctorReportModalProps {
  open: boolean;
  onClose: () => void;
  drugs: string[];
  results: EvaluatedDrugPair[];
  selectedSymptoms: ExtractedClinicalSymptom[];
}

export const DoctorReportModal: React.FC<DoctorReportModalProps> = ({
  open,
  onClose,
  drugs,
  results,
  selectedSymptoms,
}) => {
  const theme = useTheme();

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const lines = [
      '=== PATIENT MEDICATION & INTERACTION SUMMARY FOR CLINICIAN ===',
      `Date Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
      '',
      `CURRENT REGIMEN (${drugs.length} substances evaluated via RxCheck):`,
      ...drugs.map(d => `- ${d}`),
      '',
      'DETECTED CLINICAL INTERACTIONS (from RxCheck Dataset):',
      ...results.map(
        r =>
          `[${r.severity.toUpperCase()}] ${r.drug1} + ${r.drug2}: ${r.clinicalSignificance || 'No recorded interaction'}\nManagement: ${r.management}`
      ),
      '',
      'REPORTED PATIENT SYMPTOMS:',
      ...(selectedSymptoms.length > 0
        ? selectedSymptoms.map(c => `[! ${c.isRedFlag ? 'RED FLAG' : 'OBSERVED'}] ${c.symptomName} (related to ${c.sourcePair}): "${c.contextSnippet}"`)
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
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{
        '@media print': {
          '& .MuiDialog-container': {
            display: 'block',
          },
          '& .MuiPaper-root': {
            boxShadow: 'none !important',
            border: 'none !important',
            margin: '0 !important',
            maxWidth: '100% !important',
            width: '100% !important',
          },
        },
      }}
    >
      {/* Print Stylesheet to hide non-print buttons and fit 1 page */}
      <style>
        {`
          @media print {
            @page {
              size: portrait;
              margin: 10mm 12mm;
            }
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              font-size: 11px !important;
            }
            .no-print {
              display: none !important;
            }
            .print-fit-page {
              padding: 0 !important;
              max-height: none !important;
              overflow: visible !important;
            }
          }
        `}
      </style>

      {/* Dialog Header */}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
          pt: 2,
          px: { xs: 2, md: 3 },
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <MedicalServicesIcon color="primary" />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem', lineHeight: 1.2 }}>
              Physician Consultation & Medication Review Summary
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Generated {new Date().toLocaleDateString()} &bull; RxCheck Clinical Dataset
            </Typography>
          </Box>
        </Box>

        <Button
          onClick={onClose}
          color="inherit"
          size="small"
          startIcon={<CloseIcon />}
          className="no-print"
          sx={{ color: 'text.secondary' }}
        >
          Close
        </Button>
      </DialogTitle>

      {/* Main Content: Compact to fit on 1 page */}
      <DialogContent className="print-fit-page" sx={{ p: { xs: 2, md: 2.5 } }}>
        <Alert severity="warning" variant="outlined" sx={{ mb: 2, py: 0.5, fontSize: '0.8rem', borderRadius: 1.5 }}>
          Bring this report to your doctor or pharmacist. Never stop, start, or alter prescription medications without direct clinical guidance.
        </Alert>

        {/* Section 1: Regimen */}
        <Box sx={{ mb: 1.8 }}>
          <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: 'primary.main', display: 'block', mb: 0.5 }}>
            1. Current Patient Regimen ({drugs.length} item{drugs.length === 1 ? '' : 's'}):
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
            {drugs.map(d => (
              <Chip key={d} label={d} size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.75rem', height: 24 }} />
            ))}
          </Box>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Section 2: Interactions Found */}
        <Box sx={{ mb: 1.8 }}>
          <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: 'primary.main', display: 'block', mb: 0.8 }}>
            2. Detected Potential Interactions (RxCheck Active Dataset):
          </Typography>
          {results.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
              No interactions evaluated yet.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {results.map((res, idx) => (
                <Box
                  key={idx}
                  sx={{
                    p: 1.2,
                    borderRadius: 1.5,
                    border: `1px solid ${theme.palette.divider}`,
                    bgcolor: 'action.hover',
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.3 }}>
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
                      sx={{ fontWeight: 800, fontSize: '0.65rem', height: 20 }}
                    />
                    <Typography variant="body2" sx={{ fontWeight: 800, fontSize: '0.85rem' }}>
                      {res.drug1} + {res.drug2}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', mb: 0.3, lineHeight: 1.4 }}>
                    {res.clinicalSignificance || 'No matching interaction found in current dataset (safety unverified).'}
                  </Typography>
                  {res.management && (
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', lineHeight: 1.3 }}>
                      <strong>Management:</strong> {res.management}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Section 3: Reported Symptoms */}
        <Box sx={{ mb: 1.8 }}>
          <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: 'primary.main', display: 'block', mb: 0.5 }}>
            3. Patient-Reported Adverse Signs / Symptoms:
          </Typography>
          {selectedSymptoms.length === 0 ? (
            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              None selected or reported.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {selectedSymptoms.map((c, i) => (
                <Typography key={i} variant="caption" sx={{ display: 'block', lineHeight: 1.3 }}>
                  <strong>&bull; {c.symptomName}</strong> ({c.sourcePair}): &ldquo;{c.contextSnippet}&rdquo;
                </Typography>
              ))}
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Section 4: Questions to Ask */}
        <Box>
          <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: 'primary.main', display: 'block', mb: 0.5 }}>
            4. Suggested Discussion Checklist for Your Doctor:
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 0.6 }}>
            {[
              'Are these medications safe to take simultaneously?',
              'Should I take any pills at different times of day?',
              'Are there safer alternative medications available?',
              'What specific warning signs warrant emergency care?',
              'Do any lifestyle factors interfere with my prescriptions?',
            ].map((q, idx) => (
              <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <CheckBoxIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                <Typography variant="caption" sx={{ fontSize: '0.78rem' }}>{q}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </DialogContent>

      {/* Dialog Footer Actions: Hidden in Print */}
      <DialogActions className="no-print" sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}`, justifyContent: 'space-between' }}>
        <Button startIcon={<ContentCopyIcon />} onClick={handleCopyText} color="inherit" size="small">
          Copy Text
        </Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" onClick={onClose} size="small">
            Close
          </Button>
          <Button variant="contained" startIcon={<PrintIcon />} onClick={handlePrint} size="small">
            Print Summary
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};
