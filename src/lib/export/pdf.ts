import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { renderToBuffer } from '@react-pdf/renderer';
import { createElement } from 'react';
import type { Deal } from '@/lib/db/schema';
import type { PricingResult } from '@/lib/pricing/types';

const SHIFT4_BLUE = '#395542';
const ACCENT_TEAL = '#CF987E';
const LIGHT_GRAY = '#f3f4f6';
const BORDER_GRAY = '#d1d5db';
const TEXT_DARK = '#111827';
const TEXT_MUTED = '#6b7280';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 50,
    color: TEXT_DARK,
  },
  // Cover page
  coverPage: {
    fontFamily: 'Helvetica',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
  },
  coverLogo: {
    fontSize: 36,
    fontFamily: 'Helvetica-Bold',
    color: SHIFT4_BLUE,
    marginBottom: 8,
  },
  coverTagline: {
    fontSize: 12,
    color: TEXT_MUTED,
    marginBottom: 60,
  },
  coverTitle: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: SHIFT4_BLUE,
    marginBottom: 12,
  },
  coverMerchant: {
    fontSize: 18,
    color: TEXT_DARK,
    marginBottom: 8,
  },
  coverDate: {
    fontSize: 12,
    color: TEXT_MUTED,
    marginTop: 40,
  },
  coverDivider: {
    width: 80,
    height: 3,
    backgroundColor: ACCENT_TEAL,
    marginVertical: 30,
  },
  // Section styles
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: SHIFT4_BLUE,
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: ACCENT_TEAL,
  },
  paragraph: {
    fontSize: 10,
    lineHeight: 1.6,
    color: TEXT_DARK,
    marginBottom: 10,
  },
  // Table styles
  table: {
    marginVertical: 12,
    borderWidth: 1,
    borderColor: BORDER_GRAY,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: SHIFT4_BLUE,
    padding: 8,
  },
  tableHeaderText: {
    color: '#ffffff',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_GRAY,
  },
  tableRowAlt: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_GRAY,
    backgroundColor: LIGHT_GRAY,
  },
  tableCell: {
    fontSize: 9,
    flex: 1,
    color: TEXT_DARK,
  },
  tableCellBold: {
    fontSize: 9,
    flex: 1,
    fontFamily: 'Helvetica-Bold',
    color: TEXT_DARK,
  },
  // Highlight box
  highlightBox: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#6ee7b7',
    borderRadius: 4,
    padding: 12,
    marginVertical: 12,
  },
  highlightLabel: {
    fontSize: 9,
    color: TEXT_MUTED,
    marginBottom: 2,
  },
  highlightValue: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#059669',
  },
  highlightSub: {
    fontSize: 9,
    color: TEXT_MUTED,
    marginTop: 2,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: TEXT_MUTED,
  },
  // DCC box
  dccBox: {
    backgroundColor: '#f0fdfa',
    borderWidth: 1,
    borderColor: '#5eead4',
    borderRadius: 4,
    padding: 12,
    marginVertical: 12,
  },
  dccTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: ACCENT_TEAL,
    marginBottom: 8,
  },
  // Terms
  termsText: {
    fontSize: 8,
    lineHeight: 1.5,
    color: TEXT_MUTED,
    marginBottom: 4,
  },
  spacer: {
    height: 20,
  },
});

