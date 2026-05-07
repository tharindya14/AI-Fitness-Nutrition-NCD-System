const axios = require("axios");

const SupplementProfile = require("../models/SupplementProfile");
const SupplementRecommendation = require("../models/SupplementRecommendation");
const SupplementSchedule = require("../models/SupplementSchedule");
const SupplementProgress = require("../models/SupplementProgress");

const ML_API = process.env.SUPPLEMENT_ML_API || "http://127.0.0.1:8001";



exports.getRecommendations = async (req, res) => {
  try {
    const userId = req.user.userId;

    const {
      name,
      age,
      gender,
      height_cm,
      weight_kg,
      bmi,
      health_condition,
      medication,
      goal,
      budget_range,
      activity_level,
    } = req.body;

    if (
      !name ||
      !age ||
      !gender ||
      !height_cm ||
      !weight_kg ||
      !bmi ||
      !goal ||
      !budget_range ||
      !activity_level
    ) {
      return res.status(400).json({
        success: false,
        message: "Required user profile fields are missing",
      });
    }

    const profile = await SupplementProfile.create({
      userId,
      name,
      age,
      gender,
      height_cm,
      weight_kg,
      bmi,
      health_condition: health_condition || "none",
      medication: medication || "none",
      goal,
      budget_range,
      activity_level,
    });

    const mlPayload = {
      age,
      gender,
      height_cm,
      weight_kg,
      bmi,
      health_condition: health_condition || "none",
      medication: medication || "none",
      goal,
      budget_range,
      activity_level,
    };

    const mlResponse = await axios.post(
      `${ML_API}/supplement/recommend`,
      mlPayload
    );

    const mlData = mlResponse.data.data;

    const savedRecommendation = await SupplementRecommendation.create({
      userId,
      profileId: profile._id,
      predicted_category: mlData.predicted_category,
      user_budget_range: mlData.user_budget_range,
      total_matched_products: mlData.total_matched_products,
      safe_products_count: mlData.safe_products_count,
      unsafe_products_count: mlData.unsafe_products_count,
      recommendations: mlData.recommendations,
      unsafe_products: mlData.unsafe_products,
      note: mlData.note,
    });

    return res.status(200).json({
      success: true,
      message: "Supplement recommendations generated and saved successfully",
      data: {
        profile,
        recommendation: savedRecommendation,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to get supplement recommendations",
      error: error.response?.data || error.message,
    });
  }
};

exports.generateSchedule = async (req, res) => {
  try {
    const userId = req.user.userId;

    const {
      recommendationId,
      supplement_id,
      supplement_name,
      category,
      ingredients,
      goal,
    } = req.body;

    if (!supplement_id || !supplement_name || !category) {
      return res.status(400).json({
        success: false,
        message: "Required supplement schedule fields are missing",
      });
    }

    const mlPayload = {
      supplement_id,
      supplement_name,
      category,
      ingredients: ingredients || "",
      goal: goal || "",
    };

    const mlResponse = await axios.post(
      `${ML_API}/supplement/generate-schedule`,
      mlPayload
    );

    const scheduleData = mlResponse.data.data;

    const savedSchedule = await SupplementSchedule.create({
      userId,
      recommendationId,
      supplement_id: scheduleData.supplement_id,
      supplement_name: scheduleData.supplement_name,
      category: scheduleData.category,
      recommended_time: scheduleData.recommended_time,
      with_meal: scheduleData.with_meal,
      frequency_per_day: scheduleData.frequency_per_day,
      dose_instruction: scheduleData.dose_instruction,
      duration_weeks: scheduleData.duration_weeks,
      avoid_with: scheduleData.avoid_with,
      spacing_rule: scheduleData.spacing_rule,
      tracking_frequency: scheduleData.tracking_frequency,
      expected_result_window: scheduleData.expected_result_window,
      adherence_tip: scheduleData.adherence_tip,
      safety_note: scheduleData.safety_note,
    });

    return res.status(200).json({
      success: true,
      message: "Supplement schedule generated and saved successfully",
      data: savedSchedule,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to generate supplement schedule",
      error: error.response?.data || error.message,
    });
  }
};

function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

exports.addProgress = async (req, res) => {
  try {
    const userId = req.user.userId;

    const {
      scheduleId,
      supplement_id,
      supplement_name,
      taken_status,
      weight_kg,
      bmi,
      energy_level_1_5,
      workout_performance_1_5,
      side_effects,
      goal_progress_percentage,
      note,
    } = req.body;

    if (!scheduleId || !supplement_id || !supplement_name || !taken_status) {
      return res.status(400).json({
        success: false,
        message: "Required progress fields are missing",
      });
    }

    const today = getTodayString();

    const progress = await SupplementProgress.findOneAndUpdate(
      {
        userId,
        scheduleId,
        log_day: today,
      },
      {
        userId,
        scheduleId,
        supplement_id,
        supplement_name,
        log_date: new Date(),
        log_day: today,
        taken_status,
        weight_kg,
        bmi,
        energy_level_1_5,
        workout_performance_1_5,
        side_effects: side_effects || "None",
        goal_progress_percentage: goal_progress_percentage || 0,
        note: note || "",
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Today’s progress saved or updated successfully",
      data: progress,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to save today’s progress",
      error: error.message,
    });
  }
};

exports.getMyHistory = async (req, res) => {
  try {
    const userId = req.user.userId;

    const history = await SupplementRecommendation.find({ userId })
      .populate("profileId")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to get supplement history",
      error: error.message,
    });
  }
};

