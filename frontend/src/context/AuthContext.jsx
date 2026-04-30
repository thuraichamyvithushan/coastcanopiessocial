// import React, { createContext, useState, useContext, useEffect } from 'react';
// import { auth } from '../config/firebase';
// import { signOut } from 'firebase/auth';

// const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//     const [user, setUser] = useState(null);
//     const [loading, setLoading] = useState(true);

//     useEffect(() => {
//         const userInfo = localStorage.getItem('userInfo');
//         if (userInfo) {
//             setUser(JSON.parse(userInfo));
//         }
//         setLoading(false);
//     }, []);

//     const login = (userData) => {
//         console.log('AuthContext: Saving user data to localStorage...', userData);
//         localStorage.setItem('userInfo', JSON.stringify(userData));
//         setUser(userData);
//         console.log('AuthContext: User state updated.');
//     };

//     const logout = async () => {
//         try {
//             await signOut(auth);
//             localStorage.removeItem('userInfo');
//             setUser(null);
//             window.location.href = '/login';
//         } catch (error) {
//             console.error('Logout error:', error);
//         }
//     };

//     return (
//         <AuthContext.Provider value={{ user, login, logout, loading }}>
//             {!loading && children}
//         </AuthContext.Provider>
//     );
// };

// export const useAuth = () => useContext(AuthContext);


import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userInfo = localStorage.getItem('userInfo');

        if (userInfo) {
            setUser(JSON.parse(userInfo));
        } 
        else {
            // 🔥 FORCE A DEFAULT USER SO DASHBOARD LOADS
            const defaultUser = {
                _id: "default_user_123",
                name: "Demo User",
                email: "demo@example.com",
                role: "user"        // Change to "admin" if you want to test admin dashboard
            };
            setUser(defaultUser);
            localStorage.setItem('userInfo', JSON.stringify(defaultUser));
        }

        setLoading(false);
    }, []);

    const login = (userData) => {
        localStorage.setItem('userInfo', JSON.stringify(userData));
        setUser(userData);
    };

    const logout = async () => {
        try {
            await signOut(auth);
            localStorage.removeItem('userInfo');
            setUser(null);
            // Changed from /login to /dashboard
            window.location.href = '/dashboard';
        } catch (error) {
            console.error('Logout error:', error);
            window.location.href = '/dashboard';
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);