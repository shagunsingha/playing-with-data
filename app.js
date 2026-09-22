const panels = [...document.querySelectorAll(".folder")];
const announcement = document.querySelector(".announcement");
let currentStep = 0;
let furthestStep = 0;
let announcementTimer;

function announce(message) {
  announcement.textContent = message;
  announcement.classList.add("is-visible");
  window.clearTimeout(announcementTimer);
  announcementTimer = window.setTimeout(() => announcement.classList.remove("is-visible"), 1600);
}

function showStep(step, focusPanel = true) {
  if (step < 0 || step >= panels.length || step > furthestStep) return;
  currentStep = step;
  panels.forEach((panel, index) => {
    const active = index === step;
    panel.hidden = !active;
    panel.classList.toggle("is-active", active);
    if (active) {
      panel.classList.remove("is-entering");
      requestAnimationFrame(() => panel.classList.add("is-entering"));
      const panelColor = getComputedStyle(panel, "::before").backgroundColor;
      document.querySelector('meta[name="theme-color"]').setAttribute("content", panelColor);
    }
  });
  if (focusPanel) {
    const heading = panels[step].querySelector("h1, .guide-title");
    heading?.setAttribute("tabindex", "-1");
    heading?.focus({ preventScroll: true });
  }
}

document.querySelectorAll("[data-next]").forEach((button) => {
  button.addEventListener("click", () => {
    furthestStep = Math.max(furthestStep, Math.min(currentStep + 1, panels.length - 1));
    showStep(Math.min(currentStep + 1, panels.length - 1));
  });
});

function getBaseTranslation(element) {
  return element.classList.contains("azalea") || element.classList.contains("uno-card") ? "translate(-50%, -50%)" : "";
}

function applyPosition(element) {
  const x = Number(element.dataset.x || 0);
  const y = Number(element.dataset.y || 0);
  const scale = Number(element.dataset.scale || 1);
  element.style.transform = `${getBaseTranslation(element)} translate(${x}px, ${y}px) scale(${scale})`;
}

const heartColors = ["#FA4F02", "#779AD4", "#C44C7F", "#F14C4C", "#FFBD3E", "#3EAE5C", "#338DC5", "#FFFFFF"];
let lastHeartAt = 0;

function leaveHeart(azalea, burst = false) {
  const layer = azalea.closest("[data-stage]")?.querySelector(".heart-layer");
  if (!layer) return;
  const now = performance.now();
  if (!burst && now - lastHeartAt < 45) return;
  lastHeartAt = now;
  const flowerRect = azalea.getBoundingClientRect();
  const layerRect = layer.getBoundingClientRect();
  const heart = document.createElement("span");
  const states = ["", "is-hollow", "is-broken", "is-beating"];
  const state = states[Math.floor(Math.random() * states.length)];
  heart.className = `confetti-heart ${state}`;
  heart.textContent = state === "is-hollow" ? "♡" : "♥";
  heart.style.left = `${flowerRect.left + flowerRect.width / 2 - layerRect.left + (Math.random() - .5) * flowerRect.width * .45}px`;
  heart.style.top = `${flowerRect.top + flowerRect.height / 2 - layerRect.top + (Math.random() - .5) * flowerRect.height * .45}px`;
  heart.style.setProperty("--heart-color", heartColors[Math.floor(Math.random() * heartColors.length)]);
  heart.style.setProperty("--heart-size", `${12 + Math.random() * 27}px`);
  heart.style.setProperty("--heart-rotate", `${-38 + Math.random() * 76}deg`);
  layer.append(heart);
  while (layer.children.length > 90) layer.firstElementChild.remove();
}

function clampPosition(element, x, y) {
  const stage = element.closest("[data-stage]");
  const stageRect = stage.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  const currentX = Number(element.dataset.x || 0);
  const currentY = Number(element.dataset.y || 0);
  const originalLeft = elementRect.left - currentX;
  const originalTop = elementRect.top - currentY;
  const minX = stageRect.left - originalLeft + 6;
  const maxX = stageRect.right - originalLeft - elementRect.width - 6;
  const minY = stageRect.top - originalTop + 6;
  const maxY = stageRect.bottom - originalTop - elementRect.height - 6;
  return {
    x: Math.min(Math.max(x, minX), maxX),
    y: Math.min(Math.max(y, minY), maxY),
  };
}

