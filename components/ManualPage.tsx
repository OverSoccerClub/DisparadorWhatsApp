'use client'

import React, { useState, useEffect } from 'react'
import { marked } from 'marked'
import { BookOpenIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline'
import { useAlertContext } from '@/lib/contexts/AlertContext'

interface ManualPageProps {
  content: string
}

export default function ManualPage({ content }: ManualPageProps) {
  const { showSuccess } = useAlertContext()
  const [htmlContent, setHtmlContent] = useState<string>('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // Converter markdown para HTML
    marked.setOptions({
      breaks: true,
      gfm: true,
    })
    
    const html = marked.parse(content)
    setHtmlContent(html as string)
  }, [content])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    showSuccess('Conteúdo copiado para a área de transferência!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="card p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-secondary-200 dark:border-secondary-700">
          <div className="flex items-center">
            <BookOpenIcon className="h-8 w-8 text-primary-600 dark:text-primary-400 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                Manual do Usuário
              </h1>
              <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">
                Guia completo de uso do Fluxus Message
              </p>
            </div>
          </div>
          <button
            onClick={copyToClipboard}
            className="btn btn-secondary btn-sm"
            title="Copiar conteúdo"
          >
            <ClipboardDocumentIcon className="h-4 w-4" />
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
        </div>

        {/* Conteúdo */}
        <div 
          className="prose prose-sm dark:prose-invert max-w-none
            prose-headings:text-secondary-900 dark:prose-headings:text-secondary-100
            prose-p:text-secondary-700 dark:prose-p:text-secondary-300
            prose-a:text-primary-600 dark:prose-a:text-primary-400
            prose-strong:text-secondary-900 dark:prose-strong:text-secondary-100
            prose-code:text-primary-600 dark:prose-code:text-primary-400
            prose-pre:bg-secondary-100 dark:prose-pre:bg-secondary-800
            prose-blockquote:border-primary-500 dark:prose-blockquote:border-primary-400
            prose-table:border-secondary-200 dark:prose-table:border-secondary-700
            prose-th:bg-secondary-100 dark:prose-th:bg-secondary-800
            prose-td:border-secondary-200 dark:prose-td:border-secondary-700"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>
    </div>
  )
}

