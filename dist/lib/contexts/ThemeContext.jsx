"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThemeProvider = ThemeProvider;
exports.useTheme = useTheme;
const react_1 = require("react");
const ThemeContext = (0, react_1.createContext)(undefined);
function ThemeProvider({ children }) {
    const [theme, setThemeState] = (0, react_1.useState)('light');
    const [mounted, setMounted] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        setMounted(true);
        // Carregar tema do localStorage ou preferência do sistema
        const saved = localStorage.getItem('theme');
        if (saved) {
            setThemeState(saved);
        }
        else {
            // Verificar preferência do sistema
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setThemeState(prefersDark ? 'dark' : 'light');
        }
    }, []);
    (0, react_1.useEffect)(() => {
        if (!mounted)
            return;
        // Aplicar tema ao documento
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        }
        else {
            root.classList.remove('dark');
        }
        // Salvar no localStorage
        localStorage.setItem('theme', theme);
    }, [theme, mounted]);
    const toggle = () => {
        setThemeState(prev => prev === 'light' ? 'dark' : 'light');
    };
    const setTheme = (newTheme) => {
        setThemeState(newTheme);
    };
    return (<ThemeContext.Provider value={{ theme, toggle, setTheme }}>
      {children}
    </ThemeContext.Provider>);
}
function useTheme() {
    const context = (0, react_1.useContext)(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
