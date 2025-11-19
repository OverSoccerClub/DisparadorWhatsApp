#!/usr/bin/env node
// Smoke check: valida que o servidor Next está respondendo e que as APIs principais estão vivas
// Permite sobrescrever a URL base via NEXT_PUBLIC_API_URL (útil quando Next escolhe outra porta)
const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
const endpoints = [
  `${base}/api/queue/stats`,
  `${base}/api/disparos-simple`
]

async function check(url, timeout = 30000) {
  console.log(`🔎 Verificando ${url} ...`)
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)

  try {
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(id)
    if (!res.ok) {
      console.error(`❌ ${url} retornou status ${res.status}`)
      return false
    }
    const data = await res.json().catch(() => null)
    console.log(`✅ ${url} OK`, data && typeof data === 'object' ? { keys: Object.keys(data).slice(0,5) } : undefined)
    return true
  } catch (err) {
    clearTimeout(id)
    console.error(`❌ Erro ao acessar ${url}:`, err && err.message ? err.message : String(err))
    return false
  }
}

(async () => {
  for (const url of endpoints) {
    const ok = await check(url, 30000)
    if (!ok) {
      console.error('\nSmoke check falhou')
      process.exit(1)
    }
  }

  console.log('\n🎉 Smoke check concluído com sucesso')
  process.exit(0)
})()
