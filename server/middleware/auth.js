const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_change_this';
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days

/**
 * Generate JWT token for user
 */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify JWT token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Middleware to authenticate partner requests
 */
function authenticatePartner(req, res, next) {
  try {
    // Get token from Authorization header or cookie
    const token = req.headers.authorization?.split(' ')[1] || req.cookies.partner_token;

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = verifyToken(token);

    if (!decoded || decoded.type !== 'partner') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Attach user data to request
    req.partner = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

/**
 * Middleware to authenticate admin requests
 */
function authenticateAdmin(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies.admin_token;

    if (!token) {
      return res.status(401).json({ error: 'Admin authentication required' });
    }

    const decoded = verifyToken(token);

    if (!decoded || decoded.type !== 'admin') {
      return res.status(401).json({ error: 'Invalid admin token' });
    }

    req.admin = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name
    };

    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    return res.status(401).json({ error: 'Admin authentication failed' });
  }
}

/**
 * Optional authentication - doesn't fail if no token, just adds user if present
 */
function optionalAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies.partner_token;

    if (token) {
      const decoded = verifyToken(token);
      if (decoded && decoded.type === 'partner') {
        req.partner = {
          id: decoded.id,
          email: decoded.email,
          name: decoded.name
        };
      }
    }
  } catch (error) {
    // Silently fail, user just won't be authenticated
  }

  next();
}

module.exports = {
  generateToken,
  verifyToken,
  authenticatePartner,
  authenticateAdmin,
  optionalAuth
};
