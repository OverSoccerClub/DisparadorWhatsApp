'use client'

import { CloudIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline'

export type DispatchMethod = 'evolution' | 'waha'

interface DispatchMethodSelectorProps {
  value: DispatchMethod
  onChange: (method: DispatchMethod) => void
  className?: string
}

export default function DispatchMethodSelector({ 
  value, 
  onChange, 
  className = '' 
}: DispatchMethodSelectorProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-secondary-700">
        Método de Envio
      </label>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Evolution API */}
        <button
          type="button"
          onClick={() => onChange('evolution')}
          className={`
            relative p-6 border-2 rounded-lg transition-all duration-200
            hover:shadow-md active:scale-[0.98]
            ${value === 'evolution' 
              ? 'border-primary-500 bg-primary-50 shadow-sm' 
              : 'border-secondary-200 bg-white hover:border-secondary-300'
            }
          `}
        >
          {/* Checkmark de seleção */}
          {value === 'evolution' && (
            <div className="absolute top-3 right-3">
              <div className="flex items-center justify-center w-6 h-6 bg-primary-500 rounded-full">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          )}
          
          <div className="flex flex-col items-center text-center space-y-3">
            <div className={`
              flex items-center justify-center w-16 h-16 rounded-full transition-colors
              ${value === 'evolution' 
                ? 'bg-primary-100' 
                : 'bg-secondary-100'
              }
            `}>
              <CloudIcon className={`
                h-8 w-8
                ${value === 'evolution' 
                  ? 'text-primary-600' 
                  : 'text-secondary-600'
                }
              `} />
            </div>
            
            <div>
              <h3 className={`
                text-lg font-semibold
                ${value === 'evolution' 
                  ? 'text-primary-900' 
                  : 'text-secondary-900'
                }
              `}>
                Evolution API
              </h3>
              <p className="mt-1 text-sm text-secondary-600">
                Envio via instâncias Evolution
              </p>
            </div>
            
            <div className="flex items-center space-x-2 text-xs text-secondary-500">
              <div className="flex items-center space-x-1">
                <span className="w-2 h-2 bg-success-500 rounded-full"></span>
                <span>Estável</span>
              </div>
              <span>•</span>
              <span>Multi-instância</span>
            </div>
          </div>
        </button>

        {/* WAHA API */}
        <button
          type="button"
          onClick={() => onChange('waha')}
          className={`
            relative p-6 border-2 rounded-lg transition-all duration-200
            hover:shadow-md active:scale-[0.98]
            ${value === 'waha' 
              ? 'border-primary-500 bg-primary-50 shadow-sm' 
              : 'border-secondary-200 bg-white hover:border-secondary-300'
            }
          `}
        >
          {/* Checkmark de seleção */}
          {value === 'waha' && (
            <div className="absolute top-3 right-3">
              <div className="flex items-center justify-center w-6 h-6 bg-primary-500 rounded-full">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          )}
          
          <div className="flex flex-col items-center text-center space-y-3">
            <div className={`
              flex items-center justify-center w-16 h-16 rounded-full transition-colors
              ${value === 'waha' 
                ? 'bg-primary-100' 
                : 'bg-secondary-100'
              }
            `}>
              <DevicePhoneMobileIcon className={`
                h-8 w-8
                ${value === 'waha' 
                  ? 'text-primary-600' 
                  : 'text-secondary-600'
                }
              `} />
            </div>
            
            <div>
              <h3 className={`
                text-lg font-semibold
                ${value === 'waha' 
                  ? 'text-primary-900' 
                  : 'text-secondary-900'
                }
              `}>
                WAHA API
              </h3>
              <p className="mt-1 text-sm text-secondary-600">
                Envio via sessões WAHA
              </p>
            </div>
            
            <div className="flex items-center space-x-2 text-xs text-secondary-500">
              <div className="flex items-center space-x-1">
                <span className="w-2 h-2 bg-success-500 rounded-full"></span>
                <span>Moderno</span>
              </div>
              <span>•</span>
              <span>Multi-servidor</span>
            </div>
          </div>
        </button>
      </div>
      
      {/* Descrição adicional baseada na seleção */}
      <div className="p-4 bg-secondary-50 rounded-lg border border-secondary-200">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1 text-sm text-secondary-700">
            {value === 'evolution' ? (
              <>
                <span className="font-medium">Evolution API:</span> Ideal para quem já possui instâncias configuradas. 
                Suporta distribuição inteligente de mensagens entre múltiplas instâncias conectadas.
              </>
            ) : (
              <>
                <span className="font-medium">WAHA API:</span> Solução moderna com suporte a múltiplos servidores WAHA. 
                Perfeito para balanceamento de carga e alta disponibilidade.
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

