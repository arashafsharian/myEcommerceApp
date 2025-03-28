import jwt from "jsonwebtoken";
import { redis } from "./redis.js";

export const generateTokens = async (userId) => {
  try {
    const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "15m",
    });
    const refreshToken = jwt.sign(
      { userId },
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: "7d",
      }
    );

    await storeRefreshToken(userId, refreshToken);

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Error generating tokens:", error);
    throw new Error("Token generation failed");
  }
};

export const storeRefreshToken = async (userId, refreshToken) => {
  try {
    await redis.setex(`refreshToken:${userId}`, 7 * 24 * 60 * 60, refreshToken);
  } catch (error) {
    console.error("Error storing refresh token:", error);
    throw new Error("Failed to store refresh token");
  }
};

export const setCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    maxAge: process.env.ACCESS_TOKEN_EXPIRY || 15 * 60 * 1000,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    maxAge: process.env.REFRESH_TOKEN_EXPIRY || 7 * 24 * 60 * 60 * 1000,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
};
