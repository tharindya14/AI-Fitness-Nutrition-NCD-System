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
  age: user.age,
  gender: user.gender,
  height: user.height,
  weight: user.weight,
  bmi: user.bmi,
  allergies: user.allergies,
  medications: user.medications,
  healthConditions: user.healthConditions,
  profileImage: user.profileImage,
defaultAvatar: user.defaultAvatar,
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
        age: user.age,
        gender: user.gender,
        height: user.height,
        weight: user.weight,
        bmi: user.bmi,
        allergies: user.allergies,
        medications: user.medications,
        healthConditions: user.healthConditions,
        profileImage: user.profileImage,
        defaultAvatar: user.defaultAvatar,
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

exports.getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
      error: error.message,
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const {
      age,
      gender,
      height,
      weight,
      allergies,
      medications,
      healthConditions,
    } = req.body;

    const heightNumber = height ? Number(height) : null;
    const weightNumber = weight ? Number(weight) : null;
    const ageNumber = age ? Number(age) : null;

    let bmi = null;

    if (heightNumber && weightNumber && heightNumber > 0 && weightNumber > 0) {
      const heightInMeters = heightNumber / 100;
      bmi = Number(
        (weightNumber / (heightInMeters * heightInMeters)).toFixed(2)
      );
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      {
        $set: {
          age: ageNumber,
          gender: gender || "",
          height: heightNumber,
          weight: weightNumber,
          bmi,
          allergies: Array.isArray(allergies) ? allergies : [],
          medications: Array.isArray(medications) ? medications : [],
          healthConditions: Array.isArray(healthConditions)
            ? healthConditions
            : [],
        },
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    });
  }
};

exports.uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file uploaded",
      });
    }

   const baseUrl =process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`;
    const imageUrl = `${baseUrl}/uploads/profile-images/${req.file.filename}`;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      {
        $set: {
          profileImage: imageUrl,
          defaultAvatar: "",
        },
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      message: "Profile image uploaded successfully",
      profileImage: imageUrl,
      user: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Profile image upload failed",
      error: error.message,
    });
  }
};

exports.setDefaultAvatar = async (req, res) => {
  try {
    const { defaultAvatar } = req.body;

    if (!defaultAvatar) {
      return res.status(400).json({
        success: false,
        message: "Default avatar is required",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      {
        $set: {
          defaultAvatar,
          profileImage: "",
        },
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      message: "Default avatar selected successfully",
      defaultAvatar,
      user: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to set default avatar",
      error: error.message,
    });
  }
};
