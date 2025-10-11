import { Request, Response } from 'express';
import { prisma } from '../prismaClient';
import { createRule, deleteRule, updateRule } from '../services/ruleEngine';
import type { RuleMatchField, RuleMatchType } from '@prisma/client';

const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID ?? 'demo-user';

const parsePriority = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return undefined;
  }
  return parsed;
};

const isMatchType = (value: string): value is RuleMatchType =>
  ['regex', 'contains', 'startsWith', 'endsWith'].includes(value);

const isMatchField = (value: string): value is RuleMatchField =>
  ['description', 'counterparty', 'reference', 'source'].includes(value);

export const getRules = async (req: Request, res: Response) => {
  const userId = req.header('x-user-id') ?? DEFAULT_USER_ID;

  try {
    const rules = await prisma.categorizationRule.findMany({
      where: { userId },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { updatedAt: 'desc' },
        { createdAt: 'desc' },
      ],
    });
    return res.json(rules);
  } catch (error) {
    console.error('Failed to load rules', error);
    return res.status(500).json({ error: 'Unable to load rules' });
  }
};

export const postRule = async (req: Request, res: Response) => {
  const userId = req.header('x-user-id') ?? DEFAULT_USER_ID;
  const { label, pattern, categoryId } = req.body ?? {};

  if (!label || !pattern || !categoryId) {
    return res.status(400).json({ error: 'label, pattern, and categoryId are required' });
  }

  const matchType = typeof req.body.matchType === 'string' && isMatchType(req.body.matchType)
    ? req.body.matchType
    : undefined;
  const matchField = typeof req.body.matchField === 'string' && isMatchField(req.body.matchField)
    ? req.body.matchField
    : undefined;
  const priority = parsePriority(req.body.priority);
  const isActive = req.body.isActive === undefined ? undefined : Boolean(req.body.isActive);
  const createdBy = req.header('x-user-email') ?? req.header('x-user-id') ?? 'system';

  try {
    const rule = await prisma.$transaction(async (tx) => {
      const created = await createRule(tx, userId, {
        label,
        pattern,
        categoryId,
        matchType,
        matchField,
        priority,
        isActive,
        createdBy,
      });

      return tx.categorizationRule.findUnique({
        where: { id: created.id },
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    });

    return res.status(201).json(rule);
  } catch (error) {
    console.error('Failed to create rule', error);
    return res.status(500).json({ error: 'Unable to create rule' });
  }
};

export const patchRule = async (req: Request, res: Response) => {
  const userId = req.header('x-user-id') ?? DEFAULT_USER_ID;
  const ruleId = req.params.id;
  if (!ruleId) {
    return res.status(400).json({ error: 'Rule id required' });
  }

  const updates: Record<string, unknown> = {};

  if (typeof req.body.label === 'string') updates.label = req.body.label;
  if (typeof req.body.pattern === 'string') updates.pattern = req.body.pattern;
  if (typeof req.body.categoryId === 'string') updates.categoryId = req.body.categoryId;
  if (req.body.priority !== undefined) updates.priority = parsePriority(req.body.priority);
  if (req.body.isActive !== undefined) updates.isActive = Boolean(req.body.isActive);
  if (typeof req.body.matchType === 'string' && isMatchType(req.body.matchType)) {
    updates.matchType = req.body.matchType;
  }
  if (typeof req.body.matchField === 'string' && isMatchField(req.body.matchField)) {
    updates.matchField = req.body.matchField;
  }

  try {
    const rule = await prisma.$transaction(async (tx) => {
      await updateRule(tx, userId, ruleId, updates);
      return tx.categorizationRule.findUnique({
        where: { id: ruleId },
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    });
    return res.json(rule);
  } catch (error) {
    console.error('Failed to update rule', error);
    return res.status(500).json({ error: 'Unable to update rule' });
  }
};

export const removeRule = async (req: Request, res: Response) => {
  const userId = req.header('x-user-id') ?? DEFAULT_USER_ID;
  const ruleId = req.params.id;
  if (!ruleId) {
    return res.status(400).json({ error: 'Rule id required' });
  }

  try {
    await prisma.$transaction((tx) => deleteRule(tx, userId, ruleId));
    return res.status(204).send();
  } catch (error) {
    console.error('Failed to delete rule', error);
    return res.status(500).json({ error: 'Unable to delete rule' });
  }
};
