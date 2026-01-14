// src/index.js
async function allimage(request) {
  return fetch(request, {
    // 图像处理指令数组（支持多步骤操作）
    image: [
      {
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
      },
      {
        action: "format",
        // 动作类型：格式转换
        option: {
          param: {
            f: "jpeg"
            // 目标格式参数（png/jpeg/webp等）
          }
        }
      }
    ]
  });
}
async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  let newPath = path.replace("/test", "");
  console.alert("url path:", path, "newPath=", newPath);
  url.pathname = newPath;
  return await allimage(new Request("https://pic.iqiu.fans/tx.png", request));
}
var src_default = {
  async fetch(request) {
    return handleRequest(request);
  }
};
export {
  src_default as default
};
