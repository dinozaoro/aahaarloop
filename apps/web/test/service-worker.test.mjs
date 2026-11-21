import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const swPath = fileURLToPath(new URL("../public/sw.js", import.meta.url));

function key(request) {
  return typeof request === "string" ? request : request.url;
}

function loadWorker() {
  const handlers = new Map();
  const messages = [];
  const cacheStore = new Map();
  const deleted = [];

  globalThis.self = {
    location: { origin: "http://localhost:3000" },
    addEventListener: (type, fn) => handlers.set(type, fn),
    skipWaiting: () => handlers.set("skipped", () => true),
    clients: {
      claim: async () => {},
      matchAll: async () => [
        { postMessage: (message) => messages.push(message) },
      ],
    },
  };

  globalThis.caches = {
    async open(name) {
      if (!cacheStore.has(name)) {
        cacheStore.set(name, new Map());
      }
      const entries = cacheStore.get(name);
      return {
        async addAll(urls) {
          for (const url of urls) {
            entries.set(url, new Response("shell"));
          }
        },
        async match(request) {
          return entries.get(key(request)) ?? null;
        },
        async put(request, response) {
          entries.set(key(request), response);
        },
      };
    },
    async keys() {
      return [...cacheStore.keys()];
    },
    async delete(name) {
      deleted.push(name);
      return cacheStore.delete(name);
    },
  };

  delete require.cache[require.resolve(swPath)];
  require(swPath);
  return {
    handlers,
    messages,
    cacheStore,
    deleted,
    cache: async (name = "aahaarloop-v1") => cacheStore.get(name),
    openCache: async (name = "aahaarloop-v1") => {
      await globalThis.caches.open(name);
      return cacheStore.get(name);
    },
  };
}

async function runLifecycle(worker, type) {
  let pending;
  await worker.handlers.get(type)({
    waitUntil: (task) => {
      pending = task;
    },
  });
  await pending;
}

function event(request, overrides = {}) {
  let response;
  return {
    request,
    respondWith(value) {
      response = value;
    },
    waitUntil() {},
    result: () => response,
    ...overrides,
  };
}

test("install precaches the shell and announces a new version", async () => {
  const worker = loadWorker();
  await runLifecycle(worker, "install");
  const entries = await worker.cache();
  assert.ok(entries.has("/"));
  assert.ok(entries.has("/offline.html"));
  assert.ok(entries.has("/manifest.webmanifest"));
  assert.equal(worker.messages.length, 1);
  assert.equal(worker.messages[0].type, "NEW_VERSION_AVAILABLE");
});

test("activate removes caches from previous versions", async () => {
  const worker = loadWorker();
  worker.cacheStore.set("aahaarloop-v0", new Map());
  await runLifecycle(worker, "activate");
  assert.deepEqual(worker.deleted, ["aahaarloop-v0"]);
});

test("offline navigation falls back to the cached shell", async () => {
  const worker = loadWorker();
  await runLifecycle(worker, "install");
  globalThis.fetch = async () => {
    throw new Error("offline");
  };
  worker.messages.length = 0;

  const navigation = event({
    url: "http://localhost:3000/dashboard",
    method: "GET",
    mode: "navigate",
  });
  worker.handlers.get("fetch")(navigation);
  const response = await navigation.result();
  assert.equal(await response.text(), "shell");
  assert.deepEqual(worker.messages, [
    { type: "STALE_DATA", url: "/dashboard" },
  ]);
});

test("API reads are served stale from cache while the network refreshes", async () => {
  const worker = loadWorker();
  const entries = await worker.openCache();
  entries.set("http://localhost:3000/api/donations", new Response("cached"));
  globalThis.fetch = async () => new Response("fresh");

  const request = event({
    url: "http://localhost:3000/api/donations",
    method: "GET",
    mode: "cors",
  });
  worker.handlers.get("fetch")(request);
  const response = await request.result();
  assert.equal(await response.text(), "cached");
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(
    await (await entries.get("http://localhost:3000/api/donations")).text(),
    "fresh",
  );
  assert.ok(
    worker.messages.some(
      (message) =>
        message.type === "STALE_DATA" && message.url === "/api/donations",
    ),
  );
});

test("static assets are cache-first and fetched only once", async () => {
  const worker = loadWorker();
  let fetches = 0;
  globalThis.fetch = async () => {
    fetches += 1;
    return new Response("asset");
  };
  const url = "http://localhost:3000/_next/static/chunk.js";

  const first = event({ url, method: "GET", mode: "no-cors" });
  worker.handlers.get("fetch")(first);
  assert.equal(await (await first.result()).text(), "asset");

  const second = event({ url, method: "GET", mode: "no-cors" });
  worker.handlers.get("fetch")(second);
  assert.equal(await (await second.result()).text(), "asset");
  assert.equal(fetches, 1);
});
