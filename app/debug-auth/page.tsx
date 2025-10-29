'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'

export default function DebugAuthPage() {
  const { user, loading } = useAuth()
  const [authCheck, setAuthCheck] = useState<any>(null)
  const [cookies, setCookies] = useState<string>('')

  useEffect(() => {
    // Verificar cookies
    setCookies(document.cookie)
    
    // Fazer teste direto da API
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => setAuthCheck(data))
      .catch(err => setAuthCheck({ error: err.message }))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Debug de Autenticação</h1>
        
        <div className="grid gap-6">
          {/* Status do Hook useAuth */}
          <div className="card bg-white shadow">
            <div className="card-body">
              <h2 className="card-title">Status do Hook useAuth</h2>
              <div className="space-y-2">
                <p><strong>Loading:</strong> {loading ? 'Sim' : 'Não'}</p>
                <p><strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'null'}</p>
              </div>
            </div>
          </div>

          {/* Teste da API */}
          <div className="card bg-white shadow">
            <div className="card-body">
              <h2 className="card-title">Teste da API /api/auth/me</h2>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(authCheck, null, 2)}
              </pre>
            </div>
          </div>

          {/* Cookies */}
          <div className="card bg-white shadow">
            <div className="card-body">
              <h2 className="card-title">Cookies do Browser</h2>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {cookies || 'Nenhum cookie encontrado'}
              </pre>
            </div>
          </div>

          {/* Ações */}
          <div className="card bg-white shadow">
            <div className="card-body">
              <h2 className="card-title">Ações</h2>
              <div className="flex gap-4">
                <button
                  onClick={() => window.location.reload()}
                  className="btn btn-primary"
                >
                  Recarregar Página
                </button>
                <button
                  onClick={() => {
                    fetch('/api/auth/logout', { method: 'POST' })
                      .then(() => window.location.href = '/auth')
                  }}
                  className="btn btn-error"
                >
                  Fazer Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
