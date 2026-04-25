import PDFDocument from 'pdfkit';
import type { ScoringResultPayload } from '../../module/scoring/scoring.types';

// ============================================================
// CONSTANTS
// ============================================================

const COLORS = {
  primary: '#1B2A4A', // deep navy — headings, strong text
  accent: '#C8932A', // gold — brand accent, borders
  bodyText: '#2D3748', // dark grey — body copy
  mutedText: '#718096', // muted grey — labels, captions
  green: '#1A6B3C',
  greenBg: '#F0FFF4',
  greenBorder: '#48BB78',
  amber: '#92610A',
  amberBg: '#FFFBEB',
  amberBorder: '#D69E2E',
  red: '#9B1C1C',
  redBg: '#FFF5F5',
  redBorder: '#FC8181',
  white: '#FFFFFF',
  lightGrey: '#F7FAFC',
  borderGrey: '#E2E8F0',
  pageWidth: 515, // usable width with 50pt margins on each side
} as const;

const PAGE_MARGIN = 50;

// ============================================================
// BAND HELPERS
// ============================================================

type BandColors = { text: string; bg: string; border: string; label: string };

const bandColors = (band: string): BandColors => {
  if (band === 'GREEN')
    return { text: COLORS.green, bg: COLORS.greenBg, border: COLORS.greenBorder, label: 'STRONG' };
  if (band === 'AMBER')
    return {
      text: COLORS.amber,
      bg: COLORS.amberBg,
      border: COLORS.amberBorder,
      label: 'MODERATE',
    };
  return { text: COLORS.red, bg: COLORS.redBg, border: COLORS.redBorder, label: 'CRITICAL' };
};

const bandEmoji = (band: string): string => {
  if (band === 'GREEN') return '✓';
  if (band === 'AMBER') return '!';
  return '✕';
};

// ============================================================
// LAYOUT HELPERS
// ============================================================

/**
 * Draws a filled rounded rectangle.
 * PDFKit doesn't have native rounded rects so we approximate
 * using bezier curves.
 */
const roundedRect = (
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fillColor: string,
  strokeColor?: string
) => {
  doc.save();
  doc
    .moveTo(x + r, y)
    .lineTo(x + w - r, y)
    .quadraticCurveTo(x + w, y, x + w, y + r)
    .lineTo(x + w, y + h - r)
    .quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    .lineTo(x + r, y + h)
    .quadraticCurveTo(x, y + h, x, y + h - r)
    .lineTo(x, y + r)
    .quadraticCurveTo(x, y, x + r, y)
    .closePath();

  if (strokeColor) {
    doc.fillAndStroke(fillColor, strokeColor);
  } else {
    doc.fill(fillColor);
  }
  doc.restore();
};

/** Draws a horizontal rule across the full page width. */
const hr = (
  doc: InstanceType<typeof PDFDocument>,
  y: number,
  color: string = COLORS.borderGrey
) => {
  doc
    .save()
    .moveTo(PAGE_MARGIN, y)
    .lineTo(PAGE_MARGIN + COLORS.pageWidth, y)
    .lineWidth(0.5)
    .strokeColor(color)
    .stroke()
    .restore();
};

// ============================================================
// SECTION BUILDERS
// ============================================================

const drawHeader = (doc: PDFKit.PDFDocument, businessName: string, date: string) => {
  // Navy header bar
  doc.rect(0, 0, doc.page.width, 90).fill(COLORS.primary);

  // Brand name top-left
  doc
    .fontSize(9)
    .fillColor(COLORS.accent)
    .text('BEAUVISION ASSOCIATES', PAGE_MARGIN, 20, { characterSpacing: 2 });

  // Report title
  doc.fontSize(22).fillColor(COLORS.white).text('Business Health Report', PAGE_MARGIN, 36);

  // Business name + date top-right
  doc
    .fontSize(9)
    .fillColor('#A0AEC0')
    .text(date, PAGE_MARGIN, 20, { align: 'right', width: COLORS.pageWidth });

  doc
    .fontSize(11)
    .fillColor(COLORS.white)
    .text(businessName, PAGE_MARGIN, 36, { align: 'right', width: COLORS.pageWidth });

  doc.moveDown(0);
  doc.y = 110;
};

