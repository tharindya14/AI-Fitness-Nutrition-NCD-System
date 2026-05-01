const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const DietSafetyLog = require("../models/DietSafetyLog");

exports.checkDietSafety = async (req, res) => {
  try {
    const inputData = {
      drug_name: req.body.drug_name,
      food_name: req.body.food_name,
      allergies: req.body.allergies || [],
    };

    const pythonScriptPath = path.join(
      __dirname,
      "..",
      "..",
      "..",
      "..",
      "ml_service",
      "main.py"
    );

    const defaultVenvPath = path.join(
      __dirname,
      "..",
      "..",
      "..",
      "..",
      "venv",
      "Scripts",
      "python.exe"
    );

    const homeVenvPath = path.join(os.homedir(), "venv", "Scripts", "python.exe");
    const downloadsEmbedPath = path.join(
      os.homedir(),
      "Downloads",
      "python-3.11.0-embed-amd64",
      "python.exe"
    );

    const candidates = [
      process.env.PYTHON_PATH,
      defaultVenvPath,
      homeVenvPath,
      downloadsEmbedPath,
      "python",
      "python3",
    ].filter(Boolean);

    const pythonPath = candidates.find((candidate) => {
      try {
        return fs.existsSync(candidate) && fs.lstatSync(candidate).isFile();
      } catch {
        return false;
      }
    });

    if (!pythonPath) {
      return res.status(500).json({
        success: false,
        message:
          "Python executable not found. Set PYTHON_PATH in .env or install Python on PATH.",
        checkedPaths: candidates,
      });
    }

    console.log("Using Python:", pythonPath);

    const pythonProcess = spawn(pythonPath, [
      pythonScriptPath,
      JSON.stringify(inputData),
    ]);

    let result = "";
    let error = "";

    pythonProcess.stdout.on("data", (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      error += data.toString();
    });

    pythonProcess.on("error", (spawnError) => {
      return res.status(500).json({
        success: false,
        message: "Failed to start Python process",
        error: spawnError.message,
      });
    });

    pythonProcess.on("close", async (code) => {
      let parsedResult;

      try {
        parsedResult = JSON.parse(result);
      } catch (parseError) {
        return res.status(500).json({
          success: false,
          message: "Failed to parse Python output",
          rawOutput: result,
          pythonError: error,
        });
      }

      if (code !== 0) {
        return res.status(500).json({
          success: false,
          message: "Python ML service failed",
          error,
          result: parsedResult,
        });
      }

      if (parsedResult.success) {
        await DietSafetyLog.create({
          userId: req.user.userId,
          drugName: parsedResult.drug_name,
          foodName: parsedResult.food_name,
          allergies: inputData.allergies,
          modelRisk: parsedResult.model_risk,
          allergyRisks: parsedResult.allergy_risks,
          ruleWarnings: parsedResult.rule_warnings,
          riskScore: parsedResult.risk_score,
          finalRiskLevel: parsedResult.final_risk_level,
          probability: parsedResult.probability,
          recommendedAlternatives: parsedResult.recommended_alternatives,
        });
      }

      return res.json(parsedResult);
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Diet safety check failed",
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
      message: "Failed to fetch diet history",
      error: error.message,
    });
  }
};