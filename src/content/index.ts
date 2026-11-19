import { findComposer, readComposerText, replaceComposerText } from "./composer";
import { createTranslateButton, findTranslateButtonPlacement, translateButtonId } from "./translateButton";

const sampleDraft = "Oi, bom dia";
const sampleTranslation = "Hi, good morning!";
let busy = false;
let recoveryDraft: string | null = null;

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
      updateTranslateButton();
      return;
    }

    const composer = findComposer();
    if (!composer) {
      return;
    }

    const original = readComposerText(composer);
    if (original !== sampleDraft) {
      return;
    }

    const result = await replaceComposerText(composer, original, sampleTranslation);
    if (result !== "applied") {
      console.warn("[WhatsApp Translator] Não foi possível aplicar a tradução simulada.");
    }
    if (result === "recovery") {
      recoveryDraft = original;
      updateTranslateButton();
    }
  } finally {
    busy = false;
  }
};

const updateTranslateButton = (): void => {
  const composer = findComposer();
  const placement = composer && findTranslateButtonPlacement(composer);
  const existingButton = document.getElementById(translateButtonId);

  if (!placement) {
    existingButton?.remove();
    return;
  }

  const button = existingButton ?? createTranslateButton(translateDraft);
  const label = recoveryDraft === null ? "Traduzir" : "Copiar original";
  if (button.textContent !== label) {
    button.textContent = label;
    button.title = recoveryDraft === null
      ? `Teste a tradução com “${sampleDraft}”`
      : "Copie o rascunho original para colar manualmente.";
  }

  const { row, before } = placement;
  if (button.parentElement !== row || button.nextElementSibling !== before) {
    row.insertBefore(button, before);
  }
};

let updateScheduled = false;

const observer = new MutationObserver(() => {
  if (updateScheduled) {
    return;
  }

  updateScheduled = true;
  requestAnimationFrame(() => {
    updateScheduled = false;
    updateTranslateButton();
  });
});

observer.observe(document.body, {
  subtree: true,
  childList: true,
  attributes: true,
  attributeFilter: ["aria-hidden", "aria-label", "class", "contenteditable", "data-icon", "hidden", "id", "inert", "role", "style"]
});

updateTranslateButton();
