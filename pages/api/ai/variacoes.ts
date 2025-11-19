import type { NextApiRequest, NextApiResponse } from 'next'

// Lazy import para evitar custo quando não usado
async function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null
  const { GoogleGenerativeAI } = await import('@google/generative-ai')
  return new GoogleGenerativeAI(apiKey)
}

// Modelos estáveis suportados
const PREFERRED_MODELS = ['gemini-1.5-pro', 'gemini-1.5-flash'] as const

function getSafeModel(client: any) {
  // Caso alguém edite manualmente, garantimos fallback para modelos suportados
  const envModel = process.env.GEMINI_MODEL?.trim()
  const candidates = envModel ? [envModel, ...PREFERRED_MODELS] : [...PREFERRED_MODELS]
  // Retorna o primeiro modelo disponível (não temos listagem; confiamos no try/catch na geração)
  return client.getGenerativeModel({ model: candidates[0] })
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  // SEMPRE retorna 200 - nunca 500
  try {
    const { mensagem, quantidade = 5 } = req.body || {}

    if (!mensagem || typeof mensagem !== 'string') {
      return res.status(200).json({ 
        success: false, 
        fallback: true, 
        reason: 'invalid_message' 
      })
    }

    const count = Math.min(Math.max(parseInt(String(quantidade)) || 1, 1), 1000) // Aumentado para 1000 variações

    // Verificar se a chave do Gemini está configurada
    const geminiKey = process.env.GEMINI_API_KEY
    if (!geminiKey || geminiKey === 'your_gemini_api_key_here') {
      return res.status(200).json({
        success: false,
        fallback: true,
        reason: 'gemini_missing_api_key'
      })
    }

    // Tentar usar Gemini 2.5 (disponível na conta)
    try {
      const client = await getGeminiClient()
      if (!client) {
        return res.status(200).json({
          success: false,
          fallback: true,
          reason: 'gemini_client_error'
        })
      }

      // Modelos Gemini 2.5 disponíveis (versões mais recentes)
      const modelsToTry = ['gemini-2.0-flash-exp', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.5-flash-002', 'gemini-1.5-pro-002']
      
      console.log('🤖 Tentando modelos Gemini disponíveis...')
      
      for (const modelName of modelsToTry) {
        try {
          console.log(`🔍 Testando modelo: ${modelName}`)
          const model = client.getGenerativeModel({ model: modelName })
          
          const prompt = `Gere ${count} variações da mensagem abaixo em português brasileiro. 
          Mantenha o mesmo contexto e significado. Use apenas sinônimos e pequenos ajustes.
          Preserve placeholders como {{nome}}, {{telefone}}.
          Retorne apenas um JSON array com as variações.
          
          Mensagem: ${mensagem}`

          const result = await model.generateContent(prompt)
          const text = result.response.text()
          
          // Tentar extrair JSON
          const match = text.match(/\[[\s\S]*\]/)
          const jsonText = match ? match[0] : text
          
          const variations = JSON.parse(jsonText)
          
          if (Array.isArray(variations) && variations.length > 0) {
            console.log(`✅ Modelo ${modelName} funcionou! Gerou ${variations.length} variações`)
            return res.status(200).json({ 
              success: true, 
              variations: variations.slice(0, count),
              modelUsed: modelName
            })
          }
          
        } catch (modelError) {
          console.error(`❌ Modelo ${modelName} falhou:`, modelError instanceof Error ? modelError.message : String(modelError))
          // Continuar para o próximo modelo
          continue
        }
      }
      
    } catch (aiError) {
      console.error('Gemini error:', aiError)
    }

    // Fallback: retornar que deve usar método local
    console.log('⚠️ Todos os modelos Gemini falharam, usando sistema local de variações')
    return res.status(200).json({
      success: false,
      fallback: true,
      reason: 'ai_failed',
      message: 'Usando sistema local de variações (todos os modelos Gemini falharam)'
    })

  } catch (error) {
    console.error('Route error:', error)
    return res.status(200).json({
      success: false,
      fallback: true,
      reason: 'internal_error'
    })
  }
}
