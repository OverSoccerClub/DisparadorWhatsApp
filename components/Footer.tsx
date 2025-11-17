'use client'

import React from 'react'
import { usePathname } from 'next/navigation'

interface FooterProps {
  className?: string
}

export default function Footer({ className = '' }: FooterProps) {
  const pathname = usePathname()
  // Usar versão hardcoded para evitar problemas com importação de package.json em client component
  const currentVersion = '0.1.5'
  const buildDate = new Date().toLocaleDateString('pt-BR')
  
  // Não exibir footer nas páginas de autenticação
  if (pathname?.startsWith('/auth')) {
    return null
  }
  
  return (
    <footer className={`bg-secondary-50 dark:bg-secondary-900 border-t border-secondary-200 dark:border-secondary-700 py-4 ${className}`}>
      <div className="md:pl-64">
        <div className="px-3 md:px-4 lg:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-2 text-sm text-secondary-600 dark:text-secondary-400">
              <span>© 2024 WhatsApp Dispatcher</span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Sistema Online
              </span>
            </div>
            
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-4 gap-y-2 text-sm text-secondary-500 dark:text-secondary-400">
              <div className="flex items-center space-x-2">
                <span className="bg-primary-100 dark:bg-primary-900/20 text-primary-800 dark:text-primary-400 px-2 py-1 rounded-md font-medium">
                  v{currentVersion}
                </span>
                <span className="text-secondary-400 dark:text-secondary-500">•</span>
                <span>Build {buildDate}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
                <span className="text-success-600 dark:text-success-400 font-medium">Operacional</span>
              </div>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-secondary-200 dark:border-secondary-700">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-y-2 text-xs text-secondary-500 dark:text-secondary-400">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1">
                <span>Desenvolvido com Next.js 14</span>
                <span>•</span>
                <span>Integração Supabase</span>
                <span>•</span>
                <span>IA Gemini 2.5</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <span>Última atualização:</span>
                <span className="font-medium">{new Date().toLocaleString('pt-BR')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
