import React, { createContext, useContext, useState } from 'react';

const UIContext = createContext();

export function UIProvider({ children }) {
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [showLoans, setShowLoansState] = useState(() => {
        return localStorage.getItem('showLoans') !== 'false';
    });

    const openSettings = () => setSettingsOpen(true);
    const closeSettings = () => setSettingsOpen(false);
    const toggleSettings = () => setSettingsOpen(prev => !prev);

    const setShowLoans = (value) => {
        setShowLoansState(value);
        localStorage.setItem('showLoans', value);
    };

    return (
        <UIContext.Provider value={{
            settingsOpen,
            openSettings,
            closeSettings,
            toggleSettings,
            showLoans,
            setShowLoans
        }}>
            {children}
        </UIContext.Provider>
    );
}

export function useUI() {
    return useContext(UIContext);
}
