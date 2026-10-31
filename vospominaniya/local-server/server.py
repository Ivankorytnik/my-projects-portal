"""Локальный сервер распознавания для раздела «Воспоминания» (korytnikhub.pro/vospominaniya/).

Заменяет облачную функцию memories-transcribe и повторяет её формат запросов и ответов:
  POST multipart/form-data, заголовок x-memory-key, поле action = validate | transcribe | agent.
Распознавание речи: faster-whisper на этом компьютере. Литературная обработка: Ollama на этом компьютере.
Слушает только 127.0.0.1, в интернет ничего не отправляет. Нужен Python 3.9+ и пакет faster-whisper.

Запуск:            python server.py
Задать пароль:     python server.py --set-password
Проверить сервис:  http://127.0.0.1:8790/health
"""

import argparse
import base64
import difflib
import getpass
import hashlib
import hmac
import json
import logging
import os
import re
import secrets
import sys
import tempfile
import threading
import time
import urllib.error
import urllib.request
from email.parser import BytesParser
from email.policy import HTTP
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

VERSION = "1.1.0"
PERIODS = ["Детство", "Училище", "Армия", "Семья", "Работа", "Яндекс", "Gett", "Проекты", "Настоящее", "Не определено"]
DEFAULT_ORIGINS = ["https://korytnikhub.pro", "https://www.korytnikhub.pro"]
MAX_BODY = 600 * 1024 * 1024

DEFAULT_CONFIG = {
    "host": "127.0.0.1",
    "port": 8790,
    "allowed_origins": DEFAULT_ORIGINS,
    "asr_engine": "gigaam",
    "gigaam_model": "v3_e2e_rnnt",
    "chunk_seconds": 22,
    "whisper_model": "large-v3-turbo",
    "whisper_fallback_model": "small",
    "whisper_device": "cpu",
    "whisper_compute_type": "int8",
    "whisper_beam_size": 5,
    "ollama_url": "http://127.0.0.1:11434",
    "ollama_model": "qwen2.5:3b",
    "ollama_timeout": 900,
    "ollama_num_ctx": 8192,
    "fragment_chars": 2400,
    "password_hash": "",
}


def app_dir():
    env = os.environ.get("VOSPOMINANIYA_HOME")
    if env:
        return env
    if os.name == "nt" and os.environ.get("LOCALAPPDATA"):
        return os.path.join(os.environ["LOCALAPPDATA"], "VospominaniyaLocal")
    return os.path.join(os.path.expanduser("~"), ".vospominaniya-local")


def config_path():
    return os.path.join(app_dir(), "config.json")


def load_config():
    cfg = dict(DEFAULT_CONFIG)
    try:
        with open(config_path(), "r", encoding="utf-8-sig") as f:
            data = json.load(f)
        if isinstance(data, dict):
            cfg.update({k: v for k, v in data.items() if k in DEFAULT_CONFIG})
    except FileNotFoundError:
        pass
    origins = [str(o).rstrip("/") for o in cfg.get("allowed_origins") or [] if str(o).strip()]
    cfg["allowed_origins"] = origins or list(DEFAULT_ORIGINS)
    return cfg


def save_config(cfg):
    os.makedirs(app_dir(), exist_ok=True)
    tmp = config_path() + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump({k: cfg.get(k, v) for k, v in DEFAULT_CONFIG.items()}, f, ensure_ascii=False, indent=2)
    os.replace(tmp, config_path())


# ---------- пароль ----------

def hash_password(password, salt=None, rounds=200_000):
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, rounds)
    return "pbkdf2$%d$%s$%s" % (rounds, base64.b64encode(salt).decode(), base64.b64encode(digest).decode())


def check_password(password, stored):
    try:
        kind, rounds, salt, digest = str(stored).split("$")
        if kind != "pbkdf2":
            return False
        calc = hashlib.pbkdf2_hmac("sha256", str(password).encode("utf-8"), base64.b64decode(salt), int(rounds))
        return hmac.compare_digest(calc, base64.b64decode(digest))
    except Exception:
        return False


