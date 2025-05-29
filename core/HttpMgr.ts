interface RequestOptions {
    timeout?: number; // 超时时间(ms)
    retries?: number; // 重试次数
    retryDelay?: number; // 重试延迟(ms)
}

// 存储所有进行中的请求的 AbortController
const activeControllers = new Map<string, Map<string, Set<AbortController>>>();

/**
 * 中断指定URL的请求
 * @param url 要中断的请求URL
 * @param method 要中断的请求方法，不指定则中断所有方法的请求
 */
export function abortRequest(url: string, method?: string) {
    const methodControllers = activeControllers.get(url);
    if (methodControllers) {
        if (method) {
            // 中断指定方法的请求
            const controllers = methodControllers.get(method);
            if (controllers) {
                controllers.forEach((controller) => controller.abort());
                controllers.clear();
                methodControllers.delete(method);
            }
        } else {
            // 中断所有方法的请求
            methodControllers.forEach((controllers) => {
                controllers.forEach((controller) => controller.abort());
                controllers.clear();
            });
            methodControllers.clear();
        }
        if (methodControllers.size === 0) {
            activeControllers.delete(url);
        }
    }
}

/**
 * 中断所有进行中的请求
 */
export function abortAllRequests() {
    activeControllers.forEach((methodControllers) => {
        methodControllers.forEach((controllers) => {
            controllers.forEach((controller) => controller.abort());
            controllers.clear();
        });
        methodControllers.clear();
    });
    activeControllers.clear();
}

/**
 * 基础请求方法
 */
async function request(url: string, options: RequestOptions = {}, fetchOptions: RequestInit = {}) {
    const { timeout = 5000, retries = 3, retryDelay = 1000 } = options;
    let lastError: Error;
    let controller: AbortController;
    let timeoutId: number;
    let startTime = Date.now();
    const method = fetchOptions.method || "GET";

    // 确保URL和method对应的Set存在
    if (!activeControllers.has(url)) {
        activeControllers.set(url, new Map());
    }
    const methodControllers = activeControllers.get(url)!;
    if (!methodControllers.has(method)) {
        methodControllers.set(method, new Set());
    }
    const controllers = methodControllers.get(method)!;

    try {
        for (let i = 0; i <= retries; i++) {
            try {
                // 创建新的 controller
                controller = new AbortController();
                controllers.add(controller);

                // 计算剩余超时时间
                const remainingTimeout = Math.max(0, timeout - (Date.now() - startTime));
                if (remainingTimeout <= 0) {
                    throw new Error("Total request timeout exceeded");
                }

                timeoutId = setTimeout(() => {
                    controller.abort();
                    controllers.delete(controller);
                }, remainingTimeout);

                const response = await fetch(url, {
                    ...fetchOptions,
                    signal: controller.signal
                });

                // 清除定时器
                clearTimeout(timeoutId);
                controllers.delete(controller);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                // 检查响应类型
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    return await response.json();
                } else {
                    return await response.text();
                }
            } catch (error) {
                // 清除定时器
                clearTimeout(timeoutId);
                controllers.delete(controller);

                // 处理不同类型的错误
                if (error instanceof TypeError) {
                    // 网络错误
                    lastError = new Error("Network error: " + error.message);
                } else if (error instanceof SyntaxError) {
                    // JSON 解析错误
                    lastError = new Error("JSON parse error: " + error.message);
                } else if (error.name === "AbortError") {
                    // 超时错误
                    lastError = new Error("Request timeout");
                } else {
                    lastError = error;
                }

                // 检查是否超过总超时时间
                if (Date.now() - startTime >= timeout) {
                    throw new Error("Total request timeout exceeded");
                }

                if (i < retries) {
                    console.log(`Retrying... (${i + 1}/${retries})`);
                    await new Promise((resolve) => setTimeout(resolve, retryDelay));
                }
            }
        }
    } catch (error) {
        // 确保在最外层也清理资源
        clearTimeout(timeoutId);
        if (controller) {
            controllers.delete(controller);
        }
        if (controllers.size === 0) {
            methodControllers.delete(method);
        }
        if (methodControllers.size === 0) {
            activeControllers.delete(url);
        }
        throw error;
    } finally {
        // 清理资源
        clearTimeout(timeoutId);
        if (controller) {
            controllers.delete(controller);
        }
        if (controllers.size === 0) {
            methodControllers.delete(method);
        }
        if (methodControllers.size === 0) {
            activeControllers.delete(url);
        }
    }

    throw lastError;
}

/**
 * GET请求
 */
export async function get(url: string, options: RequestOptions = {}) {
    return request(url, options, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });
}

/**
 * POST请求
 */
export async function post(url: string, data: any, options: RequestOptions = {}) {
    return request(url, options, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });
}
