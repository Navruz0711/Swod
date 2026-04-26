const navButtons = Array.from(document.querySelectorAll(".quick-nav button"));
const sections = Array.from(document.querySelectorAll(".frame"));
const toTopButton = document.querySelector(".to-top");
const openFormButtons = Array.from(document.querySelectorAll("[data-open-form]"));
const modal = document.getElementById("lead-modal");
const closeModalButtons = Array.from(document.querySelectorAll("[data-close-modal]"));
const leadForm = document.getElementById("lead-form");
const leadError = document.getElementById("lead-error");
const phoneInput = document.getElementById("phone");
const leadSubmitButton = leadForm.querySelector(".lead-form__submit");
const emailjsPublicKey = leadForm.dataset.emailjsPublicKey || "";
const emailjsServiceId = leadForm.dataset.emailjsServiceId || "";
const emailjsTemplateId = leadForm.dataset.emailjsTemplateId || "";
const telegramBotToken = leadForm.dataset.telegramBotToken || "";
const telegramChatId = leadForm.dataset.telegramChatId || "";
const thankYouUrl = "./spasibo.html";
const frameClickZones = [
  { frameId: "frame-1", x1: 0.02, y1: 0.87, x2: 0.39, y2: 0.98 },
  { frameId: "frame-2", x1: 0.56, y1: 0.475, x2: 0.995, y2: 0.56 },
  { frameId: "frame-7", x1: 0.09, y1: 0.13, x2: 0.39, y2: 0.56 },
];

function normalizePhone(phone) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("8") && digits.length === 11) {
    return `+7${digits.slice(1)}`;
  }
  if (digits.startsWith("7") && digits.length === 11) {
    return `+${digits}`;
  }
  if (digits.length === 10) {
    return `+7${digits}`;
  }
  return "";
}

function formatPhone(value) {
  const digits = value.replace(/\D/g, "");
  const normalizedDigits = digits.startsWith("8") ? `7${digits.slice(1)}` : digits;
  const core = normalizedDigits.startsWith("7") ? normalizedDigits.slice(1, 11) : normalizedDigits.slice(0, 10);
  const p1 = core.slice(0, 3);
  const p2 = core.slice(3, 6);
  const p3 = core.slice(6, 8);
  const p4 = core.slice(8, 10);

  let result = "+7";
  if (p1) {
    result += ` (${p1}`;
  }
  if (p1.length === 3) {
    result += ")";
  }
  if (p2) {
    result += ` ${p2}`;
  }
  if (p3) {
    result += `-${p3}`;
  }
  if (p4) {
    result += `-${p4}`;
  }
  return result;
}

function isConfiguredEmailjs(publicKey, serviceId, templateId) {
  if (!publicKey || !serviceId || !templateId) {
    return false;
  }
  return ![publicKey, serviceId, templateId].some((value) => value.includes("REPLACE_WITH_YOUR_"));
}

function isConfiguredTelegram(token, chatId) {
  if (!token || !chatId) {
    return false;
  }
  if (token.includes("REPLACE_WITH_YOUR_BOT_TOKEN") || chatId.includes("REPLACE_WITH_YOUR_CHAT_ID")) {
    return false;
  }
  return true;
}

async function sendLeadToEmailjs({ name, phone, email }) {
  if (!window.emailjs || typeof window.emailjs.send !== "function") {
    throw new Error("EmailJS is not loaded");
  }

  window.emailjs.init({
    publicKey: emailjsPublicKey,
  });

  await window.emailjs.send(emailjsServiceId, emailjsTemplateId, {
    name,
    phone,
    email,
    subject: "Новая заявка с сайта ZEMLEPRO",
  });
}

async function sendLeadToTelegram({ name, phone, email }) {
  const text = [
    "Новая заявка с сайта ZEMLEPRO",
    `Имя: ${name}`,
    `Телефон: ${phone}`,
    `Email: ${email}`,
  ].join("\n");
  const endpoint = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
  const payload = new URLSearchParams({
    chat_id: telegramChatId,
    text,
  });
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body: payload.toString(),
  });

  if (!response.ok) {
    throw new Error("Telegram send failed");
  }
}