const drawOverallScore = (
  doc: PDFKit.PDFDocument,
  totalScore: number,
  colorBand: string,
  hasAnyKnockout: boolean
) => {
  const colors = bandColors(colorBand);
  const boxY = doc.y;

  // Score card background
  roundedRect(doc, PAGE_MARGIN, boxY, COLORS.pageWidth, 80, 6, colors.bg, colors.border);

  // Score number — large and bold
  doc
    .fontSize(36)
    .fillColor(colors.text)
    .text(`${totalScore}`, PAGE_MARGIN + 20, boxY + 12, { continued: false, lineBreak: false });

  // /100 label
  doc
    .fontSize(14)
    .fillColor(colors.text)
    .text('/100', PAGE_MARGIN + 72, boxY + 26, { lineBreak: false });

  // Band pill
  roundedRect(doc, PAGE_MARGIN + 115, boxY + 22, 80, 24, 4, colors.border);
  doc
    .fontSize(10)
    .fillColor(COLORS.white)
    .text(colors.label, PAGE_MARGIN + 115, boxY + 28, {
      width: 80,
      align: 'center',
      lineBreak: false,
    });

  // Right side descriptor
  doc
    .fontSize(10)
    .fillColor(colors.text)
    .text('Overall Assessment Score', PAGE_MARGIN + 220, boxY + 14, {
      width: COLORS.pageWidth - 230,
      align: 'right',
    });
  doc
    .fontSize(9)
    .fillColor(COLORS.mutedText)
    .text('Based on 7 business pillars', PAGE_MARGIN + 220, boxY + 30, {
      width: COLORS.pageWidth - 230,
      align: 'right',
    });

  doc.y = boxY + 90;

  // Knockout warning banner
  if (hasAnyKnockout) {
    const warnY = doc.y;
    roundedRect(doc, PAGE_MARGIN, warnY, COLORS.pageWidth, 28, 4, '#FFF5F5', COLORS.redBorder);
    doc
      .fontSize(9)
      .fillColor(COLORS.red)
      .text(
        'CRITICAL ALERT  —  One or more critical risk factors were detected. Review the highlighted pillars immediately.',
        PAGE_MARGIN + 12,
        warnY + 9,
        { width: COLORS.pageWidth - 24, lineBreak: false }
      );
    doc.y = warnY + 38;
  }

  doc.moveDown(0.8);
};

const drawSectionTitle = (doc: PDFKit.PDFDocument, title: string) => {
  doc
    .fontSize(7)
    .fillColor(COLORS.accent)
    .text(title.toUpperCase(), PAGE_MARGIN, doc.y, { characterSpacing: 1.5 })
    .moveDown(0.3);

  hr(doc, doc.y, COLORS.accent);
  doc.moveDown(0.6);
};

const drawPillarRow = (
  doc: PDFKit.PDFDocument,
  pillarCode: string,
  pillarName: string,
  weightedScore: number,
  colorBand: string
) => {
  const colors = bandColors(colorBand);
  const rowY = doc.y;
  const barMaxW = 160;
  const barW = Math.round((weightedScore / 100) * barMaxW);

  // Left side — code badge
  roundedRect(doc, PAGE_MARGIN, rowY + 2, 30, 18, 3, COLORS.primary);
  doc
    .fontSize(7)
    .fillColor(COLORS.white)
    .text(pillarCode, PAGE_MARGIN, rowY + 7, { width: 30, align: 'center', lineBreak: false });

  // Pillar name
  doc
    .fontSize(10)
    .fillColor(COLORS.bodyText)
    .text(pillarName, PAGE_MARGIN + 38, rowY + 5, { lineBreak: false });

  // Score bar background
  roundedRect(doc, PAGE_MARGIN + 240, rowY + 7, barMaxW, 8, 4, COLORS.borderGrey);
  // Score bar fill
  if (barW > 0) {
    roundedRect(doc, PAGE_MARGIN + 240, rowY + 7, barW, 8, 4, colors.border);
  }

  // Score text
  doc
    .fontSize(10)
    .fillColor(colors.text)
    .text(`${weightedScore}`, PAGE_MARGIN + 412, rowY + 4, { lineBreak: false });

  doc
    .fontSize(7)
    .fillColor(COLORS.mutedText)
    .text('/100', PAGE_MARGIN + 432, rowY + 7, { lineBreak: false });

  // Band label
  doc
    .fontSize(7)
    .fillColor(colors.text)
    .text(bandEmoji(colorBand) + ' ' + colors.label, PAGE_MARGIN + 460, rowY + 6, {
      width: 55,
      align: 'right',
      lineBreak: false,
    });

  doc.y = rowY + 28;
};