function formatEur(val: number): string {
  return `EUR ${val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

interface ProposalDocProps {
  deal: Deal;
  pricing: PricingResult;
}

function ProposalDocument({ deal, pricing }: ProposalDocProps) {
  const date = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const narrativeParagraphs = (deal.narrative || '').split('\n\n').filter(Boolean);

  return createElement(Document, {},
    // Cover page
    createElement(Page, { size: 'A4', style: styles.coverPage },
      createElement(Text, { style: styles.coverLogo }, 'BANYAN'),
      createElement(Text, { style: styles.coverTagline }, 'Payment Gateway Solutions'),
      createElement(View, { style: styles.coverDivider }),
      createElement(Text, { style: styles.coverTitle }, 'Commercial Proposal'),
      createElement(Text, { style: styles.coverMerchant }, deal.merchantName),
      createElement(Text, { style: styles.coverDate }, `Prepared: ${date}`),
      createElement(Text, { style: styles.coverDate }, deal.hotelGroup ? `Group: ${deal.hotelGroup}` : ''),
      createElement(View, { style: styles.footer },
        createElement(Text, {}, 'Banyan — Confidential'),
        createElement(Text, {}, date),
      ),
    ),

    // Content pages
    createElement(Page, { size: 'A4', style: styles.page },
      // Executive Summary
      createElement(Text, { style: styles.sectionTitle }, 'Executive Summary'),
      ...narrativeParagraphs.map((p, i) =>
        createElement(Text, { key: `p-${i}`, style: styles.paragraph }, p)
      ),

      createElement(View, { style: styles.spacer }),

      // Savings highlight (only when positive)
      ...(pricing.annualSavings > 0 ? [
        createElement(View, { key: 'savings-box', style: styles.highlightBox },
          createElement(Text, { style: styles.highlightLabel }, 'Projected Annual Savings'),
          createElement(Text, { style: styles.highlightValue }, formatEur(pricing.annualSavings)),
          createElement(Text, { style: styles.highlightSub }, `${pricing.savingsPercent.toFixed(1)}% reduction in processing costs`),
        ),
      ] : []),

      createElement(View, { style: styles.spacer }),

      // Current vs Proposed comparison
      createElement(Text, { style: styles.sectionTitle }, 'Current vs Proposed Comparison'),
      createElement(View, { style: styles.table },
        createElement(View, { style: styles.tableHeader },
          createElement(Text, { style: styles.tableHeaderText }, 'Metric'),
          createElement(Text, { style: styles.tableHeaderText }, 'Current'),
          createElement(Text, { style: styles.tableHeaderText }, 'Proposed'),
          createElement(Text, { style: styles.tableHeaderText }, 'Difference'),
        ),
        createElement(View, { style: styles.tableRow },
          createElement(Text, { style: styles.tableCellBold }, 'Blended Rate'),
          createElement(Text, { style: styles.tableCell }, deal.currentBlendedRate ? `${Number(deal.currentBlendedRate)} bps` : '--'),
          createElement(Text, { style: styles.tableCell }, `${pricing.adjustedRate} bps`),
          createElement(Text, { style: styles.tableCell }, deal.currentBlendedRate ? `${(Number(deal.currentBlendedRate) - pricing.adjustedRate).toFixed(0)} bps` : '--'),
        ),
        createElement(View, { style: styles.tableRowAlt },
          createElement(Text, { style: styles.tableCellBold }, 'Transaction Fee'),
          createElement(Text, { style: styles.tableCell }, deal.currentTxFee ? `EUR ${Number(deal.currentTxFee)}` : '--'),
          createElement(Text, { style: styles.tableCell }, `EUR ${pricing.proposedTxFee}`),
          createElement(Text, { style: styles.tableCell }, deal.currentTxFee ? `EUR ${(Number(deal.currentTxFee) - pricing.proposedTxFee).toFixed(4)}` : '--'),
        ),
        createElement(View, { style: styles.tableRow },
          createElement(Text, { style: styles.tableCellBold }, 'Monthly Fee'),
          createElement(Text, { style: styles.tableCell }, deal.currentMonthlyFee ? `EUR ${Number(deal.currentMonthlyFee)}` : '--'),
          createElement(Text, { style: styles.tableCell }, `EUR ${pricing.proposedMonthlyFee}`),
          createElement(Text, { style: styles.tableCell }, deal.currentMonthlyFee ? `EUR ${(Number(deal.currentMonthlyFee) - pricing.proposedMonthlyFee).toFixed(0)}` : '--'),
        ),
        createElement(View, { style: styles.tableRowAlt },
          createElement(Text, { style: styles.tableCellBold }, 'Annual Cost'),
          createElement(Text, { style: styles.tableCell }, formatEur(pricing.annualCostCurrent)),
          createElement(Text, { style: styles.tableCell }, formatEur(pricing.annualCostProposed)),
          createElement(Text, { style: styles.tableCell }, formatEur(pricing.annualSavings)),
        ),
      ),

      createElement(View, { style: styles.footer },
        createElement(Text, {}, 'Banyan — Confidential'),
        createElement(Text, {}, `Page 2 — ${date}`),
      ),
    ),

    // Pricing breakdown + DCC + Terms
    createElement(Page, { size: 'A4', style: styles.page },
      createElement(Text, { style: styles.sectionTitle }, 'Pricing Breakdown'),
      createElement(View, { style: styles.table },
        createElement(View, { style: styles.tableHeader },
          createElement(Text, { style: styles.tableHeaderText }, 'Component'),
          createElement(Text, { style: styles.tableHeaderText }, 'Detail'),
        ),
        createElement(View, { style: styles.tableRow },
          createElement(Text, { style: styles.tableCellBold }, 'Pricing Tier'),
          createElement(Text, { style: styles.tableCell }, `${pricing.tierName} (Tier ${pricing.tier})`),
        ),
        createElement(View, { style: styles.tableRowAlt },
          createElement(Text, { style: styles.tableCellBold }, 'Base Rate'),
          createElement(Text, { style: styles.tableCell }, `${pricing.baseRate} bps`),
        ),
        createElement(View, { style: styles.tableRow },
          createElement(Text, { style: styles.tableCellBold }, 'Adjusted Rate'),
          createElement(Text, { style: styles.tableCell }, `${pricing.adjustedRate} bps`),
        ),
        createElement(View, { style: styles.tableRowAlt },
          createElement(Text, { style: styles.tableCellBold }, 'Transaction Fee'),
          createElement(Text, { style: styles.tableCell }, `EUR ${pricing.proposedTxFee}`),
        ),
        createElement(View, { style: styles.tableRow },
          createElement(Text, { style: styles.tableCellBold }, 'Monthly Fee'),
          createElement(Text, { style: styles.tableCell }, `EUR ${pricing.proposedMonthlyFee}`),
        ),
        createElement(View, { style: styles.tableRowAlt },
          createElement(Text, { style: styles.tableCellBold }, 'Annual Volume'),
          createElement(Text, { style: styles.tableCell }, formatEur(Number(deal.annualVolume))),
        ),
      ),

      // Margin info
      createElement(View, { style: styles.spacer }),
      createElement(View, { style: styles.table },
        createElement(View, { style: styles.tableHeader },
          createElement(Text, { style: styles.tableHeaderText }, 'Margin Analysis'),
          createElement(Text, { style: styles.tableHeaderText }, 'Value'),
        ),
        createElement(View, { style: styles.tableRow },
          createElement(Text, { style: styles.tableCellBold }, 'Interchange Cost'),
          createElement(Text, { style: styles.tableCell }, formatEur(pricing.marginEstimate.interchangeCost)),
        ),
        createElement(View, { style: styles.tableRowAlt },
          createElement(Text, { style: styles.tableCellBold }, 'Scheme Fees'),
          createElement(Text, { style: styles.tableCell }, formatEur(pricing.marginEstimate.schemeFees)),
        ),
        createElement(View, { style: styles.tableRow },
          createElement(Text, { style: styles.tableCellBold }, 'Banyan Margin'),
          createElement(Text, { style: styles.tableCell }, `${formatEur(pricing.marginEstimate.margin)} (${pricing.marginEstimate.marginPercent.toFixed(1)}%)`),
        ),
      ),

      // DCC section
      ...(pricing.dccRevenue ? [
        createElement(View, { key: 'dcc-spacer', style: styles.spacer }),
        createElement(Text, { key: 'dcc-title', style: styles.sectionTitle }, 'DCC Revenue Projection'),
        createElement(View, { key: 'dcc-box', style: styles.dccBox },
          createElement(Text, { style: styles.dccTitle }, 'Dynamic Currency Conversion'),
          createElement(View, { style: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 } },
            createElement(Text, { style: { fontSize: 9, color: TEXT_MUTED } }, 'Eligible International Volume:'),
            createElement(Text, { style: { fontSize: 9, fontFamily: 'Helvetica-Bold' } }, formatEur(pricing.dccRevenue.eligibleVolume)),
          ),
          createElement(View, { style: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 } },
            createElement(Text, { style: { fontSize: 9, color: TEXT_MUTED } }, 'Projected Uptake:'),
            createElement(Text, { style: { fontSize: 9, fontFamily: 'Helvetica-Bold' } }, `${(pricing.dccRevenue.projectedUptake * 100).toFixed(0)}%`),
          ),
          createElement(View, { style: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 } },
            createElement(Text, { style: { fontSize: 9, color: TEXT_MUTED } }, 'Annual DCC Revenue:'),
            createElement(Text, { style: { fontSize: 9, fontFamily: 'Helvetica-Bold' } }, formatEur(pricing.dccRevenue.annualRevenue)),
          ),
          createElement(View, { style: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 } },
            createElement(Text, { style: { fontSize: 9, color: TEXT_MUTED } }, 'Merchant Share:'),
            createElement(Text, { style: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#059669' } }, formatEur(pricing.dccRevenue.revenueShareMerchant)),
          ),
          createElement(View, { style: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 } },
            createElement(Text, { style: { fontSize: 9, color: TEXT_MUTED } }, 'Shift4 Share:'),
            createElement(Text, { style: { fontSize: 9, fontFamily: 'Helvetica-Bold' } }, formatEur(pricing.dccRevenue.revenueShareShift4)),
          ),
          createElement(View, { style: { flexDirection: 'row', justifyContent: 'space-between' } },
            createElement(Text, { style: { fontSize: 9, color: TEXT_MUTED } }, 'Host Share:'),
            createElement(Text, { style: { fontSize: 9, fontFamily: 'Helvetica-Bold' } }, formatEur(pricing.dccRevenue.revenueShareHost)),
          ),
        ),
      ] : []),

      // Terms & conditions
      createElement(View, { style: styles.spacer }),
      createElement(Text, { style: styles.sectionTitle }, 'Terms & Conditions'),
      createElement(Text, { style: styles.termsText }, '1. This proposal is valid for 30 days from the date of issue.'),
      createElement(Text, { style: styles.termsText }, '2. Rates are based on the volume and card mix data provided. Actual rates may vary upon final underwriting review.'),
      createElement(Text, { style: styles.termsText }, '3. DCC revenue projections are estimates based on industry averages and are not guaranteed.'),
      createElement(Text, { style: styles.termsText }, '4. All fees are exclusive of applicable taxes and regulatory charges.'),
      createElement(Text, { style: styles.termsText }, '5. Contract terms and settlement schedules to be defined in the final merchant agreement.'),
      createElement(Text, { style: styles.termsText }, '6. Banyan reserves the right to adjust pricing based on risk assessment and compliance review.'),

      createElement(View, { style: styles.footer },
        createElement(Text, {}, 'Banyan — Confidential'),
        createElement(Text, {}, `Page 3 — ${date}`),
      ),
    ),
  );
}

export async function renderProposalPdf(deal: Deal): Promise<Buffer> {
  const pricing = deal.pricingResult as unknown as PricingResult;
  if (!pricing) {
    throw new Error('Deal has no pricing results');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = createElement(ProposalDocument, { deal, pricing }) as any;
  const buffer = await renderToBuffer(doc);
  return Buffer.from(buffer);
}
