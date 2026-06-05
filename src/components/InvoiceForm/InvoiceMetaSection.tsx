import { useInvoiceStore } from '../../store/invoiceStore'
import { addDaysISO } from '../../utils/calculations'

const GST_OPTIONS: { value: 'exclusive' | 'inclusive' | 'none'; label: string }[] = [
  { value: 'exclusive', label: '+ 10% GST' },
  { value: 'inclusive', label: 'GST Inclusive' },
  { value: 'none', label: 'No GST' },
]

const PAYMENT_TERMS = [
  { label: 'Net 7', days: 7 },
  { label: 'Net 14', days: 14 },
  { label: 'Net 21', days: 21 },
  { label: 'Net 30', days: 30 },
  { label: 'Net 60', days: 60 },
  { label: 'Custom', days: null },
]

export default function InvoiceMetaSection() {
  const { invoice, setInvoice } = useInvoiceStore()

  // Derive the current selected term from the date diff (or 'Custom' if no match)
  const currentDiff = (() => {
    if (!invoice.issuedDate || !invoice.dueDate) return null
    const issued = new Date(invoice.issuedDate)
    const due = new Date(invoice.dueDate)
    return Math.round((due.getTime() - issued.getTime()) / (1000 * 60 * 60 * 24))
  })()
  const activeTerm =
    PAYMENT_TERMS.find((t) => t.days === currentDiff)?.label ?? 'Custom'

  const handleTermChange = (label: string) => {
    const term = PAYMENT_TERMS.find((t) => t.label === label)
    if (term?.days !== null && term?.days !== undefined && invoice.issuedDate) {
      setInvoice({ dueDate: addDaysISO(invoice.issuedDate, term.days) })
    }
    // 'Custom' — leave due date editable as-is
  }

  const handleIssueDateChange = (newIssued: string) => {
    // Re-apply the current term offset when issue date changes (unless Custom)
    const term = PAYMENT_TERMS.find((t) => t.label === activeTerm)
    const newDue =
      term?.days !== null && term?.days !== undefined
        ? addDaysISO(newIssued, term.days)
        : invoice.dueDate
    setInvoice({ issuedDate: newIssued, dueDate: newDue })
  }

  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-[#5F5E5A] mb-3">
        Invoice Info
      </h2>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <div>
          <label className="block text-xs text-[#5F5E5A] mb-1">Invoice Number</label>
          <input
            type="text"
            value={invoice.number}
            onChange={(e) => setInvoice({ number: e.target.value })}
            className="w-full border border-[#D3D1C7] rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#042C53] text-[#2C2C2A] font-mono"
          />
        </div>

        <div>
          <label className="block text-xs text-[#5F5E5A] mb-1">Currency</label>
          <select
            value={invoice.currency}
            onChange={(e) => setInvoice({ currency: e.target.value })}
            className="w-full border border-[#D3D1C7] rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#042C53] text-[#2C2C2A]"
          >
            <option value="AUD">AUD</option>
            <option value="USD">USD</option>
            <option value="NZD">NZD</option>
            <option value="GBP">GBP</option>
            <option value="EUR">EUR</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-[#5F5E5A] mb-1">Issue Date</label>
          <input
            type="date"
            value={invoice.issuedDate}
            onChange={(e) => handleIssueDateChange(e.target.value)}
            className="w-full border border-[#D3D1C7] rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#042C53] text-[#2C2C2A]"
          />
        </div>

        <div>
          <label className="block text-xs text-[#5F5E5A] mb-1">Payment Terms</label>
          <select
            value={activeTerm}
            onChange={(e) => handleTermChange(e.target.value)}
            className="w-full border border-[#D3D1C7] rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#042C53] text-[#2C2C2A]"
          >
            {PAYMENT_TERMS.map((t) => (
              <option key={t.label} value={t.label}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Due date — always visible; read-only when a preset term is active */}
        <div className="col-span-2">
          <label className="block text-xs text-[#5F5E5A] mb-1">
            Due Date
            {activeTerm !== 'Custom' && (
              <span className="ml-1 text-[#042C53]">· auto-set by {activeTerm}</span>
            )}
          </label>
          <input
            type="date"
            value={invoice.dueDate}
            readOnly={activeTerm !== 'Custom'}
            onChange={(e) => {
              if (activeTerm === 'Custom') setInvoice({ dueDate: e.target.value })
            }}
            className={`w-full border border-[#D3D1C7] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#042C53] text-[#2C2C2A] ${
              activeTerm !== 'Custom'
                ? 'bg-[#F1EFE8] cursor-default text-[#5F5E5A]'
                : 'bg-white'
            }`}
          />
        </div>

        <div className="col-span-2">
          <label className="block text-xs text-[#5F5E5A] mb-1">GST</label>
          <div className="flex gap-2">
            {GST_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setInvoice({ gstMode: opt.value })}
                className={`flex-1 py-2 text-xs rounded border transition-colors ${
                  invoice.gstMode === opt.value
                    ? 'bg-[#042C53] text-white border-[#042C53]'
                    : 'bg-white text-[#5F5E5A] border-[#D3D1C7] hover:border-[#042C53]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-2">
          <label className="block text-xs text-[#5F5E5A] mb-1">Note</label>
          <textarea
            value={invoice.note}
            onChange={(e) => setInvoice({ note: e.target.value })}
            placeholder="Payment via bank transfer. Please include invoice number as reference."
            rows={2}
            className="w-full border border-[#D3D1C7] rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#042C53] text-[#2C2C2A] resize-none"
          />
        </div>
      </div>
    </section>
  )
}