const drawFinding = (
  doc: PDFKit.PDFDocument,
  finding: {
    questionText: string;
    selectedLabel: string;
    observation: string;
    recommendation: string;
    riskType: string;
  },
  isKnockout: boolean
) => {
  const findingY = doc.y;
  const leftBorder = isKnockout ? COLORS.redBorder : COLORS.amberBorder;
  const bgColor = isKnockout ? COLORS.redBg : COLORS.amberBg;

  // Card background
  roundedRect(doc, PAGE_MARGIN, findingY, COLORS.pageWidth, 1, 4, bgColor);
  // Left accent bar
  doc.rect(PAGE_MARGIN, findingY, 3, 1).fill(leftBorder);

  // We need to calculate height after text — draw text first then patch bg
  const textX = PAGE_MARGIN + 16;
  const textW = COLORS.pageWidth - 20;

  const startY = findingY + 10;

  // Question
  doc
    .fontSize(8)
    .fillColor(COLORS.mutedText)
    .text('QUESTION', textX, startY, { characterSpacing: 1 });

  doc
    .fontSize(9)
    .fillColor(COLORS.bodyText)
    .text(finding.questionText, textX, doc.y + 2, { width: textW })
    .moveDown(0.4);

  // Answer row
  doc
    .fontSize(8)
    .fillColor(COLORS.mutedText)
    .text(`SELECTED: `, textX, doc.y, { continued: true, lineBreak: false })
    .fillColor(COLORS.bodyText)
    .text(`Option ${finding.selectedLabel}  ·  ${finding.observation}`, { lineBreak: false })
    .moveDown(0.5);

  // Recommendation
  doc
    .fontSize(8)
    .fillColor(COLORS.mutedText)
    .text('RECOMMENDATION', textX, doc.y, { characterSpacing: 1 });

  doc
    .fontSize(9)
    .fillColor(COLORS.primary)
    .text(finding.recommendation, textX, doc.y + 2, { width: textW });

  const endY = doc.y + 10;

  // Now draw the background and left bar with correct height
  const cardH = endY - findingY;
  roundedRect(doc, PAGE_MARGIN, findingY, COLORS.pageWidth, cardH, 4, bgColor);
  doc.rect(PAGE_MARGIN, findingY, 3, cardH).fill(leftBorder);

  // Redraw text on top (PDF layers stack so we re-render over the bg)
  doc.y = findingY + 10;

  doc
    .fontSize(8)
    .fillColor(COLORS.mutedText)
    .text('QUESTION', textX, doc.y, { characterSpacing: 1 });

  doc
    .fontSize(9)
    .fillColor(COLORS.bodyText)
    .text(finding.questionText, textX, doc.y + 2, { width: textW })
    .moveDown(0.4);

  doc
    .fontSize(8)
    .fillColor(COLORS.mutedText)
    .text(`SELECTED: `, textX, doc.y, { continued: true, lineBreak: false })
    .fillColor(COLORS.bodyText)
    .text(`Option ${finding.selectedLabel}  ·  ${finding.observation}`)
    .moveDown(0.5);

  doc
    .fontSize(8)
    .fillColor(COLORS.mutedText)
    .text('RECOMMENDATION', textX, doc.y, { characterSpacing: 1 });

  doc
    .fontSize(9)
    .fillColor(COLORS.primary)
    .text(finding.recommendation, textX, doc.y + 2, { width: textW });

  doc.y = endY + 8;
};

