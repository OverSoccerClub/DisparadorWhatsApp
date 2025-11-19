"use strict";
/**
 * Script para criar workflow no n8n via API HTTP
 *
 * Execute: node scripts/create-n8n-workflow.js
 *
 * Requer:
 * - N8N_API_URL (ex: https://mass-connect-n8n.zk02fr.easypanel.host/)
 * - N8N_API_KEY (obtenha no n8n: Settings > API)
 */
const https = require('https');
const http = require('http');
// Configuração - ALTERE AQUI
const N8N_API_URL = process.env.N8N_API_URL || 'https://mass-connect-n8n.zk02fr.easypanel.host';
const N8N_API_KEY = process.env.N8N_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0ZWQ3NjJhMi1iZDMwLTQ0ODAtYTFhNC00ZmJlNDI3ZTJiMzIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYzNDA1NDMzfQ.-p7CH3DUsvv0XGeRO5Yl06Jtmna5HrS6VM9M9IzDV9Y';
// Workflow completo
const workflow = {
    name: "WhatsApp - Envio de Código de Ativação",
    nodes: [
        {
            parameters: {
                httpMethod: "POST",
                path: "activation-code",
                responseMode: "lastNode",
                responseData: "firstEntryJson"
            },
            id: "webhook-1",
            name: "Webhook",
            type: "n8n-nodes-base.webhook",
            typeVersion: 2.1,
            position: [250, 300]
        },
        {
            parameters: {
                jsCode: `// Extrair dados do webhook
const phone = $input.item.json.phone;
const message = $input.item.json.message;
const code = $input.item.json.code;
const name = $input.item.json.name || 'Usuário';
const email = $input.item.json.email || '';

// Validar dados obrigatórios
if (!phone || !code) {
  throw new Error('Telefone e código são obrigatórios');
}

// Normalizar telefone (remover caracteres não numéricos, exceto +)
let normalizedPhone = phone.replace(/[^\\d+]/g, '');

// Garantir formato internacional se necessário
if (normalizedPhone.length === 11 && !normalizedPhone.startsWith('+')) {
  // Número brasileiro: adicionar código do país
  normalizedPhone = \`55\${normalizedPhone}\`;
}

// Retornar dados formatados
return {
  json: {
    phone: normalizedPhone,
    message: message,
    code: code,
    name: name,
    email: email,
    originalPhone: phone
  }
};`
            },
            id: "code-1",
            name: "Processar Dados",
            type: "n8n-nodes-base.code",
            typeVersion: 2,
            position: [450, 300]
        },
        {
            parameters: {
                method: "POST",
                url: "={{ $env.EVOLUTION_API_URL }}/message/sendText/{{ $env.EVOLUTION_INSTANCE_NAME }}",
                sendHeaders: true,
                headerParameters: {
                    parameters: [
                        {
                            name: "apikey",
                            value: "={{ $env.EVOLUTION_API_KEY }}"
                        },
                        {
                            name: "Content-Type",
                            value: "application/json"
                        }
                    ]
                },
                sendBody: true,
                contentType: "json",
                specifyBody: "json",
                jsonBody: `={
  "number": "{{ $json.phone }}",
  "text": "{{ $json.message }}",
  "delay": 1200,
  "linkPreview": false
}`
            },
            id: "http-1",
            name: "Enviar via Evolution API",
            type: "n8n-nodes-base.httpRequest",
            typeVersion: 4.3,
            position: [650, 200]
        },
        {
            parameters: {
                respondWith: "json",
                responseBody: `={
  "success": true,
  "message": "Código enviado com sucesso",
  "phone": "{{ $('Processar Dados').item.json.phone }}",
  "code": "{{ $('Processar Dados').item.json.code }}",
  "timestamp": "{{ $now }}"
}`
            },
            id: "respond-1",
            name: "Resposta de Sucesso",
            type: "n8n-nodes-base.respondToWebhook",
            typeVersion: 1.4,
            position: [850, 300]
        }
    ],
    connections: {
        "Webhook": {
            main: [
                [
                    {
                        node: "Processar Dados",
                        type: "main",
                        index: 0
                    }
                ]
            ]
        },
        "Processar Dados": {
            main: [
                [
                    {
                        node: "Enviar via Evolution API",
                        type: "main",
                        index: 0
                    }
                ]
            ]
        },
        "Enviar via Evolution API": {
            main: [
                [
                    {
                        node: "Resposta de Sucesso",
                        type: "main",
                        index: 0
                    }
                ]
            ]
        }
    },
    settings: {
        executionOrder: "v1"
    }
};
// Função para fazer requisição HTTP/HTTPS
function makeRequest(url, options, data) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === 'https:';
        const client = isHttps ? https : http;
        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || (isHttps ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-N8N-API-KEY': N8N_API_KEY,
                ...options.headers
            }
        };
        const req = client.request(requestOptions, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve({ status: res.statusCode, data: parsed });
                }
                catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });
        req.on('error', (error) => {
            reject(error);
        });
        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}