# ---------- распознавание речи ----------
# Основной движок: GigaAM v3 (Сбер, MIT), для русской речи заметно точнее Whisper и сразу ставит знаки препинания.
# Запасной: Whisper через faster-whisper. Если GigaAM не установлен или упал, распознаёт Whisper.

SR = 16000


class WhisperEngine:
    name = "whisper"

    def __init__(self, cfg):
        self.cfg = cfg
        self.model = None
        self.model_name = ""
        self.error = ""

    def _load(self):
        if self.model is not None:
            return self.model
        from faster_whisper import WhisperModel  # импорт здесь, чтобы /health работал и без модели
        names = [self.cfg["whisper_model"]]
        if self.cfg.get("whisper_fallback_model") and self.cfg["whisper_fallback_model"] not in names:
            names.append(self.cfg["whisper_fallback_model"])
        last = None
        for name in names:
            for device, compute in ((self.cfg["whisper_device"], self.cfg["whisper_compute_type"]), ("cpu", "int8")):
                try:
                    logging.info("Загружаю Whisper %s (%s, %s)", name, device, compute)
                    self.model = WhisperModel(name, device=device, compute_type=compute)
                    self.model_name = "Whisper %s (%s, %s)" % (name, device, compute)
                    self.error = ""
                    return self.model
                except Exception as e:  # нет модели, нет видеокарты, мало памяти
                    last = e
                    logging.warning("Whisper %s на %s не загрузился: %s", name, device, e)
        self.error = str(last)
        raise RuntimeError("Не удалось загрузить модель распознавания: %s" % last)

    def transcribe(self, path, language="ru", prompt="", quality="max"):
        model = self._load()
        beam = int(self.cfg.get("whisper_beam_size") or 5) if quality == "max" else 1
        segments, info = model.transcribe(
            path,
            language=language or "ru",
            beam_size=beam,
            vad_filter=True,
            initial_prompt=prompt or None,
            condition_on_previous_text=True,
        )
        parts = [s.text.strip() for s in segments if s.text and s.text.strip()]
        return {"text": join_segments(parts), "duration": round(float(getattr(info, "duration", 0) or 0), 1)}


def group_spans(spans, max_len, total):
    """Склеивает куски речи из детектора тишины в отрезки не длиннее max_len отсчётов. Слишком длинный кусок режется."""
    pieces = []
    for sp in spans:
        a, b = max(0, int(sp["start"])), min(total, int(sp["end"]))
        while b - a > max_len:
            pieces.append((a, a + max_len))
            a += max_len
        if b > a:
            pieces.append((a, b))
    chunks = []
    for a, b in pieces:
        if chunks and b - chunks[-1][0] <= max_len:
            chunks[-1] = (chunks[-1][0], b)
        else:
            chunks.append((a, b))
    return chunks


class GigaAMEngine:
    name = "gigaam"

    def __init__(self, cfg):
        self.cfg = cfg
        self.model = None
        self.model_name = ""
        self.error = ""
        self._clips = {}

    def _load(self):
        if self.model is not None:
            return self.model
        import torch
        import gigaam
        import gigaam.model as gm
        import gigaam.preprocess as gp
        clips = self._clips

        # GigaAM читает звук через внешний ffmpeg, которого на Windows обычно нет.
        # Подменяем чтение: куски из памяти отдаём напрямую, файлы декодирует PyAV из faster-whisper.
        def load_audio(path, sample_rate=SR):
            if isinstance(path, str) and path in clips:
                return torch.from_numpy(clips[path]).float()
            from faster_whisper import decode_audio
            return torch.from_numpy(decode_audio(path, sampling_rate=sample_rate)).float()

        gp.load_audio = load_audio
        gm.load_audio = load_audio
        name = self.cfg["gigaam_model"]
        logging.info("Загружаю GigaAM %s", name)
        self.model = gigaam.load_model(name, fp16_encoder=False, device="cpu")
        self.model_name = "GigaAM %s (cpu)" % name
        self.error = ""
        return self.model

    def transcribe(self, path, language="ru", prompt="", quality="max"):
        from faster_whisper import decode_audio
        from faster_whisper.vad import VadOptions, get_speech_timestamps
        model = self._load()
        audio = decode_audio(path, sampling_rate=SR)
        limit = float(self.cfg.get("chunk_seconds") or 22)
        spans = get_speech_timestamps(audio, VadOptions(min_silence_duration_ms=400, speech_pad_ms=150, max_speech_duration_s=limit))
        chunks = group_spans(spans, int(limit * SR), len(audio))
        parts = []
        for i, (a, b) in enumerate(chunks):
            key = "<clip %d>" % i
            self._clips[key] = audio[a:b]
            try:
                res = model.transcribe(key)
            finally:
                self._clips.pop(key, None)
            text = str(getattr(res, "text", res) or "").strip()
            if text:
                parts.append(text)
        return {"text": join_segments(parts), "duration": round(len(audio) / SR, 1), "chunks": len(chunks)}


