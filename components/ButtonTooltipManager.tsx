'use client'

import { useEffect } from 'react'

/**
 * Observa interações do usuário e garante que todos os botões tenham um tooltip
 * amigável, usando o texto ou aria-label como fallback.
 */
export default function ButtonTooltipManager() {
  useEffect(() => {
    const ensureTooltip = (target: HTMLElement | null) => {
      if (!target) return
      if (target.getAttribute('data-tooltip')) return

      const label =
        target.getAttribute('aria-label') ||
        target.getAttribute('title') ||
        target.textContent?.trim()

      if (label) {
        target.setAttribute('data-tooltip', label)
      }
    }

    const handlePointerEnter = (event: Event) => {
      const target = event.target
      if (!(target instanceof Element) || typeof target.closest !== 'function') {
        return
      }

      const node = target.closest('button, [role="button"]') as HTMLElement | null
      if (node) {
        ensureTooltip(node)
      }
    }

    document.addEventListener('pointerenter', handlePointerEnter, true)

    return () => {
      document.removeEventListener('pointerenter', handlePointerEnter, true)
    }
  }, [])

  return null
}