// Criar workflow
async function createWorkflow() {
    console.log('🚀 Criando workflow no n8n...\n');
    console.log(`📡 Servidor: ${N8N_API_URL}`);
    console.log(`🔑 API Key: ${N8N_API_KEY.substring(0, 10)}...\n`);
    if (N8N_API_KEY === 'SUA_API_KEY_AQUI') {
        console.error('❌ ERRO: Configure N8N_API_KEY!');
        console.log('\n📋 Como obter a API Key:');
        console.log('1. Acesse seu n8n: ' + N8N_API_URL);
        console.log('2. Vá em Settings > API');
        console.log('3. Crie uma API Key');
        console.log('4. Execute: N8N_API_KEY=sua-key node scripts/create-n8n-workflow.js');
        process.exit(1);
    }
    try {
        const apiUrl = `${N8N_API_URL}/api/v1/workflows`;
        console.log('📤 Enviando requisição...');
        const response = await makeRequest(apiUrl, {
            method: 'POST'
        }, workflow);
        if (response.status === 200 || response.status === 201) {
            console.log('✅ Workflow criado com sucesso!');
            console.log(`\n📋 Detalhes:`);
            console.log(`   ID: ${response.data.id}`);
            console.log(`   Nome: ${response.data.name}`);
            console.log(`   Ativo: ${response.data.active ? 'Sim' : 'Não'}`);
            // Buscar webhook ID do nó Webhook
            const webhookNode = response.data.nodes?.find(node => node.type === 'n8n-nodes-base.webhook');
            if (webhookNode && webhookNode.webhookId) {
                const webhookUrl = `${N8N_API_URL}/webhook/${webhookNode.webhookId}`;
                console.log(`\n🔗 URL do Webhook:`);
                console.log(`   ${webhookUrl}`);
                console.log(`\n💡 Adicione no .env.local:`);
                console.log(`   N8N_WEBHOOK_URL=${webhookUrl}`);
            }
            else {
                // Tentar obter via path
                const webhookPath = webhookNode?.parameters?.path || 'activation-code';
                console.log(`\n🔗 URL do Webhook (após ativar):`);
                console.log(`   ${N8N_API_URL}/webhook/${webhookPath}`);
                console.log(`\n💡 Após ativar o workflow, copie a URL completa do webhook`);
            }
            console.log(`\n⚠️  IMPORTANTE:`);
            console.log(`   1. Configure as variáveis de ambiente no n8n:`);
            console.log(`      - EVOLUTION_API_URL`);
            console.log(`      - EVOLUTION_INSTANCE_NAME`);
            console.log(`      - EVOLUTION_API_KEY`);
            console.log(`   2. Ative o workflow no n8n`);
            console.log(`   3. Teste o webhook`);
        }
        else {
            console.error(`❌ Erro ao criar workflow: ${response.status}`);
            console.error(`Resposta:`, JSON.stringify(response.data, null, 2));
            if (response.status === 401) {
                console.error('\n🔐 Erro de autenticação!');
                console.error('Verifique se a API Key está correta.');
            }
        }
    }
    catch (error) {
        console.error('❌ Erro:', error.message);
        console.error('\n💡 Verifique:');
        console.error('   - Se a URL do n8n está correta');
        console.error('   - Se a API Key está correta');
        console.error('   - Se o servidor n8n está acessível');
    }
}
// Executar
createWorkflow();
