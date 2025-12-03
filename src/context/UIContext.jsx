import React, { createContext, useContext, useState } from 'react';

const UIContext = createContext();

export function UIProvider({ children }) {
    const [settingsOpen, setSettingsOpen] = useState(false);

    const openSettings = () => setSettingsOpen(true);
    const closeSettings = () => setSettingsOpen(false);
    const toggleSettings = () => setSettingsOpen(prev => !prev);

    return (
        <UIContext.Provider value={{ settingsOpen, openSettings, closeSettings, toggleSettings }}>
            {children}
        </UIContext.Provider>
    );
}

export function useUI() {
    return useContext(UIContext);
}
