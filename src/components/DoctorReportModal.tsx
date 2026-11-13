import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Button,
  useTheme,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloseIcon from '@mui/icons-material/Close';
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

  const generateReportText = (): string => {
    const divider = '─'.repeat(72);
    const dateStr = new Date().toLocaleDateString();
    const timeStr = new Date().toLocaleTimeString();

    const sections: string[] = [
      'RxCheck Clinical Consultation & Medication Review Summary',
      `Generated: ${dateStr} at ${timeStr}  |  Source: RxCheck Medical Dataset`,
      divider,
      '',
      `1. CURRENT PATIENT REGIMEN (${drugs.length} item${drugs.length === 1 ? '' : 's'}):`,
      ...drugs.map(d => `   • ${d}`),
      '',
      `2. DETECTED CLINICAL INTERACTIONS (${results.length} pair${results.length === 1 ? '' : 's'} evaluated):`,
      ...(results.length === 0
        ? ['   No interaction records found in active dataset (does not establish safety).']
        : results.map((r, i) => {
            const lines = [
              `   [${i + 1}] ${r.drug1} + ${r.drug2}  [${r.severity.toUpperCase()}${r.isHighPriority ? ' - HIGH PRIORITY' : ''}]`,
              `       Clinical Significance: ${r.clinicalSignificance || 'None documented.'}`,
            ];
            if (r.management) {
              lines.push(`       Management Guidance:   ${r.management}`);
            }
            if (r.mechanism) {
              lines.push(`       Mechanism of Action:   ${r.mechanism}`);
            }
            return lines.join('\n');
          })),
      '',
      '3. PATIENT-REPORTED ADVERSE SIGNS & SYMPTOMS:',
      ...(selectedSymptoms.length === 0
        ? ['   None reported.']
        : selectedSymptoms.map(
            s => `   • ${s.symptomName} (${s.sourcePair})\n     Excerpt: "${s.contextSnippet}"`
          )),
      '',
      '4. SUGGESTED PRESCRIBER DISCUSSION CHECKLIST:',
      '   [ ] 1. Are these medications safe to take simultaneously for my clinical condition?',
      '   [ ] 2. Should any doses be spaced throughout the day to minimize peak concentrations?',
      '   [ ] 3. Are safer alternatives with lower interaction profiles available?',
      '   [ ] 4. What specific red-flag warning signs should prompt immediate emergency care?',
      '   [ ] 5. Do any lifestyle factors (alcohol, supplements) interfere with this regimen?',
      '',
      divider,
      'Clinical Disclaimer: RxCheck provides records from the current active dataset and does not replace professional clinical judgment. Always consult a licensed medical provider before making medication changes.',
    ];

    return sections.join('\n');
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(generateReportText());
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
            background: '#ffffff !important',
            color: '#000000 !important',
          },
        },
      }}
    >
      <style>
        {`
          @media print {
            @page {
              size: portrait;
              margin: 12mm 15mm;
            }
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .no-print {
              display: none !important;
            }
            .print-simple-text {
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
              font-size: 11px !important;
              line-height: 1.45 !important;
              color: #111827 !important;
              white-space: pre-wrap !important;
              word-break: break-word !important;
              padding: 0 !important;
              margin: 0 !important;
              background: transparent !important;
              border: none !important;
            }
          }
        `}
      </style>

      {/* Header: Vertically centered icon and text */}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 2,
          px: { xs: 2.5, md: 3 },
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <MedicalServicesIcon color="primary" sx={{ fontSize: 32 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: { xs: '1rem', sm: '1.15rem' }, lineHeight: 1.2 }}>
              Physician Consultation & Medication Review Summary
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.3, lineHeight: 1 }}>
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

      {/* Content: Simple clean text document that fits seamlessly on a single page */}
      <DialogContent sx={{ p: { xs: 2.5, md: 3 } }}>
        <Box
          component="pre"
          className="print-simple-text"
          sx={{
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            fontSize: '0.82rem',
            lineHeight: 1.5,
            p: 2.5,
            borderRadius: 2,
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.03)',
            border: `1px solid ${theme.palette.divider}`,
            color: 'text.primary',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            m: 0,
          }}
        >
          {generateReportText()}
        </Box>
      </DialogContent>

      {/* Actions */}
      <DialogActions className="no-print" sx={{ p: 2, px: 3, borderTop: `1px solid ${theme.palette.divider}`, justifyContent: 'space-between' }}>
        <Button startIcon={<ContentCopyIcon />} onClick={handleCopyText} color="inherit" size="small">
          Copy Text
        </Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" onClick={onClose} size="small">
            Close
          </Button>
          <Button variant="contained" startIcon={<PrintIcon />} onClick={handlePrint} size="small">
            Print Summary (PDF)
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};
