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
import type { EvaluatedDrugPair, ExtractedClinicalSymptom, ScrapedInteractionReport } from '../types/rxcheck';
import { generateClinicalSummaryPdf } from '../utils/generateClinicalPdf';

interface DoctorReportModalProps {
  open: boolean;
  onClose: () => void;
  drugs: string[];
  results: EvaluatedDrugPair[];
  selectedSymptoms: ExtractedClinicalSymptom[];
  drugsComReport?: ScrapedInteractionReport | null;
}

export const DoctorReportModal: React.FC<DoctorReportModalProps> = ({
  open,
  onClose,
  drugs,
  results,
  selectedSymptoms,
  drugsComReport,
}) => {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);

  const handleDownloadPdf = () => {
    try {
      const doc = generateClinicalSummaryPdf({ drugs, results, selectedSymptoms, drugsComReport });
      doc.save('Clinical_Medication_Summary.pdf');
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    }
  };

  const handleOpenPdf = () => {
    try {
      const doc = generateClinicalSummaryPdf({ drugs, results, selectedSymptoms, drugsComReport });
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
      'Clinical Consultation & Medication Review Summary',
      `Generated: ${dateStr} at ${timeStr}`,
      divider,
      '',
      `1. CURRENT PATIENT REGIMEN (${drugs.length} item${drugs.length === 1 ? '' : 's'}):`,
      ...drugs.map(d => `   • ${d}`),
      '',
    ];

    // Drugs.com advisories if present
    const dInteractions = drugsComReport?.drug_interactions || [];
    const dDuplications = drugsComReport?.duplications || [];
    const dFood = drugsComReport?.food_interactions || [];

    if (dInteractions.length > 0 || dDuplications.length > 0 || dFood.length > 0) {
      sections.push('2. DRUGS.COM CLINICAL ADVISORIES & PRECAUTIONS:');
      if (dInteractions.length > 0) {
        sections.push('   Drug-to-Drug Interactions:');
        dInteractions.forEach((item, idx) => {
          sections.push(`   [${idx + 1}] ${item.title} (${item.severity?.toUpperCase() || 'NOTE'})`);
          sections.push(`       ${item.text}`);
        });
      }
      if (dDuplications.length > 0) {
        sections.push('   Therapeutic Duplications:');
        dDuplications.forEach(item => {
          sections.push(`   • ${item.title}: ${item.text}`);
        });
      }
      if (dFood.length > 0) {
        sections.push('   Food & Lifestyle Precautions:');
        dFood.forEach(item => {
          sections.push(`   • ${item.title}: ${item.text}`);
        });
      }
      sections.push('');
    }

    sections.push(
      `3. DETECTED PAIRWISE INTERACTIONS (${results.length} pair${results.length === 1 ? '' : 's'} evaluated):`,
      ...(results.length === 0
        ? ['   No pairwise interaction records documented.']
        : results.map((r, i) => {
            const lines = [
              `   [${i + 1}] ${r.drug1} + ${r.drug2}  [${r.severity.toUpperCase()}${r.isHighPriority ? ' - HIGH PRIORITY' : ''}]`,
              `       Clinical Significance: ${r.clinicalSignificance || 'None documented.'}`,
            ];
            if (r.management) {
              lines.push(`       Management Guidance: ${r.management}`);
            }
            return lines.join('\n');
          })),
      '',
      `4. PATIENT-REPORTED ADVERSE SYMPTOMS (${selectedSymptoms.length} reported):`,
      ...(selectedSymptoms.length === 0
        ? ['   None selected by patient.']
        : selectedSymptoms.map(
            s => `   • ${s.symptomName}${s.isRedFlag ? ' [CRITICAL/RED FLAG]' : ''} (Related to: ${s.sourcePair})\n     Context: "${s.contextSnippet}"`
          )),
      '',
      '5. SUGGESTED QUESTIONS FOR PHYSICIAN / PHARMACIST:',
      '   [ ] Are these medications safe to take simultaneously for my condition?',
      '   [ ] Should any doses be spaced throughout the day to minimize peak concentrations?',
      '   [ ] Are there safer alternative medications with lower interaction risks?',
      '   [ ] What specific warning signs should prompt immediate medical evaluation?',
      '   [ ] Do any lifestyle factors, alcohol, or supplements interfere with this regimen?',
      '',
      divider,
      'Clinical Disclaimer: This report aggregates documented medical interaction records and safety warnings for consultation purposes. It does not replace professional clinical judgment. Always consult a licensed healthcare provider before modifying any medication regimen.'
    );

    return sections.join('\n');
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(generateReportText());
      setCopied(true);
    } catch (err) {
      console.error('Failed to copy report text:', err);
    }
  };

  const criticalSymptoms = selectedSymptoms.filter(s => s.isRedFlag);
  const majorInteractions = results.filter(r => r.severity === 'major');
  const dInteractions = drugsComReport?.drug_interactions || [];

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        scroll="paper"
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
              maxHeight: '90vh',
              backgroundImage: 'none',
            },
          },
        }}
      >
        {/* Header */}
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 1.5,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <MedicalServicesIcon color="primary" sx={{ fontSize: 28 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                Doctor Consultation Summary
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.3, lineHeight: 1 }}>
                Formatted for physician or pharmacist consultation
              </Typography>
            </Box>
          </Box>
          <Button
            size="small"
            color="inherit"
            onClick={onClose}
            sx={{ minWidth: 36, p: 0.5, borderRadius: 2 }}
          >
            <CloseIcon fontSize="small" />
          </Button>
        </DialogTitle>

        {/* Content */}
        <DialogContent sx={{ p: 3 }}>
          {/* Quick Stats Pill Header */}
          <Box
            sx={{
              p: 2,
              mb: 3,
              borderRadius: 2,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              border: `1px solid ${theme.palette.divider}`,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Medications
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 800 }}>
                {drugs.length}
              </Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Interactions Found
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 800,
                  color: majorInteractions.length > 0 || dInteractions.length > 0 ? 'error.main' : 'text.primary',
                }}
              >
                {results.filter(r => r.status === 'interaction_found').length + dInteractions.length}
              </Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Critical Symptoms
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 800,
                  color: criticalSymptoms.length > 0 ? 'error.main' : 'text.primary',
                }}
              >
                {criticalSymptoms.length}
              </Typography>
            </Box>
          </Box>

          {/* Section 1: Regimen */}
          <Box sx={{ mb: 3 }}>
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
              1. Current Medication Regimen ({drugs.length}):
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {drugs.map((d, i) => (
                <Chip key={i} label={d} sx={{ fontWeight: 700 }} />
              ))}
            </Box>
          </Box>

          {/* Section 2: Drugs.com Findings if present */}
          {dInteractions.length > 0 && (
            <Box sx={{ mb: 3 }}>
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
                2. Drugs.com Clinical Advisories ({dInteractions.length}):
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {dInteractions.map((item, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      p: 1.8,
                      borderRadius: 2,
                      border: `1px solid ${theme.palette.divider}`,
                      bgcolor: 'action.hover',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>
                        {item.title}
                      </Typography>
                      <Chip
                        label={item.severity?.toUpperCase() || 'WARNING'}
                        size="small"
                        color={item.severity?.toLowerCase() === 'major' ? 'error' : 'warning'}
                        sx={{ fontWeight: 800, height: 22, fontSize: '0.7rem' }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem', lineHeight: 1.5 }}>
                      {item.text}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* Section 3: Detected Pairwise Interactions */}
          <Box sx={{ mb: 3 }}>
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
              {dInteractions.length > 0 ? '3.' : '2.'} Pairwise Clinical Interactions:
            </Typography>

            {results.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                No pairwise interaction records documented.
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
                        sx={{ fontWeight: 800, height: 22, fontSize: '0.7rem' }}
                      />
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>
                        {res.drug1} + {res.drug2}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem', mt: 0.5 }}>
                      {res.clinicalSignificance || 'No documented interaction.'}
                    </Typography>
                    {res.management && (
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          mt: 0.8,
                          fontWeight: 700,
                          color: 'warning.main',
                        }}
                      >
                        Guidance: {res.management}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          {/* Section 4: Patient Symptoms */}
          <Box sx={{ mb: 3 }}>
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
              {dInteractions.length > 0 ? '4.' : '3.'} Patient-Reported Adverse Symptoms ({selectedSymptoms.length}):
            </Typography>

            {selectedSymptoms.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                No adverse symptoms reported.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {selectedSymptoms.map((sym, i) => (
                  <Box
                    key={i}
                    sx={{
                      p: 1.5,
                      borderRadius: 1.5,
                      bgcolor: sym.isRedFlag ? 'rgba(239, 68, 68, 0.1)' : 'action.hover',
                      border: `1px solid ${sym.isRedFlag ? theme.palette.error.main : theme.palette.divider}`,
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 800, color: sym.isRedFlag ? 'error.main' : 'inherit' }}>
                      {sym.isRedFlag && '[CRITICAL] '}
                      {sym.symptomName}
                      <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        (Associated with: {sym.sourcePair})
                      </Typography>
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', display: 'block', mt: 0.3 }}>
                      "{sym.contextSnippet}"
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          {/* Section 5: Doctor Questions Checklist */}
          <Box>
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
              {dInteractions.length > 0 ? '5.' : '4.'} Discussion Checklist for Your Doctor:
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
              {[
                'Are these medications safe to take simultaneously for my condition?',
                'Should any doses be spaced throughout the day to minimize peak concentrations?',
                'Are there safer alternative medications with lower interaction risks?',
                'What specific warning signs should prompt immediate medical evaluation?',
                'Do any lifestyle factors, alcohol, or supplements interfere with this regimen?',
              ].map((q, idx) => (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                  <CheckBoxIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                    {q}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </DialogContent>

        {/* Actions */}
        <DialogActions
          sx={{
            px: 3,
            py: 2,
            borderTop: `1px solid ${theme.palette.divider}`,
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          <Button
            startIcon={<ContentCopyIcon />}
            variant="outlined"
            onClick={handleCopyText}
            sx={{ fontWeight: 700 }}
          >
            Copy Summary Text
          </Button>

          <Button
            startIcon={<PictureAsPdfIcon />}
            variant="contained"
            color="primary"
            onClick={handleOpenPdf}
            sx={{ fontWeight: 800 }}
          >
            Preview PDF
          </Button>

          <Button
            startIcon={<PictureAsPdfIcon />}
            variant="contained"
            color="secondary"
            onClick={handleDownloadPdf}
            sx={{ fontWeight: 800 }}
          >
            Download PDF
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={copied}
        autoHideDuration={3000}
        onClose={() => setCopied(false)}
        message="Doctor consultation summary copied to clipboard"
      />
    </>
  );
};
