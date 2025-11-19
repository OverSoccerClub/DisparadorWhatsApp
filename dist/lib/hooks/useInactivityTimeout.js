"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useInactivityTimeout = useInactivityTimeout;
const react_1 = require("react");
/**
 * Hook para monitorar inatividade do usuário e executar callback após timeout
 */
function useInactivityTimeout({ timeout, onTimeout, events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'], enabled = true }) {
    const timeoutRef = (0, react_1.useRef)(null);
    const lastActivityRef = (0, react_1.useRef)(Date.now());
    // Função para resetar o timer
    const resetTimer = (0, react_1.useCallback)(() => {
        if (!enabled)
            return;
        // Limpar timer anterior
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        // Atualizar última atividade
        lastActivityRef.current = Date.now();
        // Criar novo timer
        timeoutRef.current = setTimeout(() => {
            const timeSinceLastActivity = Date.now() - lastActivityRef.current;
            // Verificar se realmente passou o timeout (pode haver pequenas diferenças)
            if (timeSinceLastActivity >= timeout) {
                onTimeout();
            }
        }, timeout);
    }, [timeout, onTimeout, enabled]);
    // Função para verificar inatividade
    const checkInactivity = (0, react_1.useCallback)(() => {
        if (!enabled)
            return;
        const timeSinceLastActivity = Date.now() - lastActivityRef.current;
        if (timeSinceLastActivity >= timeout) {
            onTimeout();
        }
        else {
            // Resetar timer com o tempo restante
            resetTimer();
        }
    }, [timeout, onTimeout, enabled, resetTimer]);
    (0, react_1.useEffect)(() => {
        if (!enabled) {
            // Limpar timer se desabilitado
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            return;
        }
        // Iniciar timer na montagem
        resetTimer();
        // Adicionar listeners para eventos de atividade
        events.forEach(event => {
            window.addEventListener(event, resetTimer, { passive: true });
        });
        // Verificar inatividade quando a janela ganha foco
        window.addEventListener('focus', checkInactivity);
        // Verificar inatividade quando a página fica visível
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                checkInactivity();
            }
        });
        // Cleanup
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            events.forEach(event => {
                window.removeEventListener(event, resetTimer);
            });
            window.removeEventListener('focus', checkInactivity);
        };
    }, [enabled, events, resetTimer, checkInactivity]);
    // Retornar função para resetar manualmente
    return {
        reset: resetTimer,
        getLastActivity: () => lastActivityRef.current
    };
}
