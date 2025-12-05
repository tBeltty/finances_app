import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const { user, updateTheme: updateUserTheme } = useAuth();
    const [theme, setThemeState] = useState('cosmic');
    const [mode, setModeState] = useState('dark');

    // Initialize from user preference or local storage
    useEffect(() => {
        if (user) {
            setThemeState(user.theme || 'cosmic');
            setModeState(user.mode || 'dark');
        } else {
            const savedTheme = localStorage.getItem('theme');
            const savedMode = localStorage.getItem('mode');
            if (savedTheme) setThemeState(savedTheme);
            if (savedMode) setModeState(savedMode);
        }
    }, [user]);

    // Apply theme classes and attributes
    useEffect(() => {
        const root = document.documentElement;

        // Reset classes
        root.classList.remove('light', 'dark', 'theme-takito', 'theme-cookie', 'theme-cosmic');

        // Apply Mode (Attribute + Class for backward compat)
        root.setAttribute('data-theme', mode);
        if (mode === 'dark') {
            root.classList.add('dark');
        }

        console.log('THEME DEBUG:', 'theme=', theme, 'mode=', mode, 'classes=', root.className, 'data-theme=', root.getAttribute('data-theme'));

        // Apply Theme
        if (theme !== 'cosmic') {
            root.classList.add(`theme-${theme}`);
        }

        // Update Favicon
        const favicon = document.getElementById('favicon');
        if (favicon) {
            let iconName = 'icon.png'; // Default Cosmic
            if (theme === 'takito') iconName = 'logo-shiba.png';
            if (theme === 'cookie') iconName = 'logo-ragdoll.png';
            if (theme === 'cosmic') iconName = 'logo-cosmic.png';

            // Use the specific files I downloaded
            favicon.href = `/${iconName}`;
        }

        // Save to local storage
        localStorage.setItem('theme', theme);
        localStorage.setItem('mode', mode);

    }, [theme, mode]);

    const setTheme = async (newTheme) => {
        setThemeState(newTheme);
        if (user) {
            try {
                await updateUserTheme(newTheme, mode);
            } catch (error) {
                console.error('Failed to save theme preference', error);
            }
        }
    };

    const setMode = async (newMode) => {
        setModeState(newMode);
        if (user) {
            try {
                await updateUserTheme(theme, newMode);
            } catch (error) {
                console.error('Failed to save mode preference', error);
            }
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, mode, setTheme, setMode }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
