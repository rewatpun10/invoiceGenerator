import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useContractorStore } from '../../store/contractorStore'
import type { Contractor } from '../../types/invoice'

const fields: { key: keyof Contractor; label: string; placeholder: string; type?: string }[] = [
  { key: 'name', label: 'Full Name', placeholder: 'Jane Smith' },
  { key: 'abn', label: 'ABN', placeholder: '12 345 678 901' },
  { key: 'email', label: 'Email', placeholder: 'jane@example.com', type: 'email' },
  { key: 'phone', label: 'Phone', placeholder: '+61 400 000 000' },
  { key: 'location', label: 'Location', placeholder: 'Sydney, NSW' },
  { key: 'bankName', label: 'Bank Name', placeholder: 'Commonwealth Bank' },
  { key: 'bsb', label: 'BSB', placeholder: '062-000' },
  { key: 'accountNumber', label: 'Account Number', placeholder: '12345678' },
]

export default function ContractorSection() {
  const { contractor, setContractor } = useContractorStore()
  const { register, watch } = useForm<Contractor>({ defaultValues: contractor })

  const values = watch()

  useEffect(() => {
    const timeout = setTimeout(() => {
      setContractor(values)
    }, 300)
    return () => clearTimeout(timeout)
  }, [JSON.stringify(values)])

  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-[#5F5E5A] mb-3">
        Your Details
      </h2>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {fields.map(({ key, label, placeholder, type }) => (
          <div key={key} className={key === 'name' ? 'col-span-2' : ''}>
            <label className="block text-xs text-[#5F5E5A] mb-1">{label}</label>
            <input
              type={type ?? 'text'}
              placeholder={placeholder}
              {...register(key)}
              className="w-full border border-[#D3D1C7] rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#042C53] text-[#2C2C2A]"
            />
          </div>
        ))}
      </div>
    </section>
  )
}
