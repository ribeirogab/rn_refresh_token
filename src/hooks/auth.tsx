import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
  useMemo,
} from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';

import { api } from '../services/api';

interface IUser {
  name?: string;
  email?: string;
  permissions: string[];
  roles: string[];
}

interface AuthProviderProps {
  children: ReactNode;
}

interface IAuthState {
  token: string;
  user: IUser;
}

interface ISignInResponse {
  user: IUser;
  token: string;
  refreshToken: string;
}

interface ISetAuthData {
  user?: IUser;
  token?: string;
  refreshToken?: string;
}

interface IAuthContextData {
  signIn(email: string, password: string): Promise<void>;
  signInWithGoogle(token: string): Promise<void>;
  signOut(): Promise<void>;
  setAuthData(data: ISetAuthData): Promise<void>;
  authLoading: boolean;
  user: IUser | null;
  token: string | null;
  isAuthenticated: boolean;
}

const AuthContext = createContext({} as IAuthContextData);

export async function signOut() {
  await AsyncStorage.multiRemove([
    '@app:token',
    '@app:refreshToken',
    // '@app:user',
  ]);
}

function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<IUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const isAuthenticated = useMemo(() => !!user, [user]);

  // console.log('[AuthProvider] user', user);
  // console.log('token', token);
  // console.log('isAuthenticated', isAuthenticated);

  useEffect(() => {
    async function loadUserData() {
      try {
        setAuthLoading(true);

        // const jsonStorageUser = await AsyncStorage.getItem('@app:user');

        // if (jsonStorageUser) {
        //   const storageUser = JSON.parse(jsonStorageUser);
        //   setUser(storageUser);
        // } else {
        //   setUser(null);
        // }

        const storageToken = await AsyncStorage.getItem('@app:token');

        if (storageToken) {
          if (token && token !== storageToken) {
            throw new Error();
          }

          const response = await api.get('/me', {
            headers: { Authorization: `Bearer ${storageToken}` },
          });

          const { email, permissions, roles } = response.data;

          console.log('user', { email, permissions, roles });

          setUser({ email, permissions, roles });
        }
      } catch (error) {
        console.log('loadUserData', error);
        setUser(null);
        signOut();
      } finally {
        setAuthLoading(false);
      }
    }

    loadUserData();
  }, [token]);

  async function setAuthData({
    user: userData,
    token: tokenData,
    refreshToken,
  }: ISetAuthData) {
    await AsyncStorage.multiSet([
      ...[tokenData ? ['@app:token', tokenData] : []],
      ...[refreshToken ? ['@app:refreshToken', refreshToken] : []],
      // ...[userData ? ['@app:user', JSON.stringify(userData)] : []],
    ]);

    userData && setUser(userData);
    // tokenData && setToken(tokenData);
  }

  async function signIn(email: string, password: string) {
    try {
      setAuthLoading(true);

      const response = await api.post('/sessions', {
        email,
        password,
      });

      const { token: tokenData, refreshToken } = response.data;

      await setAuthData({
        token: tokenData,
        refreshToken,
      });

      setToken(tokenData);
    } catch (error) {
      throw new Error('Verifique as credenciais e tente novamente!');
    } finally {
      setAuthLoading(false);
    }
  }

  async function signInWithGoogle(googleToken: string) {
    try {
      setAuthLoading(true);

      const { data } = await api.post<ISignInResponse>('/sessions', {
        googleToken,
      });

      const { user: userData, token: tokenData, refreshToken } = data;

      await setAuthData({ user: userData, token: tokenData, refreshToken });
    } catch (error) {
      Alert.alert(
        'Ocorreu um erro',
        'Erro de autenticação com o Google, por favor tente novamente mais tarde.',
      );
    } finally {
      setAuthLoading(false);
    }
  }

  async function userSignOut() {
    await signOut();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        signIn,
        signInWithGoogle,
        signOut: userSignOut,
        setAuthData,
        authLoading,
        token,
        user,
        isAuthenticated,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

function useAuth(): IAuthContextData {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

export { AuthProvider, useAuth };
