"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMessageVariations = generateMessageVariations;
exports.detectMessageType = detectMessageType;
exports.generateTypedVariations = generateTypedVariations;
// Dicionário completo de sinônimos para manter o contexto
const synonymDictionary = {
    // Saudações
    'olá': ['oi', 'olá', 'e aí', 'salve', 'beleza'],
    'oi': ['olá', 'oi', 'e aí', 'salve', 'beleza'],
    'bom dia': ['bom dia', 'bom dia', 'bom dia', 'bom dia'],
    'boa tarde': ['boa tarde', 'boa tarde', 'boa tarde', 'boa tarde'],
    'boa noite': ['boa noite', 'boa noite', 'boa noite', 'boa noite'],
    // Conectores
    'espero que esteja bem': ['espero que esteja bem', 'espero que esteja tudo bem', 'espero que esteja ótimo', 'espero que esteja excelente'],
    'espero que esteja tudo bem': ['espero que esteja bem', 'espero que esteja tudo bem', 'espero que esteja ótimo', 'espero que esteja excelente'],
    'como vai': ['como vai', 'como está', 'como anda', 'como tem passado'],
    'como está': ['como vai', 'como está', 'como anda', 'como tem passado'],
    // Palavras de negócio
    'promoção': ['oferta', 'desconto', 'promoção', 'oportunidade', 'vantagem'],
    'oferta': ['promoção', 'desconto', 'oferta', 'oportunidade', 'vantagem'],
    'desconto': ['promoção', 'oferta', 'desconto', 'redução', 'abatimento'],
    'produto': ['item', 'produto', 'artigo', 'mercadoria', 'peça'],
    'item': ['produto', 'artigo', 'item', 'mercadoria', 'peça'],
    'preço': ['valor', 'preço', 'custo', 'investimento', 'taxa'],
    'valor': ['preço', 'custo', 'valor', 'investimento', 'taxa'],
    'comprar': ['adquirir', 'comprar', 'obter', 'levar', 'pegar'],
    'adquirir': ['comprar', 'obter', 'adquirir', 'levar', 'pegar'],
    'venda': ['vendas', 'comercialização', 'negócio', 'transação'],
    'vendas': ['venda', 'comercialização', 'negócio', 'transação'],
    // Pessoas
    'cliente': ['cliente', 'amigo', 'pessoa', 'você', 'senhor(a)'],
    'amigo': ['cliente', 'amigo', 'pessoa', 'você', 'senhor(a)'],
    'pessoa': ['cliente', 'amigo', 'pessoa', 'você', 'senhor(a)'],
    'você': ['cliente', 'amigo', 'pessoa', 'você', 'senhor(a)'],
    // Empresa
    'empresa': ['empresa', 'companhia', 'negócio', 'marca', 'organização'],
    'companhia': ['empresa', 'companhia', 'negócio', 'marca', 'organização'],
    'negócio': ['empresa', 'companhia', 'negócio', 'marca', 'organização'],
    'marca': ['empresa', 'companhia', 'negócio', 'marca', 'organização'],
    // Contato
    'contato': ['contato', 'comunicação', 'ligação', 'chamada', 'conversa'],
    'comunicação': ['contato', 'comunicação', 'ligação', 'chamada', 'conversa'],
    'ligação': ['contato', 'comunicação', 'ligação', 'chamada', 'conversa'],
    'chamada': ['contato', 'comunicação', 'ligação', 'chamada', 'conversa'],
    // Tempo
    'hoje': ['hoje', 'agora', 'neste momento', 'já', 'imediatamente'],
    'agora': ['hoje', 'agora', 'neste momento', 'já', 'imediatamente'],
    'amanhã': ['amanhã', 'próximo dia', 'depois', 'futuro', 'em breve'],
    'depois': ['amanhã', 'próximo dia', 'depois', 'futuro', 'em breve'],
    'semana': ['semana', 'período', 'tempo', 'prazo', 'intervalo'],
    'mês': ['mês', 'período', 'tempo', 'prazo', 'intervalo'],
    'ano': ['ano', 'período', 'tempo', 'prazo', 'intervalo'],
    // Qualificadores
    'excelente': ['excelente', 'fantástico', 'maravilhoso', 'incrível', 'extraordinário'],
    'fantástico': ['excelente', 'fantástico', 'maravilhoso', 'incrível', 'extraordinário'],
    'maravilhoso': ['excelente', 'fantástico', 'maravilhoso', 'incrível', 'extraordinário'],
    'ótimo': ['ótimo', 'bom', 'legal', 'bacana', 'show'],
    'bom': ['ótimo', 'bom', 'legal', 'bacana', 'show'],
    'legal': ['ótimo', 'bom', 'legal', 'bacana', 'show'],
    // Ações
    'obrigado': ['obrigado', 'obrigada', 'valeu', 'valeu mesmo', 'muito obrigado'],
    'obrigada': ['obrigado', 'obrigada', 'valeu', 'valeu mesmo', 'muito obrigado'],
    'valeu': ['obrigado', 'obrigada', 'valeu', 'valeu mesmo', 'muito obrigado'],
    'desculpe': ['desculpe', 'desculpa', 'peço desculpas', 'me desculpe'],
    'desculpa': ['desculpe', 'desculpa', 'peço desculpas', 'me desculpe'],
    // Urgência
    'urgente': ['urgente', 'importante', 'prioritário', 'crítico', 'essencial'],
    'importante': ['urgente', 'importante', 'prioritário', 'crítico', 'essencial'],
    'prioritário': ['urgente', 'importante', 'prioritário', 'crítico', 'essencial'],
    // Finalizações
    'atenciosamente': ['atenciosamente', 'cordialmente', 'respeitosamente'],
    'cordialmente': ['atenciosamente', 'cordialmente', 'respeitosamente'],
    'abraços': ['abraços', 'um abraço', 'abraços', 'um abraço'],
    'um abraço': ['abraços', 'um abraço', 'abraços', 'um abraço'],
    // Tecnologia
    'email': ['email', 'e-mail', 'correio eletrônico', 'mensagem eletrônica'],
    'e-mail': ['email', 'e-mail', 'correio eletrônico', 'mensagem eletrônica'],
    'telefone': ['telefone', 'celular', 'whatsapp', 'número', 'contato'],
    'celular': ['telefone', 'celular', 'whatsapp', 'número', 'contato'],
    'whatsapp': ['telefone', 'celular', 'whatsapp', 'número', 'contato']
};
// Função para gerar variações usando apenas sinônimos
function generateMessageVariations(message, count) {
    if (count <= 1)
        return [message];
    const variations = [message]; // Primeira variação é a original
    for (let i = 1; i < count; i++) {
        let variation = message;
        let attempts = 0;
        const maxAttempts = 10; // Evitar loop infinito
        // Aplicar substituições até encontrar uma variação única
        while (attempts < maxAttempts) {
            // Aplicar substituições de sinônimos
            variation = applySynonymSubstitutions(variation, i + attempts);
            // Se for diferente das anteriores, usar esta variação
            if (!variations.includes(variation)) {
                break;
            }
            // Se for igual, aplicar mais substituições
            variation = applyMoreSynonymSubstitutions(variation, i + attempts);
            attempts++;
        }
        // Se ainda for igual após tentativas, adicionar sufixo único
        if (variations.includes(variation)) {
            variation = `${variation} (${i})`;
        }
        variations.push(variation);
    }
    return variations;
}
// Função para aplicar substituições de sinônimos
function applySynonymSubstitutions(message, variationIndex) {
    let variation = message;
    // Aplicar substituições de sinônimos de forma inteligente
    Object.entries(synonymDictionary).forEach(([original, synonyms]) => {
        const regex = new RegExp(`\\b${original}\\b`, 'gi');
        if (regex.test(variation)) {
            // Escolher sinônimo baseado no índice da variação
            const synonymIndex = variationIndex % synonyms.length;
            const chosenSynonym = synonyms[synonymIndex];
            variation = variation.replace(regex, chosenSynonym);
        }
    });
    return variation;
}
// Função para aplicar mais substituições quando necessário
function applyMoreSynonymSubstitutions(message, variationIndex) {
    let variation = message;
    // Aplicar substituições mais agressivas
    Object.entries(synonymDictionary).forEach(([original, synonyms]) => {
        const regex = new RegExp(`\\b${original}\\b`, 'gi');
        if (regex.test(variation)) {
            // Usar índice diferente para garantir variação
            const synonymIndex = (variationIndex * 2) % synonyms.length;
            const chosenSynonym = synonyms[synonymIndex];
            variation = variation.replace(regex, chosenSynonym);
        }
    });
    return variation;
}
// Função para detectar o tipo de mensagem (simplificada)
function detectMessageType(message) {
    const lowerMessage = message.toLowerCase();
    if (/promoção|desconto|oferta|venda|preço|comprar/i.test(lowerMessage)) {
        return 'promocional';
    }
    if (/empresa|negócio|cliente|serviço|produto/i.test(lowerMessage)) {
        return 'comercial';
    }
    if (/informação|notícia|atualização|comunicado/i.test(lowerMessage)) {
        return 'informativa';
    }
    return 'pessoal'; // Default
}
// Função para gerar variações baseadas no tipo de mensagem (usando apenas sinônimos)
function generateTypedVariations(message, count) {
    // Usar apenas a função de sinônimos, sem adicionar frases extras
    return generateMessageVariations(message, count);
}
