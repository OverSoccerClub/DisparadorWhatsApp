'use client'

import React, { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  icon?: ReactNode
  actions?: ReactNode
  className?: string
}

export default function PageHeader({ title, subtitle, icon, actions, className = '' }: PageHeaderProps) {
  return (
    <div className={`flex items-center justify-between mb-8 ${className}`} suppressHydrationWarning>
      <div>
        <h1 className="text-2xl font-semibold text-secondary-900 flex items-center" suppressHydrationWarning>
          {icon ? (
            <span className="h-6 w-6 mr-2 flex-shrink-0" suppressHydrationWarning>
              {icon}
            </span>
          ) : null}
          <span>{title}</span>
        </h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-secondary-600">
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex items-center space-x-3">
          {actions}
        </div>
      ) : null}
    </div>
  )
}


