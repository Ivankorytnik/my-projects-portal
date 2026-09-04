import { env, pipeline } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1";

env.allowLocalModels = false;
env.useBrowserCache = true;

let editorPromise = null;

function getEditor() {
  if (editorPromise) return editorPromise;
  const hasWebGpu = "gpu" in navigator;
  self.postMessage({ type: "status", message: "Загружаю локальный литературный редактор…" });
  editorPromise = pipeline("text-generation", "onnx-community/Qwen2.5-0.5B-Instruct", {
    device: hasWebGpu ? "webgpu" : "wasm",
    dtype: hasWebGpu ? "q4f16" : "q4",
    progress_callback: progress => {
      if (progress.status === "progress" && typeof progress.progress === "number") {
        self.postMessage({ type: "progress", progress: Math.round(progress.progress) });
      }
    },
  });
  return editorPromise;
}

function splitTranscript(text, maxLength = 3000) {
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
  const parts = [];
  let current = "";
  for (const sentence of sentences) {
    const next = current ? `${current} ${sentence.trim()}` : sentence.trim();
    if (next.length > maxLength && current) {
      parts.push(current);
      current = sentence.trim();
    } else current = next;
  }
  if (current) parts.push(current);
  return parts;
}

function responseText(result) {
  const generated = result?.[0]?.generated_text;
  if (Array.isArray(generated)) return String(generated.at(-1)?.content || "").trim();
  return String(generated || "").trim();
}

function extractTagged(text, tag) {
  const match = text.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match?.[1]?.trim() || "";
}

async function editFragment(editor, fragment, index, count, chapterTitle) {
  const first = index === 0;
  const messages = [
    { role: "system", content: "Ты бережный литературный редактор русских семейных мемуаров. Пиши от первого лица. Сохраняй имена, факты, места, даты, последовательность событий и смысл автора. Убирай слова-паразиты, случайные повторы и оговорки; исправляй грамматику; делай естественные предложения и абзацы. Ничего не выдумывай и не добавляй эмоций, диалогов или деталей, которых нет в исходнике." },
    { role: "user", content: `${first ? `Рабочее название: ${chapterTitle || "не указано"}.\n` : ""}Это фрагмент ${index + 1} из ${count}. Перепиши его литературно, не сокращая важные факты и не продолжая рассказ от себя. ${first ? "Верни строго: <ЗАГОЛОВОК>краткое название главы</ЗАГОЛОВОК><ТЕКСТ>литературный текст</ТЕКСТ>" : "Верни строго: <ТЕКСТ>литературный текст</ТЕКСТ>"}\n\nИсходная расшифровка:\n${fragment}` },
  ];
  const result = await editor(messages, {
    max_new_tokens: Math.min(1400, Math.max(450, Math.ceil(fragment.length * 0.46))),
    do_sample: false,
    repetition_penalty: 1.08,
  });
  const raw = responseText(result);
  return {
    title: first ? extractTagged(raw, "ЗАГОЛОВОК") : "",
    content: extractTagged(raw, "ТЕКСТ") || raw.replace(/<\/?(?:ЗАГОЛОВОК|ТЕКСТ)>/gi, "").trim(),
  };
}

self.addEventListener("message", async event => {
  if (event.data.type !== "edit") return;
  try {
    const editor = await getEditor();
    const transcript = String(event.data.transcript || "").trim();
    const fragments = splitTranscript(transcript);
    const texts = [];
    let title = "";
    for (let index = 0; index < fragments.length; index += 1) {
      self.postMessage({ type: "status", message: `Литературно оформляю: часть ${index + 1} из ${fragments.length}…` });
      const edited = await editFragment(editor, fragments[index], index, fragments.length, String(event.data.chapterTitle || ""));
      if (!title && edited.title) title = edited.title;
      if (edited.content) texts.push(edited.content);
    }
    const fallbackTitle = String(event.data.chapterTitle || "").trim() || transcript.split(/\s+/).slice(0, 7).join(" ").replace(/[.,!?;:]$/, "");
    self.postMessage({ type: "complete", title: title || fallbackTitle || "Новое воспоминание", content: texts.join("\n\n").trim() });
  } catch (error) {
    editorPromise = null;
    self.postMessage({ type: "error", message: error instanceof Error ? error.message : "Литературный редактор недоступен" });
  }
});
