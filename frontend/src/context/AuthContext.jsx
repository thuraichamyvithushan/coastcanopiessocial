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