class Transcriber:
    def __init__(self, cfg):
        self.cfg = cfg
        self.lock = threading.Lock()
        self.engines = {"gigaam": GigaAMEngine(cfg), "whisper": WhisperEngine(cfg)}

    def order(self):
        first = self.cfg.get("asr_engine") if self.cfg.get("asr_engine") in self.engines else "gigaam"
        return [first] + [n for n in self.engines if n != first]

    @property
    def model_name(self):
        return "; ".join(e.model_name for e in self.engines.values() if e.model_name)

    @property
    def error(self):
        return "; ".join("%s: %s" % (n, e.error) for n, e in self.engines.items() if e.error)

    def _load(self):
        last = None
        for name in self.order():
            try:
                return self.engines[name]._load()
            except Exception as e:
                self.engines[name].error = str(e)
                last = e
                logging.warning("Движок %s не загрузился: %s", name, e)
        raise RuntimeError("Не удалось загрузить распознавание: %s" % last)

    def status(self):
        return {
            "engine": self.order()[0],
            "loaded": self.model_name,
            "error": self.error,
            **{n: {"loaded": e.model_name, "error": e.error} for n, e in self.engines.items()},
        }

    def transcribe(self, path, language="ru", prompt="", quality="max", dictionary=""):
        with self.lock:
            last = None
            for name in self.order():
                eng = self.engines[name]
                try:
                    res = eng.transcribe(path, language, prompt, quality)
                    res["engine"] = eng.model_name or name
                    res["text"] = apply_dictionary(res["text"], dictionary)
                    return res
                except Exception as e:
                    eng.error = str(e)
                    last = e
                    logging.warning("Распознавание движком %s не удалось: %s", name, e)
            raise RuntimeError("Не удалось распознать запись: %s" % last)


DICT_VOWELS = "аеёиоуыэюяьй"


def apply_dictionary(text, dictionary):
    """Осторожно поправляет написание имён из словаря: «Трефештах» при слове «Трифешты» станет «Трифештах».
    Сравнивается основа слова, окончание остаётся как распознано. Короткие и непохожие слова не трогаются."""
    entries = [w.strip() for w in re.split(r"[\n,;]+", dictionary or "") if w.strip()]
    stems = []
    for e in entries:
        for word in e.split():
            st = word
            for _ in range(2):
                if len(st) > 4 and st[-1].lower() in DICT_VOWELS:
                    st = st[:-1]
            if len(st) >= 4:
                stems.append(st)
    if not stems:
        return text

    def fix(m):
        tok = m.group(0)
        low = tok.lower()
        for st in stems:
            sl = st.lower()
            n = len(sl)
            if low[:n] == sl or low[0] != sl[0] or not (n <= len(low) <= n + 4):
                continue
            if difflib.SequenceMatcher(None, low[:n], sl).ratio() >= 0.84:
                head = st if tok[0].isupper() else sl
                return head + tok[n:]
        return tok

    return re.sub(r"[А-Яа-яЁё]{4,}", fix, text)


def join_segments(parts):
    text = " ".join(parts)
    text = re.sub(r"\s+([,.!?;:])", r"\1", text)
    return re.sub(r"\s{2,}", " ", text).strip()


