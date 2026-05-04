import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  View,
} from "react-native";
import axios from "axios";
import { getItem } from "@/utils/storage";
import { router } from "expo-router";
import { API_BASE_URL } from "@/constants/api";

export default function HistoryPage() {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);

      const token = await getItem("token");

      if (!token) {
        Alert.alert("Login Required", "Please login first.");
        router.replace("/");
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/diet/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setHistory(response.data.data || []);
    } catch (error: any) {
      Alert.alert("History Failed", error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.title}>My Safety History</Text>
          <Text style={styles.subtitle}>Your previous food safety checks.</Text>

          {loading ? (
            <ActivityIndicator size="large" color="#2D6A4F" />
          ) : history.length === 0 ? (
            <Text style={styles.paragraph}>No history found.</Text>
          ) : (
            history.map((item, index) => (
              <View key={index} style={styles.historyBox}>
                <Text style={styles.historyTitle}>
                  {item.drugName} + {item.foodName}
                </Text>
                <Text style={styles.historyText}>
                  Risk: {item.finalRiskLevel} | Score: {item.riskScore}
                </Text>
              </View>
            ))
          )}

          <Pressable style={styles.primaryButton} onPress={() => router.replace("/diet")}>
            <Text style={styles.primaryText}>Back to Safety Check</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F7F4" },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 22 },
  card: { backgroundColor: "#fff", borderRadius: 24, padding: 24, elevation: 4 },
  title: { fontSize: 28, fontWeight: "900", color: "#1B4332" },
  subtitle: { fontSize: 15, color: "#5C6B63", marginTop: 6, marginBottom: 24 },
  paragraph: { fontSize: 15, color: "#333" },
  historyBox: { backgroundColor: "#F1F5F2", padding: 14, borderRadius: 14, marginBottom: 10 },
  historyTitle: { fontWeight: "900", color: "#1B4332" },
  historyText: { color: "#5C6B63", marginTop: 4 },
  primaryButton: {
    backgroundColor: "#2D6A4F",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 20,
  },
  primaryText: { color: "#fff", fontWeight: "900", fontSize: 16 },
});