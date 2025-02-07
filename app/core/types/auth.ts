export type AuthCredentials = {
  email: string;
  password: string;
  name?: string;
};

// export type AuthMethodResult = { error: string | null };

export type User = {
  id: string;
  account: {
    name: string;
    email: string;
    imageUrl?: string;
    role: {
      index: number;
      name: string;
    };
  };
};

export type UserAuthData = {
  token: string;
  user: User;
};

export type StoreAuthData = UserAuthData & {
  timestamp: number;
};

export type AuthData = {
  token: string;
  userId: string;
};

export type AuthSession = UserAuthData | null;

export type SessionContext = {
  session: AuthSession;
  isLoading: boolean;
  signUp: (args: AuthCredentials) => Promise<string | null>;
  signIn: (args: AuthCredentials) => Promise<string | null>;
  signOut: () => Promise<any>;
};
