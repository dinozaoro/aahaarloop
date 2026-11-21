import assert from "node:assert/strict";
import test from "node:test";

const { chatCompletion, getGatewayConfig, listGatewayModels } =
  await import("../src/lib/ai/gateway.ts");

const BASE = "https://branch-api.ai.example.neon.tech";
const TOKEN = "nt_live_test";

function withEnv(values, fn) {
  const saved = {};
  for (const key of ["NEON_AI_GATEWAY_BASE_URL", "NEON_AI_GATEWAY_TOKEN"]) {
    saved[key] = process.env[key];
    if (values[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = values[key];
    }
  }
  try {
    return fn();
  } finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

test("gateway config requires both injected variables and strips trailing slashes", () => {
  withEnv({}, () => {
    assert.throws(() => getGatewayConfig(), /not configured/);
  });
  withEnv(
    { NEON_AI_GATEWAY_BASE_URL: `${BASE}/`, NEON_AI_GATEWAY_TOKEN: TOKEN },
    () => {
      assert.deepEqual(getGatewayConfig(), { baseUrl: BASE, token: TOKEN });
    },
  );
});

test("listGatewayModels calls the branch /v1/models endpoint with the bearer token", async () => {
  let called;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    called = { url, init };
    return new Response(
      JSON.stringify({ data: [{ id: "test-model", enabled: true }] }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  };
  try {
    const models = await withEnv(
      { NEON_AI_GATEWAY_BASE_URL: BASE, NEON_AI_GATEWAY_TOKEN: TOKEN },
      () => listGatewayModels(),
    );
    assert.equal(called.url, `${BASE}/v1/models`);
    assert.equal(called.init.headers.Authorization, `Bearer ${TOKEN}`);
    assert.deepEqual(models, [{ id: "test-model", enabled: true }]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("chatCompletion posts to the chat-completions dialect and returns the text", async () => {
  let body;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    assert.equal(url, `${BASE}/v1/chat/completions`);
    assert.equal(init.method, "POST");
    body = JSON.parse(init.body);
    return new Response(
      JSON.stringify({ choices: [{ message: { content: "bonjour" } }] }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  };
  try {
    const text = await withEnv(
      { NEON_AI_GATEWAY_BASE_URL: BASE, NEON_AI_GATEWAY_TOKEN: TOKEN },
      () => chatCompletion("test-model", [{ role: "user", content: "hi" }]),
    );
    assert.equal(text, "bonjour");
    assert.equal(body.model, "test-model");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
