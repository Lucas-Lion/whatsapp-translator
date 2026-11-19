import { readApiKey, saveApiKey } from "../storage/apiKey";

const form = document.querySelector<HTMLFormElement>("#settings");
const fields = document.querySelector<HTMLFieldSetElement>("#key-fields");
const keyInput = document.querySelector<HTMLInputElement>("#api-key");
const status = document.querySelector<HTMLElement>("#status");

if (form && fields && keyInput && status) {
  void readApiKey().then((key) => {
    status.textContent = key ? "Chave configurada. Informe uma nova chave para substituí-la." : "";
    fields.disabled = false;
  }, () => {
    status.textContent = "Não foi possível acessar o armazenamento protegido. Reabra as configurações para tentar novamente.";
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const key = keyInput.value.trim();
    if (fields.disabled || !key) {
      return;
    }

    fields.disabled = true;
    status.textContent = "Salvando…";
    try {
      await saveApiKey(key);
      keyInput.value = "";
      status.textContent = "Chave salva neste navegador.";
    } catch {
      status.textContent = "Não foi possível salvar a chave. Tente novamente.";
    } finally {
      fields.disabled = false;
    }
  });
}
