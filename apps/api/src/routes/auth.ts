import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma/index.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError(400, 'Email and password are required');
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new AppError(401, 'Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      throw new AppError(401, 'Invalid credentials');
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      throw new AppError(400, 'Email, password, and name are required');
    }

    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      throw new AppError(400, 'Email already in use');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
