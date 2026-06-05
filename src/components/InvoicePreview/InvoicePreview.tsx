import { useInvoiceStore } from '../../store/invoiceStore'
import { useContractorStore } from '../../store/contractorStore'
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

const LABEL_STYLE: React.CSSProperties = {
  fontSize: '7px',
  fontWeight: 600,
  color: SLATE,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  marginBottom: '4px',
}

export default function InvoicePreview() {
  const { invoice } = useInvoiceStore()
  const { contractor } = useContractorStore()
  const totals = calcTotals(invoice)
  const totalHrs = calcTotalHours(invoice)
  const initials = getInitials(contractor.name || 'YN')
  const terms = resolveTermsLabel(invoice.issuedDate, invoice.dueDate)
  const hasPaymentDetails = contractor.bankName || contractor.bsb || contractor.accountNumber

  return (
    <div
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        background: 'white',
        padding: '36px',
        fontSize: '10px',
        color: BLACK,
        minHeight: '100%',
      }}
    >
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              background: NAVY,
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 700,
              fontSize: '13px',
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '12px', color: BLACK, marginBottom: '2px' }}>
              {contractor.name || 'Your Name'}
            </div>
            {contractor.abn && <div style={{ color: SLATE, fontSize: '9px' }}>ABN {contractor.abn}</div>}
            {contractor.email && <div style={{ color: SLATE, fontSize: '9px' }}>{contractor.email}</div>}
            {contractor.phone && <div style={{ color: SLATE, fontSize: '9px' }}>{contractor.phone}</div>}
            {contractor.location && <div style={{ color: SLATE, fontSize: '9px' }}>{contractor.location}</div>}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '22px', fontWeight: 700, color: NAVY, lineHeight: 1 }}>Invoice</div>
          <div style={{ color: SLATE, fontSize: '9px', marginTop: '4px' }}>{invoice.number}</div>
          {invoice.dueDate && (
            <div
              style={{
                display: 'inline-block',
                marginTop: '8px',
                background: AMBER_BG,
                color: AMBER_TXT,
                fontSize: '8px',
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: '999px',
              }}
            >
              Due {formatDate(invoice.dueDate)}
            </div>
          )}
        </div>
      </div>

      {/* HR */}
      <div style={{ borderTop: `0.5px solid ${BORDER}`, marginBottom: '16px' }} />

      {/* BILL TO / PAYMENT DETAILS / META — 3 columns */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '20px' }}>
        {/* Left: Billed To */}
        <div style={{ flex: '1' }}>
          <div style={LABEL_STYLE}>Billed To</div>
          <div style={{ fontWeight: 700, fontSize: '11px', color: BLACK }}>
            {invoice.client.name || 'Client Name'}
          </div>
          {invoice.client.email && (
            <div style={{ color: SLATE, fontSize: '9px', marginTop: '2px' }}>
              {invoice.client.email}
            </div>
          )}
        </div>

        {/* Centre: Payment Details */}
        <div style={{ flex: '1' }}>
          <div style={LABEL_STYLE}>Payment Details</div>
          {hasPaymentDetails ? (
            <>
              {contractor.bankName && <div style={{ fontSize: '9px', color: BLACK }}>{contractor.bankName}</div>}
              {contractor.bsb && <div style={{ fontSize: '9px', color: BLACK }}>BSB: {contractor.bsb}</div>}
              {contractor.accountNumber && <div style={{ fontSize: '9px', color: BLACK }}>Acc: {contractor.accountNumber}</div>}
            </>
          ) : (
            <div style={{ fontSize: '9px', color: SLATE }}>—</div>
          )}
          {invoice.note && (
            <div style={{ fontSize: '9px', color: SLATE, marginTop: '5px', lineHeight: '1.5' }}>
              Note: {invoice.note}
            </div>
          )}
        </div>

        {/* Right: Issued + Terms */}
        <div style={{ textAlign: 'right' }}>
          <div style={LABEL_STYLE}>Issued</div>
          <div style={{ fontSize: '9px', color: BLACK, marginBottom: '8px' }}>
            {formatDate(invoice.issuedDate)}
          </div>
          <div style={LABEL_STYLE}>Payment Terms</div>
          <div style={{ fontSize: '9px', color: BLACK }}>{terms}</div>
        </div>
      </div>

      {/* HR */}
      <div style={{ borderTop: `0.5px solid ${BORDER}`, marginBottom: '0' }} />

      {/* LINE ITEMS TABLE */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
        <thead>
          <tr style={{ background: NAVY, color: 'white' }}>
            {[
              { label: 'Date', w: '14%', align: 'left' },
              { label: 'Project', w: '17%', align: 'left' },
              { label: 'Description', w: '33%', align: 'left' },
              { label: 'Qty', w: '7%', align: 'right' },
              { label: 'Unit', w: '7%', align: 'left' },
              { label: 'Rate', w: '11%', align: 'right' },
              { label: 'Amount', w: '11%', align: 'right' },
            ].map((col) => (
              <th
                key={col.label}
                style={{
                  width: col.w,
                  padding: '6px 8px',
                  fontWeight: 700,
                  fontSize: '8px',
                  textAlign: col.align as 'left' | 'right',
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {invoice.lineItems.map((item, idx) => (
            <tr
              key={item.id}
              style={{
                background: idx % 2 === 0 ? 'white' : LIGHT,
                borderBottom: `0.5px solid ${BORDER}`,
              }}
            >
              <td style={{ padding: '6px 8px' }}>{formatDate(item.date)}</td>
              <td style={{ padding: '6px 8px', color: item.project ? BLACK : SLATE }}>
                {item.project || '—'}
              </td>
              <td style={{ padding: '6px 8px', color: item.description ? BLACK : SLATE }}>
                {item.description || '—'}
              </td>
              <td style={{ padding: '6px 8px', textAlign: 'right' }}>{item.qty}</td>
              <td style={{ padding: '6px 8px' }}>{item.unit}</td>
              <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                {formatCurrency(item.rate, invoice.currency)}
              </td>
              <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 500 }}>
                {formatCurrency(item.amount, invoice.currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* TOTALS */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
        <div style={{ width: '36%', minWidth: '200px' }}>
          {/* Subtotal + GST */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: SLATE, fontSize: '8px' }}>Subtotal</span>
            <span style={{ color: SLATE, fontSize: '8px' }}>
              {formatCurrency(totals.subtotal, invoice.currency)}
            </span>
          </div>
          {invoice.gstMode !== 'none' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: SLATE, fontSize: '8px' }}>
                GST (10%){invoice.gstMode === 'inclusive' ? ' incl.' : ''}
              </span>
              <span style={{ color: SLATE, fontSize: '8px' }}>
                {formatCurrency(totals.gst, invoice.currency)}
              </span>
            </div>
          )}

          {/* Divider */}
          <div style={{ borderTop: `0.5px solid ${BORDER}`, paddingTop: '6px' }}>
            {/* Total hrs — only when there are hrs line items */}
            {totalHrs > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontWeight: 700, fontSize: '10px', color: BLACK }}>Total hrs</span>
                <span style={{ fontWeight: 700, fontSize: '10px', color: BLACK }}>
                  {totalHrs % 1 === 0 ? totalHrs : totalHrs.toFixed(1)} hrs
                </span>
              </div>
            )}
            {/* Total AUD */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: '10px', color: BLACK }}>
                Total {invoice.currency}
              </span>
              <span style={{ fontWeight: 700, fontSize: '10px', color: BLACK }}>
                {formatCurrency(totals.grandTotal, invoice.currency)}
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
