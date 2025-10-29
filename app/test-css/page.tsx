export default function TestCSS() {
  return (
    <div className="min-h-screen bg-secondary-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-secondary-900 mb-6">Teste de CSS</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-3">Card 1</h2>
            <p className="text-secondary-600 mb-4">Este é um card de teste para verificar se o CSS está funcionando.</p>
            <button className="btn btn-primary btn-sm">Botão Primário</button>
          </div>
          
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-3">Card 2</h2>
            <p className="text-secondary-600 mb-4">Outro card para testar os estilos.</p>
            <button className="btn btn-secondary btn-sm">Botão Secundário</button>
          </div>
          
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-3">Card 3</h2>
            <p className="text-secondary-600 mb-4">Terceiro card para completar o grid.</p>
            <button className="btn btn-success btn-sm">Botão Sucesso</button>
          </div>
        </div>
        
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-secondary-900 mb-4">Cores do Sistema</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-primary-500 text-white p-4 rounded-lg text-center">
              <div className="font-semibold">Primary</div>
              <div className="text-sm opacity-90">#2563eb</div>
            </div>
            <div className="bg-success-500 text-white p-4 rounded-lg text-center">
              <div className="font-semibold">Success</div>
              <div className="text-sm opacity-90">#10b981</div>
            </div>
            <div className="bg-warning-500 text-white p-4 rounded-lg text-center">
              <div className="font-semibold">Warning</div>
              <div className="text-sm opacity-90">#f59e0b</div>
            </div>
            <div className="bg-error-500 text-white p-4 rounded-lg text-center">
              <div className="font-semibold">Error</div>
              <div className="text-sm opacity-90">#ef4444</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
