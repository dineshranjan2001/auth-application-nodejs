import jwt from "jsonwebtoken";
import crypto from "node:crypto";

const ACCESS_SECRET = process.env.ACCESS_SECRET;
const ACCESS_EXPIRES_IN = process.env.ACCESS_EXPIRES_IN || "10m";

/**
 * @param{string} userId - user ID
 * @param{string} sessionId - session ID
 * @returns{string} Generated access token
 */
export const generateAccessToken = (userId, sessionId) => {
  const accessToken = jwt.sign(
    {
      sid: sessionId,
    },
    ACCESS_SECRET,
    {
      subject: userId,
      expiresIn: ACCESS_EXPIRES_IN,
      issuer: "my-api",
      audience: "my-frontend",
      algorithm: "HS256",
    },
  );
  return accessToken;
};

/**
 * @typedef{Object} AccessTokenPayload
 * @property {string} sub - Subject (user ID)
 * @property {string} sid - Session ID
 */

/**
 * @param{string} token - JWT access token
 * @returns{AccessTokenPayload} Decoded token payload
 */
export const verifyAccessToken = (token) => {
  const decodedToken = jwt.verify(token, ACCESS_SECRET, {
    issuer: "my-api",
    audience: "my-frontend",
    algorithm: "HS256",
  });

  if (
    typeof decodedToken === "string" ||
    !decodedToken ||
    !decodedToken.sub ||
    typeof decodedToken.sub !== "string"
  ) {
    throw new Error("Invalid access token");
  }
  return { sub: decodedToken.sub, sid: decodedToken.sid };
};


/**
 *Generate cryptographically secure refresh token and return a string
 *@returns{string} return refresh JWT token
*/
export const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString("base64url");
};

/**
 * SHA-256 hash of refresh token and return a string
 * @param{string} token- JWT token
 * @returns{string} return hased JWT Refresh token
 * */ 

export const hashRefreshToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};
