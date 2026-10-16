import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";

import { deleteItem, getItem } from "@/utils/storage";

const ORANGE = "#ff7a00";
const DARK = "#050505";
const CARD = "#111111";
const INPUT = "#050505";
const BORDER = "#2a2a2a";
const TEXT = "#ffffff";
const MUTED = "#b8b8b8";
const RED = "#ff453a";
const GREEN = "#31d158";
const YELLOW = "#ffb020";
function getRiskTheme(scoreValue: any, levelValue: string) {
  const numericScore = Number(scoreValue);

  if (!Number.isNaN(numericScore)) {
    if (numericScore >= 70) {
      return {
        level: "Dangerous",
        color: RED,
        softBg: "rgba(255,69,58,0.18)",
        border: "rgba(255,69,58,0.85)",
        iconBg: "rgba(255,69,58,0.22)",
      };
    }

    if (numericScore >= 40) {
      return {
        level: "Moderate",
        color: YELLOW,
        softBg: "rgba(255,176,32,0.18)",
        border: "rgba(255,176,32,0.85)",
        iconBg: "rgba(255,176,32,0.20)",
      };
    }

    return {
      level: "Safe",
      color: GREEN,
      softBg: "rgba(49,209,88,0.16)",
      border: "rgba(49,209,88,0.85)",
      iconBg: "rgba(49,209,88,0.18)",
    };
  }

  if (levelValue === "Dangerous") {
    return {
      level: "Dangerous",
      color: RED,
      softBg: "rgba(255,69,58,0.18)",
      border: "rgba(255,69,58,0.85)",
      iconBg: "rgba(255,69,58,0.22)",
    };
  }

  if (levelValue === "Moderate") {
    return {
      level: "Moderate",
      color: YELLOW,
      softBg: "rgba(255,176,32,0.18)",
      border: "rgba(255,176,32,0.85)",
      iconBg: "rgba(255,176,32,0.20)",
    };
  }

  if (levelValue === "Safe") {
    return {
      level: "Safe",
      color: GREEN,
      softBg: "rgba(49,209,88,0.16)",
      border: "rgba(49,209,88,0.85)",
      iconBg: "rgba(49,209,88,0.18)",
    };
  }

  return {
    level: levelValue || "Unknown",
    color: ORANGE,
    softBg: "rgba(255,122,0,0.16)",
    border: "rgba(255,122,0,0.75)",
    iconBg: "rgba(255,122,0,0.18)",
  };
}

const resultHero = require("../../assets/images/result/result_hero_app.png");
const riskIcon = require("../../assets/images/result/icon_risk_warning.png");
const shieldIcon = require("../../assets/images/result/icon_safety_shield.png");
const healthIcon = require("../../assets/images/result/icon_health_profile.png");
const medicineIcon = require("../../assets/images/result/icon_medicine.png");
const foodIcon = require("../../assets/images/result/icon_food.png");
const summaryIcon = require("../../assets/images/result/icon_summary.png");
const adviceIcon = require("../../assets/images/result/icon_advice.png");
const interactionIcon = require("../../assets/images/result/icon_drug_interaction.png");
const alternativeIcon = require("../../assets/images/result/icon_alternative.png");