exports.getMySchedules = async (req, res) => {
  try {
    const userId = req.user.userId;

    const schedules = await SupplementSchedule.find({ userId }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: schedules.length,
      data: schedules,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to get supplement schedules",
      error: error.message,
    });
  }
};

exports.getMyProgress = async (req, res) => {
  try {
    const userId = req.user.userId;

    const progressLogs = await SupplementProgress.find({ userId })
      .populate("scheduleId")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: progressLogs.length,
      data: progressLogs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to get progress logs",
      error: error.message,
    });
  }
};

exports.getTodayProgress = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { scheduleId } = req.query;

    if (!scheduleId) {
      return res.status(400).json({
        success: false,
        message: "scheduleId is required",
      });
    }

    const today = new Date().toISOString().split("T")[0];

    const progress = await SupplementProgress.findOne({
      userId,
      scheduleId,
      log_day: today,
    });

    return res.status(200).json({
      success: true,
      exists: !!progress,
      data: progress,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to get today’s progress",
      error: error.message,
    });
  }
};

exports.getMyReport = async (req, res) => {
  try {
    const userId = req.user.userId;

    const schedules = await SupplementSchedule.find({ userId });
    const progressLogs = await SupplementProgress.find({ userId }).sort({
      createdAt: 1,
    });

    const totalLogs = progressLogs.length;
    const takenCount = progressLogs.filter(
      (log) => log.taken_status === "taken"
    ).length;
    const missedCount = progressLogs.filter(
      (log) => log.taken_status === "missed"
    ).length;
    const skippedCount = progressLogs.filter(
      (log) => log.taken_status === "skipped"
    ).length;

    const adherencePercentage =
      totalLogs > 0 ? Math.round((takenCount / totalLogs) * 100) : 0;

    const latestProgress =
      progressLogs.length > 0 ? progressLogs[progressLogs.length - 1] : null;

    return res.status(200).json({
      success: true,
      data: {
        activeSchedules: schedules.filter((item) => item.status === "active")
          .length,
        totalSchedules: schedules.length,
        totalProgressLogs: totalLogs,
        takenCount,
        missedCount,
        skippedCount,
        adherencePercentage,
        latestProgress,
        message:
          totalLogs === 0
            ? "No progress logs yet"
            : "Progress report generated successfully",
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to generate progress report",
      error: error.message,
    });
  }
};

exports.deleteProgress = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { progressId } = req.params;

    const deletedProgress = await SupplementProgress.findOneAndDelete({
      _id: progressId,
      userId,
    });

    if (!deletedProgress) {
      return res.status(404).json({
        success: false,
        message: "Progress log not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Progress log deleted successfully",
      data: deletedProgress,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete progress log",
      error: error.message,
    });
  }
};