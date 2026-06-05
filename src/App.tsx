import { useEffect, useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import ContractorSection from './components/InvoiceForm/ContractorSection'
import ClientSection from './components/InvoiceForm/ClientSection'
import InvoiceMetaSection from './components/InvoiceForm/InvoiceMetaSection'
import LineItemsSection from './components/InvoiceForm/LineItemsSection'
import InvoicePreview from './components/InvoicePreview/InvoicePreview'
import { InvoicePDF } from './components/PDFDocument/InvoicePDF'
import { useInvoiceStore } from './store/invoiceStore'
import { useContractorStore } from './store/contractorStore'

export default function App() {
  const { invoice, draftSaved, saveDraft, resetInvoice, incrementInvoiceNumber, loadDraft } =
    useInvoiceStore()
  const { contractor, saveClient } = useContractorStore()
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form')
  const [downloading, setDownloading] = useState(false)

  // Load draft on mount
  useEffect(() => {
    loadDraft()
  }, [])

  const handleDownload = async () => {
    setDownloading(true)
    try {
      if (invoice.client.name) {
        saveClient(invoice.client)
      }
      const blob = await pdf(
        <InvoicePDF invoice={invoice} contractor={contractor} />
      ).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${invoice.number}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      incrementInvoiceNumber()
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      {/* Top bar */}
      <header className="border-b border-[#D3D1C7] bg-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-7 h-7 rounded flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: '#042C53' }}
          >
            IV
          </div>
          <span className="text-sm font-semibold text-[#2C2C2A]">Invoice Generator</span>
        </div>

        <div className="flex items-center gap-2">
          {draftSaved && (
            <span className="text-xs text-[#5F5E5A]">Draft saved</span>
          )}
          <button
            onClick={saveDraft}
            className="text-xs border border-[#D3D1C7] rounded px-3 py-1.5 text-[#5F5E5A] hover:border-[#042C53] hover:text-[#042C53] transition-colors"
          >
            Save Draft
          </button>
          <button
            onClick={resetInvoice}
            className="text-xs border border-[#D3D1C7] rounded px-3 py-1.5 text-[#5F5E5A] hover:border-red-400 hover:text-red-500 transition-colors"
          >
            New Invoice
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="text-xs rounded px-4 py-1.5 text-white transition-colors disabled:opacity-60"
            style={{ backgroundColor: '#042C53' }}
          >
            {downloading ? 'Generating…' : 'Download PDF'}
          </button>
        </div>
      </header>

      {/* Mobile tab switcher */}
      <div className="lg:hidden flex border-b border-[#D3D1C7] bg-white">
        {(['form', 'preview'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
              activeTab === tab
                ? 'text-[#042C53] border-b-2 border-[#042C53]'
                : 'text-[#5F5E5A]'
            }`}
          >
            {tab === 'form' ? 'Form' : 'Preview'}
          </button>
        ))}
      </div>

      {/* Main layout */}
      <div className="lg:flex lg:h-[calc(100vh-53px)]">
        {/* Form panel */}
        <div
          className={`lg:w-1/2 lg:overflow-y-auto lg:border-r border-[#D3D1C7] p-6 space-y-8 ${
            activeTab === 'preview' ? 'hidden lg:block' : ''
          }`}
        >
          <ContractorSection />
          <div className="border-t border-[#D3D1C7]" />
          <ClientSection />
          <div className="border-t border-[#D3D1C7]" />
          <InvoiceMetaSection />
          <div className="border-t border-[#D3D1C7]" />
          <LineItemsSection />

          {/* Mobile download button */}
          <div className="lg:hidden pt-2 pb-8">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full py-3 text-sm font-medium text-white rounded transition-colors disabled:opacity-60"
              style={{ backgroundColor: '#042C53' }}
            >
              {downloading ? 'Generating…' : 'Download PDF'}
            </button>
          </div>
        </div>

        {/* Preview panel */}
        <div
          className={`lg:w-1/2 lg:overflow-y-auto bg-[#e8e6e0] p-6 ${
            activeTab === 'form' ? 'hidden lg:block' : ''
          }`}
        >
          <div className="max-w-[640px] mx-auto">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs text-[#5F5E5A] font-medium">Preview</span>
              <span className="text-xs text-[#5F5E5A]">Live</span>
            </div>
            <div
              className="rounded overflow-hidden"
              style={{ border: '1px solid #D3D1C7' }}
            >
              <InvoicePreview />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
