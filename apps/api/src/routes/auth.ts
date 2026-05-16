import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import prisma from '../prisma/index.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { requireObjectBody, requireString } from '../utils/request.js';
import { createOpaqueToken, hashSecret } from '../utils/security.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email.js';
import { getCompanyEntitlements } from '../utils/entitlements.js';

const router = Router();
const PASSWORD_RESET_TTL_MINUTES = 30;

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many attempts. Try again in 15 minutes.' },
});

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return secret;
}

function buildAuthUser(user: {
  id: string;
  email: string;
  name: string;
  role: string;
  companyId: string | null;
  emailVerifiedAt: Date | null;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    companyId: user.companyId,
    emailVerifiedAt: user.emailVerifiedAt,
  };
}

function buildDevelopmentUrl(path: string, token: string) {
  const baseUrl = process.env.APP_URL || 'http://localhost:5173';
  return `${baseUrl}${path}?token=${encodeURIComponent(token)}`;
}

function requireStrongPassword(body: Record<string, unknown>) {
  const password = requireString(body, 'password', 'Password');
  if (password.length < 8) {
    throw new AppError(400, 'Password must be at least 8 characters');
  }

  return password;
}

router.post('/login', authRateLimit, async (req, res, next) => {
  try {
    const body = requireObjectBody(req.body);
    const email = requireString(body, 'email', 'Email');
    const password = requireString(body, 'password', 'Password');

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new AppError(401, 'Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      throw new AppError(401, 'Invalid credentials');
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, companyId: user.companyId },
      getJwtSecret(),
      { expiresIn: '24h' }
    );

    const entitlements = user.companyId ? await getCompanyEntitlements(user.companyId) : null;

    res.json({
      success: true,
      data: {
        token,
        user: {
          ...buildAuthUser(user),
          entitlements,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/register', async (req, res, next) => {
  try {
    const body = requireObjectBody(req.body);
    const email = requireString(body, 'email', 'Email');
    const password = requireStrongPassword(body);
    const name = requireString(body, 'name', 'Name');

    if (!body.consent) {
      throw new AppError(400, 'You must agree to the Terms of Service and Privacy Policy');
    }

    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      throw new AppError(400, 'Email already in use');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = createOpaqueToken();

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        emailVerificationToken: hashSecret(verificationToken),
        consentedAt: new Date(),
        consentVersion: '2026-05-16',
      },
    });

    const token = jwt.sign(
      { userId: user.id, role: user.role, companyId: user.companyId },
      getJwtSecret(),
      { expiresIn: '24h' }
    );

    const verificationUrl = buildDevelopmentUrl('/login', verificationToken);
    await sendVerificationEmail(email, name, verificationToken, verificationUrl);

    const entitlements = user.companyId ? await getCompanyEntitlements(user.companyId) : null;

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          ...buildAuthUser(user),
          entitlements,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/email-verification/request', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    if (user.emailVerifiedAt) {
      res.json({
        success: true,
        data: {
          verified: true,
          message: 'Email is already verified',
        },
      });
      return;
    }

    const verificationToken = createOpaqueToken();
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerificationToken: hashSecret(verificationToken) },
    });

    const verificationUrl = buildDevelopmentUrl('/settings', verificationToken);
    await sendVerificationEmail(user.email, user.name, verificationToken, verificationUrl);

    res.json({
      success: true,
      data: {
        verified: false,
        sent: true,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/verify-email', async (req, res, next) => {
  try {
    const body = requireObjectBody(req.body);
    const token = requireString(body, 'token', 'Verification token');
    const tokenHash = hashSecret(token);

    const user = await prisma.user.findUnique({
      where: { emailVerificationToken: tokenHash },
    });

    if (!user) {
      throw new AppError(400, 'Verification token is invalid or expired');
    }

    const verified = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,
      },
    });

    res.json({ success: true, data: { user: buildAuthUser(verified) } });
  } catch (error) {
    next(error);
  }
});

router.post('/password-reset/request', authRateLimit, async (req, res, next) => {
  try {
    const body = requireObjectBody(req.body);
    const email = requireString(body, 'email', 'Email');
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      res.json({ success: true, data: { sent: true } });
      return;
    }

    const resetToken = createOpaqueToken();
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashSecret(resetToken),
        passwordResetRequestedAt: new Date(),
        passwordResetExpiresAt: expiresAt,
      },
    });

    const resetUrl = buildDevelopmentUrl('/login', resetToken);
    await sendPasswordResetEmail(user.email, resetToken, resetUrl);

    res.json({
      success: true,
      data: {
        sent: true,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/password-reset/confirm', authRateLimit, async (req, res, next) => {
  try {
    const body = requireObjectBody(req.body);
    const token = requireString(body, 'token', 'Reset token');
    const password = requireStrongPassword(body);
    const tokenHash = hashSecret(token);

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: tokenHash,
        passwordResetExpiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new AppError(400, 'Reset token is invalid or expired');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: await bcrypt.hash(password, 10),
        passwordResetToken: null,
        passwordResetRequestedAt: null,
        passwordResetExpiresAt: null,
      },
    });

    res.json({ success: true, data: { reset: true } });
  } catch (error) {
    next(error);
  }
});

router.post('/accept-invite', async (req, res, next) => {
  try {
    const body = requireObjectBody(req.body);
    const token = requireString(body, 'token', 'Invite token');
    const password = requireStrongPassword(body);
    const tokenHash = hashSecret(token);

    const user = await prisma.user.findFirst({
      where: {
        inviteToken: tokenHash,
        inviteExpiresAt: { gt: new Date() },
      },
    });

    if (!user) {
      throw new AppError(400, 'Invite token is invalid or expired');
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: await bcrypt.hash(password, 10),
        inviteToken: null,
        inviteExpiresAt: null,
        emailVerifiedAt: new Date(),
      },
    });

    const jwtToken = jwt.sign(
      { userId: updated.id, role: updated.role, companyId: updated.companyId },
      getJwtSecret(),
      { expiresIn: '24h' }
    );

    const entitlements = updated.companyId ? await getCompanyEntitlements(updated.companyId) : null;

    res.json({
      success: true,
      data: { token: jwtToken, user: { ...buildAuthUser(updated), entitlements } },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const entitlements = user.companyId ? await getCompanyEntitlements(user.companyId) : null;

    res.json({
      success: true,
      data: {
        user: {
          ...buildAuthUser(user),
          entitlements,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
