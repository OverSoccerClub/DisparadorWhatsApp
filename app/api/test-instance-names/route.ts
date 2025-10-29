import { NextRequest, NextResponse } from 'next/server'
import { InstanceNameGenerator } from '@/lib/instance-name-generator'
import { InstanceUniquenessChecker } from '@/lib/instance-uniqueness-checker'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || 'test-user-123'
    const count = parseInt(searchParams.get('count') || '5')

    console.log('Testando geração de nomes para usuário:', userId)

    const results = {
      userId,
      generatedNames: [] as any[],
      methods: {
        hashBased: [] as { name: string; length: number }[],
        timestampBased: [] as { name: string; length: number }[],
        uuidBased: [] as { name: string; length: number }[],
        sequential: [] as { name: string; length: number }[]
      }
    }

    // Testar diferentes métodos de geração
    for (let i = 0; i < count; i++) {
      const hashName = InstanceNameGenerator.generateInstanceName({ userId })
      const timestampName = InstanceNameGenerator.generateTimestampBasedName({ userId })
      const uuidName = InstanceNameGenerator.generateUUIDBasedName({ userId })
      const sequentialName = InstanceNameGenerator.generateSequentialName({ userId, sequence: i + 1 })

      results.methods.hashBased.push({
        name: hashName,
        length: hashName.length
      })

      results.methods.timestampBased.push({
        name: timestampName,
        length: timestampName.length
      })

      results.methods.uuidBased.push({
        name: uuidName,
        length: uuidName.length
      })

      results.methods.sequential.push({
        name: sequentialName,
        length: sequentialName.length
      })
    }

    // Testar geração de nome único
    try {
      const uniqueName = await InstanceNameGenerator.generateUniqueInstanceName(
        { userId },
        async (name) => {
          // Simular verificação (sempre retorna true para teste)
          return true
        }
      )

      results.generatedNames.push({
        method: 'unique',
        name: uniqueName,
        length: uniqueName.length
      })
    } catch (error) {
      console.error('Erro ao gerar nome único:', error)
    }

    // Testar validação de nomes
    const testNames = [
      'inst_valid123',
      'inst_valid-name',
      'inst_valid_name',
      '123invalid',
      'inst@invalid',
      'a', // muito curto
      'inst_' + 'a'.repeat(60) // muito longo
    ]

    const validationResults = testNames.map(name => ({
      name,
      validation: InstanceNameGenerator.validateInstanceName(name)
    }))

    return NextResponse.json({
      success: true,
      data: {
        ...results,
        validationResults,
        summary: {
          totalMethods: Object.keys(results.methods).length,
          totalNames: count,
          averageLength: {
            hashBased: results.methods.hashBased.reduce((sum, item) => sum + item.length, 0) / count,
            timestampBased: results.methods.timestampBased.reduce((sum, item) => sum + item.length, 0) / count,
            uuidBased: results.methods.uuidBased.reduce((sum, item) => sum + item.length, 0) / count,
            sequential: results.methods.sequential.reduce((sum, item) => sum + item.length, 0) / count
          }
        }
      }
    })

  } catch (error) {
    console.error('Erro ao testar geração de nomes:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao testar geração de nomes: ' + (error instanceof Error ? error.message : String(error))
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, customName, apiUrl, apiKey } = body

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'userId é obrigatório'
      }, { status: 400 })
    }

    let finalName: string

    if (customName) {
      // Gerar nome personalizado
      finalName = InstanceNameGenerator.generateCustomName(customName, { userId })
    } else {
      // Gerar nome automático
      finalName = await InstanceNameGenerator.generateUniqueInstanceName(
        { userId },
        async (name) => {
          if (apiUrl && apiKey) {
            const result = await InstanceUniquenessChecker.checkInstanceNameUniqueness(
              name,
              userId,
              apiUrl,
              apiKey
            )
            return result.isUnique
          }
          return true // Se não temos credenciais, assumir que é único
        }
      )
    }

    // Validar o nome gerado
    const validation = InstanceNameGenerator.validateInstanceName(finalName)

    return NextResponse.json({
      success: true,
      data: {
        generatedName: finalName,
        validation,
        length: finalName.length,
        method: customName ? 'custom' : 'automatic'
      }
    })

  } catch (error) {
    console.error('Erro ao gerar nome de instância:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao gerar nome de instância: ' + (error instanceof Error ? error.message : String(error))
    }, { status: 500 })
  }
}
