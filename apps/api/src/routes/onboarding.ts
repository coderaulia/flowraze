import { Router } from 'express';
import prisma from '../prisma/index.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { requireObjectBody, requireString } from '../utils/request.js';

const router = Router();

router.use(authenticate);

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w-]+/g, '')   // Remove all non-word chars
    .replace(/--+/g, '-');    // Replace multiple - with single -
}

router.post('/setup-company', async (req: AuthRequest, res, next) => {
  try {
    const body = requireObjectBody(req.body);
    const companyName = requireString(body, 'name', 'Company name');
    
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    if (user.companyId) {
      throw new AppError(400, 'User is already associated with a company');
    }

    // Generate slug
    const baseSlug = slugify(companyName);

    // Wrap everything in a transaction to prevent race conditions
    const result = await prisma.$transaction(async (tx) => {
      // Find unique slug within the transaction
      let slug = baseSlug;
      let existing = await tx.company.findUnique({ where: { slug } });
      let counter = 1;
      while (existing) {
        slug = `${baseSlug}-${counter}`;
        existing = await tx.company.findUnique({ where: { slug } });
        counter++;
        if (counter > 100) throw new AppError(409, 'Unable to generate unique slug');
      }

      const company = await tx.company.create({
        data: {
          name: companyName,
          slug,
          isActive: true,
        }
      });

      // Create billing account
      const trialStartedAt = new Date();
      await tx.billingAccount.create({
        data: {
          companyId: company.id,
          workspaceName: `${companyName} Workspace`,
          trialStartedAt,
          trialEndsAt: new Date(trialStartedAt.getTime() + 14 * 24 * 60 * 60 * 1000),
        }
      });

      // Update user
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          companyId: company.id,
          role: 'admin',
        }
      });

      return { company, user: updatedUser };
    });

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

export default router;
