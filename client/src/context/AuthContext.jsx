import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadUser = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const userRes = await fetch('/api/auth/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (userRes.ok) {
                    const userDetails = await userRes.json();
                    console.log("AuthContext: Loaded user:", userDetails);
                    setUser({ ...userDetails, token });
                } else {
                    // Token is invalid, clear it
                    localStorage.removeItem('token');
                    localStorage.removeItem('username');
                }
            } catch (error) {
                console.error('Error loading user:', error);
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        loadUser();
    }, []);

    const refreshUser = () => loadUser();

    const login = async (username, password, twoFactorToken = null) => {
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, twoFactorToken })
            });

            const data = await res.json();

            if (data.require2FA) {
                return { require2FA: true };
            }

            if (res.ok && data.token) {
                // Fetch full user details
                const userRes = await fetch('/api/auth/me', {
                    headers: { 'Authorization': `Bearer ${data.token}` }
                });

                if (userRes.ok) {
                    const userDetails = await userRes.json();
                    const fullUser = { ...userDetails, token: data.token };
                    setUser(fullUser);
                    localStorage.setItem('token', data.token);
                    return { success: true };
                }
            }

            return { success: false, message: data.message };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Error de conexión' };
        }
    };

    const register = async (username, password, email) => {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, email }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Error en registro');

            return { success: true, message: data.message };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
