export function formatCurrency(amount: number, currency = 'AUD'): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(isoDate: string): string {
  if (!isoDate) return ''
  const [year, month, day] = isoDate.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDateShort(isoDate: string): string {
  if (!isoDate) return ''
  const [year, month, day] = isoDate.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('')
}

export function paymentTermsLabel(issuedDate: string, dueDate: string): string {
  if (!issuedDate || !dueDate) return 'Net 30'
  const issued = new Date(issuedDate)
  const due = new Date(dueDate)
  const diff = Math.round((due.getTime() - issued.getTime()) / (1000 * 60 * 60 * 24))
  return `Net ${diff}`
}
