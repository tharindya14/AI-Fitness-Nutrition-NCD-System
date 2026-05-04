import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  View,
} from "react-native";
import axios from "axios";
import { router } from "expo-router";
import { API_BASE_URL } from "@/constants/api";
import { saveItem } from "@/utils/storage";

const logo = require("../../assets/images/splash-icon.png");

export default function AuthScreen() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);

  const fullNameRef = useRef("");
  const emailRef = useRef("");
  const passwordRef = useRef("");

  const showError = (title: string, error: any) => {
    console.log(title, error.response?.data || error.message);
    Alert.alert(title, error.response?.data?.message || error.message);
  };

  const goHome = () => {
    router.replace("/home");
  };

  const login = async () => {
    if (!emailRef.current.trim() || !passwordRef.current.trim()) {
      Alert.alert("Missing Details", "Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email: emailRef.current.trim().toLowerCase(),
        password: passwordRef.current,
      });

      await saveItem("token", response.data.token);
      goHome();
    } catch (error: any) {
      showError("Login Failed", error);
    } finally {
      setLoading(false);
    }
  };

  const register = async () => {
    if (
      !fullNameRef.current.trim() ||
      !emailRef.current.trim() ||
      !passwordRef.current.trim()
    ) {
      Alert.alert("Missing Details", "Please fill all required fields.");
      return;
    }

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
      goHome();
    } catch (error: any) {
      showError("Register Failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoBox}>
            <Image source={logo} style={styles.logo} resizeMode="contain" />
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>
              {mode === "login" ? "Welcome Back" : "Create Account"}
            </Text>

            <Text style={styles.subtitle}>
              {mode === "login"
                ? "Login to continue your FITSHIELD journey"
                : "Register to start your health safety profile"}
            </Text>

            {mode === "register" && (
              <>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor="#7A7A7A"
                  onChangeText={(text) => (fullNameRef.current = text)}
                  autoCorrect={false}
                />
              </>
            )}

            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#7A7A7A"
              onChangeText={(text) => (emailRef.current = text)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#7A7A7A"
              onChangeText={(text) => (passwordRef.current = text)}
              secureTextEntry
              autoCorrect={false}
            />

            {loading ? (
              <ActivityIndicator
                size="large"
                color="#FF7A00"
                style={styles.loader}
              />
            ) : (
              <>
                <Pressable
                  style={styles.primaryButton}
                  onPress={mode === "login" ? login : register}
                >
                  <Text style={styles.primaryText}>
                    {mode === "login" ? "Login" : "Register"}
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.switchButton}
                  onPress={() =>
                    setMode(mode === "login" ? "register" : "login")
                  }
                >
                  <Text style={styles.switchText}>
                    {mode === "login"
                      ? "Don’t have an account? Register"
                      : "Already have an account? Login"}
                  </Text>
                </Pressable>
              </>
            )}
          </View>

          <Text style={styles.footerText}>
            Health-Aware Dietary Safety System
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#000000",
  },
  keyboard: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 30,
    justifyContent: "center",
  },
  logoBox: {
    alignItems: "center",
    marginBottom: 8,
  },
  logo: {
    width: 230,
    height: 230,
  },
  card: {
    backgroundColor: "rgba(15, 15, 15, 0.96)",
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: "#FF7A00",
    shadowColor: "#FF7A00",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#B8B8B8",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#3A3A3A",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 15,
    color: "#FFFFFF",
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: "#FF7A00",
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#FF7A00",
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryText: {
    color: "#000000",
    fontSize: 17,
    fontWeight: "900",
  },
  switchButton: {
    marginTop: 14,
    paddingVertical: 15,
    borderRadius: 18,
    alignItems: "center",
    backgroundColor: "#1B1B1B",
    borderWidth: 1,
    borderColor: "#333333",
  },
  switchText: {
    color: "#FFB36B",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
  loader: {
    marginTop: 20,
  },
  footerText: {
    color: "#777777",
    textAlign: "center",
    marginTop: 20,
    fontSize: 13,
  },
});