import { jsPDF } from 'jspdf';
import type { EvaluatedDrugPair, ExtractedClinicalSymptom, ScrapedInteractionReport } from '../types/rxcheck';

export interface GeneratePdfOptions {
  drugs: string[];
  results: EvaluatedDrugPair[];
  selectedSymptoms: ExtractedClinicalSymptom[];
  drugsComReport?: ScrapedInteractionReport | null;
}

/**
 * Sanitizes text to clean ASCII characters to prevent UTF-16 spacing distortion in jsPDF.
 */
function cleanPdfText(str: string): string {
  if (!str) return '';
  return str
    .replace(/≤/g, '<= ')
    .replace(/≥/g, '>= ')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/•/g, '*')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .normalize('NFKD')
    .replace(/[^\x20-\x7E\r\n\t]/g, '');
}

export function generateClinicalSummaryPdf({
  drugs,
  results,
  selectedSymptoms,
  drugsComReport,
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

  let y = 38;

  const drawPageHeaderCompact = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text('Clinical Medication Review & Interaction Summary', marginX, 22);
    doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - marginX, 22, { align: 'right' });
    doc.setDrawColor(220, 225, 230);
    doc.setLineWidth(0.5);
    doc.line(marginX, 27, pageWidth - marginX, 27);
  };

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - bottomMargin) {
      doc.addPage();
      y = 38;
      drawPageHeaderCompact();
    }
  };

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(marginX, y, contentWidth, 52, 4, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text('Clinical Consultation & Interaction Summary', marginX + 16, y + 23);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
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
    `Generated: ${dateStr} at ${timeStr}  |  Medication Regimen Review`,
    marginX + 16,
    y + 40
  );

  y += 66;

  // SECTION 1: Active Regimen
  checkPageBreak(50);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`1. EVALUATED PATIENT REGIMEN (${drugs.length} SUBSTANCES)`, marginX, y);
  y += 6;

  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(1);

  const cleanDrugs = drugs.map(cleanPdfText);
  const drugLines = cleanDrugs.length > 0 ? cleanDrugs : ['No medications provided.'];
  const regimenBoxHeight = Math.max(28, drugLines.length * 15 + 10);

  checkPageBreak(regimenBoxHeight);
  doc.roundedRect(marginX, y, contentWidth, regimenBoxHeight, 4, 4, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);

  let drugY = y + 15;
  drugLines.forEach(drug => {
    doc.text(`*  ${drug}`, marginX + 14, drugY);
    drugY += 15;
  });

  y += regimenBoxHeight + 16;

  // SECTION 2: Drugs.com Comprehensive Clinical Advisories (if available)
  let sectionNum = 2;
  const dInteractions = drugsComReport?.drug_interactions || [];
  const dDuplications = drugsComReport?.duplications || [];
  const dFood = drugsComReport?.food_interactions || [];

  if (dInteractions.length > 0 || dDuplications.length > 0 || dFood.length > 0) {
    checkPageBreak(60);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(
      `${sectionNum}. DRUGS.COM CLINICAL ADVISORIES & PRECAUTIONS`,
      marginX,
      y
    );
    y += 6;

    // Drug-to-Drug Warnings from Drugs.com
    dInteractions.forEach((item, index) => {
      const cleanTitle = cleanPdfText(item.title);
      const cleanDesc = cleanPdfText(item.text);
      const isMajor = item.severity?.toLowerCase() === 'major';
      const isModerate = item.severity?.toLowerCase() === 'moderate';

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      const descLines = doc.splitTextToSize(cleanDesc, contentWidth - 28);
      const cardHeight = 28 + descLines.length * 12 + 6;

      checkPageBreak(cardHeight + 6);

      if (isMajor) {
        doc.setFillColor(254, 242, 242);
        doc.setDrawColor(248, 113, 113);
      } else if (isModerate) {
        doc.setFillColor(255, 251, 235);
        doc.setDrawColor(251, 191, 36);
      } else {
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
      }
      doc.setLineWidth(1);
      doc.roundedRect(marginX, y, contentWidth, cardHeight, 4, 4, 'FD');

      // Title & Badge
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`${index + 1}.  ${cleanTitle}`, marginX + 14, y + 16);

      const badgeText = isMajor ? 'MAJOR RISK' : isModerate ? 'MODERATE RISK' : 'MINOR RISK';
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      const bWidth = doc.getTextWidth(badgeText) + 14;
      const bX = pageWidth - marginX - bWidth - 12;

      if (isMajor) {
        doc.setFillColor(220, 38, 38);
        doc.setTextColor(255, 255, 255);
      } else if (isModerate) {
        doc.setFillColor(217, 119, 6);
        doc.setTextColor(255, 255, 255);
      } else {
        doc.setFillColor(14, 165, 233);
        doc.setTextColor(255, 255, 255);
      }
      doc.roundedRect(bX, y + 6, bWidth, 14, 3, 3, 'F');
      doc.text(badgeText, bX + bWidth / 2, y + 16, { align: 'center' });

      // Description
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text(descLines, marginX + 14, y + 29);

      y += cardHeight + 6;
    });

    // Therapeutic Duplications
    if (dDuplications.length > 0) {
      dDuplications.forEach(item => {
        const cleanTitle = cleanPdfText(item.title);
        const cleanDesc = cleanPdfText(item.text);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        const descLines = doc.splitTextToSize(cleanDesc, contentWidth - 28);
        const cardHeight = 26 + descLines.length * 12 + 4;

        checkPageBreak(cardHeight + 6);
        doc.setFillColor(255, 251, 235); // amber-50
        doc.setDrawColor(251, 191, 36); // amber-400
        doc.roundedRect(marginX, y, contentWidth, cardHeight, 4, 4, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(180, 83, 9);
        doc.text(`[DUPLICATION WARNING] ${cleanTitle}`, marginX + 14, y + 15);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        doc.text(descLines, marginX + 14, y + 27);

        y += cardHeight + 6;
      });
    }

    // Food, Alcohol & Dietary Precautions
    if (dFood.length > 0) {
      dFood.forEach(item => {
        const cleanTitle = cleanPdfText(item.title);
        const cleanDesc = cleanPdfText(item.text);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        const descLines = doc.splitTextToSize(cleanDesc, contentWidth - 28);
        const cardHeight = 26 + descLines.length * 12 + 4;

        checkPageBreak(cardHeight + 6);
        doc.setFillColor(240, 249, 255); // sky-50
        doc.setDrawColor(186, 230, 253); // sky-200
        doc.roundedRect(marginX, y, contentWidth, cardHeight, 4, 4, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(2, 132, 199);
        doc.text(`[FOOD & LIFESTYLE] ${cleanTitle}`, marginX + 14, y + 15);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        doc.text(descLines, marginX + 14, y + 27);

        y += cardHeight + 6;
      });
    }

    y += 12;
    sectionNum++;
  }

  // SECTION: Pairwise Interaction Evaluation
  checkPageBreak(60);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(
    `${sectionNum}. PAIRWISE CLINICAL INTERACTION EVALUATION (${results.length} PAIR${results.length === 1 ? '' : 'S'})`,
    marginX,
    y
  );
  y += 6;

  if (results.length === 0) {
    checkPageBreak(34);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(marginX, y, contentWidth, 30, 4, 4, 'FD');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('No pairwise interactions recorded for this regimen.', marginX + 14, y + 18);
    y += 40;
  } else {
    results.forEach((item, index) => {
      const cleanSignificance = cleanPdfText(
        item.clinicalSignificance || 'No documented interaction record.'
      );
      const cleanManagement = item.management ? cleanPdfText(item.management) : '';

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const sigLines = doc.splitTextToSize(
        `Clinical Significance: ${cleanSignificance}`,
        contentWidth - 28
      );

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      const mgmtLines = cleanManagement
        ? doc.splitTextToSize(`Management: ${cleanManagement}`, contentWidth - 28)
        : [];

      const cardHeight =
        30 + sigLines.length * 13 + (mgmtLines.length > 0 ? mgmtLines.length * 12.5 + 6 : 0) + 10;

      checkPageBreak(cardHeight + 8);

      const isMajor = item.severity === 'major';
      const isModerate = item.severity === 'moderate';

      if (isMajor) {
        doc.setFillColor(254, 242, 242);
        doc.setDrawColor(248, 113, 113);
      } else if (isModerate) {
        doc.setFillColor(255, 251, 235);
        doc.setDrawColor(251, 191, 36);
      } else {
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
      }
      doc.setLineWidth(1);
      doc.roundedRect(marginX, y, contentWidth, cardHeight, 4, 4, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      const cleanPairTitle = `${index + 1}.  ${cleanPdfText(item.drug1)} + ${cleanPdfText(item.drug2)}`;
      doc.text(cleanPairTitle, marginX + 14, y + 17);

      const badgeText = isMajor
        ? 'MAJOR RISK'
        : isModerate
        ? 'MODERATE RISK'
        : item.status === 'no_record_found'
        ? 'NO RECORD'
        : 'EVALUATED';

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      const textWidth = doc.getTextWidth(badgeText);
      const badgeWidth = textWidth + 16;
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
      doc.roundedRect(badgeX, y + 7, badgeWidth, 15, 3, 3, 'F');
      doc.text(badgeText, badgeX + badgeWidth / 2, y + 17.5, { align: 'center' });

      let textY = y + 32;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      doc.text(sigLines, marginX + 14, textY);
      textY += sigLines.length * 13;

      if (mgmtLines.length > 0) {
        textY += 4;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(180, 83, 9);
        doc.text(mgmtLines, marginX + 14, textY);
      }

      y += cardHeight + 8;
    });
  }

  y += 10;
  sectionNum++;

  // SECTION: Adverse Signs & Symptoms
  checkPageBreak(50);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`${sectionNum}. PATIENT-REPORTED ADVERSE SIGNS & SYMPTOMS`, marginX, y);
  y += 6;

  if (selectedSymptoms.length === 0) {
    checkPageBreak(28);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(marginX, y, contentWidth, 26, 4, 4, 'FD');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('No adverse symptoms selected by patient.', marginX + 14, y + 16);
    y += 34;
  } else {
    selectedSymptoms.forEach(sym => {
      const cleanSnippet = cleanPdfText(sym.contextSnippet);
      const cleanName = cleanPdfText(sym.symptomName);
      const cleanPair = cleanPdfText(sym.sourcePair);

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      const snippetLines = doc.splitTextToSize(`"${cleanSnippet}"`, contentWidth - 28);
      const symHeight = 22 + snippetLines.length * 12;

      checkPageBreak(symHeight);
      doc.setFillColor(sym.isRedFlag ? 254 : 248, sym.isRedFlag ? 242 : 250, sym.isRedFlag ? 242 : 252);
      doc.setDrawColor(sym.isRedFlag ? 248 : 226, sym.isRedFlag ? 113 : 232, sym.isRedFlag ? 113 : 240);
      doc.roundedRect(marginX, y, contentWidth, symHeight, 4, 4, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(sym.isRedFlag ? 185 : 15, sym.isRedFlag ? 28 : 23, sym.isRedFlag ? 28 : 42);
      doc.text(
        `${sym.isRedFlag ? '[CRITICAL] ' : '* '} ${cleanName} (Related to: ${cleanPair})`,
        marginX + 14,
        y + 14
      );

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(snippetLines, marginX + 14, y + 26);

      y += symHeight + 7;
    });
  }

  y += 10;
  sectionNum++;

  // SECTION: Discussion Checklist for Physician
  checkPageBreak(85);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`${sectionNum}. SUGGESTED DISCUSSION CHECKLIST FOR YOUR DOCTOR`, marginX, y);
  y += 6;

  const questions = [
    'Are these medications safe to take simultaneously for my condition?',
    'Should any doses be spaced throughout the day to minimize peak concentrations?',
    'Are there safer alternative medications with lower interaction risks?',
    'What specific warning signs should prompt immediate medical evaluation?',
    'Do any lifestyle factors, alcohol, or supplements interfere with this regimen?',
  ];

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  const checklistHeight = questions.length * 17 + 10;
  checkPageBreak(checklistHeight);
  doc.roundedRect(marginX, y, contentWidth, checklistHeight, 4, 4, 'FD');

  let qY = y + 15;
  questions.forEach(q => {
    doc.setDrawColor(100, 116, 139);
    doc.setLineWidth(1);
    doc.rect(marginX + 14, qY - 8, 9, 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(cleanPdfText(q), marginX + 30, qY);
    qY += 17;
  });

  y += checklistHeight + 16;

  // DISCLAIMER FOOTER
  checkPageBreak(35);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  const disclaimer =
    'Clinical Disclaimer: This report aggregates documented medical interaction records and safety warnings for consultation purposes. It does not replace professional clinical judgment. Always consult a qualified physician or licensed pharmacist before altering or initiating medication regimens.';
  const discLines = doc.splitTextToSize(cleanPdfText(disclaimer), contentWidth);
  doc.text(discLines, marginX, y);

  return doc;
}
