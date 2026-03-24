export interface ContractDraft {
  title: string;
  agreementType: string;
  effectiveDate: string;
  endDate: string;
  jurisdiction: string;
  preparedBy: string;
  partyAName: string;
  partyADetails: string;
  partyBName: string;
  partyBDetails: string;
  purpose: string;
  scope: string;
  paymentTerms: string;
  confidentiality: string;
  termination: string;
  additionalTerms: string;
  showPaymentTerms: boolean;
  showConfidentiality: boolean;
  showTermination: boolean;
  showAdditionalTerms: boolean;
}

const today = new Date().toISOString().slice(0, 10);

export const STORAGE_KEY = "ansiversa.contract-generator.v1.draft";

export const defaultContractDraft: ContractDraft = {
  title: "Service Agreement",
  agreementType: "Independent Contractor Agreement",
  effectiveDate: today,
  endDate: "",
  jurisdiction: "",
  preparedBy: "",
  partyAName: "",
  partyADetails: "",
  partyBName: "",
  partyBDetails: "",
  purpose: "",
  scope: "",
  paymentTerms: "",
  confidentiality: "",
  termination: "",
  additionalTerms: "",
  showPaymentTerms: true,
  showConfidentiality: true,
  showTermination: true,
  showAdditionalTerms: false,
};

function cleanValue(value: string, fallback: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function maybeLine(label: string, value: string) {
  if (!value.trim()) return "";
  return `${label}: ${value.trim()}`;
}

export function formatContractText(draft: ContractDraft): string {
  const sections: string[] = [];

  const title = cleanValue(draft.title, "Contract Agreement");
  const type = cleanValue(draft.agreementType, "General Agreement");
  const effectiveDate = cleanValue(draft.effectiveDate, "Not specified");
  const endDate = draft.endDate.trim() ? draft.endDate.trim() : "Open-ended";

  sections.push(title.toUpperCase());
  sections.push(`Agreement Type: ${type}`);
  sections.push(`Effective Date: ${effectiveDate}`);
  sections.push(`End Date: ${endDate}`);

  const jurisdiction = maybeLine("Governing Region / Jurisdiction", draft.jurisdiction);
  const preparedBy = maybeLine("Prepared By", draft.preparedBy);

  if (jurisdiction) sections.push(jurisdiction);
  if (preparedBy) sections.push(preparedBy);

  const partyAName = cleanValue(draft.partyAName, "Party A");
  const partyBName = cleanValue(draft.partyBName, "Party B");

  sections.push("\nPARTIES");
  sections.push(`${partyAName}`);
  sections.push(cleanValue(draft.partyADetails, "Details not provided."));
  sections.push("");
  sections.push(`${partyBName}`);
  sections.push(cleanValue(draft.partyBDetails, "Details not provided."));

  sections.push("\n1. PURPOSE / OVERVIEW");
  sections.push(cleanValue(draft.purpose, "Purpose to be defined by the parties."));

  sections.push("\n2. SCOPE OF WORK / RESPONSIBILITIES");
  sections.push(cleanValue(draft.scope, "Scope and responsibilities to be defined by the parties."));

  if (draft.showPaymentTerms) {
    sections.push("\n3. PAYMENT TERMS");
    sections.push(cleanValue(draft.paymentTerms, "Payment terms to be mutually agreed in writing."));
  }

  if (draft.showConfidentiality) {
    sections.push("\n4. CONFIDENTIALITY");
    sections.push(
      cleanValue(draft.confidentiality, "Each party will maintain confidentiality of non-public information.")
    );
  }

  if (draft.showTermination) {
    sections.push("\n5. TERMINATION");
    sections.push(cleanValue(draft.termination, "Termination conditions to be agreed by both parties."));
  }

  if (draft.showAdditionalTerms) {
    sections.push("\n6. ADDITIONAL TERMS");
    sections.push(cleanValue(draft.additionalTerms, "No additional terms provided."));
  }

  sections.push("\nSIGNATURES");
  sections.push(`${partyAName}: ________________________________   Date: ____________`);
  sections.push(`${partyBName}: ________________________________   Date: ____________`);

  return sections.join("\n");
}
