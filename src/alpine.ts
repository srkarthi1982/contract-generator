import type { Alpine } from "alpinejs";
import { createContractStore } from "./store/app";

export default function initAlpine(Alpine: Alpine) {
  Alpine.store("contractApp", createContractStore());
}
