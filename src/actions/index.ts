import type { ActionAPIContext } from "astro:actions";
import { defineAction, ActionError } from "astro:actions";
import { z } from "astro:schema";
import {
  db,
  eq,
  and,
  ContractTemplates,
  Contracts,
  ContractClauses,
} from "astro:db";

function requireUser(context: ActionAPIContext) {
  const locals = context.locals as App.Locals | undefined;
  const user = locals?.user;

  if (!user) {
    throw new ActionError({
      code: "UNAUTHORIZED",
      message: "You must be signed in to perform this action.",
    });
  }

  return user;
}

export const server = {
  createTemplate: defineAction({
    input: z.object({
      id: z.string().optional(),
      name: z.string().min(1, "Name is required"),
      description: z.string().optional(),
      category: z.string().optional(),
      baseLanguage: z.string().optional(),
      body: z.string().min(1, "Body is required"),
      isSystem: z.boolean().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);

      const [template] = await db
        .insert(ContractTemplates)
        .values({
          id: input.id ?? crypto.randomUUID(),
          userId: input.isSystem ? null : user.id,
          name: input.name,
          description: input.description,
          category: input.category,
          baseLanguage: input.baseLanguage,
          body: input.body,
          isSystem: input.isSystem ?? false,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return { template };
    },
  }),

  updateTemplate: defineAction({
    input: z.object({
      id: z.string(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      category: z.string().optional(),
      baseLanguage: z.string().optional(),
      body: z.string().optional(),
      isSystem: z.boolean().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);
      const { id, ...rest } = input;

      const [existing] = await db
        .select()
        .from(ContractTemplates)
        .where(eq(ContractTemplates.id, id))
        .limit(1);

      if (!existing || (existing.userId && existing.userId !== user.id)) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Template not found or not accessible.",
        });
      }

      const updateData: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(rest)) {
        if (typeof value !== "undefined") {
          updateData[key] = value;
        }
      }

      if (Object.keys(updateData).length === 0) {
        return { template: existing };
      }

      const [template] = await db
        .update(ContractTemplates)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(ContractTemplates.id, id))
        .returning();

      return { template };
    },
  }),

  listTemplates: defineAction({
    input: z.object({}).optional(),
    handler: async (_, context) => {
      const user = requireUser(context);

      const templates = await db.select().from(ContractTemplates);

      const filtered = templates.filter((t) => t.userId === null || t.userId === user.id);

      return { templates: filtered };
    },
  }),

  createContract: defineAction({
    input: z.object({
      id: z.string().optional(),
      templateId: z.string().optional(),
      title: z.string().min(1, "Title is required"),
      partyAName: z.string().optional(),
      partyBName: z.string().optional(),
      effectiveDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
      governingLaw: z.string().optional(),
      status: z.string().optional(),
      finalText: z.string().min(1, "Final text is required"),
      notes: z.string().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);

      if (input.templateId) {
        const [template] = await db
          .select()
          .from(ContractTemplates)
          .where(eq(ContractTemplates.id, input.templateId))
          .limit(1);

        if (!template || (template.userId && template.userId !== user.id)) {
          throw new ActionError({
            code: "NOT_FOUND",
            message: "Template not found.",
          });
        }
      }

      const [contract] = await db
        .insert(Contracts)
        .values({
          id: input.id ?? crypto.randomUUID(),
          userId: user.id,
          templateId: input.templateId,
          title: input.title,
          partyAName: input.partyAName,
          partyBName: input.partyBName,
          effectiveDate: input.effectiveDate,
          endDate: input.endDate,
          governingLaw: input.governingLaw,
          status: input.status,
          finalText: input.finalText,
          notes: input.notes,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return { contract };
    },
  }),

  updateContract: defineAction({
    input: z.object({
      id: z.string(),
      templateId: z.string().optional(),
      title: z.string().optional(),
      partyAName: z.string().optional(),
      partyBName: z.string().optional(),
      effectiveDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
      governingLaw: z.string().optional(),
      status: z.string().optional(),
      finalText: z.string().optional(),
      notes: z.string().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);
      const { id, templateId, ...rest } = input;

      const [existing] = await db
        .select()
        .from(Contracts)
        .where(and(eq(Contracts.id, id), eq(Contracts.userId, user.id)))
        .limit(1);

      if (!existing) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Contract not found.",
        });
      }

      if (typeof templateId !== "undefined") {
        if (templateId) {
          const [template] = await db
            .select()
            .from(ContractTemplates)
            .where(eq(ContractTemplates.id, templateId))
            .limit(1);

          if (!template || (template.userId && template.userId !== user.id)) {
            throw new ActionError({
              code: "NOT_FOUND",
              message: "Template not found.",
            });
          }
        }
      }

      const updateData: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(rest)) {
        if (typeof value !== "undefined") {
          updateData[key] = value;
        }
      }
      if (typeof templateId !== "undefined") {
        updateData.templateId = templateId;
      }

      if (Object.keys(updateData).length === 0) {
        return { contract: existing };
      }

      const [contract] = await db
        .update(Contracts)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(and(eq(Contracts.id, id), eq(Contracts.userId, user.id)))
        .returning();

      return { contract };
    },
  }),

  listContracts: defineAction({
    input: z.object({}).optional(),
    handler: async (_, context) => {
      const user = requireUser(context);

      const contracts = await db.select().from(Contracts).where(eq(Contracts.userId, user.id));

      return { contracts };
    },
  }),

  deleteContract: defineAction({
    input: z.object({
      id: z.string(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);

      const [deleted] = await db
        .delete(Contracts)
        .where(and(eq(Contracts.id, input.id), eq(Contracts.userId, user.id)))
        .returning();

      if (!deleted) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Contract not found.",
        });
      }

      return { contract: deleted };
    },
  }),

  saveClause: defineAction({
    input: z.object({
      id: z.string().optional(),
      contractId: z.string(),
      orderIndex: z.number().int().positive(),
      heading: z.string().optional(),
      body: z.string().min(1, "Clause body is required"),
      clauseKey: z.string().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);

      const [contract] = await db
        .select()
        .from(Contracts)
        .where(and(eq(Contracts.id, input.contractId), eq(Contracts.userId, user.id)))
        .limit(1);

      if (!contract) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Contract not found.",
        });
      }

      const baseValues = {
        contractId: input.contractId,
        orderIndex: input.orderIndex,
        heading: input.heading,
        body: input.body,
        clauseKey: input.clauseKey,
        createdAt: new Date(),
      };

      if (input.id) {
        const [existing] = await db
          .select()
          .from(ContractClauses)
          .where(eq(ContractClauses.id, input.id))
          .limit(1);

        if (!existing || existing.contractId !== input.contractId) {
          throw new ActionError({
            code: "NOT_FOUND",
            message: "Clause not found.",
          });
        }

        const [clause] = await db
          .update(ContractClauses)
          .set(baseValues)
          .where(eq(ContractClauses.id, input.id))
          .returning();

        return { clause };
      }

      const [clause] = await db.insert(ContractClauses).values(baseValues).returning();
      return { clause };
    },
  }),

  deleteClause: defineAction({
    input: z.object({
      id: z.string(),
      contractId: z.string(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);

      const [contract] = await db
        .select()
        .from(Contracts)
        .where(and(eq(Contracts.id, input.contractId), eq(Contracts.userId, user.id)))
        .limit(1);

      if (!contract) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Contract not found.",
        });
      }

      const [deleted] = await db
        .delete(ContractClauses)
        .where(
          and(eq(ContractClauses.id, input.id), eq(ContractClauses.contractId, input.contractId))
        )
        .returning();

      if (!deleted) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Clause not found.",
        });
      }

      return { clause: deleted };
    },
  }),

  getContractWithClauses: defineAction({
    input: z.object({
      id: z.string(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);

      const [contract] = await db
        .select()
        .from(Contracts)
        .where(and(eq(Contracts.id, input.id), eq(Contracts.userId, user.id)))
        .limit(1);

      if (!contract) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Contract not found.",
        });
      }

      const clauses = await db
        .select()
        .from(ContractClauses)
        .where(eq(ContractClauses.contractId, input.id));

      return { contract, clauses };
    },
  }),
};
