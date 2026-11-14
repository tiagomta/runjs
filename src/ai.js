export default function () {
  let config;

  return {
    setup: ({ baseURL, model, apiKey } = {}) => {
      if (typeof baseURL !== "string" || !baseURL.trim())
        throw new Error("AI baseURL is required");
      if (typeof model !== "string" || !model.trim())
        throw new Error("AI model is required");
      if (apiKey !== undefined && typeof apiKey !== "string")
        throw new Error("AI apiKey must be a string");

      config = {
        endpoint: `${baseURL.replace(/\/+$/, "")}/chat/completions`,
        model,
        apiKey,
      };
    },
    generate: async (prompt) => {
      if (!config) throw new Error("Call ai.setup before generating text");
      if (typeof prompt !== "string" || !prompt.trim())
        throw new Error("AI prompt must be a non-empty string");

      const { endpoint, model, apiKey } = config;
      const headers = { "Content-Type": "application/json" };
      if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          stream: false,
        }),
        signal: AbortSignal.timeout(60000),
      });
      if (!response.ok)
        throw new Error(`AI API error: HTTP ${response.status}`);

      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content;
      if (typeof text !== "string")
        throw new Error("AI response did not contain generated text");
      return text;
    },
  };
}
