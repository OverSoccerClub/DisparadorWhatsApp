'use client'

import {
  Bars3Icon,
  BellIcon,
  MagnifyingGlassIcon,
  SunIcon,
  MoonIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { Menu, Transition } from '@headlessui/react'
import { Fragment, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useSidebar } from '@/lib/contexts/SidebarContext'
import { useTheme } from '@/lib/contexts/ThemeContext'
import UserProfileModal from '@/components/UserProfileModal'

export default function Header() {
  const { isOpen, toggle } = useSidebar()
  const { user, logout } = useAuth()
  const { theme, toggle: toggleTheme } = useTheme()
  const [showProfileModal, setShowProfileModal] = useState(false)

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8" suppressHydrationWarning>
      <button
        type="button"
        className="-m-2.5 p-2.5 text-secondary-700 hover:text-secondary-900"
        onClick={toggle}
      >
        <span className="sr-only">{isOpen ? 'Fechar' : 'Abrir'} sidebar</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Separator */}
      <div className="h-6 w-px bg-secondary-200 lg:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <form className="relative flex flex-1" action="#" method="GET">
          <label htmlFor="search-field" className="sr-only">
            Buscar
          </label>
          <MagnifyingGlassIcon
            className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-secondary-400"
            aria-hidden="true"
          />
          <input
            id="search-field"
            className="block h-full w-full border-0 py-0 pl-8 pr-0 text-secondary-900 dark:text-secondary-100 placeholder:text-secondary-400 dark:placeholder:text-secondary-500 focus:ring-0 sm:text-sm bg-transparent"
            placeholder="Buscar..."
            type="search"
            name="search"
          />
        </form>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* WhatsApp Status */}
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-secondary-600 dark:text-secondary-400">WhatsApp Conectado</span>
          </div>

          {/* Notifications */}
          <button
            type="button"
            className="-m-2.5 p-2.5 text-secondary-400 hover:text-secondary-500"
          >
            <span className="sr-only">Ver notificações</span>
            <BellIcon className="h-6 w-6" aria-hidden="true" />
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="-m-2.5 p-2.5 text-secondary-400 hover:text-secondary-500 transition-colors"
            title={theme === 'light' ? 'Alternar para tema escuro' : 'Alternar para tema claro'}
          >
            <span className="sr-only">Alternar tema</span>
            {theme === 'light' ? (
              <MoonIcon className="h-6 w-6" aria-hidden="true" />
            ) : (
              <SunIcon className="h-6 w-6" aria-hidden="true" />
            )}
          </button>

          {/* Separator */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-secondary-200 dark:bg-secondary-700" aria-hidden="true" />

          {/* Profile dropdown */}
          <Menu as="div" className="relative">
            <Menu.Button className="-m-1.5 flex items-center p-1.5">
              <span className="sr-only">Abrir menu do usuário</span>
              <div className="h-8 w-8 rounded-full bg-secondary-100 flex items-center justify-center">
                <span className="text-secondary-600 text-sm font-medium">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <span className="hidden lg:flex lg:items-center">
                <span className="ml-4 text-sm font-semibold leading-6 text-secondary-900" aria-hidden="true">
                  {user?.name || 'Usuário'}
                </span>
              </span>
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2.5 w-52 origin-top-right rounded-lg bg-white dark:bg-secondary-800 py-3 shadow-xl ring-1 ring-secondary-900/5 dark:ring-secondary-700 focus:outline-none">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => {
                        setShowProfileModal(true)
                      }}
                      className={`${
                        active ? 'bg-secondary-50 dark:bg-secondary-700' : ''
                      } w-full flex items-center gap-2 px-4 py-2 text-sm leading-6 text-secondary-900 dark:text-secondary-100`}
                    >
                      <UserIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                      Perfil
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      href="/configuracoes"
                      className={`${
                        active ? 'bg-secondary-50 dark:bg-secondary-700' : ''
                      } flex items-center gap-2 px-4 py-2 text-sm leading-6 text-secondary-900 dark:text-secondary-100`}
                    >
                      <Cog6ToothIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                      Configurações
                    </Link>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={logout}
                      className={`${
                        active ? 'bg-secondary-50 dark:bg-secondary-700' : ''
                      } flex w-full items-center gap-2 px-4 py-2 text-sm leading-6 text-secondary-900 dark:text-secondary-100`}
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5 text-danger-500" />
                      Sair
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
          <UserProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
        </div>
      </div>
    </div>
  )
}
