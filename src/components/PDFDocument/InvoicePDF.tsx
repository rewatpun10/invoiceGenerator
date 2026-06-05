import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from '@react-pdf/renderer'
import type { Invoice, Contractor } from '../../types/invoice'
import { calcTotals, calcTotalHours } from '../../utils/calculations'
import { formatCurrency, formatDate, getInitials, paymentTermsLabel } from '../../utils/formatters'

function resolveTermsLabel(issuedDate: string, dueDate: string): string {
  if (!issuedDate || !dueDate) return 'Net 14'
  const diff = Math.round(
    (new Date(dueDate).getTime() - new Date(issuedDate).getTime()) / (1000 * 60 * 60 * 24)
  )
  const preset = [7, 14, 21, 30, 60].find((d) => d === diff)
  return preset !== undefined ? `Net ${preset}` : paymentTermsLabel(issuedDate, dueDate)
}

const NAVY = '#042C53'
const SLATE = '#5F5E5A'
const LIGHT = '#F1EFE8'
const BORDER = '#D3D1C7'
const AMBER_BG = '#FAEEDA'
const AMBER_TXT = '#854F0B'
const BLACK = '#2C2C2A'
const WHITE = '#FFFFFF'

const mm = (n: number) => n * 2.8346

const styles = StyleSheet.create({
  page: {
    paddingTop: mm(18),
    paddingBottom: mm(18),
    paddingLeft: mm(18),
    paddingRight: mm(18),
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: BLACK,
    backgroundColor: WHITE,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  initialsBox: {
    width: 28,
    height: 28,
    backgroundColor: NAVY,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: { color: WHITE, fontSize: 11, fontFamily: 'Helvetica-Bold' },
  contractorName: { fontFamily: 'Helvetica-Bold', fontSize: 10, color: BLACK, marginBottom: 2 },
  contractorMeta: { fontSize: 8, color: SLATE, marginBottom: 1 },
  headerRight: { alignItems: 'flex-end' },
  invoiceTitle: { fontSize: 24, fontFamily: 'Helvetica-Bold', color: NAVY },
  invoiceNumber: { fontSize: 9, color: SLATE, marginTop: 3 },
  dueBadge: {
    marginTop: 6,
    backgroundColor: AMBER_BG,
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  dueBadgeText: { fontSize: 8, color: AMBER_TXT, fontFamily: 'Helvetica-Bold' },

  // HR
  hr: { borderTopWidth: 0.5, borderTopColor: BORDER, marginBottom: 14 },
  hrSmall: { borderTopWidth: 0.5, borderTopColor: BORDER, marginBottom: 0 },

  // 3-column bill-to / payment / meta row
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 16,
  },
  infoCol: { flex: 1 },
  infoColRight: { alignItems: 'flex-end' },

  label: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: SLATE,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  clientName: { fontFamily: 'Helvetica-Bold', fontSize: 10, color: BLACK },
  clientEmail: { fontSize: 8, color: SLATE, marginTop: 1 },
  metaValue: { fontSize: 9, color: BLACK, marginBottom: 1 },
  payText: { fontSize: 9, color: BLACK, marginBottom: 1 },

  // Table
  table: { width: '100%' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: NAVY },
  tableHeaderCell: {
    paddingVertical: 6,
    paddingHorizontal: 6,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: WHITE,
  },
  tableHeaderCellRight: {
    paddingVertical: 6,
    paddingHorizontal: 6,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: WHITE,
    textAlign: 'right',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  tableCell: { paddingVertical: 6, paddingHorizontal: 6, fontSize: 8, color: BLACK },
  tableCellRight: { paddingVertical: 6, paddingHorizontal: 6, fontSize: 8, color: BLACK, textAlign: 'right' },

  // Totals
  totalsWrapper: { alignItems: 'flex-end', marginTop: 14 },
  totalsBlock: { width: '36%' },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  totalsLabel: { fontSize: 8, color: SLATE },
  totalsValue: { fontSize: 8, color: SLATE },
  totalsDivider: { borderTopWidth: 0.5, borderTopColor: BORDER, marginBottom: 5, marginTop: 2 },
  grandTotalLabel: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: BLACK },
  grandTotalValue: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: BLACK },

})

const COLS: [string, string, 'left' | 'right'][] = [
  ['Date', '14%', 'left'],
  ['Project', '17%', 'left'],
  ['Description', '33%', 'left'],
  ['Qty', '7%', 'right'],
  ['Unit', '7%', 'left'],
  ['Rate', '11%', 'right'],
  ['Amount', '11%', 'right'],
]

interface Props {
  invoice: Invoice
  contractor: Contractor
}

export function InvoicePDF({ invoice, contractor }: Props) {
  const totals = calcTotals(invoice)
  const totalHrs = calcTotalHours(invoice)
  const initials = getInitials(contractor.name || 'YN')
  const terms = resolveTermsLabel(invoice.issuedDate, invoice.dueDate)
  const hasPaymentDetails = contractor.bankName || contractor.bsb || contractor.accountNumber

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.initialsBox}>
              <Text style={styles.initialsText}>{initials}</Text>
            </View>
            <View>
              <Text style={styles.contractorName}>{contractor.name || 'Your Name'}</Text>
              {contractor.abn ? <Text style={styles.contractorMeta}>ABN {contractor.abn}</Text> : null}
              {contractor.email ? <Text style={styles.contractorMeta}>{contractor.email}</Text> : null}
              {contractor.phone ? <Text style={styles.contractorMeta}>{contractor.phone}</Text> : null}
              {contractor.location ? <Text style={styles.contractorMeta}>{contractor.location}</Text> : null}
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.invoiceTitle}>Invoice</Text>
            <Text style={styles.invoiceNumber}>{invoice.number}</Text>
            {invoice.dueDate ? (
              <View style={styles.dueBadge}>
                <Text style={styles.dueBadgeText}>Due {formatDate(invoice.dueDate)}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* HR */}
        <View style={styles.hr} />

        {/* 3-COLUMN: BILLED TO | PAYMENT DETAILS | ISSUED / TERMS */}
        <View style={styles.infoRow}>
          {/* Left: Billed To */}
          <View style={styles.infoCol}>
            <Text style={styles.label}>Billed To</Text>
            <Text style={styles.clientName}>{invoice.client.name || 'Client Name'}</Text>
            {invoice.client.email ? (
              <Text style={styles.clientEmail}>{invoice.client.email}</Text>
            ) : null}
          </View>

          {/* Centre: Payment Details */}
          <View style={styles.infoCol}>
            <Text style={styles.label}>Payment Details</Text>
            {hasPaymentDetails ? (
              <>
                {contractor.bankName ? <Text style={styles.payText}>{contractor.bankName}</Text> : null}
                {contractor.bsb ? <Text style={styles.payText}>BSB: {contractor.bsb}</Text> : null}
                {contractor.accountNumber ? <Text style={styles.payText}>Acc: {contractor.accountNumber}</Text> : null}
              </>
            ) : (
              <Text style={[styles.payText, { color: SLATE }]}>—</Text>
            )}
            {invoice.note ? (
              <Text style={[styles.payText, { color: SLATE, marginTop: 5, lineHeight: 1.5 }]}>
                Note: {invoice.note}
              </Text>
            ) : null}
          </View>

          {/* Right: Issued + Terms */}
          <View style={styles.infoColRight}>
            <Text style={styles.label}>Issued</Text>
            <Text style={[styles.metaValue, { marginBottom: 8 }]}>
              {formatDate(invoice.issuedDate)}
            </Text>
            <Text style={styles.label}>Payment Terms</Text>
            <Text style={styles.metaValue}>{terms}</Text>
          </View>
        </View>

        {/* HR */}
        <View style={styles.hrSmall} />

        {/* LINE ITEMS TABLE */}
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            {COLS.map(([label, width, align]) => (
              <Text
                key={label}
                style={[
                  align === 'right' ? styles.tableHeaderCellRight : styles.tableHeaderCell,
                  { width },
                ]}
              >
                {label}
              </Text>
            ))}
          </View>
          {invoice.lineItems.map((item, idx) => (
            <View
              key={item.id}
              style={[styles.tableRow, { backgroundColor: idx % 2 === 0 ? WHITE : LIGHT }]}
            >
              <Text style={[styles.tableCell, { width: '14%' }]}>{formatDate(item.date)}</Text>
              <Text style={[styles.tableCell, { width: '17%' }]}>{item.project || '—'}</Text>
              <Text style={[styles.tableCell, { width: '33%' }]}>{item.description || '—'}</Text>
              <Text style={[styles.tableCellRight, { width: '7%' }]}>{item.qty}</Text>
              <Text style={[styles.tableCell, { width: '7%' }]}>{item.unit}</Text>
              <Text style={[styles.tableCellRight, { width: '11%' }]}>
                {formatCurrency(item.rate, invoice.currency)}
              </Text>
              <Text style={[styles.tableCellRight, { width: '11%' }]}>
                {formatCurrency(item.amount, invoice.currency)}
              </Text>
            </View>
          ))}
        </View>

        {/* TOTALS */}
        <View style={styles.totalsWrapper}>
          <View style={styles.totalsBlock}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text style={styles.totalsValue}>
                {formatCurrency(totals.subtotal, invoice.currency)}
              </Text>
            </View>
            {invoice.gstMode !== 'none' && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>
                  GST (10%){invoice.gstMode === 'inclusive' ? ' incl.' : ''}
                </Text>
                <Text style={styles.totalsValue}>
                  {formatCurrency(totals.gst, invoice.currency)}
                </Text>
              </View>
            )}
            <View style={styles.totalsDivider} />
            {totalHrs > 0 && (
              <View style={[styles.totalsRow, { marginBottom: 4 }]}>
                <Text style={styles.grandTotalLabel}>Total hrs</Text>
                <Text style={styles.grandTotalValue}>
                  {totalHrs % 1 === 0 ? totalHrs : totalHrs.toFixed(1)} hrs
                </Text>
              </View>
            )}
            <View style={styles.totalsRow}>
              <Text style={styles.grandTotalLabel}>Total {invoice.currency}</Text>
              <Text style={styles.grandTotalValue}>
                {formatCurrency(totals.grandTotal, invoice.currency)}
              </Text>
            </View>
          </View>
        </View>

      </Page>
    </Document>
  )
}
