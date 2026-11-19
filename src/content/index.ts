import { findComposer, readComposerText, replaceComposerText, watchComposerDraft } from "./composer";
import {
  createTranslateButton, createUndoButton, findTranslateButtonPlacement, translateButtonId, undoButtonId
} from "./translateButton";
import type { ExtensionRequest, TranslationError, TranslationResponse } from "../types/translation";

type Feedback = TranslationError | "idle" | "loading" | "success" | "empty" | "stale" | "applyFailed" |
  "optionsFailed" | "restoring" | "restored" | "undoFailed";

type UndoTranslation = {
  composer: HTMLElement;
  original: string;
  translation: string;
  draft: ReturnType<typeof watchComposerDraft>;
};

const feedbackText: Record<Feedback, [label: string, description: string]> = {
  idle: ["Traduzir", "Traduzir o rascunho para inglês com o Gemini."],
  loading: ["Traduzindo…", "Aguardando a tradução do Gemini."],
  inProgress: ["Tradução em andamento", "Aguarde a solicitação anterior desta aba terminar antes de tentar novamente."],
  success: ["Traduzido", "Confira a tradução antes de enviar."],
  empty: ["Digite uma mensagem", "Escreva um rascunho para traduzir."],
  stale: ["Tradução descartada", "O rascunho ou a conversa mudou durante a tradução."],
  missingKey: ["Configurar Gemini", "Clique para informar a chave da API do Gemini."],
  invalidKey: ["Chave inválida", "O Gemini rejeitou a autenticação. Clique para atualizar a chave."],
  accessDenied: ["Acesso negado", "Verifique se o projeto tem acesso ao Gemini. Clique para atualizar a chave."],
  freeQuota: ["Limite gratuito atingido", "Aguarde a renovação da cota gratuita antes de tentar novamente."],
  rateLimit: ["Limite atingido", "A cota do Gemini foi atingida. Aguarde antes de tentar novamente."],
  network: ["Falha de rede", "Confira a conexão e tente novamente. A solicitação pode ter expirado."],
  unavailable: ["Gemini indisponível", "O serviço está temporariamente indisponível. Tente novamente mais tarde."],
  modelUnavailable: ["Modelo indisponível", "Verifique se o seu projeto tem acesso ao modelo configurado no Gemini."],
  invalidResponse: ["Resposta incompleta", "O Gemini não retornou uma tradução completa. Clique para tentar novamente."],
  unexpected: ["Erro na tradução", "Não foi possível traduzir. Clique para tentar novamente."],
  applyFailed: ["Erro no editor", "Não foi possível inserir a tradução. Clique para tentar novamente."],
  optionsFailed: ["Erro nas opções", "Abra as opções do WhatsApp Translator em chrome://extensions."],
  restoring: ["Restaurando…", "Restaurando o rascunho original."],
  restored: ["Original restaurado", "Confira o rascunho antes de enviar."],
  undoFailed: ["Erro ao restaurar", "Não foi possível restaurar o rascunho original."],
};

let feedback: Feedback = "idle";
let feedbackTimer: number | undefined;
let busy = false;
let recoveryDraft: string | null = null;
let undoTranslation: UndoTranslation | null = null;

const setFeedback = (next: Feedback): void => {
  window.clearTimeout(feedbackTimer);
  feedback = next;
  updateTranslateButton();
  if (next === "success" || next === "restored") {
    feedbackTimer = window.setTimeout(() => setFeedback("idle"), 2500);
  }
};

const discardUndoTranslation = (): void => {
  undoTranslation?.draft.stop();
  undoTranslation = null;
};

const getCurrentUndoTranslation = (): UndoTranslation | null => {
  if (undoTranslation && !undoTranslation.draft.isCurrent()) {
    discardUndoTranslation();
  }
  return undoTranslation;
};

const rememberTranslation = (composer: HTMLElement, original: string, translation: string): void => {
  discardUndoTranslation();
  const draft = watchComposerDraft(composer, translation, () => {
    if (undoTranslation?.draft === draft) {
      discardUndoTranslation();
      scheduleButtonUpdate();
    }
  });
  undoTranslation = { composer, original, translation, draft };
};

