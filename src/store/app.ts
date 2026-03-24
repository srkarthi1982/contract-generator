import { defaultContractDraft, formatContractText, STORAGE_KEY, type ContractDraft } from "../lib/contract";

interface ContractStore {
  draft: ContractDraft;
  copied: boolean;
  init: () => void;
  persist: () => void;
  resetDraft: () => void;
  copyContract: () => Promise<void>;
  getFullContractText: () => string;
}

function readSavedDraft(): Partial<ContractDraft> | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<ContractDraft>;
    return parsed;
  } catch {
    return null;
  }
}

function mergeDraft(saved: Partial<ContractDraft> | null): ContractDraft {
  if (!saved) return { ...defaultContractDraft };

  return {
    ...defaultContractDraft,
    ...saved,
  };
}

export function createContractStore(): ContractStore {
  return {
    draft: { ...defaultContractDraft },
    copied: false,

    init() {
      this.draft = mergeDraft(readSavedDraft());
      this.persist();
    },

    persist() {
      if (typeof window === "undefined") return;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.draft));
    },

    resetDraft() {
      if (typeof window === "undefined") return;
      const shouldReset = window.confirm("Start a new contract? This will clear your current draft.");
      if (!shouldReset) return;

      this.draft = { ...defaultContractDraft };
      this.persist();
      this.copied = false;
    },

    async copyContract() {
      const text = this.getFullContractText();

      await navigator.clipboard.writeText(text);
      this.copied = true;
      window.setTimeout(() => {
        this.copied = false;
      }, 1800);
    },

    getFullContractText() {
      return formatContractText(this.draft);
    },
  };
}
