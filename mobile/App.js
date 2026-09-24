import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, useAuth } from './src/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

function Root() {
  const { loading } = useAuth();
  if (loading) return null;
  return <AppNavigator />;
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Root />
      </NavigationContainer>
    </AuthProvider>
  );
}