export default function ResultPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const params = useLocalSearchParams();

  const loadResult = async () => {
    try {
      setLoading(true);
      const saved = await getItem("latestResult");

      if (saved) {
        setResult(JSON.parse(saved));
      } else {
        setResult(null);
      }
    } catch (error) {
      console.log("Result load error:", error);
      setResult(null);
    } finally {
      setLoading(false);
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

  const parsed = useMemo(() => {
    const finalLevel =
      result?.final_risk_level || result?.finalRiskLevel || "Unknown";

    const finalScore =
      result?.final_risk_score ??
      result?.finalRiskScore ??
      result?.risk_score ??
      "-";

   const riskTheme = getRiskTheme(finalScore, finalLevel);
    const medicineNames: string[] = Array.isArray(result?.medicine_names)
      ? result.medicine_names
      : result?.drug_name
      ? [result.drug_name]
      : [];

    const foodDrugResults: any[] = Array.isArray(result?.food_drug_results)
      ? result.food_drug_results
      : [];

    const drugDrugInteractions: any[] = Array.isArray(
      result?.drug_drug_interactions
    )
      ? result.drug_drug_interactions
      : [];

    const summaries: string[] = Array.isArray(result?.summary)
      ? result.summary
      : [];

    const alternatives: any[] = Array.isArray(
      result?.recommended_alternatives
    )
      ? result.recommended_alternatives
      : [];

    return {
      finalLevel: riskTheme.level,
finalScore,
riskTheme,
      medicineNames,
      foodDrugResults,
      drugDrugInteractions,
      summaries,
      alternatives,
    };
  }, [result]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={ORANGE} />
          <Text style={styles.centerText}>Loading safety result...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!result) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerBox}>
          <Text style={styles.emptyTitle}>No result found</Text>
          <Text style={styles.emptyText}>
            Please run a food-drug interaction check first.
          </Text>

          <Pressable
            style={styles.primaryButton}
            onPress={() => router.replace("/diet")}
          >
            <Text style={styles.primaryText}>Go Back</Text>
            <Text style={styles.primaryArrow}>›</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const {
  finalLevel,
  finalScore,
  riskTheme,
  medicineNames,
  foodDrugResults,
  drugDrugInteractions,
  summaries,
  alternatives,
} = parsed;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Pressable style={styles.homeBackButton} onPress={() => router.replace("/diet")}>
          <Text style={styles.homeBackIcon}>‹</Text>
          <Text style={styles.homeBackText}>Checker</Text>
        </Pressable>

        <View style={styles.heroBox}>
          <View style={styles.heroTextBox}>
            <Text style={styles.heroTitle}>Safety Result</Text>
            <Text style={styles.heroSubtitle}>
              Food-drug safety analysis based on your selected profile.
            </Text>
          </View>

          <View style={styles.heroImageWrap}>
            <Image source={resultHero} style={styles.heroImage} resizeMode="contain" />
          </View>
        </View>

        <View style={styles.mainCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.headerTitleWrap}>
              <Text style={[styles.sectionEyebrow, { color: riskTheme.color }]}>
  Overall Risk
</Text>
            </View>

            <View style={[styles.riskBadge, { backgroundColor: riskTheme.color }]}>
  <Text style={styles.riskBadgeText}>{finalLevel}</Text>
</View>
          </View>

          <View
  style={[
    styles.scorePanel,
    {
      backgroundColor: riskTheme.softBg,
      borderColor: riskTheme.border,
      shadowColor: riskTheme.color,
    },
  ]}
>
  <View>
    <Text style={styles.smallLabel}>Risk Score</Text>
    <Text style={[styles.scoreText, { color: riskTheme.color }]}>
      {finalScore}/100
    </Text>
  </View>

  <View
    style={[
      styles.scoreIconCircle,
      {
        borderColor: riskTheme.border,
        backgroundColor: riskTheme.iconBg,
        shadowColor: riskTheme.color,
      },
    ]}
  >
    <Image
      source={finalLevel === "Dangerous" ? riskIcon : shieldIcon}
      style={styles.panelIcon}
      resizeMode="contain"
    />
  </View>
</View>

          <View style={styles.quickGrid}>
            <InfoCard
              icon={medicineIcon}
              title="Selected Medicines"
              value={medicineNames.length > 0 ? medicineNames.join(", ") : "-"}
            />
            <InfoCard icon={foodIcon} title="Food" value={result?.food_name || "-"} />
          </View>

          <View style={styles.profileBox}>
            <View style={styles.profileTop}>
              <View style={styles.titleWithIcon}>
                <Image source={healthIcon} style={styles.smallImageIcon} />
                <Text style={styles.profileTitle}>Health Profile Used</Text>
              </View>

              <Text style={styles.profileBadge}>
                {result?.bmi_category || "Profile"}
              </Text>
            </View>

            <Text style={styles.profileText}>
              BMI: {result?.bmi ?? "--"}{" "}
              {result?.bmi_category ? `(${result.bmi_category})` : ""}
            </Text>
            <Text style={styles.profileText}>
              Height: {result?.height_cm ?? "--"} cm
            </Text>
            <Text style={styles.profileText}>
              Weight: {result?.weight_kg ?? "--"} kg
            </Text>

            {result?.bmi_advice ? (
              <Text style={styles.profileAdvice}>{result.bmi_advice}</Text>
            ) : null}
          </View>

          <SectionTitle icon={summaryIcon} title="Overall Summary" />
          {summaries.length === 0 ? (
            <Text style={styles.paragraph}>No summary available.</Text>
          ) : (
            summaries.map((item, index) => (
              <View key={index} style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{item}</Text>
              </View>
            ))
          )}

          <SectionTitle icon={adviceIcon} title="Overall Advice" />
          <View style={styles.adviceBox}>
            <Text style={styles.adviceText}>
              {result?.overall_advice || "No advice available."}
            </Text>
          </View>

          <SectionTitle icon={interactionIcon} title="Drug-Drug Interaction" />
          {drugDrugInteractions.length === 0 ? (
            <View style={styles.neutralBox}>
              <Text style={styles.neutralText}>
                No drug-drug interaction detected from the available dataset.
              </Text>
            </View>
          ) : (
            drugDrugInteractions.map((item, index) => (
              <View key={index} style={styles.interactionBox}>
                <Text style={styles.interactionTitle}>
                  {item.medicine_1} + {item.medicine_2}
                </Text>
                <Text style={styles.interactionText}>
                  Severity: {item.severity || "-"} | Score:{" "}
                  {item.risk_score ?? "-"}
                </Text>
                <Text style={styles.interactionText}>
                  Type: {item.interaction_type || "-"}
                </Text>
                <Text style={styles.interactionText}>
                  {item.explanation || "No explanation available."}
                </Text>
                {item.recommendation ? (
                  <Text style={styles.recommendationText}>
                    {item.recommendation}
                  </Text>
                ) : null}
              </View>
            ))
          )}

          <SectionTitle icon={shieldIcon} title="Food-Drug Results" />
          {foodDrugResults.length === 0 ? (
            <View style={styles.neutralBox}>
              <Text style={styles.neutralText}>
                No food-drug result available.
              </Text>
            </View>
          ) : (
            foodDrugResults.map((item, index) => {
              const itemLevel = item.final_risk_level || "Unknown";
              const itemColor =
                itemLevel === "Dangerous"
                  ? RED
                  : itemLevel === "Moderate"
                  ? YELLOW
                  : itemLevel === "Safe"
                  ? GREEN
                  : ORANGE;

              return (
                <View key={index} style={styles.interactionBox}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.interactionTitle}>
                      {item.drug_name}
                    </Text>

                    <View style={[styles.smallBadge, { backgroundColor: itemColor }]}>
                      <Text style={styles.smallBadgeText}>{itemLevel}</Text>
                    </View>
                  </View>

                  <Text style={styles.interactionText}>
                    Contains: {item.drug_contains || "-"}
                  </Text>
                  <Text style={styles.interactionText}>
                    Model Risk: {item.model_risk || "-"}
                  </Text>
                  <Text style={styles.interactionText}>
                    Score: {item.risk_score ?? 0}/100
                  </Text>

                  <Text style={styles.subSection}>Explanation</Text>
                  <Text style={styles.paragraph}>
                    {item.explanation?.summary || "No explanation available."}
                  </Text>

                  <Text style={styles.subSection}>Key Risks</Text>
                  {(item.explanation?.key_risks || []).length === 0 ? (
                    <Text style={styles.paragraph}>No key risks found.</Text>
                  ) : (
                    item.explanation.key_risks.map(
                      (risk: string, riskIndex: number) => (
                        <View key={riskIndex} style={styles.bulletRow}>
                          <Text style={styles.bulletDot}>•</Text>
                          <Text style={styles.bulletText}>{risk}</Text>
                        </View>
                      )
                    )
                  )}

                  <Text style={styles.subSection}>Advice</Text>
                  <Text style={styles.paragraph}>
                    {item.explanation?.advice || "No advice available."}
                  </Text>
                </View>
              );
            })
          )}

          <SectionTitle icon={alternativeIcon} title="Recommended Alternatives" />
          {alternatives.length === 0 ? (
            <View style={styles.neutralBox}>
              <Text style={styles.neutralText}>No alternatives available.</Text>
            </View>
          ) : (
            alternatives.map((item, index) => (
              <View key={index} style={styles.altBox}>
                

                <View style={styles.altTextBox}>
                  <Text style={styles.altTitle}>
                    {item.Food || item.food_name || "Alternative"}
                  </Text>
                  <Text style={styles.altText}>
                    {item.food_type || "-"} • {item.consumption_type || "-"} •{" "}
                    {item.energy ?? "-"} kcal
                  </Text>

                  {item.bmi_reason ? (
                    <Text style={styles.altReason}>{item.bmi_reason}</Text>
                  ) : null}
                </View>
              </View>
            ))
          )}

          <Text style={styles.disclaimer}>
            {result?.disclaimer ||
              "This is a decision-support result only and should not be considered medical advice."}
          </Text>

          

          <Pressable
            style={styles.secondaryButton}
            onPress={() => router.replace("/home")}
          >
            <Text style={styles.secondaryText}>Go Home</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionTitle({ icon, title }: { icon: any; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionLine} />
      <View style={styles.titleWithIcon}>
        <Image source={icon} style={styles.sectionIcon} />
        <Text style={styles.section}>{title}</Text>
      </View>
    </View>
  );
}

