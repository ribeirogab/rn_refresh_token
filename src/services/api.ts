import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-community/async-storage';

import { API_URL } from '@env';

import { signOut } from '../hooks/auth';

interface RequestProps {
  onSuccess(token: string): void;
  onFailure(err: AxiosError): void;
}

let isRefreshing = false;
let failedRequestQueue: RequestProps[] = [];

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.response.use(
  response => response,
  (error: AxiosError) => {
    if (error?.response?.status === 401) {
      if (error.response.data?.code === 'token.expired') {
        const originalConfig = error.config;

        AsyncStorage.multiGet(['@app:refreshToken', '@app:token'])
          .then(stores => {
            const refreshToken = stores[0][1];
            const token = stores[1][1];

            api
              .post(
                '/refresh',
                { refreshToken },
                { headers: { Authorization: `Bearer ${token}` } },
              )
              .then(({ data }) => {
                console.log('isRefreshing', isRefreshing);
                console.log('response.data', data);

                if (!isRefreshing) {
                  isRefreshing = true;

                  AsyncStorage.multiSet([
                    ['@app:token', data.token],
                    ['@app:refreshToken', data.refreshToken],
                  ])
                    .then(() => {
                      api.defaults.headers.Authorization = `Bearer ${data.token}`;

                      failedRequestQueue.forEach(request =>
                        request.onSuccess(data.token),
                      );

                      failedRequestQueue = [];
                    })
                    .catch(err => {
                      throw new Error(err);
                    })
                    .finally(() => {
                      isRefreshing = false;
                    });
                }
              })
              .catch(err => {
                throw new Error(err);
              });
          })
          .catch(() => {
            failedRequestQueue.forEach(request => request.onFailure(error));

            failedRequestQueue = [];
          });

        return new Promise((resolve, reject) => {
          failedRequestQueue.push({
            onSuccess: (token: string) => {
              originalConfig.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalConfig));
            },
            onFailure: (err: AxiosError) => {
              reject(err);
            },
          });
        });
      } else {
        signOut();
      }
    }

    return Promise.reject(error);
  },
);
