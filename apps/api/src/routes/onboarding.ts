import { Router } from 'express';
import prisma from '../prisma/index.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { requireObjectBody, requireString } from '../utils/request.js';

const router = Router();

type StagePreset = { name: string; order: number; color: string; isWon: boolean; isLost: boolean };

const PIPELINE_PRESETS: Record<string, { dealLabel: string; pipelineName: string; stages: StagePreset[] }> = {
  'Agency Services': {
    dealLabel: 'Projects',
    pipelineName: 'Project Pipeline',
    stages: [
      { name: 'Inquiry', order: 1, color: '#bcc3ff', isWon: false, isLost: false },
      { name: 'Discovery', order: 2, color: '#93c5fd', isWon: false, isLost: false },
      { name: 'Proposal Sent', order: 3, color: '#ffb595', isWon: false, isLost: false },
      { name: 'Negotiation', order: 4, color: '#ff6b6b', isWon: false, isLost: false },
      { name: 'Won', order: 5, color: '#4ae176', isWon: true, isLost: false },
      { name: 'Lost', order: 6, color: '#ffb4ab', isWon: false, isLost: true },
    ],
  },
  'Property': {
    dealLabel: 'Properties',
    pipelineName: 'Property Pipeline',
    stages: [
      { name: 'Lead', order: 1, color: '#bcc3ff', isWon: false, isLost: false },
      { name: 'Contacted', order: 2, color: '#93c5fd', isWon: false, isLost: false },
      { name: 'Showing', order: 3, color: '#ffb595', isWon: false, isLost: false },
      { name: 'Offer', order: 4, color: '#fbbf24', isWon: false, isLost: false },
      { name: 'Under Contract', order: 5, color: '#ff6b6b', isWon: false, isLost: false },
      { name: 'Closed', order: 6, color: '#4ae176', isWon: true, isLost: false },
    ],
  },
  'Insurance / Financial Sales': {
    dealLabel: 'Policies',
    pipelineName: 'Policy Pipeline',
    stages: [
      { name: 'Lead', order: 1, color: '#bcc3ff', isWon: false, isLost: false },
      { name: 'Contacted', order: 2, color: '#93c5fd', isWon: false, isLost: false },
      { name: 'Needs Analysis', order: 3, color: '#ffb595', isWon: false, isLost: false },
      { name: 'Quote', order: 4, color: '#fbbf24', isWon: false, isLost: false },
      { name: 'Underwriting', order: 5, color: '#ff6b6b', isWon: false, isLost: false },
      { name: 'Active', order: 6, color: '#4ae176', isWon: true, isLost: false },
    ],
  },
};

const DEFAULT_PRESET = {
  dealLabel: 'Deals',
  pipelineName: 'Sales Pipeline',
  stages: [
    { name: 'New', order: 1, color: '#bcc3ff', isWon: false, isLost: false },
    { name: 'Qualified', order: 2, color: '#4ae176', isWon: false, isLost: false },
    { name: 'Proposal', order: 3, color: '#ffb595', isWon: false, isLost: false },
    { name: 'Negotiation', order: 4, color: '#ff6b6b', isWon: false, isLost: false },
    { name: 'Won', order: 5, color: '#4ae176', isWon: true, isLost: false },
    { name: 'Lost', order: 6, color: '#ffb4ab', isWon: false, isLost: true },
  ],
};

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
    const industry = typeof body.industry === 'string' ? body.industry.trim() || null : null;

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

      const preset = (industry && PIPELINE_PRESETS[industry]) || DEFAULT_PRESET;

      const company = await tx.company.create({
        data: {
          name: companyName,
          slug,
          industry,
          dealLabel: preset.dealLabel,
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
          name: preset.pipelineName,
          isDefault: true,
          stages: {
            create: preset.stages.map((stage) => ({ ...stage })),
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
