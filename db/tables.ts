/**
 * Contract Generator - draft agreements with editable terms.
 *
 * Design goals:
 * - Separate reusable templates vs instantiated contracts.
 * - Contracts link to parties and store final text.
 * - Clauses are structured so we can show a nice editor later.
 */

import { defineTable, column, NOW } from "astro:db";

export const ContractTemplates = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    userId: column.text({ optional: true }),          // null => global/system template
    name: column.text(),                              // e.g. "Freelance Agreement"
    description: column.text({ optional: true }),
    category: column.text({ optional: true }),        // "freelance", "nda", "employment"
    baseLanguage: column.text({ optional: true }),    // "en", "ar", etc.
    body: column.text(),                              // full template text with placeholders
    isSystem: column.boolean({ default: false }),
    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW }),
  },
});

export const Contracts = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    userId: column.text(),
    templateId: column.text({
      references: () => ContractTemplates.columns.id,
      optional: true,
    }),
    title: column.text(),                              // human name: "Contract with ACME"
    partyAName: column.text({ optional: true }),       // e.g. user/business
    partyBName: column.text({ optional: true }),       // e.g. client
    effectiveDate: column.date({ optional: true }),
    endDate: column.date({ optional: true }),
    governingLaw: column.text({ optional: true }),
    status: column.text({ optional: true }),           // "draft", "sent", "signed", "archived"
    finalText: column.text(),                          // rendered final contract
    notes: column.text({ optional: true }),
    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW }),
  },
});

export const ContractClauses = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    contractId: column.text({
      references: () => Contracts.columns.id,
    }),
    orderIndex: column.number(),                       // clause order
    heading: column.text({ optional: true }),
    body: column.text(),
    clauseKey: column.text({ optional: true }),        // internal identifier ("payment", "confidentiality")
    createdAt: column.date({ default: NOW }),
  },
});

export const tables = {
  ContractTemplates,
  Contracts,
  ContractClauses,
} as const;
