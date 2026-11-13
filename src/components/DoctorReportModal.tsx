import React, { useState } from 'react';
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
  useTheme,
  Snackbar,
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloseIcon from '@mui/icons-material/Close';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import type { EvaluatedDrugPair, ExtractedClinicalSymptom } from '../types/rxcheck';
import { generateClinicalSummaryPdf } from '../utils/generateClinicalPdf';

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
  const [copied, setCopied] = useState(false);

  const handleDownloadPdf = () => {
    try {
      const doc = generateClinicalSummaryPdf({ drugs, results, selectedSymptoms });
      doc.save('RxCheck_Clinical_Summary.pdf');
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    }
  };

  const handleOpenPdf = () => {
    try {
      const doc = generateClinicalSummaryPdf({ drugs, results, selectedSymptoms });
      const blobUrl = doc.output('bloburl');
      window.open(blobUrl, '_blank');
    } catch (err) {
      console.error('Failed to open PDF:', err);
    }
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
      'Clinical Disclaimer: RxCheck provides records from active medical datasets and does not replace professional clinical judgment. Always consult a licensed medical provider before making medication changes.',
    ];

    return sections.join('\n');
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(generateReportText());
    setCopied(true);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        {/* Dialog Header */}
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
            sx={{ color: 'text.secondary' }}
          >
            Close
          </Button>
        </DialogTitle>

        {/* Dialog Content: Rich UI view restored */}
        <DialogContent sx={{ p: { xs: 2.5, md: 3 } }}>
          {/* Section 1: Active Regimen */}
          <Box sx={{ mb: 2.5 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: 0.6,
                color: 'primary.main',
                display: 'block',
                mb: 1,
              }}
            >
              1. Evaluated Patient Regimen ({drugs.length} Substances):
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {drugs.map((drug, idx) => (
                <Chip
                  key={idx}
                  label={drug}
                  variant="outlined"
                  sx={{
                    fontWeight: 700,
                    bgcolor: 'action.hover',
                    borderRadius: 2,
                  }}
                />
              ))}
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Section 2: Clinical Interactions */}
          <Box sx={{ mb: 2.5 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: 0.6,
                color: 'primary.main',
                display: 'block',
                mb: 1,
              }}
            >
              2. Detected Clinical Interactions (from RxCheck Dataset):
            </Typography>

            {results.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                No pairwise interaction records documented in the current dataset.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {results.map((res, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      p: 1.8,
                      borderRadius: 2,
                      border: `1px solid ${
                        res.severity === 'major'
                          ? theme.palette.error.main
                          : res.severity === 'moderate'
                          ? theme.palette.warning.main
                          : theme.palette.divider
                      }`,
                      bgcolor:
                        res.severity === 'major'
                          ? theme.palette.mode === 'dark'
                            ? 'rgba(239, 68, 68, 0.08)'
                            : 'rgba(254, 242, 242, 0.8)'
                          : res.severity === 'moderate'
                          ? theme.palette.mode === 'dark'
                            ? 'rgba(245, 158, 11, 0.08)'
                            : 'rgba(255, 251, 235, 0.8)'
                          : 'action.hover',
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.5 }}>
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
                        sx={{ fontWeight: 800, fontSize: '0.65rem', height: 22 }}
                      />
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                        {res.drug1} + {res.drug2}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontSize: '0.82rem', mb: 0.5, lineHeight: 1.45 }}>
                      {res.clinicalSignificance || 'No matching interaction found in current dataset (safety unverified).'}
                    </Typography>
                    {res.management && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          fontWeight: 600,
                          display: 'block',
                          lineHeight: 1.35,
                        }}
                      >
                        <strong>Clinical Management:</strong> {res.management}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Section 3: Reported Symptoms */}
          <Box sx={{ mb: 2.5 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: 0.6,
                color: 'primary.main',
                display: 'block',
                mb: 1,
              }}
            >
              3. Patient-Reported Adverse Signs & Symptoms:
            </Typography>
            {selectedSymptoms.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', fontStyle: 'italic' }}>
                None reported.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                {selectedSymptoms.map((c, i) => (
                  <Box
                    key={i}
                    sx={{
                      p: 1.2,
                      borderRadius: 1.5,
                      border: `1px solid ${c.isRedFlag ? theme.palette.error.main : theme.palette.divider}`,
                      bgcolor: c.isRedFlag
                        ? theme.palette.mode === 'dark'
                          ? 'rgba(239, 68, 68, 0.1)'
                          : 'rgba(254, 242, 242, 0.8)'
                        : 'action.hover',
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.82rem' }}>
                      &bull; {c.symptomName} <span style={{ fontWeight: 400, opacity: 0.75 }}>({c.sourcePair})</span>
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', display: 'block', mt: 0.3 }}>
                      &ldquo;{c.contextSnippet}&rdquo;
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Section 4: Discussion Checklist */}
          <Box>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: 0.6,
                color: 'primary.main',
                display: 'block',
                mb: 1.2,
              }}
            >
              4. Suggested Discussion Checklist for Your Doctor:
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 }}>
              {[
                'Are these medications safe to take simultaneously for my condition?',
                'Should any doses be spaced throughout the day to minimize peak concentrations?',
                'Are there safer alternative medications with lower interaction profiles?',
                'What specific warning signs should prompt immediate emergency care?',
                'Do any lifestyle factors, alcohol, or supplements interfere with this regimen?',
              ].map((q, idx) => (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckBoxIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                  <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                    {q}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </DialogContent>

        {/* Dialog Actions */}
        <DialogActions
          sx={{
            p: 2,
            px: 3,
            borderTop: `1px solid ${theme.palette.divider}`,
            justifyContent: 'space-between',
          }}
        >
          <Button
            startIcon={<ContentCopyIcon />}
            onClick={handleCopyText}
            color="inherit"
            size="small"
          >
            Copy Text
          </Button>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<PictureAsPdfIcon />}
              onClick={handleOpenPdf}
            >
              View PDF
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<PictureAsPdfIcon />}
              onClick={handleDownloadPdf}
            >
              Download PDF
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={copied}
        autoHideDuration={3000}
        onClose={() => setCopied(false)}
        message="Summary text copied to clipboard!"
      />
    </>
  );
};
