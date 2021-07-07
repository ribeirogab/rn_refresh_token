import React, { useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';

import { useAuth } from '../hooks/auth';

import { api } from '../services/api';

export function Dashboard() {
  const { signOut, user, token } = useAuth();

  // console.log('[Dashboard] user', user);

  useEffect(() => {
    api
      .get('/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(response => {
        console.log('[Dashboard] user', response.data);
      })
      .catch(error => console.log(error));
  }, [token]);

  return (
    <View>
      <Text>email: {user?.email}</Text>
      <TouchableOpacity style={styles.button} onPress={signOut}>
        <Text>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    padding: 8,
    backgroundColor: 'gray',
    color: '#fff',
    marginTop: 16,
    height: 40,
  },
});
