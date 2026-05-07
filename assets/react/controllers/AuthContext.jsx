import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({
          username: payload.username,
          email: payload.email || payload.username 
        });
      } catch (error) {
        localStorage.removeItem('jwtToken');
        setUser(null);
      }
    }
    setIsLoading(false);
  }, []);

  const login = (token) => {
    localStorage.setItem('jwtToken', token);
    const payload = JSON.parse(atob(token.split('.')[1]));
    setUser({
      username: payload.username,
      email: payload.email || payload.username
    });
  };

  const logout = () => {
    localStorage.removeItem('jwtToken');
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}