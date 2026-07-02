import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();
const AUTH_STORAGE_KEY = 'userInfo';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const syncUserFromStorage = () => {
            const userInfo = localStorage.getItem(AUTH_STORAGE_KEY);

            if (!userInfo) {
                setUser(null);
                return;
            }

            try {
                setUser(JSON.parse(userInfo));
            } catch (error) {
                localStorage.removeItem(AUTH_STORAGE_KEY);
                setUser(null);
            }
        };

        syncUserFromStorage();

        const handleStorage = (event) => {
            if (!event || event.key === AUTH_STORAGE_KEY) {
                syncUserFromStorage();
            }
        };

        const handleUnauthorized = () => {
            setUser(null);
        };

        window.addEventListener('storage', handleStorage);
        window.addEventListener('auth:unauthorized', handleUnauthorized);

        setLoading(false);

        return () => {
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener('auth:unauthorized', handleUnauthorized);
        };
    }, []);

    const login = (userData) => {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
        setUser(userData);
    };

    const logout = async () => {
        try {
            localStorage.removeItem(AUTH_STORAGE_KEY);
            setUser(null);
            window.location.href = '/login';
        } catch (error) {
            console.error('Logout error:', error);
            window.location.href = '/login';
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