function InfoCard({
  icon,
  title,
  value,
}: {
  icon: any;
  title: string;
  value: string;
}) {
  return (
    <View style={styles.infoBox}>
      <View style={styles.infoTop}>
        <Image source={icon} style={styles.infoIcon} />
        <Text style={styles.smallLabel}>{title}</Text>
      </View>
      <Text style={styles.value}>{value || "-"}</Text>
    </View>
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
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 34,
  },

  centerBox: {
    flex: 1,
    padding: 22,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: DARK,
  },

  centerText: {
    color: MUTED,
    marginTop: 12,
    fontWeight: "800",
  },

  emptyTitle: {
    color: TEXT,
    fontSize: 26,
    fontWeight: "900",
  },

  emptyText: {
    color: MUTED,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 18,
    lineHeight: 21,
    fontWeight: "600",
  },

  homeBackButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: 16,
    paddingVertical: 6,
    paddingRight: 12,
  },

  homeBackIcon: {
    color: ORANGE,
    fontSize: 34,
    fontWeight: "900",
    marginRight: 4,
    marginTop: -3,
  },

  homeBackText: {
    color: ORANGE,
    fontSize: 15,
    fontWeight: "900",
  },

  heroBox: {
    minHeight: 250,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  heroTextBox: {
    flex: 1.05,
    zIndex: 2,
  },

  heroTitle: {
    color: TEXT,
    fontSize: 38,
    fontWeight: "900",
    lineHeight: 40,
    letterSpacing: -1,
  },

  heroSubtitle: {
    color: "#d4d4d4",
    fontSize: 16,
    lineHeight: 24,
    marginTop: 14,
    fontWeight: "700",
  },

  heroImageWrap: {
    width: 190,
    height: 190,
    marginLeft: -42,
    alignItems: "center",
    justifyContent: "center",
  },

  heroImage: {
    width: 300,
    height: 300,
  },

  mainCard: {
    backgroundColor: "rgba(17,17,17,0.96)",
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(255,122,0,0.42)",
    padding: 18,
    paddingTop: 22,
    shadowColor: ORANGE,
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },

  summaryHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
  },

  headerTitleWrap: {
    flex: 1,
  },

  sectionEyebrow: {
    color: ORANGE,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 4,
  },

  mainTitle: {
    color: TEXT,
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 36,
  },

  riskBadge: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 999,
    marginTop: 4,
  },

  riskBadgeText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 13,
  },

  scorePanel: {
  borderRadius: 22,
  borderWidth: 1.4,
  padding: 16,
  marginBottom: 14,
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  shadowOpacity: 0.38,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 0 },
  elevation: 9,
},

  smallLabel: {
    fontSize: 12,
    color: MUTED,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

 scoreText: {
  fontSize: 32,
  fontWeight: "900",
  marginTop: 4,
},

scoreIconCircle: {
  width: 58,
  height: 58,
  borderRadius: 29,
  borderWidth: 1,
  alignItems: "center",
  justifyContent: "center",
  shadowOpacity: 0.5,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 0 },
  elevation: 8,
},

  panelIcon: {
    width: 58,
    height: 58,
  },

  quickGrid: {
    gap: 10,
  },

  infoBox: {
    backgroundColor: "rgba(5,5,5,0.94)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    padding: 15,
  },

  infoTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  infoIcon: {
    width: 34,
    height: 34,
  },

  value: {
    fontSize: 17,
    fontWeight: "900",
    color: TEXT,
    marginTop: 8,
    lineHeight: 24,
  },

  profileBox: {
    backgroundColor: "rgba(255,122,0,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,122,0,0.35)",
    padding: 15,
    borderRadius: 20,
    marginTop: 12,
  },

  profileTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
    marginBottom: 8,
  },

  titleWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  smallImageIcon: {
    width: 34,
    height: 34,
    marginRight: 8,
  },

  profileTitle: {
    color: TEXT,
    fontWeight: "900",
    fontSize: 16,
    flex: 1,
  },

  profileBadge: {
    color: ORANGE,
    fontWeight: "900",
    fontSize: 12,
    textTransform: "capitalize",
  },

  profileText: {
    color: "#e5e5e5",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 23,
  },

  profileAdvice: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
    fontWeight: "600",
  },

  sectionHeader: {
    marginTop: 24,
    marginBottom: 10,
  },

  sectionLine: {
    width: 42,
    height: 4,
    borderRadius: 99,
    backgroundColor: ORANGE,
    marginBottom: 9,
  },

  sectionIcon: {
    width: 38,
    height: 38,
    marginRight: 9,
  },

  section: {
    color: TEXT,
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 30,
    flex: 1,
  },

  paragraph: {
    fontSize: 15,
    color: "#d8d8d8",
    lineHeight: 24,
    fontWeight: "600",
  },

  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 8,
  },

  bulletDot: {
    color: ORANGE,
    fontSize: 19,
    lineHeight: 24,
    marginRight: 9,
    fontWeight: "900",
  },

  bulletText: {
    flex: 1,
    color: "#d8d8d8",
    fontSize: 15,
    lineHeight: 24,
    fontWeight: "600",
  },

  adviceBox: {
    backgroundColor: "rgba(255,122,0,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,122,0,0.35)",
    borderRadius: 18,
    padding: 14,
  },

  adviceText: {
    color: "#f1f1f1",
    fontSize: 15,
    lineHeight: 24,
    fontWeight: "700",
  },

  neutralBox: {
    backgroundColor: "rgba(5,5,5,0.94)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    padding: 14,
  },

  neutralText: {
    color: MUTED,
    fontSize: 15,
    lineHeight: 23,
    fontWeight: "700",
  },

  interactionBox: {
    backgroundColor: "rgba(5,5,5,0.94)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 20,
    padding: 15,
    marginTop: 12,
  },

  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  interactionTitle: {
    fontWeight: "900",
    color: TEXT,
    fontSize: 18,
    flex: 1,
    lineHeight: 24,
  },

  interactionText: {
    color: MUTED,
    marginTop: 7,
    lineHeight: 22,
    fontSize: 14,
    fontWeight: "700",
  },

  recommendationText: {
    color: ORANGE,
    marginTop: 9,
    lineHeight: 22,
    fontSize: 14,
    fontWeight: "900",
  },

  smallBadge: {
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 999,
  },

  smallBadgeText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 11,
  },

  subSection: {
    fontSize: 15,
    fontWeight: "900",
    color: ORANGE,
    marginTop: 14,
    marginBottom: 6,
  },

  altBox: {
    backgroundColor: "rgba(5,5,5,0.94)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    padding: 14,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  altIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: ORANGE,
    backgroundColor: "rgba(255,122,0,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  altIconImage: {
    width: 38,
    height: 38,
  },

  altTextBox: {
    flex: 1,
  },

  altTitle: {
    fontWeight: "900",
    color: TEXT,
    fontSize: 17,
    lineHeight: 23,
  },

  altText: {
    color: MUTED,
    marginTop: 4,
    fontSize: 14,
    fontWeight: "700",
  },

  altReason: {
    color: "#cfcfcf",
    marginTop: 7,
    fontSize: 12,
    lineHeight: 18,
    fontStyle: "italic",
    fontWeight: "600",
  },

  disclaimer: {
    fontSize: 12,
    color: MUTED,
    marginTop: 20,
    lineHeight: 19,
    fontStyle: "italic",
    fontWeight: "600",
  },

  primaryButton: {
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: ORANGE,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: 22,
    shadowColor: ORANGE,
    shadowOpacity: 0.38,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },

  primaryText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },

  primaryArrow: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 30,
    marginLeft: 8,
    marginTop: -4,
  },

  secondaryButton: {
    minHeight: 54,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: ORANGE,
    backgroundColor: "rgba(255,122,0,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },

  secondaryText: {
    color: ORANGE,
    fontWeight: "900",
    fontSize: 15,
  },
});
