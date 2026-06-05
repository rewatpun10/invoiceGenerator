import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Contractor, Client } from '../types/invoice'

interface ContractorStore {
  contractor: Contractor
  pastClients: Client[]
  pastProjects: string[]
  setContractor: (c: Partial<Contractor>) => void
  saveClient: (client: Client) => void
  saveProject: (project: string) => void
}

const defaultContractor: Contractor = {
  name: '',
  abn: '',
  email: '',
  phone: '',
  location: '',
  bankName: '',
  bsb: '',
  accountNumber: '',
}

export const useContractorStore = create<ContractorStore>()(
  persist(
    (set) => ({
      contractor: defaultContractor,
      pastClients: [],
      pastProjects: [],

      setContractor: (c) =>
        set((state) => ({
          contractor: { ...state.contractor, ...c },
        })),

      saveClient: (client) =>
        set((state) => {
          const exists = state.pastClients.some(
            (pc) => pc.name.toLowerCase() === client.name.toLowerCase()
          )
          if (exists || !client.name.trim()) return state
          return { pastClients: [...state.pastClients, client] }
        }),

      saveProject: (project) =>
        set((state) => {
          const trimmed = project.trim()
          if (!trimmed || state.pastProjects.includes(trimmed)) return state
          return { pastProjects: [...state.pastProjects, trimmed] }
        }),
    }),
    { name: 'contractor-store' }
  )
)
