import { createContext } from "react";

type AuthContextType = {
  user: object | null;
  token: string | null;
  login: (userData: object, token: string) => void;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);
