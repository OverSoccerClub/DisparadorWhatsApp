"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.SidebarProvider = SidebarProvider;
exports.useSidebar = useSidebar;
const react_1 = require("react");
const SidebarContext = (0, react_1.createContext)(undefined);
function SidebarProvider({ children }) {
    const [isOpen, setIsOpen] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        // Carregar estado do localStorage ao montar
        const saved = localStorage.getItem('sidebarOpen');
        if (saved !== null) {
            setIsOpen(saved === 'true');
        }
    }, []);
    (0, react_1.useEffect)(() => {
        // Salvar estado no localStorage quando mudar
        localStorage.setItem('sidebarOpen', String(isOpen));
    }, [isOpen]);
    const toggle = () => setIsOpen(prev => !prev);
    const open = () => setIsOpen(true);
    const close = () => setIsOpen(false);
    return (<SidebarContext.Provider value={{ isOpen, toggle, open, close }}>
      {children}
    </SidebarContext.Provider>);
}
function useSidebar() {
    const context = (0, react_1.useContext)(SidebarContext);
    if (context === undefined) {
        throw new Error('useSidebar must be used within a SidebarProvider');
    }
    return context;
}