def whisper_prompt(dictionary, context, title):
    # Словарь имён и названий подсказывает Whisper правильное написание. Подсказка короткая: Whisper берёт около 200 токенов.
    words = [w.strip() for w in re.split(r"[\n,;]+", dictionary or "") if w.strip()]
    pieces = []
    if words:
        pieces.append("Имена и названия: " + ", ".join(words) + ".")
    if title and title not in ("Новое воспоминание", "Без названия"):
        pieces.append(title.rstrip(".…") + ".")
    if context:
        pieces.append(context)
    return " ".join(pieces)[:700]


# ---------- литературная обработка через Ollama ----------

EDITOR_SYSTEM = (
    "Ты бережный литературный редактор русских семейных мемуаров. Пиши от первого лица, как рассказывает автор. "
    "Сохраняй все имена, факты, места, даты, числа, последовательность событий и смысл. "
    "Убирай слова-паразиты, случайные повторы и оговорки, исправляй грамматику, делай естественные предложения и абзацы. "
    "Ничего не выдумывай: не добавляй эмоций, диалогов, деталей и выводов, которых нет в исходнике. "
    "Если слово непонятно, оставь его как есть."
)

META_SYSTEM = (
    "Ты помощник, который размечает главу семейных воспоминаний. Отвечай только JSON по схеме. "
    "Бери только то, что прямо есть в тексте. Чего в тексте нет, не придумывай: пустой список или пустая строка. "
    "Период выбирай из списка, а если по тексту непонятно, ставь «Не определено»."
)

META_SCHEMA = {
    "type": "object",
    "properties": {
        "title": {"type": "string"},
        "period": {"type": "string", "enum": PERIODS},
        "people": {"type": "array", "items": {"type": "string"}},
        "places": {"type": "array", "items": {"type": "string"}},
        "dates": {"type": "array", "items": {"type": "string"}},
        "summary": {"type": "string"},
        "question": {"type": "string"},
    },
    "required": ["title", "period", "people", "places", "dates", "summary", "question"],
}


class OllamaError(RuntimeError):
    pass