document.querySelectorAll("[data-draggable]").forEach((artifact) => {
    artifact.dataset.x = "0";
    artifact.dataset.y = "0";
    artifact.dataset.scale = artifact.classList.contains("azalea") ? "1" : artifact.dataset.scale || "1";
  let drag = null;

  artifact.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    drag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      x: Number(artifact.dataset.x),
      y: Number(artifact.dataset.y),
    };
    artifact.setPointerCapture(event.pointerId);
    artifact.classList.add("is-dragging");
  });

  artifact.addEventListener("pointermove", (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const position = clampPosition(artifact, drag.x + event.clientX - drag.startX, drag.y + event.clientY - drag.startY);
    artifact.dataset.x = String(position.x);
    artifact.dataset.y = String(position.y);
    applyPosition(artifact);
    if (artifact.classList.contains("azalea")) leaveHeart(artifact);
  });

  function endDrag(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    artifact.classList.remove("is-dragging");
    drag = null;
  }

  artifact.addEventListener("pointerup", endDrag);
  artifact.addEventListener("pointercancel", endDrag);

  artifact.addEventListener("keydown", (event) => {
    const directions = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    if (!directions[event.key]) return;
    event.preventDefault();
    const distance = event.shiftKey ? 2 : 12;
    const [dx, dy] = directions[event.key];
    const position = clampPosition(
      artifact,
      Number(artifact.dataset.x) + dx * distance,
      Number(artifact.dataset.y) + dy * distance,
    );
    artifact.dataset.x = String(position.x);
    artifact.dataset.y = String(position.y);
    applyPosition(artifact);
    if (artifact.classList.contains("azalea")) leaveHeart(artifact, true);
    announce(`${artifact.getAttribute("aria-label")} moved.`);
  });
});

const azalea = document.querySelector(".azalea");
const azaleaSize = document.querySelector("[data-azalea-size]");

azaleaSize.addEventListener("input", () => {
  azalea.dataset.scale = String(Number(azaleaSize.value) / 100);
  applyPosition(azalea);
  for (let index = 0; index < 3; index += 1) leaveHeart(azalea, true);
});

document.querySelectorAll("[data-reset]").forEach((button) => {
  button.addEventListener("click", () => {
    const panel = button.closest(".folder");
    panel.querySelectorAll("[data-draggable]").forEach((artifact) => {
      artifact.dataset.x = "0";
      artifact.dataset.y = "0";
      if (artifact.classList.contains("azalea")) artifact.dataset.scale = "1";
      applyPosition(artifact);
    });
    panel.querySelectorAll(".heart-layer").forEach((layer) => layer.replaceChildren());
    const size = panel.querySelector("[data-azalea-size]");
    if (size) size.value = "100";
    announce("Artifacts reset.");
  });
});

const card = document.querySelector("[data-card-cycler]");
const reverseArrowPaths = `
  <path d="M18 63C18 34 39 17 68 17V5L103 31 68 57V43C53 43 45 50 45 63Z"></path>
  <path d="M102 57C102 86 81 103 52 103V115L17 89 52 63V77C67 77 75 70 75 57Z"></path>`;
const cardTypes = [
  {
    type: "wild",
    corner: "W",
    label: "Wild card",
    symbol: '<span class="wild-wheel"><i></i><i></i><i></i><i></i></span>',
  },
  {
    type: "skip",
    corner: "⊘",
    label: "Skip card",
    symbol: '<span class="skip-symbol"></span>',
  },
  {
    type: "reverse",
    corner: `<svg class="reverse-mini" viewBox="0 0 120 120" aria-hidden="true">${reverseArrowPaths}</svg>`,
    label: "Reverse card",
    symbol: `<svg class="reverse-symbol" viewBox="0 0 120 120" aria-hidden="true">${reverseArrowPaths}</svg>`,
  },
  {
    type: "draw-two",
    corner: "+2",
    label: "Draw Two card",
    symbol: '<span class="mini-card-stack"><i class="mini-card"></i><i class="mini-card"></i></span>',
  },
  {
    type: "draw-four",
    corner: "+4",
    label: "Wild Draw Four card",
    symbol: '<span class="mini-card-stack"><i class="mini-card" style="--mini-color:var(--red)"></i><i class="mini-card" style="--mini-color:var(--yellow)"></i><i class="mini-card" style="--mini-color:var(--green)"></i><i class="mini-card" style="--mini-color:var(--blue)"></i></span>',
  },
];
const cardColors = [
  { name: "Red", value: "var(--red)" },
  { name: "Yellow", value: "var(--yellow)" },
  { name: "Green", value: "var(--green)" },
  { name: "Blue", value: "var(--blue)" },
];
let cardIndex = 0;
let lastCardColor = -1;
let lastCardSize = -1;
let cardIsFlipping = false;

function nextCardColor() {
  let nextColor = Math.floor(Math.random() * cardColors.length);
  if (nextColor === lastCardColor) nextColor = (nextColor + 1) % cardColors.length;
  lastCardColor = nextColor;
  return cardColors[nextColor];
}

