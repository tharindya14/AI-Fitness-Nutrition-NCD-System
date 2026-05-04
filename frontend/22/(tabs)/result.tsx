import React, { useCallback, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  View,
} from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { getItem, deleteItem } from "@/utils/storage";

export default function ResultPage() {
  const [result, setResult] = useState<any>(null);
  const params = useLocalSearchParams();

  const loadResult = async () => {
    const saved = await getItem("latestResult");

    if (saved) {
      setResult(JSON.parse(saved));
    } else {
      setResult(null);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadResult();
    }, [params.refresh])
  );

  const checkAnother = async () => {
    await deleteItem("latestResult");
    setResult(null);
    router.replace("/diet");
  };

  if (!result) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerBox}>
          <Text style={styles.loading}>No result found.</Text>

          <Pressable style={styles.primaryButton} onPress={() => router.replace("/diet")}>
            <Text style={styles.primaryText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const riskColor =
    result?.final_risk_level === "Dangerous"
      ? "#D00000"
      : result?.final_risk_level === "Moderate"
      ? "#F77F00"
      : "#2D6A4F";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.title}>Safety Result</Text>

          <View style={styles.headerBox}>
            <View>
              <Text style={styles.smallLabel}>Risk Score</Text>
              <Text style={styles.score}>{result.risk_score}/100</Text>
            </View>

            <View style={[styles.badge, { backgroundColor: riskColor }]}>
              <Text style={styles.badgeText}>{result.final_risk_level}</Text>
            </View>
          </View>

          <Info title="Drug" value={result.drug_name} />
          <Info title="Food" value={result.food_name} />
          <Info title="Model Risk" value={result.model_risk} />

          <Text style={styles.section}>Explanation</Text>
          <Text style={styles.paragraph}>
            {result.explanation?.summary || "No explanation available."}
          </Text>

          <Text style={styles.section}>Key Risks</Text>
          {(result.explanation?.key_risks || []).length === 0 ? (
            <Text style={styles.paragraph}>No key risks found.</Text>
          ) : (
            result.explanation.key_risks.map((risk: string, index: number) => (
              <Text key={index} style={styles.bullet}>
                • {risk}
              </Text>
            ))
          )}

          <Text style={styles.section}>Advice</Text>
          <Text style={styles.paragraph}>
            {result.explanation?.advice || "No advice available."}
          </Text>

          <Text style={styles.section}>Recommended Alternatives</Text>
          {(result.recommended_alternatives || []).length === 0 ? (
            <Text style={styles.paragraph}>No alternatives available.</Text>
          ) : (
            result.recommended_alternatives.map((item: any, index: number) => (
              <View key={index} style={styles.altBox}>
                <Text style={styles.altTitle}>{item.Food}</Text>
                <Text style={styles.altText}>
                  {item.food_type} • {item.consumption_type} • {item.energy} kcal
                </Text>
              </View>
            ))
          )}

          <Text style={styles.disclaimer}>
            {result.explanation?.disclaimer ||
              "This is a decision-support result only and should not be considered medical advice."}
          </Text>

          <Pressable style={styles.primaryButton} onPress={checkAnother}>
            <Text style={styles.primaryText}>Check Another Food</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Info({ title, value }: { title: string; value: string }) {
  return (
    <View style={styles.infoBox}>
      <Text style={styles.smallLabel}>{title}</Text>
      <Text style={styles.value}>{value || "-"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F7F4",
  },
  scroll: {
    padding: 22,
    paddingBottom: 40,
  },
  centerBox: {
    flex: 1,
    padding: 22,
    justifyContent: "center",
  },
  loading: {
    fontSize: 18,
    color: "#1B4332",
    fontWeight: "800",
    marginBottom: 20,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    elevation: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#1B4332",
    marginBottom: 16,
  },
  headerBox: {
    backgroundColor: "#F1F5F2",
    padding: 16,
    borderRadius: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  smallLabel: {
    fontSize: 13,
    color: "#344E41",
    fontWeight: "800",
  },
  score: {
    fontSize: 30,
    fontWeight: "900",
    color: "#1B4332",
    marginTop: 4,
  },
  badge: {
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 20,
  },
  badgeText: {
    color: "#fff",
    fontWeight: "900",
  },
  infoBox: {
    backgroundColor: "#F8FAF8",
    padding: 14,
    borderRadius: 14,
    marginTop: 12,
  },
  value: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
    marginTop: 6,
  },
  section: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1B4332",
    marginTop: 22,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 15,
    color: "#333",
    lineHeight: 24,
  },
  bullet: {
    fontSize: 15,
    color: "#333",
    lineHeight: 24,
    marginTop: 4,
  },
  altBox: {
    backgroundColor: "#F1F5F2",
    padding: 13,
    borderRadius: 14,
    marginTop: 9,
  },
  altTitle: {
    fontWeight: "900",
    color: "#1B4332",
  },
  altText: {
    color: "#5C6B63",
    marginTop: 3,
  },
  disclaimer: {
    fontSize: 12,
    color: "#777",
    marginTop: 18,
    lineHeight: 18,
    fontStyle: "italic",
  },
  primaryButton: {
    backgroundColor: "#2D6A4F",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 22,
  },
  primaryText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },
});