class Agent:
    def __init__(self, cfg):
        self.cfg = cfg
        self.lock = threading.Lock()

    def _post(self, path, payload, timeout=None):
        url = self.cfg["ollama_url"].rstrip("/") + path
        req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers={"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=timeout or self.cfg["ollama_timeout"]) as r:
                return json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", "replace")[:300]
            if e.code == 404 and "not found" in body.lower():
                raise OllamaError("В Ollama нет модели %s. Выполните: ollama pull %s" % (self.cfg["ollama_model"], self.cfg["ollama_model"]))
            raise OllamaError("Ollama ответила ошибкой %s: %s" % (e.code, body))
        except (urllib.error.URLError, OSError) as e:
            raise OllamaError("Ollama не запущена или недоступна (%s). Запустите Ollama и повторите." % getattr(e, "reason", e))

    def status(self):
        url = self.cfg["ollama_url"].rstrip("/") + "/api/tags"
        try:
            with urllib.request.urlopen(url, timeout=3) as r:
                data = json.loads(r.read().decode("utf-8"))
            names = [m.get("name", "") for m in data.get("models", [])]
            want = self.cfg["ollama_model"]
            has = any(n == want or n == want + ":latest" or n.split(":")[0] == want and ":" not in want for n in names)
            return {"ok": True, "model": want, "installed": has, "models": names[:20]}
        except Exception as e:
            return {"ok": False, "model": self.cfg["ollama_model"], "installed": False, "error": str(getattr(e, "reason", e))}

    def chat(self, system, user, schema=None, max_tokens=1600):
        payload = {
            "model": self.cfg["ollama_model"],
            "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
            "stream": False,
            "keep_alive": "15m",
            "options": {"temperature": 0.2, "repeat_penalty": 1.08, "num_ctx": int(self.cfg["ollama_num_ctx"]), "num_predict": max_tokens},
        }
        if schema:
            payload["format"] = schema
        data = self._post("/api/chat", payload)
        return str((data.get("message") or {}).get("content") or "").strip()

    def edit_fragment(self, fragment, index, count, dictionary):
        hint = ("Правильное написание имён и названий: %s.\n" % dictionary) if dictionary else ""
        user = (
            "%sЭто фрагмент %d из %d. Перепиши его литературно, не сокращая факты и не продолжая рассказ от себя. "
            "Верни только готовый текст, без заголовков, пояснений и кавычек.\n\nИсходная расшифровка:\n%s"
            % (hint, index + 1, count, fragment)
        )
        out = self.chat(EDITOR_SYSTEM, user, max_tokens=max(500, int(len(fragment) * 0.9)))
        out = re.sub(r"^\s*(?:вот\s+)?(?:литературн\w+\s+)?(?:текст|вариант)\s*:\s*", "", out, flags=re.I).strip().strip("«»\"")
        # Защита от выдумок и обрывов: если ответ сильно короче или длиннее исходника, оставляем исходник.
        if not out or len(out) < len(fragment) * 0.45 or len(out) > len(fragment) * 2.2:
            logging.warning("Фрагмент %d: ответ модели отброшен (длина %d при исходнике %d)", index + 1, len(out), len(fragment))
            return fragment.strip(), False
        if out[0].islower():
            out = out[0].upper() + out[1:]
        return out, True

    def metadata(self, source, title_hint, dictionary):
        hint = ("Правильное написание имён и названий: %s.\n" % dictionary) if dictionary else ""
        user = (
            "%sПериоды жизни автора: %s.\n"
            "Заполни поля:\n"
            "title: короткое название главы из 3-7 слов по содержанию;\n"
            "period: период жизни автора, к которому относится рассказ;\n"
            "people: люди, названные в тексте (имена или родство, например «отец»);\n"
            "places: места, названные в тексте;\n"
            "dates: даты, годы, возраст и сроки, как они записаны в тексте;\n"
            "summary: одно предложение о чём глава;\n"
            "question: один уточняющий вопрос автору о том, чего не хватает для книги (когда, где, кто), или пустая строка.\n"
            "%s\nТекст:\n%s"
            % (hint, ", ".join(PERIODS[:-1]), ("Рабочее название: %s.\n" % title_hint) if title_hint else "", source[:12000])
        )
        raw = self.chat(META_SYSTEM, user, schema=META_SCHEMA, max_tokens=700)
        try:
            data = json.loads(raw)
        except ValueError:
            m = re.search(r"\{[\s\S]*\}", raw)
            data = json.loads(m.group(0)) if m else {}
        return data if isinstance(data, dict) else {}

    def run(self, transcript, title_hint="", dictionary="", question="", answer=""):
        source = str(transcript or "").strip()
        if answer:
            source += "\n\nДополнение автора (ответ на вопрос «%s»): %s" % (question.strip() or "уточнение", answer.strip())
        with self.lock:
            fragments = split_text(source, int(self.cfg["fragment_chars"]))
            texts, edited = [], 0
            for i, frag in enumerate(fragments):
                text, ok = self.edit_fragment(frag, i, len(fragments), dictionary)
                texts.append(text)
                edited += 1 if ok else 0
            meta = self.metadata(source, title_hint, dictionary)
        return build_agent_result(source, "\n\n".join(texts).strip(), meta, title_hint, answer, edited, len(fragments))


def split_text(text, limit):
    sentences = re.findall(r"[^.!?…]+[.!?…]+[»\"]?|[^.!?…]+$", text) or [text]
    parts, cur = [], ""
    for s in sentences:
        s = s.strip()
        if not s:
            continue
        nxt = (cur + " " + s).strip()
        if len(nxt) > limit and cur:
            parts.append(cur)
            cur = s
        else:
            cur = nxt
    if cur:
        parts.append(cur)
    return parts or [text]


VOWELS = set("аеёиоуыэюяaeiouyьъй")


def _stem(w):
    return w[: max(4, len(w) - 3)] if len(w) > 5 else w


def _skeleton(w):
    return "".join(ch for ch in w if ch not in VOWELS)


def _word_found(w, source_lower, source_words):
    if w.isdigit():
        return w in source_lower
    if _stem(w) in source_lower:
        return True
    # Беглые гласные и падежи: «отец» и «отца», «мать» и «матери». Совпадают первая буква и согласные основы.
    sk = _skeleton(w)
    need = sk if len(sk) <= 3 else sk[:-1]
    return len(need) >= 2 and any(s[0] == w[0] and _skeleton(s).startswith(need) for s in source_words)


def mentioned(item, source_lower, source_words=None):
    """Пункт считается найденным в тексте, если в тексте есть каждое его значимое слово (с учётом падежей) и каждое число."""
    if source_words is None:
        source_words = set(re.findall(r"[а-яёa-z]+", source_lower))
    words = [w for w in re.findall(r"[а-яёa-z]+|\d+", item.lower()) if len(w) > 2 or w.isdigit()]
    if not words:
        return False
    return all(_word_found(w, source_lower, source_words) for w in words)


def clean_list(values, source_lower, limit=30):
    out = []
    source_words = set(re.findall(r"[а-яёa-z]+", source_lower))
    for v in values if isinstance(values, list) else []:
        s = re.sub(r"\s+", " ", str(v)).strip(" .,;")
        if s and len(s) <= 120 and s.lower() not in (x.lower() for x in out) and mentioned(s, source_lower, source_words):
            out.append(s)
    return out[:limit]


def build_agent_result(source, literary, meta, title_hint, answer, edited, total):
    low = source.lower()
    period = meta.get("period") if meta.get("period") in PERIODS else "Не определено"
    title = re.sub(r"\s+", " ", str(meta.get("title") or "")).strip(" .«»\"")[:120]
    if not title:
        title = title_hint or " ".join(source.split()[:7]).rstrip(".,!?;:") or "Новое воспоминание"
    question = "" if answer else str(meta.get("question") or "").strip()[:400]
    return {
        "title": title,
        "literary_text": literary or source,
        "period": period,
        "people": clean_list(meta.get("people"), low),
        "places": clean_list(meta.get("places"), low),
        "dates": clean_list(meta.get("dates"), low),
        "question": question,
        "summary": str(meta.get("summary") or "").strip()[:600],
        "engine": "local",
        "edited_fragments": edited,
        "total_fragments": total,
    }


# ---------- HTTP ----------

def parse_multipart(content_type, body):
    msg = BytesParser(policy=HTTP).parsebytes(("Content-Type: %s\r\nMIME-Version: 1.0\r\n\r\n" % content_type).encode("latin-1") + body)
    fields, files = {}, {}
    if not msg.is_multipart():
        return fields, files
    for part in msg.iter_parts():
        name = part.get_param("name", header="content-disposition")
        if not name:
            continue
        payload = part.get_payload(decode=True) or b""
        filename = part.get_filename()
        if filename is not None:
            files[name] = {"filename": filename, "data": payload, "type": part.get_content_type()}
        else:
            charset = part.get_content_charset() or "utf-8"
            fields[name] = payload.decode(charset, "replace")
    return fields, files


class Handler(BaseHTTPRequestHandler):
    server_version = "VospominaniyaLocal/" + VERSION
    cfg = None
    transcriber = None
    agent = None

    def log_message(self, fmt, *args):
        logging.info("%s %s", self.address_string(), fmt % args)

    def _origin_ok(self):
        origin = (self.headers.get("Origin") or "").rstrip("/")
        return (not origin) or origin in self.cfg["allowed_origins"], origin

    def _send(self, code, data, origin=""):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        if origin:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        ok, origin = self._origin_ok()
        if not ok or not origin:
            self.send_response(403)
            self.send_header("Content-Length", "0")
            self.end_headers()
            return
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", origin)
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "x-memory-key, content-type")
        self.send_header("Access-Control-Allow-Private-Network", "true")
        self.send_header("Access-Control-Max-Age", "600")
        self.send_header("Vary", "Origin")
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_GET(self):
        ok, origin = self._origin_ok()
        if not ok:
            return self._send(403, {"ok": False, "error": "Этот сайт не допущен к локальному серверу."})
        if self.path.split("?")[0] not in ("/health", "/"):
            return self._send(404, {"ok": False, "error": "Нет такого адреса"}, origin)
        self._send(200, {
            "ok": True,
            "service": "vospominaniya-local",
            "version": VERSION,
            "password_set": bool(self.cfg.get("password_hash")),
            "asr": self.transcriber.status(),
            "whisper": {"model": self.cfg["whisper_model"], "loaded": self.transcriber.engines["whisper"].model_name, "error": self.transcriber.engines["whisper"].error},
            "ollama": self.agent.status(),
        }, origin)

    def do_POST(self):
        ok, origin = self._origin_ok()
        if not ok:
            return self._send(403, {"ok": False, "error": "Этот сайт не допущен к локальному серверу."})
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0 or length > MAX_BODY:
            return self._send(413 if length else 400, {"ok": False, "error": "Пустой или слишком большой запрос"}, origin)
        body = self.rfile.read(length)
        stored = self.cfg.get("password_hash")
        if not stored:
            return self._send(503, {"ok": False, "error": "На локальном сервере не задан пароль. Запустите «Задать пароль» в папке сервера."}, origin)
        if not check_password(self.headers.get("x-memory-key") or "", stored):
            time.sleep(0.7)
            return self._send(401, {"ok": False, "error": "Неверный пароль"}, origin)
        try:
            fields, files = parse_multipart(self.headers.get("Content-Type") or "", body)
        except Exception:
            return self._send(400, {"ok": False, "error": "Не удалось прочитать запрос"}, origin)
        action = fields.get("action", "")
        try:
            if action == "validate":
                return self._send(200, {"ok": True, "engine": "local"}, origin)
            if action == "agent":
                return self._send(200, self.handle_agent(fields), origin)
            if action == "transcribe":
                return self._send(200, self.handle_transcribe(fields, files), origin)
            return self._send(400, {"ok": False, "error": "Неизвестное действие"}, origin)
        except OllamaError as e:
            return self._send(502, {"ok": False, "error": str(e)}, origin)
        except Exception as e:
            logging.exception("Ошибка обработки")
            return self._send(500, {"ok": False, "error": "Ошибка локального сервера: %s" % e}, origin)

    def handle_agent(self, f):
        transcript = f.get("transcript", "").strip()
        if not transcript:
            return {"ok": False, "error": "Нет текста для обработки"}
        agent = self.agent.run(transcript, f.get("chapter_title", "").strip(), f.get("dictionary", "").strip(),
                               f.get("clarifying_question", ""), f.get("clarifying_answer", ""))
        return {"ok": True, "agent": agent}

    def handle_transcribe(self, f, files):
        audio = files.get("audio")
        if not audio or not audio["data"]:
            return {"ok": False, "error": "Нет аудио"}
        suffix = os.path.splitext(audio["filename"] or "")[1] or ".webm"
        fd, path = tempfile.mkstemp(prefix="vosp-", suffix=suffix[:8])
        try:
            with os.fdopen(fd, "wb") as out:
                out.write(audio["data"])
            prompt = whisper_prompt(f.get("dictionary", ""), f.get("context", ""), f.get("chapter_title", "").strip())
            started = time.time()
            res = self.transcriber.transcribe(path, f.get("language", "ru"), prompt, f.get("quality", "max"), f.get("dictionary", ""))
            logging.info("Распознано %.1f с аудио за %.1f с (%s)", res["duration"], time.time() - started, res.get("engine"))
        finally:
            try:
                os.remove(path)
            except OSError:
                pass
        text = res["text"]
        if not text:
            return {"ok": False, "error": "В записи не найдено речи"}
        result = {"ok": True, "text": text, "raw_primary": text, "engine": "local", "asr_engine": res.get("engine", ""), "audio_seconds": res["duration"], "agent": None}
        try:
            result["agent"] = self.agent.run(text, f.get("chapter_title", "").strip(), f.get("dictionary", "").strip())
        except OllamaError as e:
            result["agent_error"] = str(e)
        return result


