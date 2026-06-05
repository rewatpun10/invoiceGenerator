import type { Totals, Invoice } from '../types/invoice'

export function calcTotalHours(invoice: Invoice): number {
  return invoice.lineItems
    .filter((item) => item.unit === 'hrs')
    .reduce((sum, item) => sum + item.qty, 0)
}

export function calcLineAmount(qty: number, rate: number): number {
  return Math.round(qty * rate * 100) / 100
}

export function calcTotals(invoice: Invoice): Totals {
  const subtotal = invoice.lineItems.reduce(
    (sum, item) => sum + calcLineAmount(item.qty, item.rate),
    0
  )

  let gst = 0
  if (invoice.gstMode === 'exclusive') {
    gst = Math.round(subtotal * 0.1 * 100) / 100
  } else if (invoice.gstMode === 'inclusive') {
    gst = Math.round((subtotal - subtotal / 1.1) * 100) / 100
  }

  const grandTotal = Math.round((subtotal + (invoice.gstMode === 'exclusive' ? gst : 0)) * 100) / 100

  return { subtotal, gst, grandTotal }
}

export function formatInvoiceNumber(n: number): string {
  return `INV-${String(n).padStart(4, '0')}`
}

export function nextInvoiceNumber(existing: string[]): string {
  let max = 0
  for (const num of existing) {
    const match = num.match(/INV-(\d+)/)
    if (match) {
      const n = parseInt(match[1], 10)
      if (n > max) max = n
    }
  }
  return formatInvoiceNumber(max + 1)
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

export function addDaysISO(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}
