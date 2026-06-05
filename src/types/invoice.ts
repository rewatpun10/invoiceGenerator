export interface LineItem {
  id: string
  date: string
  project: string
  description: string
  qty: number
  unit: 'hrs' | 'days' | 'items' | 'fixed'
  rate: number
  amount: number
}

export interface Client {
  name: string
  email: string
}

export interface Invoice {
  number: string
  issuedDate: string
  dueDate: string
  currency: string
  gstMode: 'inclusive' | 'exclusive' | 'none'
  client: Client
  lineItems: LineItem[]
  note: string
}

export interface Contractor {
  name: string
  abn: string
  email: string
  phone: string
  location: string
  bankName: string
  bsb: string
  accountNumber: string
}

export interface Totals {
  subtotal: number
  gst: number
  grandTotal: number
}
