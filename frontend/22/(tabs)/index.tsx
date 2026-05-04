import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  View,
} from "react-native";
import axios from "axios";
import { saveItem } from "@/utils/storage";
import { router } from "expo-router";
import { API_BASE_URL } from "@/constants/api";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const fullNameRef = useRef("Sandy Ramanayake");
  const emailRef = useRef("sandy@test.com");
  const passwordRef = useRef("123456");

  const showError = (title: string, error: any) => {
    console.log(title, error.response?.data || error.message);
    Alert.alert(title, error.response?.data?.message || error.message);
  };

  const register = async () => {
    try {
      setLoading(true);

      const response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
        fullName: fullNameRef.current.trim(),
        email: emailRef.current.trim().toLowerCase(),
        password: passwordRef.current,
        age: 24,
        gender: "Female",
        height: 160,
        weight: 55,
        allergies: ["milk", "wheat"],
        medications: ["Warfarin"],
        healthConditions: ["normal"],
      });

      await saveItem("token", response.data.token);
      Alert.alert("Success", "Registered successfully");
      router.replace("/Home");
    } catch (error: any) {
      showError("Register Failed", error);
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    try {
      setLoading(true);

      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email: emailRef.current.trim().toLowerCase(),
        password: passwordRef.current,
      });

      await saveItem("token", response.data.token);
      Alert.alert("Success", "Login successful");
      router.replace("/Home");
    } catch (error: any) {
      showError("Login Failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>FITSHIELD</Text>
          <Text style={styles.subtitle}>Health-Aware Dietary Safety System</Text>

          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            defaultValue={fullNameRef.current}
            onChangeText={(text) => (fullNameRef.current = text)}
            autoCorrect={false}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            defaultValue={emailRef.current}
            onChangeText={(text) => (emailRef.current = text)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            defaultValue={passwordRef.current}
            onChangeText={(text) => (passwordRef.current = text)}
            secureTextEntry
            autoCorrect={false}
          />

          {loading ? (
            <ActivityIndicator size="large" color="#2D6A4F" style={{ marginTop: 20 }} />
          ) : (
            <>
              <Pressable style={styles.primaryButton} onPress={login}>
                <Text style={styles.primaryText}>Login</Text>
              </Pressable>

              <Pressable style={styles.secondaryButton} onPress={register}>
                <Text style={styles.secondaryText}>Register New User</Text>
              </Pressable>
            </>
          )}

          <Text style={styles.tip}>
            If login fails, register first or use another email address.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F7F4" },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 22 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  title: { fontSize: 32, fontWeight: "900", color: "#1B4332" },
  subtitle: { fontSize: 15, color: "#5C6B63", marginTop: 6, marginBottom: 24 },
  label: { fontSize: 13, fontWeight: "800", color: "#344E41", marginBottom: 7 },
  input: {
    backgroundColor: "#F1F5F2",
    borderWidth: 1,
    borderColor: "#DCE8DF",
    borderRadius: 15,
    padding: 15,
    fontSize: 16,
    marginBottom: 14,
  },
  primaryButton: {
    backgroundColor: "#2D6A4F",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 10,
  },
  primaryText: { color: "#fff", fontWeight: "900", fontSize: 16 },
  secondaryButton: {
    backgroundColor: "#E8F3EC",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 12,
  },
  secondaryText: { color: "#2D6A4F", fontWeight: "900", fontSize: 16 },
  tip: { textAlign: "center", fontSize: 12, color: "#66736B", marginTop: 16 },
});