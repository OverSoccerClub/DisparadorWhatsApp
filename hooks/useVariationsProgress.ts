import { useState, useCallback } from 'react'

export interface VariationsProgress {
  totalVariations: number
  generatedVariations: number
  currentVariation?: string
  estimatedTime?: string
  messageType?: string
}

export interface VariationsProgressState {
  isActive: boolean
  progress: VariationsProgress
}

export function useVariationsProgress() {
  const [state, setState] = useState<VariationsProgressState>({
    isActive: false,
    progress: {
      totalVariations: 0,
      generatedVariations: 0
    }
  })

  const startGeneration = useCallback((totalVariations: number, messageType?: string) => {
    setState({
      isActive: true,
      progress: {
        totalVariations,
        generatedVariations: 0,
        messageType
      }
    })
  }, [])

  const updateCurrentVariation = useCallback((variation: string) => {
    setState(prev => ({
      ...prev,
      progress: {
        ...prev.progress,
        currentVariation: variation
      }
    }))
  }, [])

  const markVariationGenerated = useCallback(() => {
    setState(prev => {
      const newGenerated = prev.progress.generatedVariations + 1
      const total = prev.progress.totalVariations
      const progress = total > 0 ? Math.round((newGenerated / total) * 100) : 0
      
      return {
        ...prev,
        progress: {
          ...prev.progress,
          generatedVariations: newGenerated,
          currentVariation: undefined
        }
      }
    })
  }, [])

  const finishGeneration = useCallback(() => {
    setState(prev => ({
      ...prev,
      isActive: false
    }))
  }, [])

  const reset = useCallback(() => {
    setState({
      isActive: false,
      progress: {
        totalVariations: 0,
        generatedVariations: 0
      }
    })
  }, [])

  return {
    state,
    startGeneration,
    updateCurrentVariation,
    markVariationGenerated,
    finishGeneration,
    reset
  }
}
