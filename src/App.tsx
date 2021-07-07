import 'react-native-gesture-handler';

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';

import { AppProvider } from './hooks';

import { AppRoutes } from './routes';

export default function App() {
  return (
    <AppProvider>
      <NavigationContainer>
        <AppRoutes />
      </NavigationContainer>
    </AppProvider>
  );
}
