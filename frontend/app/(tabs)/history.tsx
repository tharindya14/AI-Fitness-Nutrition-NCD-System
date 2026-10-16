import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import axios from "axios";
import { router } from "expo-router";

import { API_BASE_URL } from "@/constants/api";
import { getItem } from "@/utils/storage";

const ORANGE = "#ff7a00";
const DARK = "#050505";
const CARD = "#101010";
const CARD_2 = "#151515";
const TEXT = "#ffffff";
const MUTED = "#b8b8b8";
const BORDER = "rgba(255,122,0,0.38)";

const DANGER = "#d00000";
const MODERATE = "#f77f00";
const SAFE = "#2d6a4f";

export default function HistoryPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

      setHistory(response.data?.data || []);
    } catch (error: any) {
      console.log("History load error:", error.response?.data || error.message);

      Alert.alert(
        "History Failed",
        error.response?.data?.message || "Unable to load history."
      );
    } finally {
      setLoading(false);
    }
  };

  const refreshHistory = async () => {
    try {
      setRefreshing(true);
      await loadHistory();
    } finally {
      setRefreshing(false);
    }
  };

  const deleteHistoryItem = async (id: string) => {
    try {
      const token = await getItem("token");

      if (!token) {
        Alert.alert("Login Required", "Please login first.");
        router.replace("/");
        return;
      }

      await axios.delete(`${API_BASE_URL}/api/diet/history/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setHistory((prev) => prev.filter((item) => item._id !== id));
      Alert.alert("Deleted", "History item deleted successfully.");
    } catch (error: any) {
      console.log("Delete history error:", error.response?.data || error.message);

      Alert.alert(
        "Delete Failed",
        error.response?.data?.message || "Unable to delete history item."
      );
    }
  };

  const confirmDelete = (item: any) => {
    if (!item?._id) {
      Alert.alert("Unavailable", "This history item cannot be deleted.");
      return;
    }

    Alert.alert(
      "Delete History",
      "Are you sure you want to delete this safety check?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteHistoryItem(item._id),
        },
      ]
    );
  };

  const getRiskColor = (riskLevel: string) => {
    const level = String(riskLevel || "").toLowerCase();

    if (level === "dangerous" || level === "risk") return DANGER;
    if (level === "moderate") return MODERATE;
    return SAFE;
  };

  const formatDate = (value: string) => {
    if (!value) return "Date unavailable";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Date unavailable";
    }

    return date.toLocaleString();
  };

  const getMedicines = (item: any) => {
    if (Array.isArray(item.medicineNames)) {
      return item.medicineNames.join(", ");
    }

    if (Array.isArray(item.medicine_names)) {
      return item.medicine_names.join(", ");
    }

    if (item.drugName) {
      return item.drugName;
    }

    if (item.drug_name) {
      return item.drug_name;
    }

    return "-";
  };

  const getFood = (item: any) => {
    return item.foodName || item.food_name || "-";
  };

  const getRiskLevel = (item: any) => {
    return (
      item.finalRiskLevel ||
      item.final_risk_level ||
      item.riskLevel ||
      item.risk_level ||
      "Unknown"
    );
  };

  const getRiskScore = (item: any) => {
    return (
      item.riskScore ??
      item.risk_score ??
      item.finalRiskScore ??
      item.final_risk_score ??
      "-"
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshHistory}
            tintColor={ORANGE}
          />
        }
      >
        <Pressable
          style={styles.backButton}
          onPress={() => router.replace("/diet")}
        >
          <Text style={styles.backIcon}>‹</Text>
          <Text style={styles.backText}>Safety Checker</Text>
        </Pressable>

        <View>
            <Text style={styles.heroTitle}>History</Text>
            <Text style={styles.heroSubtitle}>
              Review your previous food, medicine and allergy safety checks.
            </Text>
          </View>
        
          
        

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Checks</Text>
            <Text style={styles.summaryValue}>{history.length}</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>High Risk</Text>
            <Text style={[styles.summaryValue, { color: DANGER }]}>
              {
                history.filter((item) =>
                  String(getRiskLevel(item)).toLowerCase().includes("danger")
                ).length
              }
            </Text>
          </View>
        </View>

        <View style={styles.listCard}>
          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>Recent Checks</Text>

            <Pressable style={styles.refreshButton} onPress={refreshHistory}>
              <Text style={styles.refreshText}>Refresh</Text>
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={ORANGE} />
              <Text style={styles.loadingText}>Loading history...</Text>
            </View>
          ) : history.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🗂</Text>
              <Text style={styles.emptyTitle}>No History Found</Text>
              <Text style={styles.emptyText}>
                Your completed safety checks will appear here.
              </Text>

              <Pressable
                style={styles.primaryButton}
                onPress={() => router.replace("/diet")}
              >
                <Text style={styles.primaryText}>Start Safety Check</Text>
              </Pressable>
            </View>
          ) : (
            history.map((item, index) => {
              const riskLevel = getRiskLevel(item);
              const riskScore = getRiskScore(item);
              const riskColor = getRiskColor(riskLevel);

              return (
                <View key={item._id || index} style={styles.historyBox}>
                  <View style={styles.historyTop}>
                    <View style={styles.numberCircle}>
                      <Text style={styles.numberText}>
                        {String(index + 1).padStart(2, "0")}
                      </Text>
                    </View>

                    <View style={styles.historyTitleBox}>
                      <Text style={styles.historyTitle} numberOfLines={2}>
                        {getFood(item)}
                      </Text>
                      <Text style={styles.historyDate}>
                        {formatDate(item.createdAt || item.created_at)}
                      </Text>
                    </View>

                    <View style={[styles.riskBadge, { backgroundColor: riskColor }]}>
                      <Text style={styles.riskBadgeText}>{riskLevel}</Text>
                    </View>
                  </View>

                  <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>Medicines</Text>
                    <Text style={styles.detailValue}>{getMedicines(item)}</Text>
                  </View>

                  <View style={styles.resultRow}>
                    <View style={styles.scoreBox}>
                      <Text style={styles.scoreLabel}>Risk Score</Text>
                      <Text style={styles.scoreValue}>{riskScore}/100</Text>
                    </View>

                    <Pressable
                      style={styles.deleteButton}
                      onPress={() => confirmDelete(item)}
                    >
                      <Text style={styles.deleteText}>Delete</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <Pressable
          style={styles.primaryButton}
          onPress={() => router.replace("/diet")}
        >
          <Text style={styles.primaryText}>Back to Safety Check</Text>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.replace("/home")}
        >
          <Text style={styles.secondaryText}>Go Home</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: DARK,
  },

  container: {
    flex: 1,
    backgroundColor: DARK,
  },

  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 36,
  },

  backButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: 14,
    paddingVertical: 6,
    paddingRight: 12,
  },

  backIcon: {
    color: ORANGE,
    fontSize: 36,
    fontWeight: "900",
    marginTop: -4,
    marginRight: 4,
  },

  backText: {
    color: ORANGE,
    fontSize: 16,
    fontWeight: "900",
  },

  heroCard: {
    minHeight: 168,
    borderRadius: 30,
    padding: 22,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: ORANGE,
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 8,
    marginBottom: 16,
  },

  heroTitle: {
    color: TEXT,
    fontSize: 42,
    fontWeight: "900",
    lineHeight: 48,
  },

  heroTitleOrange: {
    color: ORANGE,
    fontSize: 42,
    fontWeight: "900",
    lineHeight: 48,
  },

  heroSubtitle: {
    color: MUTED,
    fontSize: 15,
    lineHeight: 23,
    marginTop: 12,
    fontWeight: "700",
    maxWidth: 240,
  },

  heroIconBox: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 1,
    borderColor: ORANGE,
    backgroundColor: "rgba(255,122,0,0.12)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: ORANGE,
    shadowOpacity: 0.4,
    shadowRadius: 15,
  },

  heroIcon: {
    color: ORANGE,
    fontSize: 42,
    fontWeight: "900",
  },

  summaryRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },

  summaryCard: {
    flex: 1,
    backgroundColor: CARD,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  summaryLabel: {
    color: MUTED,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 8,
  },

  summaryValue: {
    color: ORANGE,
    fontSize: 34,
    fontWeight: "900",
  },

  listCard: {
    backgroundColor: CARD,
    borderRadius: 28,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    marginBottom: 16,
  },

  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  sectionTitle: {
    color: TEXT,
    fontSize: 24,
    fontWeight: "900",
  },

  refreshButton: {
    borderWidth: 1,
    borderColor: ORANGE,
    backgroundColor: "rgba(255,122,0,0.10)",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 13,
  },

  refreshText: {
    color: ORANGE,
    fontSize: 12,
    fontWeight: "900",
  },

  loadingBox: {
    alignItems: "center",
    paddingVertical: 28,
  },

  loadingText: {
    color: MUTED,
    marginTop: 10,
    fontWeight: "800",
  },

  emptyCard: {
    alignItems: "center",
    backgroundColor: CARD_2,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    padding: 22,
  },

  emptyIcon: {
    fontSize: 44,
    marginBottom: 8,
  },

  emptyTitle: {
    color: TEXT,
    fontSize: 22,
    fontWeight: "900",
  },

  emptyText: {
    color: MUTED,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
    marginTop: 6,
    marginBottom: 4,
    fontWeight: "700",
  },

  historyBox: {
    backgroundColor: CARD_2,
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    marginBottom: 12,
  },

  historyTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  numberCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: ORANGE,
    backgroundColor: "rgba(255,122,0,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  numberText: {
    color: ORANGE,
    fontSize: 15,
    fontWeight: "900",
  },

  historyTitleBox: {
    flex: 1,
    paddingRight: 8,
  },

  historyTitle: {
    color: TEXT,
    fontSize: 17,
    fontWeight: "900",
  },

  historyDate: {
    color: MUTED,
    fontSize: 12,
    marginTop: 4,
    fontWeight: "700",
  },

  riskBadge: {
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },

  riskBadgeText: {
    color: TEXT,
    fontSize: 11,
    fontWeight: "900",
  },

  detailBox: {
    marginTop: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  detailLabel: {
    color: ORANGE,
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 5,
  },

  detailValue: {
    color: TEXT,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "800",
  },

  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },

  scoreBox: {
    flex: 1,
  },

  scoreLabel: {
    color: MUTED,
    fontSize: 12,
    fontWeight: "800",
  },

  scoreValue: {
    color: ORANGE,
    fontSize: 21,
    fontWeight: "900",
    marginTop: 2,
  },

  deleteButton: {
    borderWidth: 1,
    borderColor: DANGER,
    backgroundColor: "rgba(255,69,58,0.10)",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },

  deleteText: {
    color: DANGER,
    fontSize: 13,
    fontWeight: "900",
  },

  primaryButton: {
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: ORANGE,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },

  primaryText: {
    color: TEXT,
    fontSize: 16,
    fontWeight: "900",
  },

  secondaryButton: {
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: ORANGE,
    backgroundColor: "rgba(255,122,0,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },

  secondaryText: {
    color: ORANGE,
    fontSize: 16,
    fontWeight: "900",
  },
});