import type { VerificationResult } from "./verify/types";

const KEY = "newsverify:results";
const MAX = 50;

function read(): VerificationResult[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as VerificationResult[];
  } catch {
    return [];
  }
}
function write(items: VerificationResult[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX)));
  } catch {
    /* storage full or disabled — verification still works */
  }
}

export const listResults = () => read();
export const getResult = (id: string) => read().find((r) => r.id === id);
export const saveResult = (r: VerificationResult) => write([r, ...read().filter((x) => x.id !== r.id)]);
export const deleteResult = (id: string) => write(read().filter((r) => r.id !== id));
export const clearResults = () => write([]);
