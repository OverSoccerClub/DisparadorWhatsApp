import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPhoneNumber(phone: string): string {
  // Remove todos os caracteres não numéricos
  const cleaned = phone.replace(/\D/g, '')
  
  // Se começar com 55 (Brasil), mantém
  if (cleaned.startsWith('55')) {
    return cleaned
  }
  
  // Se começar com 0, remove o 0 e adiciona 55
  if (cleaned.startsWith('0')) {
    return '55' + cleaned.substring(1)
  }
  
  // Se não tem código do país, adiciona 55
  if (cleaned.length <= 11) {
    return '55' + cleaned
  }
  
  return cleaned
}

export function validatePhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  // Número brasileiro válido: 55 + DDD (2 dígitos) + número (8 ou 9 dígitos)
  return /^55\d{10,11}$/.test(cleaned)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}
