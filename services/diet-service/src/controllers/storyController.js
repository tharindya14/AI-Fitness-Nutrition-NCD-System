const { spawn } = require("child_process");
const path = require("path");

const PYTHON_PATH = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "venv",
  "Scripts",
  "python.exe"
);

const STORY_CLASSIFIER_PATH = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "ml_service",
  "story_classifier.py"
);

function runPythonStoryClassifier(payload) {
  return new Promise((resolve, reject) => {
    const jsonPayload = JSON.stringify(payload);

    const pythonProcess = spawn(
      PYTHON_PATH,
      [STORY_CLASSIFIER_PATH, jsonPayload],
      {
        windowsHide: true,
      }
    );

    let output = "";
    let errorOutput = "";

    pythonProcess.stdout.on("data", (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on("close", () => {
      try {
        const cleanOutput = output.trim();
        const result = JSON.parse(cleanOutput);
        resolve(result);
      } catch (error) {
        reject(
          new Error(
            errorOutput ||
              output ||
              "Python story classifier failed. No valid JSON output received."
          )
        );
      }
    });
  });
}

function isCasualMessage(story) {
  const text = String(story || "").toLowerCase().trim();

  const casualMessages = [
    "hi",
    "hii",
    "hello",
    "hey",
    "helo",
    "good morning",
    "good afternoon",
    "good evening",
    "how are you",
    "thank you",
    "thanks",
    "ok",
    "okay",
    "bye",
    "good night",
  ];

  return casualMessages.some((msg) => text === msg || text.includes(msg));
}

function casualResponse(cleanStory) {
  return {
    success: true,
    story: cleanStory,

    nlp_prediction: null,
    final_risk_level: null,

    detected_drug: "",
    drug_contains: "",
    detected_food: "",

    classes: [],
    probability: [],

    assistant_reply: {
      type: "casual",
      shouldShowRisk: false,
      message:
        "Hi! I am your FITSHIELD Food-Drug Safety Assistant. You can chat with me about the medicine you took and the food or drink you consumed.",
      explanation:
        "I will only show Safe, Moderate, or Dangerous when you give me a proper food-drug story with both medicine and food details.",
      advice:
        "For example, you can type: “I took Warf 5 Tablet and ate spinach today.”",
    },

    explanation: {
      summary:
        "Hi! I am your FITSHIELD Food-Drug Safety Assistant. You can chat with me about medicine and food safety.",
      details:
        "Please provide a medicine name and a food or drink name when you want a safety check.",
      advice:
        "Example: “I took Warf 5 Tablet and ate spinach today.”",
      disclaimer:
        "This is a decision-support result only and should not be considered medical advice.",
    },
  };
}

function buildFriendlyAssistantReply(result) {
  const risk = result.nlp_prediction || "Unknown";
  const drug = result.detected_drug;
  const food = result.detected_food;
  const contains = result.drug_contains;

  if (!drug && !food) {
    return {
      type: "clarification",
      shouldShowRisk: false,
      message:
        "I can help you, but I could not clearly detect a medicine or food from your message.",
      explanation:
        "To check food-drug safety, I need both the medicine name and the food or drink name. A normal message without medicine or food details should not be classified as a risk result.",
      advice:
        "Please type your situation like: “I took Warf 5 Tablet and ate spinach today.”",
    };
  }

  if (drug && !food) {
    return {
      type: "partial_drug",
      shouldShowRisk: false,
      message: `Okay, I detected the medicine as ${drug}${
        contains ? `, which contains ${contains}` : ""
      }.`,
      explanation:
        "I still need to know what food or drink you consumed to check the food-drug safety risk properly.",
      advice:
        "Please tell me the food or drink name. Example: “I ate spinach” or “I drank beer”.",
    };
  }

  if (!drug && food) {
    return {
      type: "partial_food",
      shouldShowRisk: false,
      message: `Okay, I detected the food or drink as ${food}.`,
      explanation:
        "I still need the medicine name to check whether there is any food-drug interaction risk.",
      advice:
        "Please tell me the medicine name, tablet name, or active ingredient.",
    };
  }

  if (risk === "Dangerous") {
    return {
      type: "risk_result",
      shouldShowRisk: true,
      message: `I checked your story. You mentioned ${drug} with ${food}. This situation may be risky.`,
      explanation:
        "This combination was classified as Dangerous based on the NLP model and available food-drug safety data. Some foods or drinks can increase medicine side effects or reduce the effectiveness of certain medicines.",
      advice:
        "Avoid this combination and speak with a doctor or pharmacist before consuming it again.",
    };
  }

  if (risk === "Moderate") {
    return {
      type: "risk_result",
      shouldShowRisk: true,
      message: `I checked your story. You mentioned ${drug} with ${food}. This situation needs caution.`,
      explanation:
        "This combination was classified as Moderate. It does not always mean it is highly dangerous, but the system detected a possible food-drug safety concern based on the available dataset and NLP model.",
      advice:
        "Use caution. If you take this medicine regularly, keep your food habits consistent and ask a healthcare professional if you are unsure.",
    };
  }

  if (risk === "Safe") {
    return {
      type: "risk_result",
      shouldShowRisk: true,
      message: `I checked your story. You mentioned ${drug} with ${food}. No major risk was detected.`,
      explanation:
        "This combination was classified as Safe based on the available dataset and NLP model. However, this does not replace professional medical advice.",
      advice:
        "Continue to follow your doctor’s instructions and medicine label advice.",
    };
  }

  return {
    type: "unknown",
    shouldShowRisk: false,
    message:
      "I analyzed your message, but I could not clearly understand the food-drug safety situation.",
    explanation:
      "The model returned an unclear result. Please give a clearer message with medicine and food details.",
    advice:
      "Example: “I took Warf 5 Tablet and ate spinach today.”",
  };
}

exports.classifyFoodDrugStory = async (req, res) => {
  try {
    const { story } = req.body;

    if (!story || !story.trim()) {
      return res.status(400).json({
        success: false,
        message: "Story is required",
      });
    }

    const cleanStory = story.trim();

    // Normal chat/greeting messages should not go to the NLP risk classifier.
    if (isCasualMessage(cleanStory)) {
      return res.json(casualResponse(cleanStory));
    }

    // Food-drug story classification.
    const result = await runPythonStoryClassifier({
      story: cleanStory,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Story classification failed",
        error: result.error || "Unknown classifier error",
      });
    }

    const assistantReply = buildFriendlyAssistantReply(result);

    return res.json({
      success: true,

      story: result.story,

      nlp_prediction:
        assistantReply.shouldShowRisk === true ? result.nlp_prediction : null,

      final_risk_level:
        assistantReply.shouldShowRisk === true ? result.nlp_prediction : null,

      detected_drug: result.detected_drug,
      drug_contains: result.drug_contains,
      detected_food: result.detected_food,

      classes: assistantReply.shouldShowRisk === true ? result.classes : [],
      probability:
        assistantReply.shouldShowRisk === true ? result.probability : [],

      assistant_reply: assistantReply,

      explanation: {
        summary: assistantReply.message,
        details: assistantReply.explanation,
        advice: assistantReply.advice,
        disclaimer:
          "This is a decision-support result only and should not be considered medical advice.",
      },
    });
  } catch (error) {
    console.error("Story classification error:", error);

    return res.status(500).json({
      success: false,
      message: "Story classification failed",
      error: error.message,
    });
  }
};