const undoDraft = async (): Promise<void> => {
  if (busy) {
    return;
  }

  const undo = getCurrentUndoTranslation();
  if (!undo) {
    updateTranslateButton();
    return;
  }

  undoTranslation = null;
  busy = true;
  try {
    setFeedback("restoring");
    const result = await replaceComposerText(undo.composer, undo.translation, undo.original, undo.draft.isCurrentContext);
    if (result === "applied" || result === "stale") {
      setFeedback(result === "applied" ? "restored" : "idle");
      return;
    }

    if (result === "recovery") {
      recoveryDraft = undo.original;
    } else if (undo.draft.isCurrent()) {
      undoTranslation = undo;
    }
    setFeedback("undoFailed");
  } catch {
    setFeedback("undoFailed");
  } finally {
    if (undoTranslation !== undo) {
      undo.draft.stop();
    }
    busy = false;
    updateTranslateButton();
  }
};

const translateDraft = async (): Promise<void> => {
  if (busy) {
    return;
  }

  busy = true;
  try {
    if (recoveryDraft !== null) {
      try {
        await navigator.clipboard.writeText(recoveryDraft);
      } catch {
        if (window.prompt("Copie o rascunho original para recuperá-lo.", recoveryDraft) === null) {
          return;
        }
      }
      recoveryDraft = null;
      setFeedback("idle");
      return;
    }

    if (feedback === "missingKey" || feedback === "invalidKey" || feedback === "accessDenied") {
      const opened: boolean = await chrome.runtime.sendMessage({ type: "openOptions" } satisfies ExtensionRequest);
      setFeedback(opened ? "idle" : "optionsFailed");
      return;
    }

    const composer = findComposer();
    if (!composer) {
      return;
    }

    const original = readComposerText(composer);
    if (!original.trim()) {
      setFeedback("empty");
      return;
    }

    const draft = watchComposerDraft(composer, original);
    setFeedback("loading");
    try {
      const request: ExtensionRequest = { type: "translateDraft", text: original };
      const response: TranslationResponse | undefined = await chrome.runtime.sendMessage(request).catch(() => undefined);

      if (!draft.isCurrent()) {
        setFeedback("stale");
        return;
      }
      if (!response?.ok) {
        setFeedback(response?.error ?? "unexpected");
        return;
      }

      const result = response.text === original ? "applied" :
        await replaceComposerText(composer, original, response.text, draft.isCurrentContext);
      if (result === "stale") {
        setFeedback("stale");
        return;
      }
      if (result === "recovery") {
        recoveryDraft = original;
      }
      if (result === "applied" && response.text !== original) {
        rememberTranslation(composer, original, response.text);
      }
      setFeedback(result === "applied" ? "success" : "applyFailed");
    } finally {
      draft.stop();
    }
  } catch {
    setFeedback("unexpected");
  } finally {
    busy = false;
    updateTranslateButton();
  }
};

const updateTranslateButton = (): void => {
  const composer = findComposer();
  const placement = composer && findTranslateButtonPlacement(composer);
  const existingButton = document.querySelector<HTMLButtonElement>(`button#${translateButtonId}`);
  const existingUndoButton = document.querySelector<HTMLButtonElement>(`button#${undoButtonId}`);
  const undo = getCurrentUndoTranslation();

  if (!placement) {
    existingButton?.remove();
    existingUndoButton?.remove();
    return;
  }

  const button = existingButton ?? createTranslateButton(translateDraft);
  const [label, description] = recoveryDraft === null ? feedbackText[feedback] :
    ["Copiar original", "Copie o rascunho original para colar manualmente."];
  if (button.textContent !== label) {
    button.textContent = label;
    button.title = description;
    button.setAttribute("aria-description", description);
  }
  if (button.disabled !== busy) {
    button.disabled = busy;
  }

  const { row, before } = placement;
  const undoButton = undo ? existingUndoButton ?? createUndoButton(undoDraft) : null;
  if (undoButton) {
    if (undoButton.disabled !== busy) {
      undoButton.disabled = busy;
    }
    if (undoButton.parentElement !== row || undoButton.nextElementSibling !== before) {
      row.insertBefore(undoButton, before);
    }
  } else {
    existingUndoButton?.remove();
  }

  const next = undoButton ?? before;
  if (button.parentElement !== row || button.nextElementSibling !== next) {
    row.insertBefore(button, next);
  }
};

let updateScheduled = false;

const scheduleButtonUpdate = (): void => {
  if (updateScheduled) {
    return;
  }

  updateScheduled = true;
  requestAnimationFrame(() => {
    updateScheduled = false;
    updateTranslateButton();
  });
};

const observer = new MutationObserver(scheduleButtonUpdate);
observer.observe(document.body, {
  subtree: true,
  childList: true,
  attributes: true,
  attributeFilter: ["aria-hidden", "aria-label", "class", "contenteditable", "data-icon", "hidden", "id", "inert", "role", "style"]
});

updateTranslateButton();
