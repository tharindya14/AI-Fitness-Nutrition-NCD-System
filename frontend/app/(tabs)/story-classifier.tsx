import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { getItem } from "@/utils/storage";

export default function StoryClassifierPage() {
  const [story, setStory] = useState(
    "I took Warf 5 Tablet and ate spinach today."
  );
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<any[]>([
    {
      sender: "assistant",
      text:
        "Hi! I am your Food-Drug Story Assistant. You can tell me casually what medicine you took and what food or drink you had. I will understand your story, detect the medicine and food, and explain the possible safety risk in a simple way.",
    },
  ]);

  const classifyStory = async () => {
    if (!story.trim()) {
      Alert.alert("Missing Story", "Please type your food-drug story.");
      return;
    }

    const userStory = story.trim();

    try {
      setLoading(true);

      setMessages((prev) => [
        ...prev,
        {
          sender: "user",
          text: userStory,
        },
      ]);

      setStory("");

      const token = await getItem("token");

      if (!token) {
        Alert.alert("Login Required", "Please login first.");
        router.replace("/" as any);
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/diet/classify-story`,
        {
          story: userStory,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessages((prev) => [
        ...prev,
        {
          sender: "assistant",
          result: response.data,
        },
      ]);
    } catch (error: any) {
      console.log(
        "Story classifier error:",
        error.response?.data || error.message
      );

      setMessages((prev) => [
        ...prev,
        {
          sender: "assistant",
          text:
            "Sorry, I could not analyze your story right now. Please check whether the backend services are running and try again.",
        },
      ]);

      Alert.alert(
        "Story Classification Failed",
        error.response?.data?.message || error.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Food-Drug Story Assistant</Text>
          <Text style={styles.subtitle}>
            Friendly NLP chat assistant for food-drug safety
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.chatArea}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message, index) => {
            if (message.sender === "user") {
              return <UserBubble key={index} text={message.text} />;
            }

            if (message.result) {
              return (
                <AssistantResultBubble key={index} result={message.result} />
              );
            }

            return <AssistantBubble key={index} text={message.text} />;
          })}

          {loading && (
            <View style={styles.loadingBubble}>
              <ActivityIndicator size="small" color="#2D6A4F" />
              <Text style={styles.loadingText}>Analyzing your story...</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputArea}>
          <TextInput
            style={styles.input}
            value={story}
            onChangeText={setStory}
            placeholder="Example: I took Warf 5 Tablet and ate spinach today."
            multiline
            autoCorrect={false}
          />

          <Pressable
            style={[styles.sendButton, loading && styles.disabledButton]}
            onPress={classifyStory}
            disabled={loading}
          >
            <Text style={styles.sendText}>Send</Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.backButton}
          onPress={() => router.replace("/home" as any)}
        >
          <Text style={styles.backText}>Back to Home</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <View style={styles.userBubble}>
      <Text style={styles.userLabel}>You</Text>
      <Text style={styles.userText}>{text}</Text>
    </View>
  );
}

function AssistantBubble({ text }: { text: string }) {
  return (
    <View style={styles.assistantBubble}>
      <Text style={styles.assistantLabel}>FITSHIELD Assistant</Text>
      <Text style={styles.assistantText}>{text}</Text>
    </View>
  );
}

function AssistantResultBubble({ result }: { result: any }) {
  const riskLevel =
    result?.nlp_prediction || result?.final_risk_level || "Unknown";

  const riskColor =
    riskLevel === "Dangerous"
      ? "#C0392B"
      : riskLevel === "Moderate"
      ? "#F77F00"
      : "#2D6A4F";

  const drug = result.detected_drug || "Not detected";
  const contains = result.drug_contains || "Not detected";
  const food = result.detected_food || "Not detected";

  const mainMessage =
    result.assistant_reply?.message ||
    result.explanation?.summary ||
    `I checked your story and classified it as ${riskLevel}.`;

  const description =
    result.assistant_reply?.explanation ||
    result.explanation?.details ||
    getFriendlyDescription(riskLevel, drug, food);

  const advice =
    result.assistant_reply?.advice ||
    result.explanation?.advice ||
    getFriendlyAdvice(riskLevel);

  return (
    <View style={styles.assistantBubble}>
      <Text style={styles.assistantLabel}>FITSHIELD Assistant</Text>

      <Text style={styles.assistantText}>{mainMessage}</Text>

      <View style={[styles.riskBadge, { backgroundColor: riskColor }]}>
        <Text style={styles.riskBadgeText}>{riskLevel}</Text>
      </View>

      <Text style={styles.sectionTitle}>What I detected from your story</Text>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Medication</Text>
        <Text style={styles.infoValue}>{drug}</Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Drug Contains</Text>
        <Text style={styles.infoValue}>{contains}</Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Food / Drink</Text>
        <Text style={styles.infoValue}>{food}</Text>
      </View>

      <Text style={styles.sectionTitle}>Simple Explanation</Text>
      <Text style={styles.assistantText}>{description}</Text>

      <Text style={styles.sectionTitle}>What you should do</Text>
      <Text style={styles.assistantText}>{advice}</Text>

      {result.probability && (
        <>
          <Text style={styles.sectionTitle}>Model Confidence</Text>
          <Text style={styles.confidenceText}>
            {formatProbability(result.classes, result.probability)}
          </Text>
        </>
      )}

      <Text style={styles.disclaimer}>
        This result is only for decision-support. It is not medical advice.
        Always follow guidance from a doctor or pharmacist.
      </Text>
    </View>
  );
}

function getFriendlyDescription(riskLevel: string, drug: string, food: string) {
  if (riskLevel === "Dangerous") {
    return `You mentioned ${drug} with ${food}. This may be an unsafe combination according to the available dataset and NLP model. Some foods or drinks can increase side effects or reduce the effectiveness of certain medicines.`;
  }

  if (riskLevel === "Moderate") {
    return `You mentioned ${drug} with ${food}. This does not always mean it is highly dangerous, but the system found a possible safety concern. It is better to be careful with this combination, especially if you take the medicine regularly.`;
  }

  if (riskLevel === "Safe") {
    return `You mentioned ${drug} with ${food}. Based on the available dataset and NLP model, no major food-drug safety concern was detected for this story.`;
  }

  return "I could not clearly understand the risk level from your story. Please give a clearer medicine name and food name.";
}

function getFriendlyAdvice(riskLevel: string) {
  if (riskLevel === "Dangerous") {
    return "Avoid this combination and speak with a doctor or pharmacist before consuming it again.";
  }

  if (riskLevel === "Moderate") {
    return "Use caution. Try to keep your food habits consistent and ask a healthcare professional if you are unsure.";
  }

  if (riskLevel === "Safe") {
    return "No major risk was detected, but continue to follow your doctor’s instructions and medicine label advice.";
  }

  return "Please type a clearer story, such as: “I took Warf 5 Tablet and ate spinach today.”";
}

function formatProbability(classes: string[] = [], probability: number[] = []) {
  if (!classes.length || !probability.length) return "N/A";

  return classes
    .map((className, index) => {
      const value = probability[index] || 0;
      return `${className}: ${(value * 100).toFixed(1)}%`;
    })
    .join(" | ");
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F7F4",
  },
  keyboard: {
    flex: 1,
  },
  header: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#DCE8DF",
  },
  title: {
    fontSize: 27,
    fontWeight: "900",
    color: "#1B4332",
  },
  subtitle: {
    fontSize: 14,
    color: "#5C6B63",
    marginTop: 4,
  },
  chatArea: {
    padding: 18,
    paddingBottom: 20,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#2D6A4F",
    padding: 15,
    borderRadius: 18,
    borderTopRightRadius: 4,
    maxWidth: "85%",
    marginBottom: 14,
  },
  userLabel: {
    color: "#D8F3DC",
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 4,
  },
  userText: {
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600",
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 18,
    borderTopLeftRadius: 4,
    maxWidth: "92%",
    marginBottom: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  assistantLabel: {
    color: "#1B4332",
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 6,
  },
  assistantText: {
    color: "#222",
    fontSize: 15,
    lineHeight: 23,
  },
  riskBadge: {
    alignSelf: "flex-start",
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 20,
    marginTop: 14,
    marginBottom: 10,
  },
  riskBadgeText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  infoBox: {
    backgroundColor: "#F1F5F2",
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
  },
  infoTitle: {
    color: "#344E41",
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 3,
  },
  infoValue: {
    color: "#111",
    fontSize: 15,
    fontWeight: "700",
  },
  sectionTitle: {
    color: "#1B4332",
    fontSize: 16,
    fontWeight: "900",
    marginTop: 14,
    marginBottom: 6,
  },
  confidenceText: {
    color: "#333",
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "700",
  },
  disclaimer: {
    color: "#777",
    fontSize: 12,
    lineHeight: 18,
    fontStyle: "italic",
    marginTop: 14,
  },
  loadingBubble: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 18,
    marginBottom: 14,
  },
  loadingText: {
    marginLeft: 10,
    color: "#1B4332",
    fontWeight: "700",
  },
  inputArea: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#DCE8DF",
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 110,
    backgroundColor: "#F1F5F2",
    borderWidth: 1,
    borderColor: "#DCE8DF",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: "#111",
    lineHeight: 21,
  },
  sendButton: {
    backgroundColor: "#2D6A4F",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 18,
    marginLeft: 10,
  },
  disabledButton: {
    opacity: 0.6,
  },
  sendText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 15,
  },
  backButton: {
    backgroundColor: "#E8F3EC",
    padding: 14,
    alignItems: "center",
  },
  backText: {
    color: "#2D6A4F",
    fontWeight: "900",
    fontSize: 15,
  },
});