function openModal() {
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function isInZone({ frameId, x1, y1, x2, y2 }, frame, clientX, clientY) {
  if (!frame || frame.id !== frameId) {
    return false;
  }
  const rect = frame.getBoundingClientRect();
  const relativeX = (clientX - rect.left) / rect.width;
  const relativeY = (clientY - rect.top) / rect.height;
  return relativeX >= x1 && relativeX <= x2 && relativeY >= y1 && relativeY <= y2;
}

function setActiveDot(activeSectionId) {
  navButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.target === activeSectionId);
  });
}

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const target = document.getElementById(button.dataset.target);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        setActiveDot(entry.target.id);
      }
    });
  },
  {
    threshold: 0.4,
  },
);

sections.forEach((section) => observer.observe(section));
setActiveDot("frame-1");

window.addEventListener("scroll", () => {
  const showButton = window.scrollY > 400;
  toTopButton.classList.toggle("visible", showButton);
});

toTopButton.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

openFormButtons.forEach((button) => {
  button.addEventListener("click", openModal);
});

document.addEventListener("click", (event) => {
  if (event.target.closest("[data-open-form]")) {
    openModal();
  }
});

frameClickZones.forEach((zone) => {
  const frame = document.getElementById(zone.frameId);
  if (!frame) {
    return;
  }
  frame.addEventListener("click", (event) => {
    if (event.target.closest("[data-open-form], a, .quick-nav, .to-top")) {
      return;
    }
    if (isInZone(zone, frame, event.clientX, event.clientY)) {
      openModal();
    }
  });
});

closeModalButtons.forEach((button) => {
  button.addEventListener("click", closeModal);
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal.classList.contains("is-open")) {
    closeModal();
  }
});

phoneInput.addEventListener("input", () => {
  phoneInput.value = formatPhone(phoneInput.value);
});

leadForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  leadError.textContent = "";
  leadForm.querySelectorAll("input").forEach((input) => input.setCustomValidity(""));

  const formData = new FormData(leadForm);
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const normalizedPhone = normalizePhone(phone);

  if (name.length < 2) {
    const nameInput = leadForm.querySelector("#name");
    nameInput.setCustomValidity("Укажите имя (минимум 2 символа).");
    nameInput.reportValidity();
    leadError.textContent = "Укажите имя (минимум 2 символа).";
    return;
  }

  if (!normalizedPhone) {
    phoneInput.setCustomValidity("Введите номер в формате +7 (999) 999-99-99.");
    phoneInput.reportValidity();
    leadError.textContent = "Введите корректный номер телефона в формате +7.";
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email)) {
    const emailInput = leadForm.querySelector("#email");
    emailInput.setCustomValidity("Введите корректный email.");
    emailInput.reportValidity();
    leadError.textContent = "Введите корректный email.";
    return;
  }

  leadSubmitButton.disabled = true;
  leadSubmitButton.textContent = "Отправка...";

  try {
    const hasEmailjs = isConfiguredEmailjs(emailjsPublicKey, emailjsServiceId, emailjsTemplateId);
    const hasTelegram = isConfiguredTelegram(telegramBotToken, telegramChatId);
    const sendTasks = [];

    if (hasEmailjs) {
      sendTasks.push(sendLeadToEmailjs({ name, phone: normalizedPhone, email }));
    }
    if (hasTelegram) {
      sendTasks.push(sendLeadToTelegram({ name, phone: normalizedPhone, email }));
    }

    if (sendTasks.length > 0) {
      await Promise.all(sendTasks);
    }

    window.location.href = thankYouUrl;
  } catch (error) {
    leadError.textContent = "Не удалось отправить форму. Попробуйте еще раз.";
  } finally {
    leadSubmitButton.disabled = false;
    leadSubmitButton.textContent = "Отправить";
  }
});
