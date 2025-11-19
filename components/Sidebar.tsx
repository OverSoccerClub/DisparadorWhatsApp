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
  DevicePhoneMobileIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ServerIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/hooks/useAuth'
import { useSidebar } from '@/lib/contexts/SidebarContext'

type NavigationItem = {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  children?: NavigationItem[]
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Clientes', href: '/clientes', icon: UsersIcon },
  { name: 'Campanhas', href: '/campanhas', icon: MegaphoneIcon },
  { name: 'Disparos', href: '/disparos', icon: PaperAirplaneIcon },
  { name: 'Relatórios', href: '/relatorios', icon: ChartBarIcon },
  { name: 'Manual', href: '/manual', icon: BookOpenIcon },
  { 
    name: 'Configurações', 
    href: '/configuracoes', 
    icon: CogIcon,
    children: [
      { name: 'Gerais', href: '/configuracoes', icon: CogIcon },
      { name: 'Evolution API', href: '/configuracoes/evolution-api', icon: ServerIcon },
      { name: 'Telegram', href: '/configuracoes/telegram', icon: PaperAirplaneIcon },
      { name: 'Sessões WAHA', href: '/waha-sessions', icon: DevicePhoneMobileIcon }
    ]
  },
]

function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { isOpen } = useSidebar()
  const [mounted, setMounted] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Expandir automaticamente se estiver em uma página filha
    navigation.forEach((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some((child) => pathname === child.href)
        if (hasActiveChild) {
          setExpandedItems((prev) => new Set(prev).add(item.name))
        }
      }
    })
  }, [pathname])

  // Memoizar nome e inicial do usuário
  const userName = useMemo(() => user?.name || 'Usuário', [user?.name])
  const userInitial = useMemo(() => userName.charAt(0).toUpperCase(), [userName])
  const userEmail = useMemo(() => user?.email || 'usuario@exemplo.com', [user?.email])

  const toggleExpand = (itemName: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(itemName)) {
        newSet.delete(itemName)
      } else {
        newSet.add(itemName)
      }
      return newSet
    })
  }

  const isItemActive = (item: NavigationItem): boolean => {
    if (pathname === item.href) return true
    if (item.children) {
      return item.children.some((child) => pathname === child.href)
    }
    return false
  }

  const renderNavItem = (item: NavigationItem) => {
    const isActive = isItemActive(item)
    const isExpanded = expandedItems.has(item.name)
    const hasChildren = item.children && item.children.length > 0

    if (hasChildren) {
      return (
        <div key={item.name}>
          <button
            onClick={() => toggleExpand(item.name)}
            className={cn(
              'w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
              isActive
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 shadow-sm border-l-4 border-primary-500 dark:border-primary-400'
                : 'text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-800 hover:text-secondary-900 dark:hover:text-secondary-100'
            )}
          >
            <div className="flex items-center">
              <item.icon className={cn(
                'mr-3 h-5 w-5 flex-shrink-0 transition-colors',
                isActive ? 'text-primary-600 dark:text-primary-400' : ''
              )} />
              {item.name}
            </div>
            {isExpanded ? (
              <ChevronDownIcon className={cn(
                'h-4 w-4 transition-colors',
                isActive ? 'text-primary-600 dark:text-primary-400' : ''
              )} />
            ) : (
              <ChevronRightIcon className={cn(
                'h-4 w-4 transition-colors',
                isActive ? 'text-primary-600 dark:text-primary-400' : ''
              )} />
            )}
          </button>
          {isExpanded && (
            <div className="ml-4 mt-1 space-y-1">
              {item.children!.map((child) => {
                const isChildActive = pathname === child.href
                return (
                  <Link
                    key={child.name}
                    href={child.href}
                    className={cn(
                      'flex items-center px-3 py-2 text-sm rounded-lg transition-all duration-200',
                      isChildActive
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-medium shadow-sm border-l-4 border-primary-500 dark:border-primary-400'
                        : 'text-secondary-600 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-secondary-800 hover:text-secondary-900 dark:hover:text-secondary-100'
                    )}
                  >
                    <child.icon className={cn(
                      'mr-3 h-4 w-4 flex-shrink-0 transition-colors',
                      isChildActive ? 'text-primary-600 dark:text-primary-400' : ''
                    )} />
                    {child.name}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )
    }

    return (
      <Link
        key={item.name}
        href={item.href}
        className={cn(
          'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
          isActive
            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 shadow-sm border-l-4 border-primary-500 dark:border-primary-400'
            : 'text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-800 hover:text-secondary-900 dark:hover:text-secondary-100'
        )}
      >
        <item.icon className={cn(
          'mr-3 h-5 w-5 flex-shrink-0 transition-colors',
          isActive ? 'text-primary-600 dark:text-primary-400' : ''
        )} />
        {item.name}
      </Link>
    )
  }

  if (!mounted) {
    return null
  }

  return (
    <div className={cn(
      "hidden md:flex md:flex-col md:fixed md:inset-y-0 md:z-30 transition-all duration-300 ease-in-out",
      isOpen ? "md:w-64" : "md:w-0"
    )}>
      <div className={cn(
        "flex-1 flex flex-col min-h-0 bg-white dark:bg-secondary-900 border-r border-secondary-200 dark:border-secondary-700 transition-all duration-300 ease-in-out",
        isOpen ? "opacity-100 w-64" : "opacity-0 w-0 overflow-hidden"
      )}>
        <div className="flex-1 flex flex-col pt-0 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-0 py-0">
            <img 
              src="/img/logo_marca_02_trasp.png" 
                alt="Fluxus Message"
              className="w-full h-auto object-contain"
              loading="lazy"
            />
          </div>
          
          <nav className="mt-4 flex-1 px-2 space-y-1">
            {navigation.map((item) => renderNavItem(item))}
          </nav>
        </div>
        
        <div className="flex-shrink-0 flex border-t border-secondary-200 dark:border-secondary-700 p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-secondary-100 rounded-full flex items-center justify-center">
              <span className="text-secondary-600 text-sm font-medium">
                {userInitial}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                {userName}
              </p>
              <p className="text-xs text-secondary-500 dark:text-secondary-400">
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
