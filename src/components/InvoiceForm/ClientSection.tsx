import { useState, useRef } from 'react'
import { useInvoiceStore } from '../../store/invoiceStore'
import { useContractorStore } from '../../store/contractorStore'

export default function ClientSection() {
  const { invoice, setClient } = useInvoiceStore()
  const { pastClients } = useContractorStore()
  const [showDropdown, setShowDropdown] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)

  const selectClient = (client: { name: string; email: string }) => {
    setClient(client)
    setShowDropdown(false)
  }

  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-[#5F5E5A] mb-3">
        Client Details
      </h2>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <div className="col-span-2 relative">
          <label className="block text-xs text-[#5F5E5A] mb-1">Client / Company Name</label>
          <div className="relative">
            <input
              ref={nameRef}
              type="text"
              value={invoice.client.name}
              placeholder="Acme Corp"
              onChange={(e) => setClient({ name: e.target.value })}
              onFocus={() => setShowDropdown(pastClients.length > 0)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              className="w-full border border-[#D3D1C7] rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#042C53] text-[#2C2C2A]"
            />
            {showDropdown && (
              <ul className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-[#D3D1C7] rounded shadow-sm max-h-40 overflow-y-auto">
                {pastClients
                  .filter((c) =>
                    c.name.toLowerCase().includes(invoice.client.name.toLowerCase())
                  )
                  .map((c) => (
                    <li
                      key={c.name}
                      onMouseDown={() => selectClient(c)}
                      className="px-3 py-2 text-sm cursor-pointer hover:bg-[#F1EFE8] text-[#2C2C2A]"
                    >
                      <span className="font-medium">{c.name}</span>
                      {c.email && <span className="text-[#5F5E5A] ml-2 text-xs">{c.email}</span>}
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>

        <div className="col-span-2">
          <label className="block text-xs text-[#5F5E5A] mb-1">Contact Email</label>
          <input
            type="email"
            value={invoice.client.email}
            placeholder="accounts@acme.com"
            onChange={(e) => setClient({ email: e.target.value })}
            className="w-full border border-[#D3D1C7] rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#042C53] text-[#2C2C2A]"
          />
        </div>
      </div>
    </section>
  )
}
