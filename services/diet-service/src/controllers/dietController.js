const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const DietSafetyLog = require("../models/DietSafetyLog");
const User = require("../models/AuthUser");

function findPythonExecutable() {
  const projectRoot = path.join(__dirname, "..", "..", "..", "..");

  const candidates = [
    process.env.PYTHON_PATH,

    path.join(projectRoot, ".venv", "Scripts", "python.exe"),
    path.join(projectRoot, "venv", "Scripts", "python.exe"),

    path.join(os.homedir(), "venv", "Scripts", "python.exe"),
    path.join(os.homedir(), ".venv", "Scripts", "python.exe"),

    "python",
    "python3",
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      if (candidate === "python" || candidate === "python3") {
        return candidate;
      }

      if (fs.existsSync(candidate) && fs.lstatSync(candidate).isFile()) {
        return candidate;
      }
    } catch {
      continue;
    }
  }

  return null;
}

function buildInputData(body) {
  let medicineNames = body.medicine_names || body.medicineNames || [];

  if (typeof medicineNames === "string") {
    medicineNames = medicineNames
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (!Array.isArray(medicineNames)) {
    medicineNames = [];
  }

  if (body.drug_name && medicineNames.length === 0) {
    medicineNames = [body.drug_name];
  }

  return {
    height_cm: body.height_cm || body.heightCm || body.height,
    weight_kg: body.weight_kg || body.weightKg || body.weight,
    medicine_names: medicineNames,
    food_name: body.food_name || body.foodName,
    allergies: Array.isArray(body.allergies) ? body.allergies : [],
  };
}

async function updateUserProfileFromDietCheck(userId, inputData, parsedResult) {
  const updateData = {};

  if (parsedResult.height_cm !== undefined && parsedResult.height_cm !== null) {
    updateData.height = Number(parsedResult.height_cm);
  }

  if (parsedResult.weight_kg !== undefined && parsedResult.weight_kg !== null) {
    updateData.weight = Number(parsedResult.weight_kg);
  }

  if (parsedResult.bmi !== undefined && parsedResult.bmi !== null) {
    updateData.bmi = Number(parsedResult.bmi);
  }

  if (Array.isArray(inputData.allergies)) {
    updateData.allergies = inputData.allergies;
  }

  if (Array.isArray(parsedResult.medicine_names)) {
    updateData.medications = parsedResult.medicine_names;
  }

  if (Object.keys(updateData).length === 0) {
    return null;
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: updateData },
    {
      new: true,
      runValidators: false,
    }
  ).select("-password");

  return updatedUser;
}

exports.checkDietSafety = async (req, res) => {
  try {
    const inputData = buildInputData(req.body);

    if (!inputData.food_name) {
      return res.status(400).json({
        success: false,
        message: "Food name is required.",
      });
    }

    if (!inputData.medicine_names || inputData.medicine_names.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one medicine is required.",
      });
    }

    const pythonScriptPath = path.join(
      __dirname,
      "..",
      "..",
      "..",
      "..",
      "ml_service",
      "main.py"
    );

    if (!fs.existsSync(pythonScriptPath)) {
      return res.status(500).json({
        success: false,
        message: "Python ML script not found.",
        pythonScriptPath,
      });
    }

    const pythonPath = findPythonExecutable();

    if (!pythonPath) {
      return res.status(500).json({
        success: false,
        message:
          "Python executable not found. Set PYTHON_PATH in .env or use project .venv.",
      });
    }

    console.log("Diet safety input:", inputData);
    console.log("Using Python:", pythonPath);

    const pythonProcess = spawn(pythonPath, [
      pythonScriptPath,
      JSON.stringify(inputData),
    ]);

    let result = "";
    let error = "";
    let responseSent = false;

    pythonProcess.stdout.on("data", (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      error += data.toString();
    });

    pythonProcess.on("error", (spawnError) => {
      if (responseSent) return;
      responseSent = true;

      return res.status(500).json({
        success: false,
        message: "Failed to start Python process.",
        error: spawnError.message,
      });
    });

    pythonProcess.on("close", async (code) => {
      if (responseSent) return;
      responseSent = true;

      let parsedResult;

      try {
        parsedResult = JSON.parse(result);
      } catch {
        return res.status(500).json({
          success: false,
          message: "Failed to parse Python output.",
          rawOutput: result,
          pythonError: error,
        });
      }

      if (code !== 0) {
        return res.status(500).json({
          success: false,
          message: "Python ML service failed.",
          error,
          result: parsedResult,
        });
      }

      if (parsedResult.success) {
        const updatedUserProfile = await updateUserProfileFromDietCheck(
          req.user.userId,
          inputData,
          parsedResult
        );

        await DietSafetyLog.create({
          userId: req.user.userId,

          heightCm: parsedResult.height_cm,
          weightKg: parsedResult.weight_kg,
          bmi: parsedResult.bmi,
          bmiCategory: parsedResult.bmi_category,
          bmiAdvice: parsedResult.bmi_advice,

          medicineNames: parsedResult.medicine_names,
          foodName: parsedResult.food_name,
          requestedFoodName: parsedResult.requested_food_name,
          allergies: inputData.allergies,

          drugDrugInteractions: parsedResult.drug_drug_interactions,
          foodDrugResults: parsedResult.food_drug_results,

          finalRiskScore: parsedResult.final_risk_score,
          finalRiskLevel: parsedResult.final_risk_level,
          summary: parsedResult.summary,
          overallAdvice: parsedResult.overall_advice,

          recommendedAlternatives: parsedResult.recommended_alternatives,
          disclaimer: parsedResult.disclaimer,
        });

        parsedResult.user_profile = updatedUserProfile;
      }

      return res.json(parsedResult);
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Diet safety check failed.",
      error: error.message,
    });
  }
};

exports.getMyDietHistory = async (req, res) => {
  try {
    const logs = await DietSafetyLog.find({ userId: req.user.userId }).sort({
      createdAt: -1,
    });

    return res.json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch diet history.",
      error: error.message,
    });
  }
};

exports.deleteDietHistoryItem = async (req, res) => {
  try {
    const deletedLog = await DietSafetyLog.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!deletedLog) {
      return res.status(404).json({
        success: false,
        message: "History item not found.",
      });
    }

    return res.json({
      success: true,
      message: "Diet safety history item deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete diet history item.",
      error: error.message,
    });
  }
};