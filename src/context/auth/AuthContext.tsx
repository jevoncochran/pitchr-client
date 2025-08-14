import { createContext } from "react";

type AuthContextType = {
  user: unknown;
  token: string | null;
  login: (userData: unknown, token: string) => void;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);
