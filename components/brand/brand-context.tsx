'use client'

import { createContext, useContext } from 'react'

interface BrandContextValue {
  name: string
  isDefault: boolean
}

const BrandContext = createContext<BrandContextValue>({
  name: 'ANTHROP\\C',
  isDefault: true,
})

export function BrandProvider({
  name,
  children,
}: {
  name: string
  children: React.ReactNode
}) {
  const isDefault = name === 'ANTHROP\\C'
  return (
    <BrandContext.Provider value={{ name, isDefault }}>
      {children}
    </BrandContext.Provider>
  )
}

export function useBrand(): BrandContextValue {
  return useContext(BrandContext)
}
