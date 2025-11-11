'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface SidebarContextType {
  isOpen: boolean
  toggle: () => void
  open: () => void
  close: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(true)

  useEffect(() => {
    // Carregar estado do localStorage ao montar
    const saved = localStorage.getItem('sidebarOpen')
    if (saved !== null) {
      setIsOpen(saved === 'true')
    }
  }, [])

  useEffect(() => {
    // Salvar estado no localStorage quando mudar
    localStorage.setItem('sidebarOpen', String(isOpen))
  }, [isOpen])

  const toggle = () => setIsOpen(prev => !prev)
  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)

  return (
    <SidebarContext.Provider value={{ isOpen, toggle, open, close }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}

