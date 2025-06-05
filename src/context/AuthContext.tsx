import {
  createContext,
  useEffect,
  useState,
  useContext,
  ReactNode,
} from "react";
import { AuthError, Session, User, WeakPassword } from "@supabase/supabase-js";
import { supabase } from "../supabaseClient";

type Auth = {
  session: Session | null | undefined;
  registerNewUser: RegisterHandler;
  loginUser: LoginHandler;
  logoutUser: LogoutHandler;
};

type RegisterHandler = (
  email: string,
  password: string
) => Promise<{ user: User | null; session: Session | null }>;

type LoginHandler = (
  email: string,
  password: string
) => Promise<{
  user: User;
  session: Session;
  weakPassword?: WeakPassword;
}>;

type LogoutHandler = () => Promise<void>;

const AuthContext = createContext<Auth | undefined>(undefined);

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  const registerNewUser: RegisterHandler = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) {
      console.error("An error occurred while registering:", error.message);
      throw error;
    }

    return data;
  };

  const loginUser: LoginHandler = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      console.error("An error occurred while logging in:", error.message);
      throw error;
    }

    return data;
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  const logoutUser = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("An error occurred while logging out:", error.message);
    }
  };

  return (
    <AuthContext.Provider
      value={{ session, registerNewUser, loginUser, logoutUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const auth = useContext(AuthContext);

  if (!auth) {
    throw new Error("useAuthContext must be used with an AuthContextProvider");
  }

  return auth;
};
