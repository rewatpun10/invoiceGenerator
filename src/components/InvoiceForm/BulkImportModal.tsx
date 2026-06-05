import { useEffect, useMemo, useState } from 'react'
import { useInvoiceStore } from '../../store/invoiceStore'
import { parseTimesheet, type ParsedRow } from '../../utils/timesheetParser'

interface Props {
  open: boolean
  onClose: () => void
}

const SAMPLE = `2026-04-21\tOrion Health - Growth Charts\tTeam meeting re boilerplate MR\t02:00:00\t90
2026-04-21\tOrion Health - Growth Charts\tGrowth charts weekly meeting\t00:30:00\t90
2026-04-20\tOrion Health - Growth Charts\tBoilerplate code catchup\t00:40:00\t90`

export default function BulkImportModal({ open, onClose }: Props) {
  const { invoice, bulkAddLineItems } = useInvoiceStore()

  // Pre-populate default rate from the most recent non-zero rate already on the invoice.
  const inferredRate = useMemo(() => {
    const recent = [...invoice.lineItems].reverse().find((li) => li.rate > 0)
    return recent?.rate ?? 90
  }, [invoice.lineItems])

  const [text, setText] = useState('')
  const [defaultRate, setDefaultRate] = useState<number>(inferredRate)
  const [defaultYear, setDefaultYear] = useState<number>(new Date().getFullYear())
  const [mode, setMode] = useState<'append' | 'replace'>('append')

  useEffect(() => {
    if (open) {
      setDefaultRate(inferredRate)
      setDefaultYear(new Date().getFullYear())
    }
  }, [open, inferredRate])

  const parsed = useMemo(
    () => parseTimesheet(text, defaultRate, defaultYear),
    [text, defaultRate, defaultYear]
  )

  const validRows = parsed.rows.filter((r) => r.errors.length === 0 && r.date && r.qty > 0)
  const totalHours = validRows.reduce((s, r) => s + r.qty, 0)
  const totalAmount = validRows.reduce((s, r) => s + r.qty * r.rate, 0)

  const handleImport = () => {
    if (validRows.length === 0) return
    bulkAddLineItems(
      validRows.map((r) => ({
        date: r.date,
        project: r.project,
        description: r.description,
        qty: r.qty,
        unit: r.unit,
        rate: r.rate,
      })),
      mode
    )
    setText('')
    onClose()
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-[#D3D1C7] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#2C2C2A]">Paste Timesheet</h3>
            <p className="text-xs text-[#5F5E5A] mt-0.5">
              One row per line. Columns separated by tab, pipe (<code>|</code>), or comma.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#5F5E5A] hover:text-[#2C2C2A] text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="px-5 py-4 overflow-y-auto space-y-4">
          <div className="text-xs text-[#5F5E5A] bg-[#F1EFE8] rounded px-3 py-2">
            <div className="font-medium text-[#2C2C2A] mb-1">Format</div>
            <code className="block whitespace-pre">date | project | description | duration | rate</code>
            <div className="mt-1.5 text-[11px]">
              Date: <code>2026-04-21</code>, <code>21/04/2026</code>, or <code>Apr 21</code>.
              Duration: <code>02:30:00</code>, <code>1:30</code>, <code>2.5</code>, or <code>45m</code>.
              Rate is optional — falls back to the default below.
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <label className="text-xs text-[#5F5E5A]">
              Default rate
              <input
                type="number"
                value={defaultRate}
                min={0}
                step="0.01"
                onChange={(e) => setDefaultRate(parseFloat(e.target.value) || 0)}
                className="w-full mt-1 border border-[#D3D1C7] rounded px-2 py-1.5 text-xs bg-white focus:outline-none focus:border-[#042C53]"
              />
            </label>
            <label className="text-xs text-[#5F5E5A]">
              Default year (for short dates)
              <input
                type="number"
                value={defaultYear}
                min={2000}
                max={2100}
                onChange={(e) => setDefaultYear(parseInt(e.target.value) || new Date().getFullYear())}
                className="w-full mt-1 border border-[#D3D1C7] rounded px-2 py-1.5 text-xs bg-white focus:outline-none focus:border-[#042C53]"
              />
            </label>
            <label className="text-xs text-[#5F5E5A]">
              Mode
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as 'append' | 'replace')}
                className="w-full mt-1 border border-[#D3D1C7] rounded px-2 py-1.5 text-xs bg-white focus:outline-none focus:border-[#042C53]"
              >
                <option value="append">Append to existing rows</option>
                <option value="replace">Replace all rows</option>
              </select>
            </label>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={SAMPLE}
            rows={8}
            className="w-full font-mono text-xs border border-[#D3D1C7] rounded px-3 py-2 bg-white focus:outline-none focus:border-[#042C53]"
          />

          {parsed.rows.length > 0 && (
            <PreviewTable rows={parsed.rows} />
          )}
        </div>

        <div className="px-5 py-3 border-t border-[#D3D1C7] flex items-center justify-between bg-[#F8F7F4] rounded-b-lg">
          <div className="text-xs text-[#5F5E5A]">
            {parsed.rows.length === 0 ? (
              <span>Paste your rows above to see a preview.</span>
            ) : (
              <span>
                {validRows.length} valid / {parsed.rows.length} total · {totalHours.toFixed(2)} hrs ·{' '}
                {totalAmount.toLocaleString('en-AU', { style: 'currency', currency: invoice.currency })}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs border border-[#D3D1C7] rounded px-3 py-1.5 text-[#5F5E5A] hover:border-[#042C53] hover:text-[#042C53] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={validRows.length === 0}
              className="text-xs rounded px-4 py-1.5 text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: '#042C53' }}
            >
              Import {validRows.length || ''} row{validRows.length === 1 ? '' : 's'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function PreviewTable({ rows }: { rows: ParsedRow[] }) {
  return (
    <div className="border border-[#D3D1C7] rounded overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-[#042C53] text-white">
            {['#', 'Date', 'Project', 'Description', 'Hrs', 'Rate', 'Status'].map((h) => (
              <th key={h} className="px-2 py-1.5 font-semibold text-left">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const ok = r.errors.length === 0 && r.date && r.qty > 0
            return (
              <tr
                key={i}
                className={
                  r.errors.length > 0
                    ? 'bg-red-50'
                    : r.warnings.length > 0
                    ? 'bg-yellow-50'
                    : i % 2 === 0
                    ? 'bg-white'
                    : 'bg-[#F8F7F4]'
                }
              >
                <td className="px-2 py-1 text-[#5F5E5A]">{i + 1}</td>
                <td className="px-2 py-1 whitespace-nowrap">{r.date || <em className="text-red-500">—</em>}</td>
                <td className="px-2 py-1 max-w-[140px] truncate" title={r.project}>{r.project}</td>
                <td className="px-2 py-1 max-w-[260px] truncate" title={r.description}>{r.description}</td>
                <td className="px-2 py-1 text-right">{r.qty.toFixed(2)}</td>
                <td className="px-2 py-1 text-right">{r.rate.toFixed(2)}</td>
                <td className="px-2 py-1">
                  {ok ? (
                    <span className="text-green-600">OK</span>
                  ) : (
                    <span className="text-red-600" title={r.errors.join('; ')}>
                      {r.errors[0] || 'incomplete'}
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
