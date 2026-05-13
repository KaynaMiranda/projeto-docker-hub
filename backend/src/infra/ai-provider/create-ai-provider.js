import { createMockAIProvider } from "./mock-ai-provider.js";

function createAIProvider(providerName) {
  if (providerName === "mock") {
    return createMockAIProvider();
  }

  return createMockAIProvider();
}

export { createAIProvider };
