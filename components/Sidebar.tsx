'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, memo, useMemo } from 'react'
import { 
  HomeIcon, 
  UsersIcon, 
  MegaphoneIcon, 
  PaperAirplaneIcon, 
  ChartBarIcon,
  CogIcon,
  DevicePhoneMobileIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/hooks/useAuth'

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Clientes', href: '/clientes', icon: UsersIcon },
  { name: 'Campanhas', href: '/campanhas', icon: MegaphoneIcon },
  { name: 'Disparos', href: '/disparos', icon: PaperAirplaneIcon },
  { name: 'Disparos WAHA', href: '/waha-dispatches', icon: DevicePhoneMobileIcon },
  { name: 'Sessões WAHA', href: '/waha-sessions', icon: DevicePhoneMobileIcon },
  { name: 'Relatórios', href: '/relatorios', icon: ChartBarIcon },
  { name: 'Configurações', href: '/configuracoes', icon: CogIcon },
] as const

function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Memoizar nome e inicial do usuário
  const userName = useMemo(() => user?.name || 'Usuário', [user?.name])
  const userInitial = useMemo(() => userName.charAt(0).toUpperCase(), [userName])
  const userEmail = useMemo(() => user?.email || 'usuario@exemplo.com', [user?.email])

  if (!mounted) {
    return null
  }

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
      <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-secondary-200">
        <div className="flex-1 flex flex-col pt-0 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-0 py-0">
            <img 
              src="/img/logo_dispatcher.png" 
              alt="WhatsApp Dispatcher" 
              className="w-full h-auto object-contain"
              loading="lazy"
            />
          </div>
          
          <nav className="mt-4 flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
        
        <div className="flex-shrink-0 flex border-t border-secondary-200 p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-secondary-100 rounded-full flex items-center justify-center">
              <span className="text-secondary-600 text-sm font-medium">
                {userInitial}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-900">
                {userName}
              </p>
              <p className="text-xs text-secondary-500">
                {userEmail}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(Sidebar)
