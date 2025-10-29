'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function DebugPage() {
  const [session, setSession] = useState<any>(null)
  const [cookies, setCookies] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
    checkCookies()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      console.log('🔍 Session:', session)
      console.log('🔍 Error:', error)
      setSession(session)
    } catch (error) {
      console.error('Erro ao verificar sessão:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkCookies = async () => {
    try {
      const response = await fetch('/api/debug/cookies')
      const data = await response.json()
      console.log('🍪 Cookies:', data)
      setCookies(data)
    } catch (error) {
      console.error('Erro ao verificar cookies:', error)
    }
  }

  const testWahaList = async () => {
    try {
      const response = await fetch('/api/config/waha/list')
      const data = await response.json()
      console.log('📡 Response WAHA List:', response.status, data)
      alert(`Status: ${response.status}\n${JSON.stringify(data, null, 2)}`)
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro: ' + error)
    }
  }

  const testLogin = async () => {
    const email = prompt('Email:')
    const password = prompt('Senha:')
    
    if (!email || !password) return

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await response.json()
      console.log('🔐 Login Response:', data)
      alert(`Login: ${data.success ? 'Sucesso' : 'Erro'}\n${data.message}`)
      
      // Recarregar página para ver novos cookies
      window.location.reload()
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro: ' + error)
    }
  }

  const cleanupOldCookies = async () => {
    if (!confirm('Remover cookies antigos (auth-token, refresh-token)?')) return

    try {
      const response = await fetch('/api/debug/cleanup-cookies', {
        method: 'POST'
      })
      const data = await response.json()
      console.log('🧹 Cleanup Response:', data)
      alert(data.message)
      
      // Recarregar página
      window.location.reload()
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro: ' + error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔍 Debug - Autenticação Supabase</h1>

        {/* Status da Sessão */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">📊 Status da Sessão</h2>
          {loading ? (
            <p>Carregando...</p>
          ) : session ? (
            <div className="space-y-2">
              <p className="text-green-600 font-bold">✅ Sessão ativa!</p>
              <div className="bg-gray-50 p-4 rounded">
                <p><strong>User ID:</strong> {session.user.id}</p>
                <p><strong>Email:</strong> {session.user.email}</p>
                <p><strong>Expira em:</strong> {new Date(session.expires_at! * 1000).toLocaleString('pt-BR')}</p>
              </div>
            </div>
          ) : (
            <p className="text-red-600 font-bold">❌ Nenhuma sessão ativa</p>
          )}
        </div>

        {/* Cookies */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🍪 Cookies</h2>
          {cookies ? (
            <div className="space-y-2">
              <p><strong>Total:</strong> {cookies.count}</p>
              <p><strong>Tem cookies Supabase?</strong> {cookies.hasSupabaseCookies ? '✅ Sim' : '❌ Não'}</p>
              <div className="bg-gray-50 p-4 rounded mt-4 max-h-64 overflow-y-auto">
                <pre className="text-xs">{JSON.stringify(cookies.cookies, null, 2)}</pre>
              </div>
            </div>
          ) : (
            <p>Carregando cookies...</p>
          )}
        </div>

        {/* Ações */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">🧪 Testes</h2>
          <div className="space-y-3">
            <button
              onClick={cleanupOldCookies}
              className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 font-bold"
            >
              🧹 REMOVER Cookies Antigos (auth-token, refresh-token)
            </button>
            <button
              onClick={testLogin}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              🔐 Fazer Login
            </button>
            <button
              onClick={testWahaList}
              className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              📡 Testar API WAHA List (protegida)
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              🔄 Recarregar Página
            </button>
          </div>
        </div>

        {/* Instruções */}
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold mb-2">📝 Como usar:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Verifique se tem sessão ativa</li>
            <li>Se não tiver, clique em "Fazer Login"</li>
            <li>Após login, recarregue a página</li>
            <li>Verifique se os cookies Supabase foram criados</li>
            <li>Teste a API WAHA List</li>
            <li>Se funcionar aqui, funciona em /configuracoes</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

