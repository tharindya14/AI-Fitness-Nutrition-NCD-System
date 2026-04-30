const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

exports.register = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      age,
      gender,
      height,
      weight,
      allergies,
      medications,
      healthConditions,
    } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let bmi = null;
    if (height && weight) {
      const heightInMeters = height / 100;
      bmi = Number((weight / (heightInMeters * heightInMeters)).toFixed(2));
    }

    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      age,
      gender,
      height,
      weight,
      bmi,
      allergies: allergies || [],
      medications: medications || [],
      healthConditions: healthConditions || [],
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        bmi: user.bmi,
        allergies: user.allergies,
        medications: user.medications,
        healthConditions: user.healthConditions,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        bmi: user.bmi,
        allergies: user.allergies,
        medications: user.medications,
        healthConditions: user.healthConditions,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};