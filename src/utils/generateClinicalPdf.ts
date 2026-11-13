import { jsPDF } from 'jspdf';
import type { EvaluatedDrugPair, ExtractedClinicalSymptom } from '../types/rxcheck';

export interface GeneratePdfOptions {
  drugs: string[];
  results: EvaluatedDrugPair[];
  selectedSymptoms: ExtractedClinicalSymptom[];
}

export function generateClinicalSummaryPdf({
  drugs,
  results,
  selectedSymptoms,
}: GeneratePdfOptions): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 40;
  const contentWidth = pageWidth - marginX * 2;
  const bottomMargin = 45;

  let y = 40;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - bottomMargin) {
      doc.addPage();
      y = 40;
      drawPageHeaderCompact();
    }
  };

  const drawPageHeaderCompact = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text('RxCheck Clinical Consultation & Medication Review Summary', marginX, 25);
    doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - marginX, 25, { align: 'right' });
    doc.setDrawColor(220, 225, 230);
    doc.setLineWidth(0.5);
    doc.line(marginX, 30, pageWidth - marginX, 30);
  };

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(marginX, y, contentWidth, 54, 4, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('RxCheck Clinical Consultation Summary', marginX + 16, y + 24);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225); // slate-300
  const dateStr = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeStr = new Date().toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(
    `Generated: ${dateStr} at ${timeStr}  |  Source: RxCheck Dataset (api.rxcheck.dev)`,
    marginX + 16,
    y + 42
  );

  y += 70;

  // SECTION 1: Active Regimen
  checkPageBreak(50);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`1. EVALUATED PATIENT REGIMEN (${drugs.length} SUBSTANCES)`, marginX, y);
  y += 16;

  // Box for drugs
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(1);

  const drugLines = drugs.length > 0 ? drugs : ['No medications provided.'];
  const regimenBoxHeight = Math.max(30, drugLines.length * 16 + 12);

  checkPageBreak(regimenBoxHeight);
  doc.roundedRect(marginX, y, contentWidth, regimenBoxHeight, 4, 4, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);

  let drugY = y + 16;
  drugLines.forEach(drug => {
    doc.text(`\u2022  ${drug}`, marginX + 14, drugY);
    drugY += 16;
  });

  y += regimenBoxHeight + 20;

  // SECTION 2: Clinical Interactions
  checkPageBreak(60);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`2. CLINICAL INTERACTION EVALUATION (${results.length} PAIRS EVALUATED)`, marginX, y);
  y += 16;

  if (results.length === 0) {
    checkPageBreak(36);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(marginX, y, contentWidth, 32, 4, 4, 'F');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9.5);
    doc.setTextColor(100, 116, 139);
    doc.text('No pairwise interactions recorded in current dataset.', marginX + 14, y + 20);
    y += 44;
  } else {
    results.forEach((item, index) => {
      // Calculate height needed for this interaction card
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const sigLines = doc.splitTextToSize(
        `Clinical Significance: ${item.clinicalSignificance || 'No documented interaction in current dataset release.'}`,
        contentWidth - 28
      );
      const mgmtLines = item.management
        ? doc.splitTextToSize(`Management: ${item.management}`, contentWidth - 28)
        : [];

      const cardHeight = 32 + sigLines.length * 13 + (mgmtLines.length > 0 ? mgmtLines.length * 13 + 6 : 0) + 12;

      checkPageBreak(cardHeight + 10);

      // Card background & border
      const isMajor = item.severity === 'major';
      const isModerate = item.severity === 'moderate';

      if (isMajor) {
        doc.setFillColor(254, 242, 242); // red-50
        doc.setDrawColor(248, 113, 113); // red-400
      } else if (isModerate) {
        doc.setFillColor(255, 251, 235); // amber-50
        doc.setDrawColor(251, 191, 36); // amber-400
      } else {
        doc.setFillColor(248, 250, 252); // slate-50
        doc.setDrawColor(226, 232, 240); // slate-200
      }
      doc.setLineWidth(1);
      doc.roundedRect(marginX, y, contentWidth, cardHeight, 4, 4, 'FD');

      // Title & Severity Badge
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`${index + 1}.  ${item.drug1} + ${item.drug2}`, marginX + 14, y + 18);

      // Badge label
      const badgeText = isMajor
        ? 'MAJOR RISK'
        : isModerate
        ? 'MODERATE RISK'
        : item.status === 'no_record_found'
        ? 'NO RECORD'
        : 'EVALUATED';

      const badgeWidth = doc.getTextWidth(badgeText) + 14;
      const badgeX = pageWidth - marginX - badgeWidth - 12;

      if (isMajor) {
        doc.setFillColor(220, 38, 38);
        doc.setTextColor(255, 255, 255);
      } else if (isModerate) {
        doc.setFillColor(217, 119, 6);
        doc.setTextColor(255, 255, 255);
      } else {
        doc.setFillColor(148, 163, 184);
        doc.setTextColor(255, 255, 255);
      }
      doc.roundedRect(badgeX, y + 8, badgeWidth, 15, 3, 3, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text(badgeText, badgeX + 7, y + 19);

      // Text lines
      let textY = y + 33;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      doc.text(sigLines, marginX + 14, textY);
      textY += sigLines.length * 13;

      if (mgmtLines.length > 0) {
        textY += 4;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(180, 83, 9); // amber-700
        doc.text(mgmtLines, marginX + 14, textY);
      }

      y += cardHeight + 10;
    });
  }

  y += 10;

  // SECTION 3: Adverse Signs & Symptoms
  checkPageBreak(50);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('3. PATIENT-REPORTED ADVERSE SIGNS & SYMPTOMS', marginX, y);
  y += 16;

  if (selectedSymptoms.length === 0) {
    checkPageBreak(30);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(marginX, y, contentWidth, 28, 4, 4, 'FD');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('No adverse symptoms selected by patient.', marginX + 14, y + 17);
    y += 38;
  } else {
    selectedSymptoms.forEach(sym => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const snippetLines = doc.splitTextToSize(
        `"${sym.contextSnippet}"`,
        contentWidth - 28
      );
      const symHeight = 22 + snippetLines.length * 12;

      checkPageBreak(symHeight);
      doc.setFillColor(sym.isRedFlag ? 254 : 248, sym.isRedFlag ? 242 : 250, sym.isRedFlag ? 242 : 252);
      doc.setDrawColor(sym.isRedFlag ? 248 : 226, sym.isRedFlag ? 113 : 232, sym.isRedFlag ? 113 : 240);
      doc.roundedRect(marginX, y, contentWidth, symHeight, 4, 4, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(sym.isRedFlag ? 185 : 15, sym.isRedFlag ? 28 : 23, sym.isRedFlag ? 28 : 42);
      doc.text(
        `${sym.isRedFlag ? '[CRITICAL] ' : '\u2022 '} ${sym.symptomName} (Related to: ${sym.sourcePair})`,
        marginX + 14,
        y + 15
      );

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(snippetLines, marginX + 14, y + 28);

      y += symHeight + 8;
    });
  }

  y += 10;

  // SECTION 4: Discussion Checklist for Physician
  checkPageBreak(90);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('4. SUGGESTED DISCUSSION CHECKLIST FOR YOUR DOCTOR', marginX, y);
  y += 16;

  const questions = [
    'Are these medications safe to take simultaneously for my condition?',
    'Should any doses be spaced throughout the day to minimize peak concentrations?',
    'Are there safer alternative medications with lower interaction risks?',
    'What specific warning signs should prompt immediate medical evaluation?',
    'Do any lifestyle factors, alcohol, or supplements interfere with this regimen?',
  ];

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  const checklistHeight = questions.length * 18 + 12;
  checkPageBreak(checklistHeight);
  doc.roundedRect(marginX, y, contentWidth, checklistHeight, 4, 4, 'FD');

  let qY = y + 16;
  questions.forEach(q => {
    // Draw empty checkbox square
    doc.setDrawColor(100, 116, 139);
    doc.setLineWidth(1);
    doc.rect(marginX + 14, qY - 8, 9, 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text(q, marginX + 30, qY);
    qY += 18;
  });

  y += checklistHeight + 20;

  // DISCLAIMER FOOTER
  checkPageBreak(40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // slate-400
  const disclaimer =
    'Clinical Disclaimer: RxCheck provides interaction records from active medical datasets and does not replace professional clinical judgment. Coverage varies by dataset release. Always consult a qualified physician or licensed pharmacist before altering or initiating medication regimens.';
  const discLines = doc.splitTextToSize(disclaimer, contentWidth);
  doc.text(discLines, marginX, y);

  return doc;
}