const drawFooter = (doc: PDFKit.PDFDocument) => {
  const footerY = doc.page.height - 40;
  hr(doc, footerY - 8);

  doc
    .fontSize(8)
    .fillColor(COLORS.mutedText)
    .text(
      'PICA Assessment  ·  Beauvision Associates Ltd  ·  beauvisiongroup.com',
      PAGE_MARGIN,
      footerY,
      { align: 'left', width: COLORS.pageWidth / 2 }
    );

  doc
    .fontSize(8)
    .fillColor(COLORS.mutedText)
    .text(
      'This report is confidential and intended solely for the named business.',
      PAGE_MARGIN,
      footerY,
      { align: 'right', width: COLORS.pageWidth }
    );
};

// ============================================================
// MAIN EXPORT
// ============================================================

export async function generatePhase1PDF(
  result: ScoringResultPayload,
  businessName: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: PAGE_MARGIN,
      size: 'A4',
      bufferPages: true,
      info: {
        Title: `PICA Business Health Report — ${businessName}`,
        Author: 'Beauvision Associates Ltd',
        Subject: 'PICA Phase 1 Assessment',
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const dateStr = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    // ── 1. Header ──────────────────────────────────────────
    drawHeader(doc, businessName, dateStr);

    // ── 2. Overall Score ───────────────────────────────────
    drawOverallScore(doc, result.totalScore, result.colorBand, result.hasAnyKnockout);

    // ── 3. Pillar Summary Table ────────────────────────────
    drawSectionTitle(doc, 'Pillar Summary');

    // Sort: RED first, then AMBER, then GREEN — most critical top
    const sorted = [...result.pillarScores].sort((a, b) => {
      const order = { RED: 0, AMBER: 1, GREEN: 2 };
      return (
        (order[a.colorBand as keyof typeof order] ?? 0) -
        (order[b.colorBand as keyof typeof order] ?? 0)
      );
    });

    for (const pillar of sorted) {
      drawPillarRow(
        doc,
        pillar.pillarCode,
        pillar.pillarName,
        pillar.weightedScore,
        pillar.colorBand
      );
    }

    doc.moveDown(1);

    // ── 4. Detailed Findings ───────────────────────────────
    drawSectionTitle(doc, 'Key Findings & Recommendations');

    // Only show pillars that have risk/knockout findings (not green ones)
    const pillarsWithIssues = sorted.filter((p) => p.colorBand !== 'GREEN');

    if (pillarsWithIssues.length === 0) {
      doc
        .fontSize(10)
        .fillColor(COLORS.green)
        .text('Excellent — no critical or moderate findings detected across all pillars.', {
          align: 'center',
        });
    } else {
      for (const pillar of pillarsWithIssues) {
        // Check if we need a new page
        if (doc.y > doc.page.height - 160) {
          doc.addPage();
          doc.y = PAGE_MARGIN;
        }

        // Pillar heading
        const colors = bandColors(pillar.colorBand);
        doc
          .fontSize(11)
          .fillColor(colors.text)
          .text(`${pillar.pillarCode}  ·  ${pillar.pillarName}`, PAGE_MARGIN, doc.y)
          .moveDown(0.4);

        for (const finding of pillar.findings) {
          // Page break check before each finding
          if (doc.y > doc.page.height - 140) {
            doc.addPage();
            doc.y = PAGE_MARGIN;
          }

          drawFinding(doc, finding, finding.riskType === 'KNOCKOUT');
        }

        doc.moveDown(0.5);
      }
    }

    // ── 5. Next Steps CTA ──────────────────────────────────
    if (doc.y > doc.page.height - 120) {
      doc.addPage();
      doc.y = PAGE_MARGIN;
    }

    doc.moveDown(0.5);
    const ctaY = doc.y;
    roundedRect(doc, PAGE_MARGIN, ctaY, COLORS.pageWidth, 60, 6, COLORS.primary);

    doc
      .fontSize(11)
      .fillColor(COLORS.white)
      .text('Ready for a deeper assessment?', PAGE_MARGIN + 20, ctaY + 12);

    doc
      .fontSize(9)
      .fillColor('#A0AEC0')
      .text(
        'Unlock the full Phase 2 diagnostic to get a detailed action plan across all pillars.',
        PAGE_MARGIN + 20,
        ctaY + 28,
        { width: COLORS.pageWidth - 40 }
      );

    doc.y = ctaY + 70;

    // ── 6. Footer on all pages ─────────────────────────────
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      drawFooter(doc);
    }

    doc.end();
  });
}
