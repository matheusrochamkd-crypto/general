import React, { createContext, useContext } from 'react';

// Mock user for single-user mode (no login required)
// Using the real user ID from the database to maintain existing data
const MOCK_USER = {
    id: '65e7b362-32a6-4011-aa4e-039189e82a1a',
    email: 'matheusbinottirocha@hotmail.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
};

interface AuthContextType {
    user: typeof MOCK_USER;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Always return authenticated user - single user mode
    return (
        <AuthContext.Provider value={{ user: MOCK_USER, loading: false }}>
            {children}
        </AuthContext.Provider>
    );
};
