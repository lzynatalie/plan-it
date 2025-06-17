import {
  createContext,
  useEffect,
  useState,
  useContext,
  ReactNode,
} from "react";
import { AuthError, Session, User, WeakPassword } from "@supabase/supabase-js";
import { supabase } from "../config/supabaseClient";

type Auth = {
  session: Session | null | undefined;
  user: User | undefined;
  loading: boolean;
  getProfile: () => Promise<Profile>;
  registerNewUser: RegisterHandler;
  loginUser: LoginHandler;
  logoutUser: LogoutHandler;
  createProfile: CreateProfileHandler;
  resetPassword: ResetPasswordHandler;
  updatePassword: UpdatePasswordHandler;
};

type Profile = {
  user_id: string;
  created_at: string;
  username: string;
  display_name: string;
  user_email: string;
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

type CreateProfileHandler = (
  username: string,
  displayName: string
) => Promise<void>;

type ResetPasswordHandler = (email: string) => Promise<void>;

type UpdatePasswordHandler = (password: string) => Promise<{ user: User }>;

const AuthContext = createContext<Auth | undefined>(undefined);

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [user, setUser] = useState<User | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  /**
   * Checks the validity of email format and existence
   *
   * If true is passed as argument, checks that the email exists
   *
   * If false is passed as argument, checks that the email does not exist
   *
   * Throws an AuthError if the above criteria are not fulfilled
   *
   * @param email
   */
  const checkEmail = async (email: string, exist: boolean) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const isValid = emailRegex.test(email);

    if (!isValid) {
      throw new AuthError("Invalid email address");
    }

    const { data, error } = await supabase
      .from("profile")
      .select("user_email")
      .eq("user_email", email);

    if (error) {
      throw new Error("Something went wrong. Please try again later.");
    }

    if ((!exist && data.length) || (exist && !data.length)) {
      throw new AuthError("Invalid email address");
    }
  };

  /**
   * Looks up the user's email given a username
   *
   * Returns the email if given an email
   *
   * Throws an AuthError if email does not exist
   *
   * @param usernameOrEmail
   * @returns user_email
   */
  const getEmail = async (usernameOrEmail: string): Promise<string> => {
    const isEmail = usernameOrEmail.includes("@");

    if (isEmail) {
      return usernameOrEmail;
    }

    const { data, error } = await supabase
      .from("profile")
      .select("user_email")
      .eq("username", usernameOrEmail);

    if (error) {
      throw new Error("Something went wrong. Please try again later.");
    }

    if (!data.length) {
      throw new AuthError("Invalid login credentials");
    }

    return data[0].user_email;
  };

  /**
   * Checks if a username is available
   *
   * Throws an AuthError if username is already in use
   *
   * @param username
   */
  const checkUsername = async (username: string) => {
    const { data, error } = await supabase
      .from("profile")
      .select("username")
      .eq("username", username);

    if (error) {
      throw new Error("Something went wrong. Please try again later.");
    }

    if (data.length) {
      throw new AuthError("Username is taken");
    }
  };

  /**
   * Fetches the user's username, display name, and email
   *
   * @param column
   * @returns profile data
   */
  const getProfile = async (): Promise<Profile> => {
    if (!user) {
      throw new Error("Unable to find user.");
    }

    const { data, error } = await supabase
      .from("profile")
      .select()
      .eq("user_id", user.id);

    if (error) {
      throw new Error("Something went wrong. Please try again later.");
    }

    return data[0];
  };

  /**
   * Registers a new user
   *
   * Throws an AuthError if email is invalid
   *
   * @param email
   * @param password
   * @returns user and session data
   */
  const registerNewUser: RegisterHandler = async (email, password) => {
    await checkEmail(email, false);

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: { emailRedirectTo: "http://localhost:3000/create-profile" },
    });

    if (error) {
      console.error("An error occurred while registering user:", error.message);
      throw error;
    }

    return data;
  };

  /**
   * Logs in an existing user
   *
   * Throws an AuthError if email or password is invalid
   *
   * @param usernameOrEmail
   * @param password
   * @returns user and session data
   */
  const loginUser: LoginHandler = async (usernameOrEmail, password) => {
    const email = await getEmail(usernameOrEmail);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      console.log("An error occurred while logging in user:", error.message);
      throw error;
    }

    return data;
  };

  /**
   * Updates the user's username and display name
   *
   * Throws an AuthError if username is unavailable
   *
   * @param username
   * @param displayName
   */
  const createProfile: CreateProfileHandler = async (username, displayName) => {
    await checkUsername(username);

    if (!user) {
      throw new Error("Unable to find user.");
    }

    const { error } = await supabase.from("profile").insert({
      username: username,
      display_name: displayName,
      user_email: user.email,
    });

    if (error) {
      throw new Error("Something went wrong. Please try again later.");
    }
  };

  /**
   * Initiates password reset given an email
   *
   * @param email
   */
  const resetPassword: ResetPasswordHandler = async (email) => {
    await checkEmail(email, true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "http://localhost:3000/update-password",
    });

    if (error) {
      console.error(
        "An error occurred while resetting password:",
        error.message
      );
      throw error;
    }
  };

  /**
   * Updates the user's password given new password
   *
   * @param password
   * @returns user data
   */
  const updatePassword: UpdatePasswordHandler = async (password) => {
    const { data, error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      console.error(
        "An error occurred while updating password:",
        error.message
      );
      throw error;
    }

    return data;
  };

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);
      setUser(session?.user);

      setLoading(false);
    };

    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  /**
   * Logs out the user
   */
  const logoutUser: LogoutHandler = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("An error occurred while logging out:", error.message);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        getProfile,
        registerNewUser,
        loginUser,
        logoutUser,
        createProfile,
        resetPassword,
        updatePassword,
      }}
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
