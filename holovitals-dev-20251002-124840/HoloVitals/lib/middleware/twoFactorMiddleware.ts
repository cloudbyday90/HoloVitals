/**
 * Two-Factor Authentication Middleware
 * 
 * Enforces 2FA verification for protected routes
 */

import { Request, Response, NextFunction } from 'express';
import { twoFactorAuth } from '../services/TwoFactorAuthService';

// ============================================================================
// 2FA MIDDLEWARE
// ============================================================================

/**
 * Require 2FA verification
 */
export function require2FA() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated',
        });
      }

      // Check if 2FA is required
      const is2FARequired = await twoFactorAuth.is2FARequired(userId);

      if (!is2FARequired) {
        // 2FA not enabled, proceed
        return next();
      }

      // Check if 2FA is verified in session
      const is2FAVerified = (req as any).session?.mfaVerified;

      if (!is2FAVerified) {
        return res.status(403).json({
          success: false,
          error: 'Two-factor authentication required',
          message: 'Please complete two-factor authentication',
          require2FA: true,
        });
      }

      next();
    } catch (error) {
      console.error('2FA middleware error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  };
}

/**
 * Check 2FA status
 */
export function check2FAStatus() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return next();
      }

      // Get 2FA status
      const status = await twoFactorAuth.get2FAStatus(userId);

      // Attach to request
      (req as any).twoFactorStatus = status;

      next();
    } catch (error) {
      console.error('2FA status check error:', error);
      next();
    }
  };
}

/**
 * Verify 2FA code from request
 */
export function verify2FACode() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      const code = req.body?.twoFactorCode || req.headers['x-2fa-code'];
      const method = req.body?.twoFactorMethod || '2FA_TOTP';

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      if (!code) {
        return res.status(400).json({
          success: false,
          error: 'Two-factor code required',
        });
      }

      // Verify code
      const verified = await twoFactorAuth.verify2FA({
        userId,
        code,
        method,
      });

      if (!verified) {
        return res.status(401).json({
          success: false,
          error: 'Invalid two-factor code',
        });
      }

      // Mark as verified in session
      if ((req as any).session) {
        (req as any).session.mfaVerified = true;
      }

      next();
    } catch (error) {
      console.error('2FA verification error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  require2FA,
  check2FAStatus,
  verify2FACode,
};