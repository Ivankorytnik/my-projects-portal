const SESSION_URL = "https://ytdacypygsfalkixhemj.supabase.co/functions/v1/voice-session";
const ACCESS_KEY = "kh-ai-access";
const HISTORY_KEY = "kh-ai-history-v01";

const els = {
  statusPill: document.getElementById("statusPill"),
  statusText: document.getElementById("statusText"),
  voiceStage: document.getElementById("voiceStage"),
  voiceState: document.getElementById("voiceState"),
  connectButton: document.getElementById("connectButton"),
  muteButton: document.getElementById("muteButton"),
  stopButton: document.getElementById("stopButton"),
  messages: document.getElementById("messages"),
  emptyMessage: document.getElementById("emptyMessage"),
  clearButton: document.getElementById("clearButton"),
  textForm: document.getElementById("textForm"),
  textInput: document.getElementById("textInput"),
  sendButton: document.getElementById("sendButton"),
  accessDialog: document.getElementById("accessDialog"),
  accessForm: document.getElementById("accessForm"),
  accessInput: document.getElementById("accessInput"),
  dialogError: document.getElementById("dialogError"),
  cancelAccess: document.getElementById("cancelAccess"),
  remoteAudio: document.getElementById("remoteAudio")
};

let pc = null;
let dc = null;
let localStream = null;
let muted = false;
let connecting = false;
let history = loadHistory();
let pendingAssistant = "";
let pendingUser = "";
let accessResolver = null;

renderHistory();

function loadHistory() {
  try {
    const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.slice(-60) : [];
  } catch {
    return [];
  }
}

function saveHistory() {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-60)));
}

function renderHistory() {
  els.messages.querySelectorAll(".message").forEach(node => node.remove());
  els.emptyMessage.style.display = history.length ? "none" : "block";
  history.forEach(item => appendMessageNode(item.role, item.text));
  els.messages.scrollTop = els.messages.scrollHeight;
}

function appendMessageNode(role, text) {
  const node = document.createElement("div");
  node.className = `message ${role}`;
  const roleLabel = document.createElement("span");
  roleLabel.className = "role";
  roleLabel.textContent = role === "user" ? "Иван" : "KORYTNIK AI";
  const body = document.createElement("span");
  body.textContent = text;
  node.append(roleLabel, body);
  els.messages.appendChild(node);
  els.messages.scrollTop = els.messages.scrollHeight;
  return body;
}

function addMessage(role, text) {
  const clean = String(text || "").trim();
  if (!clean) return;
  history.push({ role, text: clean, ts: Date.now() });
  saveHistory();
  renderHistory();
}

function setStatus(text, online = false) {
  els.statusText.textContent = text;
  els.statusPill.classList.toggle("online", online);
}

function setVoiceState(text, mode = "idle") {
  els.voiceState.textContent = text;
  els.voiceStage.classList.toggle("live", mode === "live" || mode === "speaking");
  els.voiceStage.classList.toggle("speaking", mode === "speaking");
}

function setConnectedUi(connected) {
  els.connectButton.textContent = connected ? "Подключено" : "Подключить голос";
  els.connectButton.disabled = connected || connecting;
  els.muteButton.disabled = !connected;
  els.stopButton.disabled = !connected;
  els.textInput.disabled = !connected;
  els.sendButton.disabled = !connected;
}

function getAccessCode() {
  return sessionStorage.getItem(ACCESS_KEY) || "";
}

function askAccessCode(message = "") {
  els.dialogError.textContent = message;
  els.accessInput.value = "";
  if (!els.accessDialog.open) els.accessDialog.showModal();
  setTimeout(() => els.accessInput.focus(), 50);
  return new Promise(resolve => { accessResolver = resolve; });
}

els.accessForm.addEventListener("submit", event => {
  event.preventDefault();
  const code = els.accessInput.value.trim();
  if (!code) return;
  sessionStorage.setItem(ACCESS_KEY, code);
  els.accessDialog.close();
  if (accessResolver) accessResolver(code);
  accessResolver = null;
});

els.cancelAccess.addEventListener("click", () => {
  els.accessDialog.close();
  if (accessResolver) accessResolver("");
  accessResolver = null;
});

async function openRealtimeSession(accessCode) {
  localStream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
  });

  pc = new RTCPeerConnection();
  pc.ontrack = event => {
    els.remoteAudio.srcObject = event.streams[0];
    els.remoteAudio.play().catch(() => {});
  };
  pc.onconnectionstatechange = () => {
    const state = pc?.connectionState;
    if (state === "failed" || state === "disconnected" || state === "closed") {
      if (!connecting) disconnect();
    }
  };

  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
  dc = pc.createDataChannel("oai-events");
  bindDataChannel();

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  const sessionConfig = {
    type: "realtime",
    model: "gpt-realtime-mini",
    instructions: [
      "Ты KORYTNIK AI, персональный голосовой помощник Ивана.",
      "По умолчанию говори по-русски.",
      "Отвечай естественно, кратко и по делу.",
      "Пользователь может перебивать тебя: сразу учитывай новую реплику.",
      "Если фактов не хватает, не выдумывай их."
    ].join(" "),
    output_modalities: ["audio"],
    max_output_tokens: 900,
    audio: {
      input: {
        noise_reduction: { type: "near_field" },
        transcription: { model: "gpt-4o-mini-transcribe", language: "ru" },
        turn_detection: {
          type: "semantic_vad",
          eagerness: "auto",
          create_response: true,
          interrupt_response: true
        }
      },
      output: { voice: "marin", speed: 1.0 }
    }
  };

  const fd = new FormData();
  fd.append("sdp", offer.sdp);
  fd.append("session", JSON.stringify(sessionConfig));

  const response = await fetch(SESSION_URL, {
    method: "POST",
    headers: { "x-kh-access": accessCode },
    body: fd
  });

  if (response.status === 401) {
    sessionStorage.removeItem(ACCESS_KEY);
    throw Object.assign(new Error("Неверный код доступа."), { code: "access_denied" });
  }

  const contentType = response.headers.get("content-type") || "";
  if (!response.ok) {
    let message = `Ошибка подключения (${response.status})`;
    try {
      if (contentType.includes("application/json")) {
        const data = await response.json();
        message = data.message || data.detail || message;
      } else {
        const text = await response.text();
        if (text) message = text.slice(0, 300);
      }
    } catch {}
    throw new Error(message);
  }

  const answerSdp = await response.text();
  await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
}

