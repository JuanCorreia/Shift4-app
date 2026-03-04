import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  HeadingLevel,
  BorderStyle,
  AlignmentType,
  WidthType,
  ShadingType,
} from 'docx';
import type { Deal } from '@/lib/db/schema';
import type { PricingResult } from '@/lib/pricing/types';

const SHIFT4_BLUE = '395542';
const ACCENT_TEAL = 'CF987E';
const LIGHT_GRAY = 'f3f4f6';
const WHITE = 'ffffff';

function formatEur(val: number): string {
  return `EUR ${val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function headerCell(text: string, width?: number): TableCell {
  return new TableCell({
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    shading: { type: ShadingType.SOLID, color: SHIFT4_BLUE, fill: SHIFT4_BLUE },
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: true, color: WHITE, size: 18, font: 'Calibri' })],
        spacing: { before: 40, after: 40 },
      }),
    ],
  });
}

function dataCell(text: string, bold = false, shaded = false): TableCell {
  return new TableCell({
    shading: shaded ? { type: ShadingType.SOLID, color: LIGHT_GRAY, fill: LIGHT_GRAY } : undefined,
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold, size: 18, font: 'Calibri' })],
        spacing: { before: 40, after: 40 },
      }),
    ],
  });
}

function tableBorders() {
  const border = { style: BorderStyle.SINGLE, size: 1, color: 'd1d5db' };
  return { top: border, bottom: border, left: border, right: border };
}

export async function generateProposalDocx(deal: Deal): Promise<Buffer> {
  const pricing = deal.pricingResult as unknown as PricingResult;
  if (!pricing) {
    throw new Error('Deal has no pricing results');
  }

  const date = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const narrativeParagraphs = (deal.narrative || '').split('\n\n').filter(Boolean);

  // Cover page section
  const coverSection = {
    properties: {},
    children: [
      new Paragraph({ spacing: { before: 3000 } }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: 'SHIFT4', bold: true, size: 72, color: SHIFT4_BLUE, font: 'Calibri' }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: 'Payment Technology Solutions', size: 24, color: '6b7280', font: 'Calibri' }),
        ],
        spacing: { after: 600 },
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: '_______________', color: ACCENT_TEAL, size: 28 }),
        ],
        spacing: { after: 600 },
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: 'Commercial Proposal', bold: true, size: 56, color: SHIFT4_BLUE, font: 'Calibri' }),
        ],
        spacing: { after: 200 },
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: deal.merchantName, size: 36, font: 'Calibri' }),
        ],
        spacing: { after: 100 },
      }),
      ...(deal.hotelGroup
        ? [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: deal.hotelGroup, size: 24, color: '6b7280', font: 'Calibri' }),
              ],
            }),
          ]
        : []),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: `Prepared: ${date}`, size: 22, color: '6b7280', font: 'Calibri' }),
        ],
        spacing: { before: 400 },
      }),
    ],
  };

  // Content section
  const contentChildren: (Paragraph | Table)[] = [];

  // Executive Summary
  contentChildren.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: 'Executive Summary', bold: true, size: 32, color: SHIFT4_BLUE, font: 'Calibri' })],
      spacing: { after: 200 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: ACCENT_TEAL } },
    })
  );

  for (const p of narrativeParagraphs) {
    contentChildren.push(
      new Paragraph({
        children: [new TextRun({ text: p, size: 20, font: 'Calibri' })],
        spacing: { after: 200 },
      })
    );
  }

  // Savings highlight
  contentChildren.push(
    new Paragraph({ spacing: { before: 200 } }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Projected Annual Savings: ', size: 24, color: '6b7280', font: 'Calibri' }),
        new TextRun({ text: formatEur(pricing.annualSavings), bold: true, size: 36, color: '059669', font: 'Calibri' }),
        new TextRun({ text: `  (${pricing.savingsPercent.toFixed(1)}% reduction)`, size: 20, color: '6b7280', font: 'Calibri' }),
      ],
      spacing: { after: 400 },
    })
  );

  // Current vs Proposed comparison table
  contentChildren.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: 'Current vs Proposed Comparison', bold: true, size: 32, color: SHIFT4_BLUE, font: 'Calibri' })],
      spacing: { after: 200 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: ACCENT_TEAL } },
    })
  );

  const comparisonTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorders(),
    rows: [
      new TableRow({
        children: [
          headerCell('Metric', 30),
          headerCell('Current', 23),
          headerCell('Proposed', 23),
          headerCell('Difference', 24),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Blended Rate', true),
          dataCell(deal.currentBlendedRate ? `${Number(deal.currentBlendedRate)} bps` : '--'),
          dataCell(`${pricing.adjustedRate} bps`),
          dataCell(deal.currentBlendedRate ? `${(Number(deal.currentBlendedRate) - pricing.adjustedRate).toFixed(0)} bps` : '--'),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Transaction Fee', true, true),
          dataCell(deal.currentTxFee ? `EUR ${Number(deal.currentTxFee)}` : '--', false, true),
          dataCell(`EUR ${pricing.proposedTxFee}`, false, true),
          dataCell(deal.currentTxFee ? `EUR ${(Number(deal.currentTxFee) - pricing.proposedTxFee).toFixed(4)}` : '--', false, true),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Monthly Fee', true),
          dataCell(deal.currentMonthlyFee ? `EUR ${Number(deal.currentMonthlyFee)}` : '--'),
          dataCell(`EUR ${pricing.proposedMonthlyFee}`),
          dataCell(deal.currentMonthlyFee ? `EUR ${(Number(deal.currentMonthlyFee) - pricing.proposedMonthlyFee).toFixed(0)}` : '--'),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Annual Cost', true, true),
          dataCell(formatEur(pricing.annualCostCurrent), false, true),
          dataCell(formatEur(pricing.annualCostProposed), false, true),
          dataCell(formatEur(pricing.annualSavings), true, true),
        ],
      }),
    ],
  });
  contentChildren.push(comparisonTable);

  // Pricing breakdown
  contentChildren.push(
    new Paragraph({ spacing: { before: 400 } }),
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: 'Pricing Breakdown', bold: true, size: 32, color: SHIFT4_BLUE, font: 'Calibri' })],
      spacing: { after: 200 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: ACCENT_TEAL } },
    })
  );

  const pricingTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorders(),
    rows: [
      new TableRow({ children: [headerCell('Component', 50), headerCell('Detail', 50)] }),
      new TableRow({ children: [dataCell('Pricing Tier', true), dataCell(`${pricing.tierName} (Tier ${pricing.tier})`)] }),
      new TableRow({ children: [dataCell('Base Rate', true, true), dataCell(`${pricing.baseRate} bps`, false, true)] }),
      new TableRow({ children: [dataCell('Adjusted Rate', true), dataCell(`${pricing.adjustedRate} bps`)] }),
      new TableRow({ children: [dataCell('Transaction Fee', true, true), dataCell(`EUR ${pricing.proposedTxFee}`, false, true)] }),
      new TableRow({ children: [dataCell('Monthly Fee', true), dataCell(`EUR ${pricing.proposedMonthlyFee}`)] }),
      new TableRow({ children: [dataCell('Annual Volume', true, true), dataCell(formatEur(Number(deal.annualVolume)), false, true)] }),
    ],
  });
  contentChildren.push(pricingTable);

  // DCC section
  if (pricing.dccRevenue) {
    contentChildren.push(
      new Paragraph({ spacing: { before: 400 } }),
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: 'DCC Revenue Projection', bold: true, size: 32, color: SHIFT4_BLUE, font: 'Calibri' })],
        spacing: { after: 200 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: ACCENT_TEAL } },
      })
    );

    const dccTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: tableBorders(),
      rows: [
        new TableRow({ children: [headerCell('DCC Metric', 50), headerCell('Value', 50)] }),
        new TableRow({ children: [dataCell('Eligible International Volume', true), dataCell(formatEur(pricing.dccRevenue.eligibleVolume))] }),
        new TableRow({ children: [dataCell('Projected Uptake', true, true), dataCell(`${(pricing.dccRevenue.projectedUptake * 100).toFixed(0)}%`, false, true)] }),
        new TableRow({ children: [dataCell('Annual DCC Revenue', true), dataCell(formatEur(pricing.dccRevenue.annualRevenue))] }),
        new TableRow({ children: [dataCell('Merchant Revenue Share', true, true), dataCell(formatEur(pricing.dccRevenue.revenueShareMerchant), true, true)] }),
        new TableRow({ children: [dataCell('Shift4 Revenue Share', true), dataCell(formatEur(pricing.dccRevenue.revenueShareShift4))] }),
      ],
    });
    contentChildren.push(dccTable);
  }

  // Terms & Conditions
  contentChildren.push(
    new Paragraph({
      children: [new TextRun({ break: 1 })],
    }),
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: 'Terms & Conditions', bold: true, size: 32, color: SHIFT4_BLUE, font: 'Calibri' })],
      spacing: { after: 200 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: ACCENT_TEAL } },
    })
  );

  const terms = [
    'This proposal is valid for 30 days from the date of issue.',
    'Rates are based on the volume and card mix data provided. Actual rates may vary upon final underwriting review.',
    'DCC revenue projections are estimates based on industry averages and are not guaranteed.',
    'All fees are exclusive of applicable taxes and regulatory charges.',
    'Contract terms and settlement schedules to be defined in the final merchant agreement.',
    'Shift4 reserves the right to adjust pricing based on risk assessment and compliance review.',
  ];

  for (let i = 0; i < terms.length; i++) {
    contentChildren.push(
      new Paragraph({
        children: [new TextRun({ text: `${i + 1}. ${terms[i]}`, size: 16, color: '6b7280', font: 'Calibri' })],
        spacing: { after: 60 },
      })
    );
  }

  const doc = new Document({
    sections: [
      coverSection,
      {
        properties: {},
        children: contentChildren,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}
