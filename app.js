const display = document.getElementById("display");
const keysEl = document.getElementById("keys");

const layout = [
  { label: "C", action: "clear", className: "key--danger" },
  { label: "⌫", action: "backspace", className: "key--muted" },
  { label: "%", action: "percent", className: "key--muted" },
  { label: "÷", action: "op", value: "/", className: "key--accent" },
  { label: "7", action: "digit", value: "7" },
  { label: "8", action: "digit", value: "8" },
  { label: "9", action: "digit", value: "9" },
  { label: "×", action: "op", value: "*", className: "key--accent" },
  { label: "4", action: "digit", value: "4" },
  { label: "5", action: "digit", value: "5" },
  { label: "6", action: "digit", value: "6" },
  { label: "−", action: "op", value: "-", className: "key--accent" },
  { label: "1", action: "digit", value: "1" },
  { label: "2", action: "digit", value: "2" },
  { label: "3", action: "digit", value: "3" },
  { label: "+", action: "op", value: "+", className: "key--accent" },
  { label: "±", action: "negate", className: "key--muted" },
  { label: "0", action: "digit", value: "0" },
  { label: ".", action: "digit", value: "." },
  { label: "=", action: "equals", className: "key--accent" },
];

let current = "0";
let stored = null;
let pendingOp = null;
let fresh = true;

function formatForDisplay(str) {
  if (str === "오류" || str === "Infinity") return str;
  const n = Number(str);
  if (!Number.isFinite(n)) return "오류";
  const abs = Math.abs(n);
  if (abs !== 0 && (abs >= 1e12 || abs < 1e-9)) return n.toExponential(6);
  const rounded = Math.round(n * 1e10) / 1e10;
  let out = String(rounded);
  if (out.includes("e")) return n.toExponential(6);
  return out;
}

function updateDisplay() {
  display.textContent = formatForDisplay(current);
}

function applyOp(a, b, op) {
  const x = Number(a);
  const y = Number(b);
  switch (op) {
    case "+":
      return x + y;
    case "-":
      return x - y;
    case "*":
      return x * y;
    case "/":
      return y === 0 ? NaN : x / y;
    default:
      return y;
  }
}

function inputDigit(d) {
  if (fresh) {
    current = d === "." ? "0." : d;
    fresh = false;
    return;
  }
  if (d === "." && current.includes(".")) return;
  if (current === "0" && d !== ".") {
    current = d;
    return;
  }
  if (current.replace(".", "").length >= 16) return;
  current += d;
}

function clear() {
  current = "0";
  stored = null;
  pendingOp = null;
  fresh = true;
}

function backspace() {
  if (fresh) return;
  if (current.length <= 1) {
    current = "0";
    fresh = true;
    return;
  }
  current = current.slice(0, -1);
}

function negate() {
  if (current === "0" && fresh) return;
  if (current.startsWith("-")) current = current.slice(1);
  else current = "-" + current;
  fresh = false;
}

function percent() {
  const n = Number(current);
  if (!Number.isFinite(n)) return;
  current = String(n / 100);
  fresh = true;
}

function commitPending() {
  if (stored === null || pendingOp === null) return;
  const next = applyOp(stored, current, pendingOp);
  current = Number.isFinite(next) ? String(next) : "오류";
  stored = null;
  pendingOp = null;
  fresh = true;
}

function setOperator(op) {
  if (current === "오류") return;
  if (stored !== null && pendingOp !== null && !fresh) {
    commitPending();
    if (current === "오류") {
      updateDisplay();
      return;
    }
  }
  stored = current;
  pendingOp = op;
  fresh = true;
}

function equals() {
  if (pendingOp === null || stored === null) return;
  commitPending();
}

layout.forEach((def) => {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "key" + (def.className ? " " + def.className : "");
  btn.textContent = def.label;
  btn.dataset.action = def.action;
  if (def.value != null) btn.dataset.value = def.value;
  keysEl.appendChild(btn);
});

keysEl.addEventListener("click", (e) => {
  const t = e.target.closest("button[data-action]");
  if (!t) return;
  const action = t.dataset.action;
  const value = t.dataset.value;

  switch (action) {
    case "digit":
      inputDigit(value);
      break;
    case "op":
      setOperator(value);
      break;
    case "equals":
      equals();
      break;
    case "clear":
      clear();
      break;
    case "backspace":
      backspace();
      break;
    case "negate":
      negate();
      break;
    case "percent":
      percent();
      break;
    default:
      break;
  }
  updateDisplay();
});

const keyMap = {
  "0": "0",
  "1": "1",
  "2": "2",
  "3": "3",
  "4": "4",
  "5": "5",
  "6": "6",
  "7": "7",
  "8": "8",
  "9": "9",
  ".": ".",
  "+": "+",
  "-": "-",
  "*": "*",
  "/": "/",
  Enter: "=",
  "=": "=",
  Escape: "Escape",
  Backspace: "Backspace",
  "%": "%",
};

document.addEventListener("keydown", (e) => {
  if (e.target.matches("input, textarea")) return;
  const k = e.key;
  const mapped = keyMap[k];
  if (mapped === "Escape") {
    e.preventDefault();
    clear();
    updateDisplay();
    return;
  }
  if (mapped === "Backspace") {
    e.preventDefault();
    backspace();
    updateDisplay();
    return;
  }
  if (mapped === "=") {
    e.preventDefault();
    equals();
    updateDisplay();
    return;
  }
  if (mapped === "%") {
    e.preventDefault();
    percent();
    updateDisplay();
    return;
  }
  if (["+", "-", "*", "/"].includes(mapped)) {
    e.preventDefault();
    setOperator(mapped);
    updateDisplay();
    return;
  }
  if (mapped && /[0-9.]/.test(mapped)) {
    e.preventDefault();
    inputDigit(mapped);
    updateDisplay();
  }
});

updateDisplay();
