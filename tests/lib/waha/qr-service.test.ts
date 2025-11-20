import { Buffer } from 'node:buffer'
import { describe, expect, beforeEach, afterEach, it, vi } from 'vitest'
import { WahaQrService } from '@/lib/waha/qr-service'

const pngBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAF/gL+R1koeQAAAABJRU5ErkJggg=='
const pngBuffer = Buffer.from(pngBase64, 'base64')

const jsonResponse = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      'content-type': 'application/json',
    },
    ...init,
  })

let fetchSpy: ReturnType<typeof vi.fn>

describe('WahaQrService', () => {
  beforeEach(() => {
    fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('retorna QR code via POST quando disponível', async () => {
    fetchSpy.mockImplementation(async (input, init) => {
      const url = input.toString()
      if (url.endsWith('/api/sessions')) {
        return jsonResponse([{ name: 'default' }])
      }
      if (url.endsWith('/api/default/auth/qr') && init?.method === 'POST') {
        return jsonResponse({ qr: 'data:image/png;base64,AAA' })
      }
      throw new Error(`Unexpected request ${url}`)
    })

    const service = new WahaQrService({ baseUrl: 'https://mocked.test' })
    const result = await service.fetchQrCode('default')

    expect(result.qrCode).toBe('data:image/png;base64,AAA')
    expect(result.method).toBe('POST')
    expect(result.source).toBe('json')
  })

  it('faz fallback para GET binário quando POST 404', async () => {
    fetchSpy.mockImplementation(async (input, init) => {
      const url = input.toString()
      if (url.endsWith('/api/sessions')) {
        return jsonResponse([])
      }
      if (url.endsWith('/api/default') && init?.method === 'POST') {
        return jsonResponse({}, { status: 201 })
      }
      if (url.endsWith('/api/default/start') && init?.method === 'POST') {
        return jsonResponse({}, { status: 200 })
      }
      if (url.endsWith('/api/default/auth/qr') && init?.method === 'POST') {
        return new Response('Not found', { status: 404 })
      }
      if (url.endsWith('/api/default/auth/qr') && init?.method === 'GET') {
        return new Response(pngBuffer, {
          status: 200,
          headers: { 'content-type': 'image/png' },
        })
      }
      throw new Error(`Unexpected request ${url}`)
    })

    const service = new WahaQrService({ baseUrl: 'https://mocked.test' })
    const result = await service.fetchQrCode('default')

    expect(result.method).toBe('GET')
    expect(result.source).toBe('image')
    expect(result.qrCode.startsWith('data:image/png;base64,')).toBe(true)
  })

  it('propaga erro quando WAHA não retorna QR reconhecido', async () => {
    fetchSpy.mockImplementation(async (input, init) => {
      const url = input.toString()
      if (url.endsWith('/api/sessions')) {
        return jsonResponse([{ name: 'default' }])
      }
      if (url.endsWith('/api/default/auth/qr') && init?.method === 'POST') {
        return jsonResponse({ unexpected: 'value' })
      }
      throw new Error(`Unexpected request ${url}`)
    })

    const service = new WahaQrService({ baseUrl: 'https://mocked.test' })
    await expect(service.fetchQrCode('default')).rejects.toThrow('Formato de QR code')
  })
})

