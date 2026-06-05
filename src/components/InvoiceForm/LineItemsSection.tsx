import { useState } from 'react'
import { useInvoiceStore } from '../../store/invoiceStore'
import { useContractorStore } from '../../store/contractorStore'
import { calcTotals, calcTotalHours } from '../../utils/calculations'
import { formatCurrency } from '../../utils/formatters'
import type { LineItem } from '../../types/invoice'
import BulkImportModal from './BulkImportModal'

const UNIT_OPTIONS: LineItem['unit'][] = ['hrs', 'days', 'items', 'fixed']

function ProjectInput({
  value,
  onChange,
  suggestions,
}: {
  value: string
  onChange: (v: string) => void
  suggestions: string[]
}) {
  const [open, setOpen] = useState(false)
  const filtered = suggestions.filter((s) => s.toLowerCase().includes(value.toLowerCase()) && s !== value)

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Project name"
        className="w-full border border-[#D3D1C7] rounded px-2 py-1.5 text-xs bg-white focus:outline-none focus:border-[#042C53]"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-20 left-0 right-0 top-full mt-0.5 bg-white border border-[#D3D1C7] rounded shadow-sm max-h-32 overflow-y-auto">
          {filtered.map((s) => (
            <li
              key={s}
              onMouseDown={() => { onChange(s); setOpen(false) }}
              className="px-2 py-1.5 text-xs cursor-pointer hover:bg-[#F1EFE8]"
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function LineItemsSection() {
  const { invoice, addLineItem, removeLineItem, updateLineItem } = useInvoiceStore()
  const { pastProjects, saveProject } = useContractorStore()
  const [importOpen, setImportOpen] = useState(false)

  const totals = calcTotals(invoice)
  const totalHrs = calcTotalHours(invoice)

  const handleProjectBlur = (project: string) => {
    if (project.trim()) saveProject(project.trim())
  }

  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-[#5F5E5A] mb-3">
        Line Items
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[640px]">
          <thead>
            <tr className="bg-[#042C53] text-white">
              {['Date', 'Project', 'Description', 'Qty', 'Unit', 'Rate', 'Amount', ''].map((h) => (
                <th
                  key={h}
                  className={`px-2 py-2 font-semibold text-left first:rounded-tl last:rounded-tr ${
                    ['Qty', 'Rate', 'Amount'].includes(h) ? 'text-right' : ''
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((item, idx) => (
              <tr
                key={item.id}
                className={idx % 2 === 0 ? 'bg-white' : 'bg-[#F1EFE8]'}
              >
                <td className="px-2 py-1.5 w-[110px]">
                  <input
                    type="date"
                    value={item.date}
                    onChange={(e) => updateLineItem(item.id, { date: e.target.value })}
                    className="w-full border border-[#D3D1C7] rounded px-1.5 py-1 text-xs bg-white focus:outline-none focus:border-[#042C53]"
                  />
                </td>
                <td className="px-2 py-1.5 w-[130px]">
                  <ProjectInput
                    value={item.project}
                    onChange={(v) => updateLineItem(item.id, { project: v })}
                    suggestions={pastProjects}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateLineItem(item.id, { description: e.target.value })}
                    onBlur={() => handleProjectBlur(item.project)}
                    placeholder="Work description"
                    className="w-full border border-[#D3D1C7] rounded px-2 py-1.5 text-xs bg-white focus:outline-none focus:border-[#042C53]"
                  />
                </td>
                <td className="px-2 py-1.5 w-[60px]">
                  <input
                    type="number"
                    value={item.qty}
                    min={0}
                    step="0.5"
                    onChange={(e) => updateLineItem(item.id, { qty: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-[#D3D1C7] rounded px-2 py-1.5 text-xs bg-white focus:outline-none focus:border-[#042C53] text-right"
                  />
                </td>
                <td className="px-2 py-1.5 w-[70px]">
                  <select
                    value={item.unit}
                    onChange={(e) => updateLineItem(item.id, { unit: e.target.value as LineItem['unit'] })}
                    className="w-full border border-[#D3D1C7] rounded px-1 py-1.5 text-xs bg-white focus:outline-none focus:border-[#042C53]"
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-1.5 w-[90px]">
                  <input
                    type="number"
                    value={item.rate}
                    min={0}
                    step="0.01"
                    onChange={(e) => updateLineItem(item.id, { rate: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-[#D3D1C7] rounded px-2 py-1.5 text-xs bg-white focus:outline-none focus:border-[#042C53] text-right"
                  />
                </td>
                <td className="px-2 py-1.5 w-[90px] text-right font-medium text-[#2C2C2A]">
                  {formatCurrency(item.amount, invoice.currency)}
                </td>
                <td className="px-2 py-1.5 w-[32px] text-center">
                  <button
                    type="button"
                    onClick={() => removeLineItem(item.id)}
                    disabled={invoice.lineItems.length === 1}
                    className="text-[#D3D1C7] hover:text-red-400 disabled:opacity-30 transition-colors text-base leading-none"
                    title="Remove row"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-start justify-between mt-4 gap-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={addLineItem}
            className="text-xs text-[#042C53] border border-[#042C53] rounded px-3 py-1.5 hover:bg-[#042C53] hover:text-white transition-colors"
          >
            + Add Row
          </button>
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="text-xs text-[#042C53] border border-[#042C53] rounded px-3 py-1.5 hover:bg-[#042C53] hover:text-white transition-colors"
          >
            Paste Timesheet
          </button>
        </div>

        <div className="text-right space-y-1 min-w-[200px]">
          <div className="flex justify-between gap-8 text-xs text-[#5F5E5A]">
            <span>Subtotal</span>
            <span>{formatCurrency(totals.subtotal, invoice.currency)}</span>
          </div>
          {invoice.gstMode !== 'none' && (
            <div className="flex justify-between gap-8 text-xs text-[#5F5E5A]">
              <span>GST {invoice.gstMode === 'inclusive' ? '(included)' : '(10%)'}</span>
              <span>{formatCurrency(totals.gst, invoice.currency)}</span>
            </div>
          )}
          <div className="border-t border-[#D3D1C7] pt-1 space-y-1">
            {totalHrs > 0 && (
              <div className="flex justify-between gap-8 text-sm font-semibold text-[#2C2C2A]">
                <span>Total hrs</span>
                <span>{totalHrs % 1 === 0 ? totalHrs : totalHrs.toFixed(1)} hrs</span>
              </div>
            )}
            <div className="flex justify-between gap-8 text-sm font-semibold text-[#2C2C2A]">
              <span>Total {invoice.currency}</span>
              <span>{formatCurrency(totals.grandTotal, invoice.currency)}</span>
            </div>
          </div>
        </div>
      </div>

      <BulkImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </section>
  )
}
