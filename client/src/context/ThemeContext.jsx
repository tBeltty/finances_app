import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ThemeContext = createContext();

// Logo options
const LOGOS = {
    cosmic: 'logo-cosmic.png',
    takito: 'logo-shiba.png',
    cookie: 'logo-ragdoll.png'
};

export const ThemeProvider = ({ children }) => {
    const { user, updateTheme: updateUserTheme } = useAuth();
    const [theme, setThemeState] = useState('cosmic');
    const [mode, setModeState] = useState('dark');
    const [logo, setLogoState] = useState('cosmic');

    // Initialize from user preference or local storage
    useEffect(() => {
        if (user) {
            setThemeState(user.theme || 'cosmic');
            setModeState(user.mode || 'dark');
            setLogoState(user.logo || 'cosmic');
        } else {
            const savedTheme = localStorage.getItem('theme');
            const savedMode = localStorage.getItem('mode');
            const savedLogo = localStorage.getItem('logo');
            if (savedTheme) setThemeState(savedTheme);
            if (savedMode) setModeState(savedMode);
            if (savedLogo) setLogoState(savedLogo);
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

        // Apply Theme
        if (theme !== 'cosmic') {
            root.classList.add(`theme-${theme}`);
        }

        // Get theme color based on theme + mode
        let themeColor = '#0f172a'; // Cosmic dark default
        if (theme === 'takito') {
            themeColor = mode === 'dark' ? '#0c0a09' : '#fffbeb';
        } else if (theme === 'cookie') {
            themeColor = mode === 'dark' ? '#082f49' : '#f0f9ff';
        } else {
            themeColor = mode === 'dark' ? '#020617' : '#f8fafc';
        }

        // Update theme-color meta tag
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', themeColor);
        }

        // Save to local storage
        localStorage.setItem('theme', theme);
        localStorage.setItem('mode', mode);

    }, [theme, mode]);

    // Apply logo changes (separate effect for logo)
    useEffect(() => {
        const iconName = LOGOS[logo] || LOGOS.cosmic;

        // Get current theme color for manifest
        let themeColor = '#0f172a';
        if (theme === 'takito') {
            themeColor = mode === 'dark' ? '#0c0a09' : '#fffbeb';
        } else if (theme === 'cookie') {
            themeColor = mode === 'dark' ? '#082f49' : '#f0f9ff';
        } else {
            themeColor = mode === 'dark' ? '#020617' : '#f8fafc';
        }

        // Update Favicon
        const favicon = document.getElementById('favicon');
        if (favicon) {
            favicon.href = `/${iconName}`;
        }

        // Update apple-touch-icon
        const appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]');
        if (appleTouchIcon) {
            appleTouchIcon.href = `/${iconName}`;
        }

        // Update PWA manifest dynamically
        const updateManifest = () => {
            const manifest = {
                name: 'tBelt Finanzas',
                short_name: 'Finanzas',
                description: 'Control de gastos y finanzas personales',
                start_url: '/',
                display: 'standalone',
                background_color: themeColor,
                theme_color: themeColor,
                icons: [
                    { src: `/${iconName}`, sizes: '192x192', type: 'image/png' },
                    { src: `/${iconName}`, sizes: '512x512', type: 'image/png' }
                ]
            };

            const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
            const manifestUrl = URL.createObjectURL(blob);

            let manifestLink = document.querySelector('link[rel="manifest"]');
            if (manifestLink) {
                if (manifestLink.href.startsWith('blob:')) {
                    URL.revokeObjectURL(manifestLink.href);
                }
                manifestLink.href = manifestUrl;
            }
        };

        updateManifest();

        // Save logo to local storage
        localStorage.setItem('logo', logo);

    }, [logo, theme, mode]);

    const setTheme = async (newTheme) => {
        setThemeState(newTheme);
        if (user) {
            try {
                await updateUserTheme(newTheme, mode, logo);
            } catch (error) {
                console.error('Failed to save theme preference', error);
            }
        }
    };

    const setMode = async (newMode) => {
        setModeState(newMode);
        if (user) {
            try {
                await updateUserTheme(theme, newMode, logo);
            } catch (error) {
                console.error('Failed to save mode preference', error);
            }
        }
    };

    const setLogo = async (newLogo) => {
        setLogoState(newLogo);
        if (user) {
            try {
                await updateUserTheme(theme, mode, newLogo);
            } catch (error) {
                console.error('Failed to save logo preference', error);
            }
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, mode, logo, setTheme, setMode, setLogo }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
