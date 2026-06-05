import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuid } from 'uuid'
import type { Invoice, LineItem } from '../types/invoice'
import { todayISO, addDaysISO, nextInvoiceNumber } from '../utils/calculations'
import { calcLineAmount } from '../utils/calculations'

const newLineItem = (): LineItem => ({
  id: uuid(),
  date: todayISO(),
  project: '',
  description: '',
  qty: 1,
  unit: 'hrs',
  rate: 0,
  amount: 0,
})

const defaultInvoice = (): Invoice => {
  const today = todayISO()
  return {
    number: 'INV-0001',
    issuedDate: today,
    dueDate: addDaysISO(today, 14),
    currency: 'AUD',
    gstMode: 'exclusive',
    client: { name: '', email: '' },
    lineItems: [newLineItem()],
    note: '',
  }
}

export type NewLineItemInput = Partial<Omit<LineItem, 'id' | 'amount'>>

interface InvoiceStore {
  invoice: Invoice
  pastNumbers: string[]
  draftSaved: boolean
  setInvoice: (partial: Partial<Invoice>) => void
  setClient: (partial: { name?: string; email?: string }) => void
  addLineItem: () => void
  removeLineItem: (id: string) => void
  updateLineItem: (id: string, partial: Partial<LineItem>) => void
  bulkAddLineItems: (items: NewLineItemInput[], mode?: 'append' | 'replace') => void
  saveDraft: () => void
  loadDraft: () => void
  resetInvoice: () => void
  incrementInvoiceNumber: () => void
}

export const useInvoiceStore = create<InvoiceStore>()(
  persist(
    (set, get) => ({
      invoice: defaultInvoice(),
      pastNumbers: [],
      draftSaved: false,

      setInvoice: (partial) =>
        set((state) => ({ invoice: { ...state.invoice, ...partial }, draftSaved: false })),

      setClient: (partial) =>
        set((state) => ({
          invoice: { ...state.invoice, client: { ...state.invoice.client, ...partial } },
          draftSaved: false,
        })),

      addLineItem: () =>
        set((state) => ({
          invoice: {
            ...state.invoice,
            lineItems: [...state.invoice.lineItems, newLineItem()],
          },
          draftSaved: false,
        })),

      removeLineItem: (id) =>
        set((state) => ({
          invoice: {
            ...state.invoice,
            lineItems: state.invoice.lineItems.filter((li) => li.id !== id),
          },
          draftSaved: false,
        })),

      updateLineItem: (id, partial) =>
        set((state) => ({
          invoice: {
            ...state.invoice,
            lineItems: state.invoice.lineItems.map((li) => {
              if (li.id !== id) return li
              const updated = { ...li, ...partial }
              updated.amount = calcLineAmount(
                partial.qty !== undefined ? partial.qty : li.qty,
                partial.rate !== undefined ? partial.rate : li.rate
              )
              return updated
            }),
          },
          draftSaved: false,
        })),

      bulkAddLineItems: (items, mode = 'append') =>
        set((state) => {
          const built: LineItem[] = items.map((it) => {
            const base = newLineItem()
            const merged: LineItem = { ...base, ...it }
            merged.amount = calcLineAmount(merged.qty, merged.rate)
            return merged
          })
          const existing = state.invoice.lineItems
          const isRowEmpty = (li: LineItem) =>
            !li.project.trim() && !li.description.trim() && li.rate === 0
          const allExistingEmpty = existing.every(isRowEmpty)
          const nextItems =
            mode === 'replace' || allExistingEmpty ? built : [...existing, ...built]
          return {
            invoice: { ...state.invoice, lineItems: nextItems },
            draftSaved: false,
          }
        }),

      saveDraft: () => {
        const { invoice } = get()
        localStorage.setItem('invoice-draft', JSON.stringify(invoice))
        set({ draftSaved: true })
      },

      loadDraft: () => {
        const raw = localStorage.getItem('invoice-draft')
        if (raw) {
          try {
            const invoice = JSON.parse(raw) as Invoice
            set({ invoice, draftSaved: true })
          } catch {
            // ignore
          }
        }
      },

      resetInvoice: () => {
        const { pastNumbers } = get()
        const next = nextInvoiceNumber(pastNumbers)
        set({ invoice: { ...defaultInvoice(), number: next }, draftSaved: false })
      },

      incrementInvoiceNumber: () =>
        set((state) => {
          const newNumbers = [...state.pastNumbers, state.invoice.number]
          const next = nextInvoiceNumber(newNumbers)
          return { pastNumbers: newNumbers, invoice: { ...state.invoice, number: next } }
        }),
    }),
    { name: 'invoice-store' }
  )
)
