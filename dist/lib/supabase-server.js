"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSupabaseServerClient = createSupabaseServerClient;
exports.createSupabaseReadOnlyClient = createSupabaseReadOnlyClient;
const ssr_1 = require("@supabase/ssr");
const headers_1 = require("next/headers");
const server_1 = require("next/server");
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
/**
 * Cria um cliente Supabase com configuração correta de cookies (usando getAll/setAll)
 * Esta função corrige os avisos do @supabase/ssr sobre métodos deprecados
 */
async function createSupabaseServerClient() {
    const cookieStore = await (0, headers_1.cookies)();
    const response = new server_1.NextResponse();
    return {
        supabase: (0, ssr_1.createServerClient)(supabaseUrl, supabaseAnonKey, {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            response.cookies.set({
                                name,
                                value,
                                ...options,
                                sameSite: 'lax',
                                httpOnly: true,
                                secure: process.env.NODE_ENV === 'production'
                            });
                        });
                    }
                    catch (error) {
                        // Silenciar erro de cookies se não for possível definir
                    }
                },
            },
        }),
        response
    };
}
/**
 * Cria um cliente Supabase apenas para leitura (sem resposta para definir cookies)
 * Use apenas quando não precisar autenticar ou atualizar cookies
 */
async function createSupabaseReadOnlyClient() {
    const cookieStore = await (0, headers_1.cookies)();
    return (0, ssr_1.createServerClient)(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll() {
                // Não fazer nada - apenas leitura
            },
        },
    });
}
