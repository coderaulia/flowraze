import { Router } from 'express';
import prisma from '../prisma/index.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { requireObjectBody, requireString } from '../utils/request.js';

const router = Router();
const DEFAULT_PIPELINE_STAGES = [
  { name: 'New', order: 1, color: '#bcc3ff', isWon: false, isLost: false },
  { name: 'Qualified', order: 2, color: '#4ae176', isWon: false, isLost: false },
  { name: 'Proposal', order: 3, color: '#ffb595', isWon: false, isLost: false },
  { name: 'Negotiation', order: 4, color: '#ff6b6b', isWon: false, isLost: false },
  { name: 'Won', order: 5, color: '#4ae176', isWon: true, isLost: false },
  { name: 'Lost', order: 6, color: '#ffb4ab', isWon: false, isLost: true },
] as const;

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
          plan: 'growth',
          status: 'trialing',
          seats: 5,
          trialStartedAt,
          trialEndsAt: new Date(trialStartedAt.getTime() + 14 * 24 * 60 * 60 * 1000),
        }
      });

      await tx.pipeline.create({
        data: {
          companyId: company.id,
          name: 'Sales Pipeline',
          isDefault: true,
          stages: {
            create: DEFAULT_PIPELINE_STAGES.map((stage) => ({ ...stage })),
          },
        },
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
