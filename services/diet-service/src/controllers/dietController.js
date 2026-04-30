const { spawn } = require("child_process");
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

    const pythonPath = path.join(
      __dirname,
      "..",
      "..",
      "..",
      "..",
      "venv",
      "Scripts",
      "python.exe"
    );

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