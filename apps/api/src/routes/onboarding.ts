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
    
    // Optional fields
    const industry = typeof body.industry === 'string' ? body.industry : undefined;
    const companySize = typeof body.companySize === 'string' ? body.companySize : undefined;

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
    let slug = slugify(companyName);
    
    // Ensure slug uniqueness
    let existing = await prisma.company.findUnique({ where: { slug } });
    let counter = 1;
    const baseSlug = slug;
    while (existing) {
      slug = `${baseSlug}-${counter}`;
      existing = await prisma.company.findUnique({ where: { slug } });
      counter++;
    }

    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: companyName,
          slug,
          isActive: true,
        }
      });

      // Create billing account
      await tx.billingAccount.create({
        data: {
          companyId: company.id,
          workspaceName: `${companyName} Workspace`,
        }
      });

      // Update user
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          companyId: company.id,
          role: 'admin', // First user is admin
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