function bindDataChannel() {
  dc.addEventListener("open", () => {
    setStatus("Онлайн", true);
    setVoiceState("Слушаю вас", "live");
    setConnectedUi(true);
  });

  dc.addEventListener("message", event => {
    let data;
    try { data = JSON.parse(event.data); } catch { return; }
    handleRealtimeEvent(data);
  });
}

function handleRealtimeEvent(data) {
  const type = data.type || "";

  if (type === "input_audio_buffer.speech_started") {
    setVoiceState("Слушаю вас", "live");
    return;
  }

  if (type === "input_audio_buffer.speech_stopped") {
    setVoiceState("Думаю...", "live");
    return;
  }

  if (type === "conversation.item.input_audio_transcription.delta") {
    pendingUser += data.delta || "";
    return;
  }

  if (type === "conversation.item.input_audio_transcription.completed") {
    const text = data.transcript || pendingUser;
    pendingUser = "";
    addMessage("user", text);
    return;
  }

  if (type === "response.output_audio_transcript.delta" || type === "response.audio_transcript.delta") {
    pendingAssistant += data.delta || "";
    setVoiceState("Отвечаю", "speaking");
    return;
  }

  if (type === "response.output_audio_transcript.done" || type === "response.audio_transcript.done") {
    const text = data.transcript || pendingAssistant;
    pendingAssistant = "";
    addMessage("assistant", text);
    setVoiceState("Слушаю вас", "live");
    return;
  }

  if (type === "response.created" || type === "response.output_audio.delta" || type === "response.audio.delta") {
    setVoiceState("Отвечаю", "speaking");
    return;
  }

  if (type === "response.done") {
    if (pendingAssistant.trim()) {
      addMessage("assistant", pendingAssistant);
      pendingAssistant = "";
    }
    setVoiceState("Слушаю вас", "live");
    return;
  }

  if (type === "error") {
    console.error("Realtime error", data);
    setVoiceState("Ошибка голосовой сессии");
  }
}

async function connect() {
  if (connecting || pc) return;
  connecting = true;
  setConnectedUi(false);
  els.connectButton.disabled = true;
  setStatus("Подключение...");
  setVoiceState("Запрашиваю микрофон...");

  try {
    let accessCode = getAccessCode();
    if (!accessCode) accessCode = await askAccessCode();
    if (!accessCode) throw new Error("Подключение отменено.");

    try {
      await openRealtimeSession(accessCode);
    } catch (error) {
      if (error.code === "access_denied") {
        disconnect(false);
        const retryCode = await askAccessCode("Код не подошёл. Попробуйте ещё раз.");
        if (!retryCode) throw new Error("Подключение отменено.");
        await openRealtimeSession(retryCode);
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error(error);
    disconnect(false);
    setStatus("Не подключено");
    setVoiceState(error.message || "Не удалось подключиться");
    alert(error.message || "Не удалось подключить голос.");
  } finally {
    connecting = false;
    if (!pc) setConnectedUi(false);
  }
}

function disconnect(updateText = true) {
  try { dc?.close(); } catch {}
  try { pc?.close(); } catch {}
  try { localStream?.getTracks().forEach(track => track.stop()); } catch {}
  dc = null;
  pc = null;
  localStream = null;
  muted = false;
  els.muteButton.textContent = "🎙";
  setConnectedUi(false);
  if (updateText) {
    setStatus("Не подключено");
    setVoiceState("Готов к подключению");
  }
}

function sendText(text) {
  if (!dc || dc.readyState !== "open") return;
  const clean = String(text || "").trim();
  if (!clean) return;

  addMessage("user", clean);
  dc.send(JSON.stringify({
    type: "conversation.item.create",
    item: {
      type: "message",
      role: "user",
      content: [{ type: "input_text", text: clean }]
    }
  }));
  dc.send(JSON.stringify({ type: "response.create" }));
  setVoiceState("Думаю...", "live");
}

els.connectButton.addEventListener("click", connect);
els.stopButton.addEventListener("click", () => disconnect());
els.muteButton.addEventListener("click", () => {
  muted = !muted;
  localStream?.getAudioTracks().forEach(track => { track.enabled = !muted; });
  els.muteButton.textContent = muted ? "🔇" : "🎙";
  setVoiceState(muted ? "Микрофон выключен" : "Слушаю вас", muted ? "idle" : "live");
});

els.textForm.addEventListener("submit", event => {
  event.preventDefault();
  const text = els.textInput.value;
  els.textInput.value = "";
  sendText(text);
});

els.clearButton.addEventListener("click", () => {
  history = [];
  saveHistory();
  renderHistory();
});

window.addEventListener("beforeunload", () => disconnect(false));
setConnectedUi(false);
