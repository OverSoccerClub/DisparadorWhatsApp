"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthProvider = AuthProvider;
exports.useAuth = useAuth;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const react_hot_toast_1 = require("react-hot-toast");
const useInactivityTimeout_1 = require("./useInactivityTimeout");
const AuthContext = (0, react_1.createContext)(undefined);
function AuthProvider({ children }) {
    const [user, setUser] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const router = (0, navigation_1.useRouter)();
    // Verificar se usuário está autenticado (memoizado)
    const checkAuth = (0, react_1.useCallback)(async () => {
        try {
            const response = await fetch('/api/auth/me', {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                setUser(data.user);
            }
            else {
                setUser(null);
            }
        }
        catch (error) {
            setUser(null);
        }
        finally {
            setLoading(false);
        }
    }, []);
    // Login (memoizado)
    const login = (0, react_1.useCallback)(async (email, password) => {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (data.success) {
                setUser(data.user);
                react_hot_toast_1.toast.success('Login realizado com sucesso!');
                return true;
            }
            else {
                react_hot_toast_1.toast.error(data.message);
                return false;
            }
        }
        catch (error) {
            react_hot_toast_1.toast.error('Erro interno do servidor');
            return false;
        }
    }, []);
    // Registro (memoizado)
    const register = (0, react_1.useCallback)(async (email, password, name) => {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password, name })
            });
            const data = await response.json();
            if (data.success) {
                setUser(data.user);
                react_hot_toast_1.toast.success('Conta criada com sucesso!');
                return true;
            }
            else {
                react_hot_toast_1.toast.error(data.message);
                return false;
            }
        }
        catch (error) {
            react_hot_toast_1.toast.error('Erro interno do servidor');
            return false;
        }
    }, []);
    // Logout (memoizado)
    const logout = (0, react_1.useCallback)(async () => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST'
            });
        }
        catch (error) {
            // Erro silencioso no logout
        }
        finally {
            setUser(null);
            react_hot_toast_1.toast.success('Logout realizado com sucesso!');
            router.push('/auth');
        }
    }, [router]);
    // Atualizar dados do usuário (memoizado)
    const refreshUser = (0, react_1.useCallback)(async () => {
        await checkAuth();
    }, [checkAuth]);
    // Verificar autenticação na inicialização
    (0, react_1.useEffect)(() => {
        // Só verificar autenticação no cliente
        if (typeof window !== 'undefined') {
            checkAuth();
        }
        else {
            setLoading(false);
        }
    }, [checkAuth]);
    // Monitorar inatividade e fazer logout automático após 30 minutos
    const handleInactivityTimeout = (0, react_1.useCallback)(async () => {
        if (user) {
            // Mostrar notificação antes de fazer logout
            react_hot_toast_1.toast.error('Sessão expirada por inatividade. Faça login novamente.', {
                duration: 5000,
                icon: '⏱️'
            });
            // Fazer logout
            await logout();
        }
    }, [user, logout]);
    // Configurar timeout de inatividade (30 minutos = 30 * 60 * 1000 ms)
    (0, useInactivityTimeout_1.useInactivityTimeout)({
        timeout: 30 * 60 * 1000, // 30 minutos em milissegundos
        onTimeout: handleInactivityTimeout,
        enabled: !!user // Só monitorar se o usuário estiver logado
    });
    // Memoizar o valor do contexto
    const value = (0, react_1.useMemo)(() => ({
        user,
        loading,
        login,
        register,
        logout,
        refreshUser
    }), [user, loading, login, register, logout, refreshUser]);
    return (<AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>);
}
function useAuth() {
    const context = (0, react_1.useContext)(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }
    return context;
}
