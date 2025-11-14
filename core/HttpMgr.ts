interface RequestOptions {
    timeout?: number; // 超时时间(ms)
    retries?: number; // 重试次数
    retryDelay?: number; // 重试延迟(ms)
}

interface HttpResponse<T = unknown> {
    success: boolean;
    status: number | null;
    data: T | null;
    error: string | null;
}

class HttpError extends Error {
    public readonly status: number;

    constructor(status: number, message: string) {
        super(message);
        this.name = "HttpError";
        this.status = status;
    }
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
async function request<T = unknown>(
    url: string,
    options: RequestOptions = {},
    fetchOptions: RequestInit = {}
): Promise<HttpResponse<T>> {
    const { timeout = 5000, retries = 3, retryDelay = 1000 } = options;
    let lastError: Error | null = null;
    let lastStatus: number | null = null;
    let controller: AbortController | null = null;
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

    const cleanupController = () => {
        if (controller) {
            controllers.delete(controller);
        }
        if (controllers.size === 0) {
            methodControllers.delete(method);
        }
        if (methodControllers.size === 0) {
            activeControllers.delete(url);
        }
    };

    try {
        for (let i = 0; i <= retries; i++) {
            try {
                // 计算剩余超时时间
                const elapsedTime = Date.now() - startTime;
                const remainingTimeout = timeout - elapsedTime;

                if (remainingTimeout <= 0) {
                    lastError = new Error("Total request timeout exceeded");
                    return {
                        success: false,
                        status: lastStatus,
                        error: lastError.message,
                        data: null
                    };
                }

                // 创建新的 controller
                controller = new AbortController();
                controllers.add(controller);

                timeoutId = setTimeout(() => {
                    controller!.abort();
                }, remainingTimeout);

                const response = await fetch(url, {
                    ...fetchOptions,
                    signal: controller.signal
                });

                clearTimeout(timeoutId);
                lastStatus = response.status;

                if (!response.ok) {
                    throw new HttpError(response.status, `HTTP error: ${response.status}`);
                }

                // 检查响应类型
                const contentType = response.headers.get("content-type");
                let data: T | null = null;

                if (contentType && contentType.includes("application/json")) {
                    try {
                        data = (await response.json()) as T;
                    } catch (parseError) {
                        throw new Error(
                            "Invalid JSON response: " +
                                (parseError instanceof Error ? parseError.message : String(parseError))
                        );
                    }
                } else {
                    data = (await response.text()) as unknown as T;
                }

                cleanupController();
                return {
                    success: true,
                    status: lastStatus,
                    data,
                    error: null
                };
            } catch (error) {
                clearTimeout(timeoutId);

                // 处理不同类型的错误
                if (error instanceof HttpError) {
                    lastStatus = error.status;
                    lastError = error;
                } else if (error instanceof TypeError) {
                    // 网络错误
                    lastError = new Error("Network error: " + error.message);
                } else if (error instanceof SyntaxError) {
                    // JSON 解析错误
                    lastError = new Error("JSON parse error: " + error.message);
                } else if (error instanceof Error && error.name === "AbortError") {
                    // 超时错误
                    lastError = new Error("Request timeout");
                } else if (error instanceof Error) {
                    lastError = error;
                } else {
                    lastError = new Error(String(error));
                }

                // 检查是否超过总超时时间
                if (Date.now() - startTime >= timeout) {
                    cleanupController();
                    return {
                        success: false,
                        status: lastStatus,
                        error: "Total request timeout exceeded",
                        data: null
                    };
                }

                if (i < retries) {
                    console.log(`Retrying... (${i + 1}/${retries})`);
                    await new Promise((resolve) => setTimeout(resolve, retryDelay));
                }
            }
        }

        // 所有重试都失败后返回错误
        cleanupController();
        return {
            success: false,
            status: lastStatus,
            error: lastError?.message ?? "Unknown error",
            data: null
        };
    } catch (error) {
        // 最外层捕获异常
        clearTimeout(timeoutId);
        cleanupController();

        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            success: false,
            status: lastStatus,
            error: errorMessage,
            data: null
        };
    }
}

/**
 * GET请求
 */
export async function httpGet<T = unknown>(url: string, options: RequestOptions = {}): Promise<HttpResponse<T>> {
    return request<T>(url, options, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });
}

/**
 * POST请求
 */
export async function httpPost<T = unknown>(
    url: string,
    data: any,
    options: RequestOptions = {}
): Promise<HttpResponse<T>> {
    return request<T>(url, options, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });
}
