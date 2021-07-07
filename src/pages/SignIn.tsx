import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useAuth } from '../hooks/auth';

export function SignIn() {
  const { signIn, isAuthenticated } = useAuth();
  const navigation = useNavigation();

  const [email, setEmail] = useState('diego@rocketseat.team');
  const [password, setPassword] = useState('123456');

  useEffect(() => {
    if (isAuthenticated) {
      console.log('Redirect to Dashboard');
      navigation.navigate('Dashboard');
    }
  }, [isAuthenticated, navigation]);

  async function onSubmit() {
    try {
      await signIn(email, password);
      navigation.navigate('Dashboard');
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text>E-mail</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={text => setEmail(text)}
          />
        </View>
        <View style={styles.inputContainer}>
          <Text>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={text => setPassword(text)}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={onSubmit}>
          <Text>Sign in</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    width: '70%',
  },
  inputContainer: {
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#0005',
  },
  button: {
    padding: 8,
    backgroundColor: 'gray',
    color: '#fff',
    marginTop: 16,
    height: 40,
  },
});
