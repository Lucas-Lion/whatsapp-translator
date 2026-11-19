export type TranslationError =
  | "missingKey"
  | "inProgress"
  | "invalidKey"
  | "accessDenied"
  | "freeQuota"
  | "rateLimit"
  | "network"
  | "unavailable"
  | "modelUnavailable"
  | "invalidResponse"
  | "unexpected";

export type ExtensionRequest = { type: "translateDraft"; text: string } | { type: "openOptions" };

export type TranslationResponse =
  | { ok: true; text: string }
  | { ok: false; error: TranslationError };
