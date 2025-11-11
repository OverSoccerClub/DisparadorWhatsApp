'use client'

import { useSidebar } from '@/lib/contexts/SidebarContext'
import { cn } from '@/lib/utils'

export default function MainContent({ children }: { children: React.ReactNode }) {
  const { isOpen } = useSidebar()
  
  return (
    <div className={cn(
      "flex flex-col flex-1 transition-all duration-300 ease-in-out",
      isOpen ? "md:pl-64" : "md:pl-0"
    )}>
      {children}
    </div>
  )
}

