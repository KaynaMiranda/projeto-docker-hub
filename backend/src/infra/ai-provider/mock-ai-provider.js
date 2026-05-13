const STOPWORDS = new Set([
  "a",
  "ao",
  "aos",
  "as",
  "com",
  "como",
  "da",
  "das",
  "de",
  "do",
  "dos",
  "e",
  "em",
  "entre",
  "essa",
  "esse",
  "esta",
  "este",
  "isso",
  "mais",
  "na",
  "nas",
  "no",
  "nos",
  "o",
  "os",
  "ou",
  "para",
  "por",
  "que",
  "se",
  "sem",
  "ser",
  "sobre",
  "sua",
  "suas",
  "seu",
  "seus",
  "um",
  "uma",
  "uns",
  "umas",
]);

function splitSentences(content) {
  return content
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function extractKeywords(content, limit = 5) {
  const frequencies = new Map();
  const words = content
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .match(/[a-z0-9]{3,}/g);

  if (!words) {
    return [];
  }

  for (const word of words) {
    if (STOPWORDS.has(word)) {
      continue;
    }

    frequencies.set(word, (frequencies.get(word) || 0) + 1);
  }

  return [...frequencies.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([word]) => word);
}

function buildSummary(sentences) {
  return sentences.slice(0, 3).join(" ");
}

function buildTasks(sentences, keywords) {
  const baseQuestions = keywords.length > 0 ? keywords : ["tema", "objetivo", "contexto"];

  const questions = baseQuestions.slice(0, 4).map((keyword, index) => {
    const answerSentence = sentences[index] || sentences[0] || "O texto apresenta este ponto de forma geral.";

    return `${index + 1}. Pergunta: Explique a relevancia de "${keyword}" no documento.\nResposta esperada: ${answerSentence}`;
  });

  return [
    "Enunciado de tarefas",
    "",
    "Utilize o texto analisado para responder as questoes abaixo.",
    "",
    ...questions,
  ].join("\n");
}

function buildUniversityWork(sentences, keywords, fileName) {
  const suggestedTitle =
    keywords.length > 0
      ? `Analise de ${keywords.slice(0, 2).join(" e ")} a partir do documento ${fileName}`
      : `Estudo baseado no documento ${fileName}`;
  const introduction = sentences[0] || "O documento apresenta um tema relevante para estudo.";
  const developmentTopics =
    keywords.length > 0
      ? keywords.map((keyword, index) => `${index + 1}. ${keyword}`).join("\n")
      : "1. Contextualizacao\n2. Desenvolvimento\n3. Conclusao";

  return [
    "Enunciado de trabalho universitario",
    "",
    `Titulo sugerido: ${suggestedTitle}`,
    "",
    `Introducao proposta: ${introduction}`,
    "",
    "Objetivos:",
    "- Compreender o conteudo central do documento.",
    "- Relacionar os principais conceitos apresentados.",
    "- Produzir uma analise critica com base no texto.",
    "",
    "Estrutura sugerida:",
    developmentTopics,
    "",
    "Entrega esperada: texto dissertativo com introducao, desenvolvimento e conclusao.",
  ].join("\n");
}

function getWordCount(content) {
  return content.trim().split(/\s+/).filter(Boolean).length;
}

function createMockAIProvider() {
  return {
    promptVersion: "mock-v1",

    async generate({ type, content, file }) {
      const sentences = splitSentences(content);
      const keywords = extractKeywords(content);
      const metadataJson = {
        provider: "mock",
        generatedAt: new Date().toISOString(),
        keywords,
        wordCount: getWordCount(content),
      };

      if (type === "SUMMARY") {
        return {
          promptVersion: "mock-v1",
          resultText: buildSummary(sentences),
          metadataJson,
        };
      }

      if (type === "TASKS") {
        return {
          promptVersion: "mock-v1",
          resultText: buildTasks(sentences, keywords),
          metadataJson,
        };
      }

      return {
        promptVersion: "mock-v1",
        resultText: buildUniversityWork(sentences, keywords, file.originalName),
        metadataJson,
      };
    },
  };
}

export { createMockAIProvider };
