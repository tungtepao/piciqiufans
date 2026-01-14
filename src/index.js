// 将图片转换为PNG格式
async function imageFormat(request) {
    return fetch(request, {
        // 图像处理指令数组（支持多步骤操作）
        image: [
            {
                action: 'format',       // 动作类型：格式转换
                option: {
                    param: {
                        f: 'png',       // 目标格式参数（png/jpeg/webp等）
                    },
                },
            },
        ],
    });
}

// 使用自定义缩放模式，固定宽度为200px，高度按比例自动计算
async function imageResize(request) {
    return fetch(request, {
        image: [
            {
                action: 'resize',       // 动作类型：调整尺寸
                option: {
                    mode: 'custom',     // 模式：自定义参数（非cover/contain等预设模式）
                    param: {
                        p: 90,          // 图片质量（0-100，值越大质量越高）
                        fw: 200,        // 固定宽度（单位：像素）
                        // fh: 200      // 可选：固定高度（若设置会覆盖自动计算）
                    },
                },
            },
        ],
    });
}

// 旋转图片180度
async function imageRotate(request) {
    return fetch(request, {
        image: [
            {
                action: 'rotate',       // 动作类型：旋转
                option: {
                    mode: 'custom',     // 模式：自定义参数
                    param: {
                        a: 180,         // 旋转角度（0-360，顺时针方向）
                    },
                },
            },
        ],
    });
}

async function allimage(request){
 return fetch(request, {
        // 图像处理指令数组（支持多步骤操作）
        image: [
             {
                action: 'resize',       // 动作类型：调整尺寸
                option: {
                    mode: 'custom',     // 模式：自定义参数（非cover/contain等预设模式）
                    param: {
                        p: 90,          // 图片质量（0-100，值越大质量越高）
                        fw: 800,        // 固定宽度（单位：像素）
                        // fh: 200      // 可选：固定高度（若设置会覆盖自动计算）
                    },
                },
            },
            {
                action: 'format',       // 动作类型：格式转换
                option: {
                    param: {
                        f: 'jpeg',       // 目标格式参数（png/jpeg/webp等）
                    },
                },
            },
        ],
    });
}

async function handleRequest(request) {
	const url = new URL(request.url);
	const path = url.pathname;
    let newPath = path.replace('/test', '');
    console.alert("url path:", path,'newPath=',newPath);

   // url.pathname = newPath;
  //  let newRequest = new Request(url, request);
    url.pathname=newPath;
    return await allimage(new Request(url,request));
  //  return await allimage(new Request("https://pic.iqiu.fans/tx.png",request));

    // 根据路径选择处理逻辑
 //   if (path === PATH1) {              // 匹配格式转换路径
  //      return await imageFormat(request);
  //  } else if (path === PATH2) {       // 匹配缩放路径
  //      return await imageResize(request);
 //   } else if (path === PATH3) {       // 匹配旋转路径
 //       return await imageRotate(request);
 //   }

	// 无匹配路径时返回404
//	return new Response('Not Found', { status: 404 });
}

export default {
	async fetch(request) {
		return handleRequest(request);
	},
};