/**
 * WakeLockSentinel TS 接口定义
 */
interface WakeLockSentinel extends EventTarget {
    released: boolean;
    release: () => Promise<void>;
}

export class WebKeepAwake {
    private wakeLock: WakeLockSentinel | null = null;
    private videoElement: HTMLVideoElement | null = null;
    private isRequesting: boolean = false;
    private releaseHandler: (() => void) | null = null;

    private static _instance: WebKeepAwake = null;

    public static init() {
        if (this._instance) return;
        this._instance = new WebKeepAwake();
        this._instance._init();
    }

    public static destroy() {
        if (this._instance) {
            this._instance._cleanup();
            this._instance = null;
        }
    }

    private _init() {
        this.tryEnableWakeLock();

        // 页面切后台 → video 会暂停 / wakeLock 可能被释放
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") {
                this.tryEnableWakeLock();
            }
        });
    }

    /**
     * 优先尝试使用 Screen Wake Lock API
     * 失败后自动使用视频保持常亮
     */
    private async tryEnableWakeLock() {
        if (this.isRequesting) return;
        this.isRequesting = true;

        // 新浏览器支持 navigator.wakeLock
        const nav: any = navigator;

        if (nav.wakeLock) {
            try {
                // 如果已有 wakeLock 且未释放,先释放
                if (this.wakeLock && !this.wakeLock.released) {
                    await this.wakeLock.release();
                    this._removeReleaseListener();
                }

                // 申请锁
                this.wakeLock = await nav.wakeLock.request("screen");
                console.log("[KeepAwake] WakeLock enabled");

                // 移除旧监听器,添加新监听器
                this._removeReleaseListener();
                this.releaseHandler = () => {
                    console.warn("[KeepAwake] WakeLock was released by system");
                    this.wakeLock = null;
                    this.releaseHandler = null;
                    this.isRequesting = false;
                    this.tryEnableWakeLock(); // 自动重新申请
                };
                this.wakeLock.addEventListener("release", this.releaseHandler);

                this.isRequesting = false;
                return; // 使用了原生API,直接结束
            } catch (err) {
                console.warn("[KeepAwake] WakeLock API failed, fallback to video.", err);
            }
        }

        // 不支持 WakeLock → 使用 video hack
        this.isRequesting = false;
        this.enableVideoFallback();
    }

    /**
     * iOS / 微信浏览器兼容方案：播放隐藏视频保持亮屏
     */
    private enableVideoFallback() {
        if (this.videoElement) {
            // 检查视频是否正在播放
            if (!this.videoElement.paused) return;
            this.videoElement.play().catch((err) => {
                console.warn("[KeepAwake] Video resume failed:", err);
            });
            return;
        }

        const video = document.createElement("video");
        video.setAttribute("playsinline", "");
        video.setAttribute("muted", "true");
        video.setAttribute("loop", "");
        video.style.opacity = "0";
        video.style.position = "absolute";
        video.style.width = "1px";
        video.style.height = "1px";
        video.style.pointerEvents = "none";

        // 最小黑点视频,兼容全 iOS
        video.src =
            "data:video/mp4;base64,AAAAHGZ0eXBtcDQyAAAAAG1wNDFtcDQxaXNvbWF2YzEAAAAIZnJlZQAAAVxtZGF0AAAAFgAAAAEAAQABAAAAAAABAAAAAQAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAA=";

        document.body.appendChild(video);
        this.videoElement = video;

        video.play().catch((err) => {
            console.warn("[KeepAwake] Video fallback failed:", err);
        });

        console.log("[KeepAwake] Video fallback active");
    }

    private _removeReleaseListener() {
        if (this.wakeLock && this.releaseHandler) {
            this.wakeLock.removeEventListener("release", this.releaseHandler);
            this.releaseHandler = null;
        }
    }

    private _cleanup() {
        // 释放 WakeLock
        if (this.wakeLock && !this.wakeLock.released) {
            this.wakeLock.release().catch((err) => {
                console.warn("[KeepAwake] Failed to release wakeLock:", err);
            });
        }
        this._removeReleaseListener();
        this.wakeLock = null;

        // 移除 video 元素
        if (this.videoElement) {
            this.videoElement.pause();
            this.videoElement.remove();
            this.videoElement = null;
        }
    }
}