function setCard(index, { randomize = true } = {}) {
  cardIndex = index;
  const nextCard = cardTypes[cardIndex];
  const usesSingleColor = ["skip", "reverse", "draw-two"].includes(nextCard.type);
  const color = usesSingleColor ? nextCardColor() : null;
  card.dataset.cardType = nextCard.type;
  card.style.setProperty("--card-color", color?.value || "var(--red)");
  randomizeCardGeometry(randomize);
  card.querySelector("[data-card-symbol]").innerHTML = nextCard.symbol;
  card.querySelectorAll("[data-card-corner]").forEach((corner) => {
    corner.innerHTML = nextCard.corner;
  });
  const accessibleName = color ? `${color.name} ${nextCard.label}` : nextCard.label;
  card.setAttribute("aria-label", `${accessibleName}. Click to draw a different card.`);
}

function randomizeCardGeometry(randomize) {
  if (!randomize) {
    card.style.setProperty("--card-scale", "1");
    card.style.setProperty("--card-x", "0px");
    card.style.setProperty("--card-y", "0px");
    return;
  }

  const stage = card.closest("[data-stage]");
  const baseWidth = card.offsetWidth;
  const baseHeight = card.offsetHeight;
  const horizontalMargin = 30;
  const verticalMargin = 38;
  const safeWidth = stage.clientWidth - horizontalMargin * 2;
  const safeHeight = stage.clientHeight - verticalMargin * 2;
  const sizes = [0.55, 0.72, 0.94, 1.22];
  let sizeIndex = Math.floor(Math.random() * sizes.length);
  if (sizeIndex === lastCardSize) sizeIndex = (sizeIndex + 1) % sizes.length;
  lastCardSize = sizeIndex;
  const requestedScale = sizes[sizeIndex];
  const maximumScale = Math.min(safeWidth / baseWidth, safeHeight / baseHeight, 1.22);
  const scale = Math.min(requestedScale, maximumScale);
  const scaledWidth = baseWidth * scale;
  const scaledHeight = baseHeight * scale;
  const baseCenterX = stage.clientWidth * 0.5;
  const baseCenterY = stage.clientHeight * 0.53;
  const minimumX = horizontalMargin + scaledWidth / 2 - baseCenterX;
  const maximumX = stage.clientWidth - horizontalMargin - scaledWidth / 2 - baseCenterX;
  const minimumY = verticalMargin + scaledHeight / 2 - baseCenterY;
  const maximumY = stage.clientHeight - verticalMargin - scaledHeight / 2 - baseCenterY;
  const x = minimumX + Math.random() * Math.max(0, maximumX - minimumX);
  const y = minimumY + Math.random() * Math.max(0, maximumY - minimumY);

  card.style.setProperty("--card-scale", scale.toFixed(3));
  card.style.setProperty("--card-x", `${x.toFixed(1)}px`);
  card.style.setProperty("--card-y", `${y.toFixed(1)}px`);
}

function drawNextCard() {
  if (cardIsFlipping) return;
  const nextIndex = (cardIndex + 1) % cardTypes.length;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion) {
    setCard(nextIndex);
    return;
  }

  cardIsFlipping = true;
  card.setAttribute("aria-busy", "true");
  card.classList.add("is-flipping");

  window.setTimeout(() => setCard(nextIndex), 300);
  card.addEventListener("animationend", () => {
    card.classList.remove("is-flipping");
    card.removeAttribute("aria-busy");
    cardIsFlipping = false;
  }, { once: true });
}

card.addEventListener("click", drawNextCard);
document.querySelector("[data-card-reset]").addEventListener("click", () => setCard(0, { randomize: false }));
setCard(0, { randomize: false });

document.querySelector("[data-finish]").addEventListener("click", () => {
  document.querySelectorAll("[data-draggable]").forEach((artifact) => {
    artifact.dataset.x = "0";
    artifact.dataset.y = "0";
    if (artifact.classList.contains("azalea")) artifact.dataset.scale = "1";
    applyPosition(artifact);
  });
  document.querySelectorAll(".heart-layer").forEach((layer) => layer.replaceChildren());
  azaleaSize.value = "100";
  setCard(0, { randomize: false });
  furthestStep = 0;
  showStep(0);
});

window.addEventListener("resize", () => {
  panels[currentStep].querySelectorAll("[data-draggable]").forEach((artifact) => {
    const position = clampPosition(artifact, Number(artifact.dataset.x), Number(artifact.dataset.y));
    artifact.dataset.x = String(position.x);
    artifact.dataset.y = String(position.y);
    applyPosition(artifact);
  });
});
