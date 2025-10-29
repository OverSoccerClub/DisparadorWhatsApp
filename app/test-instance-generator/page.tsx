import { Suspense } from 'react'
import InstanceNameGenerator from '@/components/InstanceNameGenerator'
import { useAuth } from '@/lib/hooks/useAuth'

function TestInstanceGeneratorContent() {
  const { user } = useAuth()

  if (!user?.id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
          <p className="text-gray-600">Você precisa estar logado para acessar esta página.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gerador de Nomes de Instância
          </h1>
          <p className="text-gray-600">
            Sistema otimizado para gerar nomes únicos e curtos para suas instâncias WhatsApp.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <InstanceNameGenerator 
            userId={user.id}
            onNameGenerated={(name) => {
              console.log('Nome selecionado:', name)
            }}
          />
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">
            Como Funciona o Novo Sistema
          </h2>
          <div className="space-y-3 text-sm text-blue-800">
            <div>
              <strong>1. Geração Automática:</strong> Cria nomes únicos usando diferentes algoritmos (hash, timestamp, UUID, sequencial).
            </div>
            <div>
              <strong>2. Verificação de Unicidade:</strong> Verifica se o nome já existe no Supabase e na Evolution API.
            </div>
            <div>
              <strong>3. Nomes Curtos:</strong> Gera nomes de 8-15 caracteres em vez dos antigos 50+ caracteres.
            </div>
            <div>
              <strong>4. Validação:</strong> Garante que os nomes atendem aos requisitos da Evolution API.
            </div>
            <div>
              <strong>5. Fallback:</strong> Se um nome não for único, tenta automaticamente outros métodos.
            </div>
          </div>
        </div>

        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-green-900 mb-3">
            Exemplos de Nomes Gerados
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-medium text-green-800 mb-2">Antes (Sistema Antigo):</h3>
              <div className="space-y-1 font-mono text-green-700">
                <div>user_12345678-90ab-cdef-1234-567890abcdef_instance_1703123456789_abc123</div>
                <div className="text-xs text-green-600">~80 caracteres</div>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-green-800 mb-2">Agora (Sistema Novo):</h3>
              <div className="space-y-1 font-mono text-green-700">
                <div>inst_a1b2c3d4</div>
                <div>inst_1703123456_1234</div>
                <div>inst_abc123def</div>
                <div className="text-xs text-green-600">8-15 caracteres</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TestInstanceGeneratorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    }>
      <TestInstanceGeneratorContent />
    </Suspense>
  )
}
