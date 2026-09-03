(() => {
  'use strict';

  const SESSION_URL = 'https://ytdacypygsfalkixhemj.supabase.co/functions/v1/voice-session';
  const ANSWER_URL = 'https://ytdacypygsfalkixhemj.supabase.co/functions/v1/prompter-answer';
  const CONTEXT_KEY = 'kh-prompter-context-v1';

  const byId = id => document.getElementById(id);
  const els = {
    speechWorkspace: byId('speechWorkspace'),
    prompterWorkspace: byId('prompterWorkspace'),
    start: byId('prompterStartBtn'),
    stop: byId('prompterStopBtn'),
    answerNow: byId('prompterAnswerNowBtn'),
    clearTranscript: byId('prompterClearTranscriptBtn'),
    clearAnswer: byId('prompterClearAnswerBtn'),
    copyAnswer: byId('prompterCopyAnswerBtn'),
    status: byId('prompterStatus'),
    statusText: byId('prompterStatusText'),
    transcript: byId('prompterTranscript'),
    question: byId('prompterQuestion'),
    answer: byId('prompterAnswer'),
    goal: byId('prompterGoal'),
    context: byId('prompterContext'),
    style: byId('prompterStyle'),
    source: byId('prompterSource'),
    auto: byId('prompterAuto')
  };

  if (!els.prompterWorkspace) return;

  let pc = null;
  let dc = null;
  let inputStream = null;
  let connecting = false;
  let utterances = [];
  let pendingTranscript = '';
  let answerController = null;

  restoreContext();
  bindUi();
  renderTranscript();
  clearAnswer();
  setConnectedUi(false);
  setStatus('Готов к работе', 'idle');

  function bindUi() {
    els.start?.addEventListener('click', connect);
    els.stop?.addEventListener('click', () => disconnect());
    els.answerNow?.addEventListener('click', () => requestAnswer(true));
    els.clearTranscript?.addEventListener('click', () => {
      utterances = [];
      pendingTranscript = '';
      renderTranscript();
      if (els.answerNow) els.answerNow.disabled = true;
    });
    els.clearAnswer?.addEventListener('click', () => clearAnswer());
    els.copyAnswer?.addEventListener('click', copyAnswer);
    [els.goal, els.context, els.style, els.source, els.auto].forEach(node => node?.addEventListener('change', saveContext));
    els.goal?.addEventListener('input', saveContext);
    els.context?.addEventListener('input', saveContext);
    window.addEventListener('beforeunload', () => disconnect(false));
  }

  function restoreContext() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(CONTEXT_KEY) || '{}');
      if (els.goal) els.goal.value = saved.goal || '';
      if (els.context) els.context.value = saved.context || '';
      if (els.style && saved.style) els.style.value = saved.style;
      if (els.source && saved.source) els.source.value = saved.source;
      if (els.auto && typeof saved.auto === 'boolean') els.auto.checked = saved.auto;
    } catch {}
  }

  function saveContext() {
    try {
      sessionStorage.setItem(CONTEXT_KEY, JSON.stringify({
        goal: els.goal?.value || '',
        context: els.context?.value || '',
        style: els.style?.value || 'коротко и делово',
        source: els.source?.value || 'mic',
        auto: Boolean(els.auto?.checked)
      }));
    } catch {}
  }

  function setStatus(text, mode = 'idle') {
    if (!els.status || !els.statusText) return;
    els.statusText.textContent = text;
    els.status.classList.remove('listening', 'thinking');
    if (mode === 'listening' || mode === 'thinking') els.status.classList.add(mode);
  }

  function setConnectedUi(connected) {
    els.start?.classList.toggle('hidden', connected);
    els.stop?.classList.toggle('hidden', !connected);
    if (els.answerNow) els.answerNow.disabled = !utterances.length;
  }

  async function getInputStream() {
    if ((els.source?.value || 'mic') === 'tab') {
      const display = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
        preferCurrentTab: false,
        selfBrowserSurface: 'exclude',
        surfaceSwitching: 'include',
        systemAudio: 'include'
      });
      const audioTrack = display.getAudioTracks()[0];
      display.getVideoTracks().forEach(track => track.stop());
      if (!audioTrack) {
        display.getTracks().forEach(track => track.stop());
        throw new Error('В выбранном источнике нет аудио. Выберите вкладку звонка и включите передачу аудио.');
      }
      audioTrack.addEventListener('ended', () => disconnect());
      return new MediaStream([audioTrack]);
    }

    return navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
    });
  }

  async function openRealtime() {
    inputStream = await getInputStream();
    pc = new RTCPeerConnection();
    inputStream.getAudioTracks().forEach(track => pc.addTrack(track, inputStream));

    dc = pc.createDataChannel('oai-events');
    bindDataChannel();

    pc.onconnectionstatechange = () => {
      const state = pc?.connectionState;
      if (!connecting && (state === 'failed' || state === 'disconnected' || state === 'closed')) disconnect();
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const sessionConfig = {
      type: 'realtime',
      model: 'gpt-realtime-mini',
      instructions: 'Транскрибируй входящую русскую речь. Не создавай ответы: приложение использует только расшифровку.',
      output_modalities: ['text'],
      max_output_tokens: 64,
      audio: {
        input: {
          noise_reduction: { type: (els.source?.value === 'tab' ? 'far_field' : 'near_field') },
          transcription: { model: 'gpt-4o-mini-transcribe', language: 'ru' },
          turn_detection: {
            type: 'semantic_vad',
            eagerness: 'high',
            create_response: false,
            interrupt_response: false
          }
        }
      }
    };

    const form = new FormData();
    form.append('sdp', offer.sdp);
    form.append('session', JSON.stringify(sessionConfig));

    const response = await fetch(SESSION_URL, { method: 'POST', body: form });
    if (!response.ok) {
      let message = `Ошибка подключения (${response.status})`;
      try {
        const data = await response.json();
        message = data.message || message;
      } catch {}
      throw new Error(message);
    }

    const answerSdp = await response.text();
    await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
  }

  function bindDataChannel() {
    dc.addEventListener('open', () => {
      setStatus(els.source?.value === 'tab' ? 'Слушаю звонок' : 'Слушаю разговор', 'listening');
      setConnectedUi(true);
    });

    dc.addEventListener('message', event => {
      let data;
      try { data = JSON.parse(event.data); } catch { return; }
      handleRealtimeEvent(data);
    });
  }

  function handleRealtimeEvent(data) {
    const type = data.type || '';

    if (type === 'input_audio_buffer.speech_started') {
      setStatus('Слышу речь…', 'listening');
      return;
    }
    if (type === 'input_audio_buffer.speech_stopped') {
      setStatus('Распознаю реплику…', 'thinking');
      return;
    }
    if (type === 'conversation.item.input_audio_transcription.delta') {
      pendingTranscript += data.delta || '';
      return;
    }
    if (type === 'conversation.item.input_audio_transcription.completed') {
      const text = String(data.transcript || pendingTranscript || '').trim();
      pendingTranscript = '';
      if (text) addUtterance(text);
      setStatus('Слушаю дальше', 'listening');
      return;
    }
    if (type === 'error') {
      console.error('Prompter realtime error', data);
      setStatus('Ошибка распознавания', 'idle');
      showToast('Ошибка распознавания речи.', true);
    }
  }

  async function connect() {
    if (connecting || pc) return;
    connecting = true;
    setStatus('Подключение…', 'thinking');
    if (els.start) els.start.disabled = true;
    saveContext();

    try {
      await openRealtime();
    } catch (error) {
      console.error(error);
      disconnect(false);
      setStatus(error.message || 'Не удалось подключиться', 'idle');
      showToast(error.message || 'Не удалось подключить суфлёр.', true);
    } finally {
      connecting = false;
      if (els.start) els.start.disabled = false;
    }
  }

  function disconnect(updateStatus = true) {
    answerController?.abort();
    answerController = null;
    try { dc?.close(); } catch {}
    try { pc?.close(); } catch {}
    try { inputStream?.getTracks().forEach(track => track.stop()); } catch {}
    dc = null;
    pc = null;
    inputStream = null;
    pendingTranscript = '';
    setConnectedUi(false);
    if (updateStatus) setStatus('Остановлено', 'idle');
  }

  function addUtterance(text) {
    const clean = text.replace(/\s+/g, ' ').trim();
    if (!clean) return;
    utterances.push({ text: clean, ts: Date.now() });
    utterances = utterances.slice(-14);
    renderTranscript();
    if (els.answerNow) els.answerNow.disabled = false;
    if (els.auto?.checked) requestAnswer(false);
  }

  function renderTranscript() {
    if (!els.transcript) return;
    els.transcript.innerHTML = '';
    if (!utterances.length) {
      const p = document.createElement('p');
      p.className = 'prompter-transcript-empty';
      p.textContent = 'Здесь появятся последние реплики разговора.';
      els.transcript.appendChild(p);
      return;
    }

    utterances.forEach(item => {
      const row = document.createElement('div');
      row.className = 'prompter-utterance';
      const time = document.createElement('time');
      time.textContent = new Date(item.ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      const text = document.createElement('span');
      text.textContent = item.text;
      row.append(time, text);
      els.transcript.appendChild(row);
    });
    els.transcript.scrollTop = els.transcript.scrollHeight;
  }

  function transcriptForAi() {
    return utterances.slice(-8).map((item, index) => `${index + 1}. ${item.text}`).join('\n');
  }

  async function requestAnswer(force) {
    if (!utterances.length) return;

    answerController?.abort();
    answerController = new AbortController();
    setAnswerLoading();

    try {
      const response = await fetch(ANSWER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: transcriptForAi(),
          goal: els.goal?.value || '',
          context: els.context?.value || '',
          style: els.style?.value || 'коротко и делово',
          force: Boolean(force)
        }),
        signal: answerController.signal
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.message || `Ошибка AI (${response.status})`);

      if (!data.is_question && !force) {
        clearAnswer('Жду вопрос…');
        return;
      }

      showAnswer(data.question || utterances.at(-1)?.text || '', data.answer || '');
    } catch (error) {
      if (error.name === 'AbortError') return;
      console.error(error);
      clearAnswer('Не удалось подготовить ответ.');
      showToast(error.message || 'Ошибка AI.', true);
    } finally {
      answerController = null;
    }
  }

  function setAnswerLoading() {
    if (els.answer) {
      els.answer.classList.remove('placeholder');
      els.answer.classList.add('loading');
      els.answer.textContent = 'Формулирую ответ…';
    }
    if (els.question) {
      els.question.classList.remove('has-question');
      els.question.textContent = 'Проверяю последнюю реплику';
    }
    if (els.copyAnswer) els.copyAnswer.disabled = true;
    if (els.clearAnswer) els.clearAnswer.disabled = false;
  }

  function showAnswer(question, answer) {
    if (els.question) {
      els.question.textContent = `Вопрос: ${question}`;
      els.question.classList.add('has-question');
    }
    if (els.answer) {
      els.answer.classList.remove('placeholder', 'loading');
      els.answer.textContent = answer || 'Ответ не сформирован.';
    }
    if (els.copyAnswer) els.copyAnswer.disabled = !answer;
    if (els.clearAnswer) els.clearAnswer.disabled = false;
  }

  function clearAnswer(message = 'После вопроса здесь появится готовая формулировка.') {
    if (els.question) {
      els.question.textContent = 'Последний распознанный вопрос появится здесь.';
      els.question.classList.remove('has-question');
    }
    if (els.answer) {
      els.answer.classList.add('placeholder');
      els.answer.classList.remove('loading');
      els.answer.textContent = message;
    }
    if (els.copyAnswer) els.copyAnswer.disabled = true;
    if (els.clearAnswer) els.clearAnswer.disabled = true;
  }

  async function copyAnswer() {
    const text = els.answer?.textContent?.trim() || '';
    if (!text || els.answer?.classList.contains('placeholder')) return;
    try {
      await navigator.clipboard.writeText(text);
      showToast('Ответ скопирован.');
    } catch {
      showToast('Не удалось скопировать.', true);
    }
  }

  function showToast(message, error = false) {
    const toast = byId('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.toggle('error', error);
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('show'), 2600);
  }
})();
