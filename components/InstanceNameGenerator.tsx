'use client'

import { useState } from 'react'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

interface InstanceNameGeneratorProps {
  userId: string
  onNameGenerated?: (name: string) => void
}

export default function InstanceNameGenerator({ userId, onNameGenerated }: InstanceNameGeneratorProps) {
  const [generatedNames, setGeneratedNames] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedName, setSelectedName] = useState<string>('')
  const [customName, setCustomName] = useState('')
  const [validation, setValidation] = useState<{ isValid: boolean; error?: string } | null>(null)

  const generateNames = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/test-instance-names?userId=${encodeURIComponent(userId)}&count=5`)
      const data = await response.json()
      
      if (data.success) {
        const names = [
          ...data.data.methods.hashBased.map((item: any) => item.name),
          ...data.data.methods.timestampBased.map((item: any) => item.name),
          ...data.data.methods.uuidBased.map((item: any) => item.name),
          ...data.data.methods.sequential.map((item: any) => item.name)
        ]
        setGeneratedNames(names)
      }
    } catch (error) {
      console.error('Erro ao gerar nomes:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateCustomName = async () => {
    if (!customName.trim()) return

    setLoading(true)
    try {
      const response = await fetch('/api/test-instance-names', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          customName: customName.trim()
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSelectedName(data.data.generatedName)
        setValidation(data.data.validation)
        if (onNameGenerated) {
          onNameGenerated(data.data.generatedName)
        }
      }
    } catch (error) {
      console.error('Erro ao gerar nome personalizado:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectName = (name: string) => {
    setSelectedName(name)
    if (onNameGenerated) {
      onNameGenerated(name)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">
          Gerador de Nomes de Instância
        </h3>
        <p className="text-sm text-secondary-600 mb-4">
          Sistema otimizado para gerar nomes únicos e curtos para suas instâncias.
        </p>
      </div>

      {/* Geração Automática */}
      <div className="bg-white p-4 rounded-lg border border-secondary-200">
        <h4 className="font-medium text-secondary-900 mb-3">Geração Automática</h4>
        <button
          onClick={generateNames}
          disabled={loading}
          className="btn btn-primary btn-sm mb-4"
        >
          {loading ? 'Gerando...' : 'Gerar Nomes Únicos'}
        </button>

        {generatedNames.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {generatedNames.map((name, index) => (
              <div
                key={index}
                className={`p-3 rounded border cursor-pointer transition-colors ${
                  selectedName === name
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-secondary-200 hover:border-secondary-300'
                }`}
                onClick={() => selectName(name)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm">{name}</span>
                  <span className="text-xs text-secondary-500">
                    {name.length} chars
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Nome Personalizado */}
      <div className="bg-white p-4 rounded-lg border border-secondary-200">
        <h4 className="font-medium text-secondary-900 mb-3">Nome Personalizado</h4>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Digite um nome personalizado"
            className="input flex-1"
            maxLength={20}
          />
          <button
            onClick={generateCustomName}
            disabled={loading || !customName.trim()}
            className="btn btn-secondary btn-sm"
          >
            Gerar
          </button>
        </div>

        {selectedName && (
          <div className="mt-3 p-3 bg-secondary-50 rounded border">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-sm font-medium">{selectedName}</span>
              <span className="text-xs text-secondary-500">
                {selectedName.length} caracteres
              </span>
            </div>
            
            {validation && (
              <div className="flex items-center gap-2">
                {validation.isValid ? (
                  <>
                    <CheckCircleIcon className="h-4 w-4 text-success-600" />
                    <span className="text-xs text-success-600">Nome válido</span>
                  </>
                ) : (
                  <>
                    <XCircleIcon className="h-4 w-4 text-error-600" />
                    <span className="text-xs text-error-600">{validation.error}</span>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Estatísticas */}
      {generatedNames.length > 0 && (
        <div className="bg-secondary-50 p-4 rounded-lg">
          <h4 className="font-medium text-secondary-900 mb-2">Estatísticas</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-secondary-600">Total de nomes:</span>
              <span className="ml-2 font-medium">{generatedNames.length}</span>
            </div>
            <div>
              <span className="text-secondary-600">Comprimento médio:</span>
              <span className="ml-2 font-medium">
                {Math.round(generatedNames.reduce((sum, name) => sum + name.length, 0) / generatedNames.length)} chars
              </span>
            </div>
            <div>
              <span className="text-secondary-600">Mais curto:</span>
              <span className="ml-2 font-medium">
                {Math.min(...generatedNames.map(name => name.length))} chars
              </span>
            </div>
            <div>
              <span className="text-secondary-600">Mais longo:</span>
              <span className="ml-2 font-medium">
                {Math.max(...generatedNames.map(name => name.length))} chars
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
