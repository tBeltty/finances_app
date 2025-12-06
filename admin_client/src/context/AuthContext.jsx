import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';
import Swal from 'sweetalert2';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadUser = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const { data } = await api.get('/auth/me');
            if (data.role !== 'admin') {
                throw new Error('Unauthorized Access: Admin Role Required');
            }
            setUser(data);
        } catch (error) {
            console.error(error);
            localStorage.removeItem('token');
            setUser(null);
            Swal.fire({
                icon: 'error',
                title: 'Access Denied',
                text: 'You do not have administrative privileges.',
                background: '#000',
                color: '#00ff00',
                confirmButtonColor: '#003300'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUser();
    }, []);

    const login = async (identifier, password, twoFactorToken) => {
        try {
            const { data } = await api.post('/auth/login', {
                username: identifier,
                password,
                twoFactorToken
            });

            if (data.require2FA) {
                return { require2FA: true };
            }

            // Check role from token is not secure enough, but server will rejecting subsequent requests anyway.
            // But we can check decoded token or just load user immediately.
            localStorage.setItem('token', data.token);
            await loadUser(); // Verify role immediately
            return { success: true };
        } catch (error) {
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