def make_server(cfg, transcriber=None, agent=None):
    Handler.cfg = cfg
    Handler.transcriber = transcriber or Transcriber(cfg)
    Handler.agent = agent or Agent(cfg)
    srv = ThreadingHTTPServer((cfg["host"], int(cfg["port"])), Handler)
    srv.daemon_threads = True
    return srv


def set_password_interactive():
    cfg = load_config()
    print("Пароль для раздела «Воспоминания» на этом компьютере. Можно тот же, что был раньше.")
    while True:
        a = getpass.getpass("Пароль: ")
        if len(a) < 4:
            print("Слишком короткий, нужно не меньше 4 знаков.")
            continue
        try:
            a.encode("latin-1")
        except UnicodeEncodeError:
            print("Браузер не передаёт русские буквы в пароле. Используйте латиницу, цифры и знаки.")
            continue
        if getpass.getpass("Ещё раз: ") != a:
            print("Пароли не совпали, попробуйте снова.")
            continue
        break
    cfg["password_hash"] = hash_password(a)
    save_config(cfg)
    print("Пароль сохранён в", config_path())


def main():
    p = argparse.ArgumentParser(description="Локальный сервер распознавания «Воспоминания»")
    p.add_argument("--set-password", action="store_true", help="задать пароль и выйти")
    p.add_argument("--preload", action="store_true", help="сразу загрузить модель распознавания")
    p.add_argument("--download-models", action="store_true", help="скачать и проверить модель GigaAM и выйти")
    p.add_argument("--set", action="append", default=[], metavar="КЛЮЧ=ЗНАЧЕНИЕ", help="изменить настройку и выйти")
    p.add_argument("--show-config", action="store_true", help="показать настройки без пароля и выйти")
    args = p.parse_args()
    os.makedirs(app_dir(), exist_ok=True)
    if sys.stdout is None or sys.stderr is None:
        # Запуск без окна (pythonw): вывод библиотек, например индикатор загрузки модели, уходит в файл, а не в пустоту.
        sink = open(os.path.join(app_dir(), "console.log"), "a", encoding="utf-8", buffering=1)
        sys.stdout = sys.stdout or sink
        sys.stderr = sys.stderr or sink
    handlers = [logging.FileHandler(os.path.join(app_dir(), "server.log"), encoding="utf-8")]
    if sys.stdout and sys.stdout.isatty():
        handlers.append(logging.StreamHandler())
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s", handlers=handlers)
    if args.set_password:
        return set_password_interactive()
    if args.download_models:
        cfg = load_config()
        try:
            eng = GigaAMEngine(cfg)
            eng._load()
            import numpy as np
            from faster_whisper.vad import VadOptions, get_speech_timestamps
            get_speech_timestamps(np.zeros(SR, dtype="float32"), VadOptions())
            eng._clips["<test>"] = np.zeros(SR, dtype="float32")
            eng.model.transcribe("<test>")
            print("GIGAAM_OK", eng.model_name)
            return 0
        except Exception as e:
            print("GIGAAM_FAIL", e)
            return 3
    if args.set or args.show_config:
        cfg = load_config()
        for item in args.set:
            key, _, value = item.partition("=")
            if key not in DEFAULT_CONFIG or key == "password_hash":
                print("Неизвестная настройка:", key)
                return 2
            try:
                cfg[key] = json.loads(value)
            except ValueError:
                cfg[key] = value
        if args.set:
            save_config(cfg)
        shown = {k: v for k, v in cfg.items() if k != "password_hash"}
        shown["password_set"] = bool(cfg.get("password_hash"))
        print(json.dumps(shown, ensure_ascii=False, indent=2))
        return 0
    cfg = load_config()
    if not os.path.exists(config_path()):
        save_config(cfg)
    try:
        srv = make_server(cfg)
    except OSError as e:
        logging.error("Порт %s занят: %s. Возможно, сервер уже запущен.", cfg["port"], e)
        return 1
    logging.info("Сервер «Воспоминания» %s слушает http://%s:%s, Whisper %s, Ollama %s", VERSION, cfg["host"], cfg["port"], cfg["whisper_model"], cfg["ollama_model"])
    if args.preload:
        def preload():
            try:
                with Handler.transcriber.lock:
                    Handler.transcriber._load()
                logging.info("Распознавание готово: %s", Handler.transcriber.model_name)
            except Exception as e:
                logging.error("Предзагрузка Whisper не удалась: %s", e)
        threading.Thread(target=preload, daemon=True).start()
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    sys.exit(main() or 0)
