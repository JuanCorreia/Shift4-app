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
  TableOfContents,
  SectionType,
  Header,
  Footer,
} from 'docx';
import type { Deal } from '@/lib/db/schema';
import type { PricingResult } from '@/lib/pricing/types';
import { getTemplate } from './templates';

const WHITE = 'ffffff';
const BLACK = '000000';
const HEADER_BG = '1a1a1a';

function formatEur(val: number): string {
  return `€${val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function tableBorders() {
  const border = { style: BorderStyle.SINGLE, size: 1, color: 'd1d5db' };
  return { top: border, bottom: border, left: border, right: border };
}

// Shared Shift4 header bar (black bar with SHIFT4 text) for content pages
function shift4Header(): Header {
  return new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        shading: { type: ShadingType.SOLID, color: HEADER_BG, fill: HEADER_BG },
        children: [
          new TextRun({ text: '  S H I F T  4  ', bold: true, size: 22, color: WHITE, font: 'Calibri' }),
        ],
        spacing: { before: 0, after: 0 },
      }),
    ],
  });
}

function confidentialFooter(date: string): Footer {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: `CONFIDENTIAL  |  ${date}`,
            size: 14,
            color: '9ca3af',
            font: 'Calibri',
            italics: true,
          }),
        ],
      }),
    ],
  });
}

export async function generateProposalDocx(deal: Deal, templateSlug?: string): Promise<Buffer> {
  const pricing = deal.pricingResult as unknown as PricingResult;
  if (!pricing) {
    throw new Error('Deal has no pricing results');
  }

  const tpl = getTemplate(templateSlug);
  const PRIMARY = tpl.colors.primary;
  const ACCENT = tpl.colors.accent;
  const LIGHT_BG = tpl.colors.lightBg;

  function tHeaderCell(text: string, width?: number): TableCell {
    return new TableCell({
      width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
      shading: { type: ShadingType.SOLID, color: PRIMARY, fill: PRIMARY },
      children: [
        new Paragraph({
          children: [new TextRun({ text, bold: true, color: WHITE, size: 18, font: 'Calibri' })],
          spacing: { before: 40, after: 40 },
        }),
      ],
    });
  }

  function tDataCell(text: string, bold = false, shaded = false): TableCell {
    return new TableCell({
      shading: shaded ? { type: ShadingType.SOLID, color: LIGHT_BG, fill: LIGHT_BG } : undefined,
      children: [
        new Paragraph({
          children: [new TextRun({ text, bold, size: 18, font: 'Calibri' })],
          spacing: { before: 40, after: 40 },
        }),
      ],
    });
  }

  let chapterNum = 0;
  function chapterHeading(title: string): Paragraph {
    chapterNum++;
    return new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: `${chapterNum}. ${title}`, bold: true, size: 28, color: BLACK, font: 'Calibri' })],
      spacing: { after: 200 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'd1d5db' } },
    });
  }

  function subHeading(text: string): Paragraph {
    return new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun({ text, bold: true, size: 22, color: BLACK, font: 'Calibri' })],
      spacing: { before: 200, after: 100 },
    });
  }

  function bodyText(text: string): Paragraph {
    return new Paragraph({
      children: [new TextRun({ text, size: 20, font: 'Calibri', color: '333333' })],
      spacing: { after: 160 },
    });
  }

  function bulletItem(text: string): Paragraph {
    return new Paragraph({
      children: [
        new TextRun({ text: '•  ', size: 20, font: 'Calibri', color: PRIMARY }),
        new TextRun({ text, size: 20, font: 'Calibri', color: '333333' }),
      ],
      spacing: { after: 60 },
      indent: { left: 400 },
    });
  }

  const date = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const narrativeParagraphs = (deal.narrative || '').split('\n\n').filter(Boolean);
  const marketContextParagraphs = (deal.marketContext || '').split('\n\n').filter(Boolean);
  const merchantName = deal.merchantName;
  const footer = confidentialFooter(date);

  const contentPageProps = {
    type: SectionType.NEXT_PAGE,
    page: {
      margin: { top: 1200, bottom: 1000, left: 1200, right: 1200 },
    },
  };

  // ============================================================
  // COVER PAGE
  // ============================================================
  const coverSection = {
    properties: {},
    children: [
      new Paragraph({ spacing: { before: 2400 } }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: 'S H I F T  4', bold: true, size: 52, color: PRIMARY, font: 'Calibri' }),
        ],
        spacing: { after: 200 },
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: '_______________', color: ACCENT, size: 28 }),
        ],
        spacing: { after: 800 },
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: 'PAYMENT PROCESSING PROPOSAL', bold: true, size: 36, color: BLACK, font: 'Calibri' }),
        ],
        spacing: { after: 400 },
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: merchantName, bold: true, size: 44, color: PRIMARY, font: 'Calibri' }),
        ],
        spacing: { after: 100 },
      }),
      ...(deal.hotelGroup
        ? [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: deal.hotelGroup, size: 28, color: '6b7280', font: 'Calibri' }),
              ],
              spacing: { after: 200 },
            }),
          ]
        : []),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: date, size: 22, color: '6b7280', font: 'Calibri' }),
        ],
        spacing: { before: 600 },
      }),
    ],
  };

  // ============================================================
  // TABLE OF CONTENTS
  // ============================================================
  const tocSection = {
    properties: {
      ...contentPageProps,
    },
    headers: { default: shift4Header() },
    footers: { default: footer },
    children: [
      new Paragraph({
        children: [
          new TextRun({ text: 'Contents', bold: true, size: 36, color: BLACK, font: 'Calibri' }),
        ],
        spacing: { before: 400, after: 400 },
      }),
      new TableOfContents('Table of Contents', {
        hyperlink: true,
        headingStyleRange: '1-2',
      }),
      new Paragraph({
        spacing: { before: 600 },
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: 'Update this field in Word to refresh page numbers (right-click → Update Field).',
            size: 16,
            color: '9ca3af',
            font: 'Calibri',
            italics: true,
          }),
        ],
      }),
    ],
  };

  // ============================================================
  // ALL CONTENT (single flowing section — no page breaks between chapters)
  // ============================================================
  const content: (Paragraph | Table)[] = [];

  // --- Executive Summary ---
  content.push(chapterHeading('Executive Summary'));

  if (narrativeParagraphs.length > 0) {
    for (const p of narrativeParagraphs) {
      content.push(bodyText(p));
    }
  } else {
    content.push(
      new Paragraph({
        children: [new TextRun({ text: 'Narrative not yet generated.', size: 20, color: '9ca3af', font: 'Calibri', italics: true })],
        spacing: { after: 200 },
      })
    );
  }

  if (pricing.annualSavings > 0) {
    content.push(
      new Paragraph({ spacing: { before: 200 } }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Projected Annual Savings: ', size: 24, color: '6b7280', font: 'Calibri' }),
          new TextRun({ text: formatEur(pricing.annualSavings), bold: true, size: 36, color: '059669', font: 'Calibri' }),
          new TextRun({ text: `  (${pricing.savingsPercent.toFixed(1)}% reduction)`, size: 20, color: '6b7280', font: 'Calibri' }),
        ],
        spacing: { after: 200 },
      })
    );
  }

  // --- Proposed Commercial Model (IC++) ---
  content.push(
    new Paragraph({ spacing: { before: 400 } }),
    chapterHeading('Proposed Commercial Model (IC++)'),
    bodyText(`Shift4 proposes a transparent IC++ acquiring model, aligned with international hospitality benchmarks. It is a platform-level solution designed for ${merchantName}.`),
    subHeading('Acquiring Fees'),
    bulletItem(`Visa & Mastercard IC++ ${pricing.adjustedRate} bps`),
    bulletItem('Amex: TBC'),
    subHeading('Hardware Fees'),
    bulletItem('No fees — POS devices offered at no charge'),
    subHeading('SaaS / Gateway Fees'),
    bulletItem('No fees'),
    subHeading('Transaction Fee'),
    bulletItem(`€${pricing.proposedTxFee} per transaction`),
    subHeading('Monthly Fee'),
    bulletItem(`€${pricing.proposedMonthlyFee} per month`),
  );

  if (pricing.dccRevenue) {
    content.push(
      subHeading('DCC Fees'),
      bulletItem('Amount charged to cardholder: 3%'),
      bulletItem(`1% goes to ${merchantName}`),
    );
  }

  // --- Tokenization ---
  content.push(
    new Paragraph({ spacing: { before: 400 } }),
    chapterHeading('Tokenization: Security, Flexibility, and Guest Experience'),
    subHeading('What changes with tokenization'),
    bulletItem('Sensitive card data is replaced with secure tokens'),
    bulletItem('Removal of card data from hotel systems to aid with PCI Compliance'),
    bulletItem('Tokens can be reused safely for:'),
    new Paragraph({
      children: [new TextRun({ text: '     ○  Deposits', size: 20, font: 'Calibri', color: '333333' })],
      spacing: { after: 40 },
      indent: { left: 800 },
    }),
    new Paragraph({
      children: [new TextRun({ text: '     ○  No-shows and late cancellations', size: 20, font: 'Calibri', color: '333333' })],
      spacing: { after: 40 },
      indent: { left: 800 },
    }),
    new Paragraph({
      children: [new TextRun({ text: '     ○  Post-stay charges', size: 20, font: 'Calibri', color: '333333' })],
      spacing: { after: 40 },
      indent: { left: 800 },
    }),
    new Paragraph({
      children: [new TextRun({ text: '     ○  Refunds and adjustments', size: 20, font: 'Calibri', color: '333333' })],
      spacing: { after: 160 },
      indent: { left: 800 },
    }),
    subHeading(`Why this matters for ${merchantName}`),
    bulletItem('Reduced PCI exposure'),
    bulletItem('Lower operational and security risk'),
    bulletItem('Fewer failed or abandoned charges'),
    bulletItem('Smoother guest experience (no repeated card requests)'),
    new Paragraph({ spacing: { before: 200 } }),
    bodyText('Tokenization is particularly valuable in hospitality, where payments are often multi-stage and delayed.'),
  );

  // --- Recovering Uncollected Non-Refundable Revenue ---
  content.push(
    new Paragraph({ spacing: { before: 400 } }),
    chapterHeading('Recovering Uncollected Non-Refundable Revenue'),
    bodyText('In hospitality, a recurring and often underestimated source of revenue leakage comes from uncollected non-refundable reservations.'),
    bodyText('Even where rates are contractually non-refundable:'),
    bulletItem('Cards fail at capture'),
    bulletItem('Deposits are authorised but never collected'),
    bulletItem('No-show and late cancellation charges are missed'),
    bulletItem('Manual follow-up is inconsistent or deprioritised'),
    bulletItem('Staff lack secure access to card details later'),
    new Paragraph({ spacing: { before: 100 } }),
    bodyText('This loss is typically spread across many bookings, making it invisible but material.'),
    subHeading('How this payment proposal changes this'),
    bodyText(`With tokenization and PMS-embedded payments, ${merchantName} can:`),
    bulletItem('Securely store a tokenised payment reference at booking'),
    bulletItem('Automatically or systematically collect non-refundable reservations'),
    bulletItem('Collect no-show and late cancellation fees'),
    bulletItem('Retry failed captures without recontacting guests'),
    bulletItem('Do so without storing sensitive card data'),
    subHeading('Indicative recovery ranges'),
    bodyText('Based on hospitality benchmarks:'),
    bulletItem('Typical recovery uplift: 0.3% – 1.0% of advance / non-refundable booking value'),
    bulletItem(`On ${merchantName}'s scale, this can represent tens to low hundreds of thousands of euros annually, depending on booking mix and policies`),
    new Paragraph({ spacing: { before: 100 } }),
    bodyText('This is not new pricing or enforcement — it is the consistent collection of revenue already agreed by the guest.'),
  );

  // --- DCC Revenue Projection (conditional) ---
  if (pricing.dccRevenue) {
    content.push(
      new Paragraph({ spacing: { before: 400 } }),
      chapterHeading('Dynamic Currency Conversion (DCC): Revenue Upside'),
      subHeading(`Why DCC is relevant for ${merchantName}`),
      bulletItem('High volume of international and Non-EEA cards'),
      bulletItem('Guest profile where FX transparency matters'),
      bulletItem('Transaction values where DCC is meaningful'),
      new Paragraph({ spacing: { before: 100 } }),
      bodyText('Conservative illustrative assumptions:'),
    );

    const dccTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: tableBorders(),
      rows: [
        new TableRow({ children: [tHeaderCell('DCC Metric', 50), tHeaderCell('Value', 50)] }),
        new TableRow({ children: [tDataCell('Eligible International Volume', true), tDataCell(formatEur(pricing.dccRevenue.eligibleVolume))] }),
        new TableRow({ children: [tDataCell('Projected Uptake Volume', true, true), tDataCell(formatEur(pricing.dccRevenue.projectedUptake), false, true)] }),
        new TableRow({ children: [tDataCell('Annual DCC Revenue', true), tDataCell(formatEur(pricing.dccRevenue.annualRevenue))] }),
        new TableRow({ children: [tDataCell('Merchant Share', true, true), tDataCell(formatEur(pricing.dccRevenue.revenueShareMerchant), true, true)] }),
        new TableRow({ children: [tDataCell('Shift4 Share', true), tDataCell(formatEur(pricing.dccRevenue.revenueShareShift4))] }),
        new TableRow({ children: [tDataCell('Host Share', true, true), tDataCell(formatEur(pricing.dccRevenue.revenueShareHost), false, true)] }),
      ],
    });
    content.push(dccTable);
  }

  // --- Market Context (conditional — AI-generated) ---
  if (marketContextParagraphs.length > 0) {
    content.push(
      new Paragraph({ spacing: { before: 400 } }),
      chapterHeading('Market Context'),
    );
    for (const p of marketContextParagraphs) {
      content.push(bodyText(p));
    }
  }

  // --- Current vs Proposed Comparison ---
  content.push(
    new Paragraph({ spacing: { before: 400 } }),
    chapterHeading('Current vs Proposed Comparison'),
    bodyText(`Summary of the pricing impact for ${merchantName} based on the data provided.`),
  );

  const compTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorders(),
    rows: [
      new TableRow({
        children: [
          tHeaderCell('Metric', 30),
          tHeaderCell('Current', 23),
          tHeaderCell('Proposed', 23),
          tHeaderCell('Difference', 24),
        ],
      }),
      new TableRow({
        children: [
          tDataCell('Blended Rate', true),
          tDataCell(deal.currentBlendedRate ? `${Number(deal.currentBlendedRate)} bps` : '—'),
          tDataCell(`${pricing.adjustedRate} bps`),
          tDataCell(deal.currentBlendedRate ? `${(Number(deal.currentBlendedRate) - pricing.adjustedRate).toFixed(0)} bps` : '—'),
        ],
      }),
      new TableRow({
        children: [
          tDataCell('Transaction Fee', true, true),
          tDataCell(deal.currentTxFee ? `€${Number(deal.currentTxFee)}` : '—', false, true),
          tDataCell(`€${pricing.proposedTxFee}`, false, true),
          tDataCell(deal.currentTxFee ? `€${(Number(deal.currentTxFee) - pricing.proposedTxFee).toFixed(4)}` : '—', false, true),
        ],
      }),
      new TableRow({
        children: [
          tDataCell('Monthly Fee', true),
          tDataCell(deal.currentMonthlyFee ? `€${Number(deal.currentMonthlyFee)}` : '—'),
          tDataCell(`€${pricing.proposedMonthlyFee}`),
          tDataCell(deal.currentMonthlyFee ? `€${(Number(deal.currentMonthlyFee) - pricing.proposedMonthlyFee).toFixed(0)}` : '—'),
        ],
      }),
      new TableRow({
        children: [
          tDataCell('Annual Cost', true, true),
          tDataCell(formatEur(pricing.annualCostCurrent), false, true),
          tDataCell(formatEur(pricing.annualCostProposed), false, true),
          tDataCell(formatEur(pricing.annualSavings), true, true),
        ],
      }),
    ],
  });
  content.push(compTable);

  // --- Total Economics ---
  content.push(
    new Paragraph({ spacing: { before: 400 } }),
    chapterHeading('Total Economics: Beyond Headline Pricing'),
    bodyText('This proposal should be evaluated on total outcome. The combined impact of:'),
    bulletItem('Embedded visibility into the reservation lifecycle'),
    bulletItem('Tokenization and secure payment storage'),
    bulletItem('Recovery of uncollected non-refundable revenue'),
    bulletItem('DCC revenue from international guest base'),
    bulletItem('Reduced reconciliation effort and risk'),
    new Paragraph({ spacing: { before: 100 } }),
    bodyText('Creating a stronger long-term financial and operational position.'),
  );

  // --- Implementation & Risk Mitigation ---
  content.push(
    new Paragraph({ spacing: { before: 400 } }),
    chapterHeading('Implementation & Risk Mitigation'),
    bodyText('To ensure a controlled rollout:'),
    bulletItem('Phased deployment (pilot properties first)'),
    bulletItem('Clear operational and financial KPIs'),
    bulletItem('Price protection period'),
    new Paragraph({ spacing: { before: 100 } }),
    bodyText(`${merchantName} retains full control throughout the transition.`),
  );

  // --- Why This Makes Sense + Closing ---
  content.push(
    new Paragraph({ spacing: { before: 400 } }),
    chapterHeading(`Why This Makes Sense for ${merchantName}`),
    bodyText('This is not about changing a payment provider in isolation. It is about:'),
    bulletItem('Aligning payments with the PMS that runs the business'),
    bulletItem('Reducing operational leakage'),
    bulletItem('Unlocking new revenue from existing guest behaviour'),
    bulletItem('Future-proofing payments as part of the core platform'),
    new Paragraph({ spacing: { before: 400 } }),
    subHeading('Closing Statement'),
    bodyText(`For a hotel group with ${merchantName}'s scale and international profile, payments deliver the most value when they are embedded, secure, and revenue-generating — not fragmented or treated as a standalone function.`),
  );

  // --- Terms & Conditions ---
  content.push(
    new Paragraph({ spacing: { before: 400 } }),
    chapterHeading('Terms & Conditions'),
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
    content.push(
      new Paragraph({
        children: [new TextRun({ text: `${i + 1}. ${terms[i]}`, size: 16, color: '6b7280', font: 'Calibri' })],
        spacing: { after: 60 },
      })
    );
  }

  const contentSection = {
    properties: contentPageProps,
    headers: { default: shift4Header() },
    footers: { default: footer },
    children: content,
  };

  // ============================================================
  // ASSEMBLE DOCUMENT
  // ============================================================
  const sections = [
    coverSection,
    tocSection,
    contentSection,
  ];

  const doc = new Document({
    features: { updateFields: true },
    sections,
  });

  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}
