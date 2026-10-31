import dotenv from 'dotenv';
dotenv.config();
import jwt from 'jsonwebtoken';

// CRITICAL SECURITY: Validate JWT secrets at startup - fail fast if missing
if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
  console.error('\n❌ CRITICAL ERROR: JWT secrets are not configured!');
  console.error('JWT_SECRET and JWT_REFRESH_SECRET must be set in environment variables.');
  console.error('\nGenerate strong random secrets with:');
  console.error('  node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
  console.error('\nThen set in your .env file or hosting platform environment variables.\n');
  process.exit(1); // Fail fast - do not start server without proper secrets
}

export const generateTokens = (user) => {
  const payload = {
    id: user._id || user.id,
    email: user.email,
    role: user.role,
    employeeId: user.employeeId,
    name: `${user.firstName} ${user.lastName}`
  };

  const accessToken = jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );

  const refreshToken = jwt.sign(
    { id: payload.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};
