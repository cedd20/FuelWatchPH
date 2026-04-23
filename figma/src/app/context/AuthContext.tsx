import { createContext, useContext, useState, ReactNode } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  initials: string;
  contributionCount: number;
  accuracy: number;
  points: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  requireAuth: (action: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    // Mock login - in real app, this would call an API
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setUser({
      id: "1",
      name: "Juan Dela Cruz",
      email,
      initials: "JD",
      contributionCount: 24,
      accuracy: 95,
      points: 128,
    });
  };

  const signup = async (name: string, email: string, password: string) => {
    // Mock signup - in real app, this would call an API
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const initials = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    setUser({
      id: "1",
      name,
      email,
      initials,
      contributionCount: 0,
      accuracy: 0,
      points: 0,
    });
  };

  const logout = () => {
    setUser(null);
  };

  const requireAuth = (action: string): boolean => {
    // Returns true if user is authenticated, false if they need to sign in
    return !!user;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        requireAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
