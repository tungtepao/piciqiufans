// .dev/mock/cache.js
var MockCache = class _MockCache {
  static port = 0;
  constructor() {}
  async put(reqOrUrl, response) {
    if (arguments.length < 2) {
      throw new TypeError(`Failed to execute 'put' on 'cache': 2 arguments required, but only ${arguments.length} present.`);
    }
    if (!reqOrUrl) {
      throw new TypeError("Failed to execute 'put' on 'cache': 2 arguments required, but only 0 present.");
    }
    if (!(response instanceof Response)) {
      throw new TypeError("Failed to execute 'put' on 'cache': Argument 2 is not of type Response.");
    }
    try {
      const body = await response.clone().text();
      const headers = {};
      response.headers.forEach((v, k) => headers[k] = v);
      const cacheControl = response.headers.get("Cache-Control") || "";
      const ttl = this.parseTTL(cacheControl);
      const key = this.normalizeKey(reqOrUrl);
      const fetchRes = await fetch(`http://localhost:${_MockCache.port}/mock_cache/put`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          key,
          response: {
            status: response.status,
            headers,
            body
          },
          ttl
        })
      });
      if (!fetchRes.ok) {
        const error = await fetchRes.json();
        throw new Error(error.error);
      }
      return void 0;
    } catch (err2) {
      throw new Error(`Cache put failed: ${err2.message}`);
    }
  }
  async get(reqOrUrl) {
    const key = this.normalizeKey(reqOrUrl);
    const fetchRes = await fetch(`http://localhost:${_MockCache.port}/mock_cache/get`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        key
      })
    });
    if (!fetchRes.ok) {
      const error = await fetchRes.json();
      throw new Error(error.error);
    }
    const res = await fetchRes.json();
    if (res && res.success) {
      return new Response(res.data.response.body, {
        status: res.data.response.status,
        headers: new Headers(res.data.response.headers)
      });
    } else {
      return void 0;
    }
  }
  async delete(reqOrUrl) {
    const key = this.normalizeKey(reqOrUrl);
    const fetchRes = await fetch(`http://localhost:${_MockCache.port}/mock_cache/delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        key
      })
    });
    if (!fetchRes.ok) {
      const error = await fetchRes.json();
      throw new Error(error.error);
    }
    const res = await fetchRes.json();
    return res.success;
  }
  normalizeKey(input) {
    const url = input instanceof Request ? input.url : input;
    return url.replace(/^https:/i, "http:");
  }
  parseTTL(cacheControl) {
    const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
    return maxAgeMatch ? parseInt(maxAgeMatch[1]) : 3600;
  }
};
var mock_cache = new MockCache();
globalThis.mockCache = mock_cache;
var cache_default = MockCache;

// .dev/mock/kv.js
var mockKV = class _EdgeKV {
  static port = 0;
  JS_RESPONSE_BUFFER_THRESHOLD = 64 * 1024;
  constructor(options) {
    if (!options || !options.namespace && !options.namespaceId) {
      throw new TypeError("The argument to `EdgeKV` must be an object with a `namespace` or `namespaceId` field");
    }
    this.namespace = options.namespace;
  }
  async put(key, value) {
    if (arguments.length < 2) {
      throw new TypeError(`Failed to execute 'put' on 'EdgeKV': 2 arguments required, but only ${arguments.length} present.`);
    }
    if (!key) {
      throw new TypeError("Failed to execute 'put' on 'EdgeKV': 2 arguments required, but only 0 present.");
    }
    if (typeof key !== "string") {
      throw new TypeError(`Failed to execute 'put' on 'EdgeKV': 1th argument must be a string.`);
    }
    try {
      let body;
      if (typeof value === "string") {
        if (value.length > this.JS_RESPONSE_BUFFER_THRESHOLD) {
          const encoder = new TextEncoder();
          const encodedValue = encoder.encode(value);
          body = new ReadableStream({
            start(controller) {
              controller.enqueue(encodedValue);
              controller.close();
            }
          });
        } else {
          body = value;
        }
      } else if (value instanceof Response) {
        const resBody = await value.clone().text();
        const headers = {};
        value.headers.forEach((v, k) => headers[k] = v);
        body = JSON.stringify({
          body: resBody,
          headers,
          status: value.status
        });
      } else if (value instanceof ReadableStream || value instanceof ArrayBuffer || ArrayBuffer.isView(value)) {
        body = value;
      } else {
        throw new TypeError(`Failed to execute 'put' on 'EdgeKV': 2nd argument should be one of string/Response/ArrayBuffer/ArrayBufferView/ReadableStream`);
      }
      const fetchRes = await fetch(`http://localhost:${_EdgeKV.port}/mock_kv/put?key=${key}&namespace=${this.namespace}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body
      });
      if (!fetchRes.ok) {
        const error = await fetchRes.json();
        throw new Error(error.error);
      }
      return void 0;
    } catch (err2) {
      throw new Error(`Cache put failed: ${err2.message}`);
    }
  }
  async get(key, options) {
    const isTypeValid = ty => typeof ty === "string" && (ty === "text" || ty === "json" || ty === "stream" || ty === "arrayBuffer");
    if (options && !isTypeValid(options?.type)) {
      throw new TypeError("EdgeKV.get: 2nd optional argument must be an object with a 'type' field. The 'type' field specifies the format of the return value and must be a string of 'text', 'json', 'stream' or 'arrayBuffer'");
    }
    const type = options?.type || "text";
    const fetchRes = await fetch(`http://localhost:${_EdgeKV.port}/mock_kv/get?key=${key}&namespace=${this.namespace}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    });
    let isGetFailed = false;
    fetchRes.headers.forEach((v, k) => {
      if (k === "kv-get-empty") {
        isGetFailed = true;
      }
    });
    if (isGetFailed) {
      return void 0;
    }
    switch (type) {
      case "text":
        return fetchRes.text();
      case "json":
        try {
          const value2 = await fetchRes.text();
          const userObject = JSON.parse(value2);
          return userObject;
        } catch (error) {
          throw new TypeError(`Invalid JSON: ${err.message}`);
        }
      case "arrayBuffer":
        try {
          const buffer = await fetchRes.arrayBuffer();
          return buffer;
        } catch (error) {
          throw new TypeError(`Failed to read the response body into an ArrayBuffer: ${error.message}`);
        }
      case "stream":
        const value = await fetchRes.text();
        return new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode(value));
            controller.close();
          }
        });
      default:
        throw new Error(`Unsupported type: ${type}`);
    }
  }
  async delete(key) {
    const fetchRes = await fetch(`http://localhost:${_EdgeKV.port}/mock_kv/delete?key=${key}&namespace=${this.namespace}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    });
    if (!fetchRes.ok) {
      const error = await fetchRes.json();
      throw new Error(error.error);
    }
    const res = await fetchRes.json();
    return res.success;
  }
};
globalThis.mockKV = mockKV;
var kv_default = mockKV;

// src/index.js
async function allimage(request) {
  return fetch(request, {
    // 图像处理指令数组（支持多步骤操作）
    image: [{
      action: "resize",
      // 动作类型：调整尺寸
      option: {
        mode: "custom",
        // 模式：自定义参数（非cover/contain等预设模式）
        param: {
          p: 90,
          // 图片质量（0-100，值越大质量越高）
          fw: 800
          // 固定宽度（单位：像素）
          // fh: 200      // 可选：固定高度（若设置会覆盖自动计算）
        }
      }
    }, {
      action: "format",
      // 动作类型：格式转换
      option: {
        param: {
          f: "webp"
          // 目标格式参数（png/jpeg/webp等）
        }
      }
    }]
  });
}
async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  console.log("url path:", path);
  return await allimage(request);
}
var src_default = {
  async fetch(request) {
    return handleRequest(request);
  }
};

// .dev/devEntry-1768395290182.js
cache_default.port = 18080;
kv_default.port = 18080;
var devEntry_1768395290182_default = src_default;
export { devEntry_1768395290182_default as default };