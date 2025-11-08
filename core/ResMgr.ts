import {
    AnimationClip,
    Asset,
    assetManager,
    AssetManager,
    AudioClip,
    Font,
    JsonAsset,
    Prefab,
    sp,
    SpriteAtlas,
    SpriteFrame
} from "cc";
import { DEBUG } from "cc/env";

export namespace ResLoad {
    type BundleArgs = {
        bName: string;
        version?: string | null;
        isUseRemote?: boolean;
    };

    type ResArgs = {
        bName: string;
        resName: string;
        isCache?: boolean;
        version?: string | null;
        isUseRemote?: boolean;
    };

    type ResArgsT<T extends Asset> = ResArgs & {
        resType: new (...args: any[]) => T;
    };

    type ResArgsProgress<T extends Asset> = ResArgsT<T> & {
        onProgress?: (finish: number, total: number, item?: any) => void;
    };

    const _assetsMap = new Map<string, unknown[]>();
    const _assetMap = new Map<string, unknown>();

    /**
     * 使用远程资源版本号
     * @param url 资源地址 http/https://xxx.com/bundleName
     * @param version 版本号 (md5)
     */
    const _useRemoteBundleMap = new Map<string, { url: string; version: string; bName: string }>();
    export const setRemoteBundle = (urls: string | { url: string; version: string }[], version?: string) => {
        if (typeof urls === "object") {
            urls.forEach((item) => {
                const lastPathSegment = getLastPathSegment(item.url);
                if (!lastPathSegment) return;
                _useRemoteBundleMap.set(lastPathSegment, {
                    url: item.url,
                    version: item.version,
                    bName: lastPathSegment
                });
            });
        } else {
            const lastPathSegment = getLastPathSegment(urls);
            if (!lastPathSegment) return;
            _useRemoteBundleMap.set(lastPathSegment, { url: urls, version, bName: lastPathSegment });
        }
    };

    function getLastPathSegment(url: string): string {
        if (!/^https?:\/\//i.test(url)) return "";

        const { pathname } = new URL(url);
        return pathname.split("/").filter(Boolean).pop() ?? "";
    }

    /**
     *
     * @param args 当前bundle格式 只支持 http/https://xxx.com/bundleName 或 bundleName
     * @returns
     */
    const getBundle = (args: BundleArgs): Promise<AssetManager.Bundle> => {
        const remoteBundle = _useRemoteBundleMap.get(args.bName);
        let bName = remoteBundle?.url ?? args.bName;
        let version = remoteBundle?.version ?? args.version;
        let lastPathSegment = remoteBundle?.bName ?? args.bName;
        let isUseRemote = args.isUseRemote && !!(lastPathSegment && version);
        if (!isUseRemote) {
            bName = lastPathSegment;
            version = null;
        }

        let db = assetManager.getBundle(bName);
        if (db) {
            return Promise.resolve(db);
        }

        return Promise.resolve(
            new Promise<AssetManager.Bundle>((resolve, reject) => {
                assetManager.loadBundle(
                    bName,
                    !version ? null : { version },
                    (err: Error, data: AssetManager.Bundle) => {
                        if (err) {
                            if (DEBUG) {
                                console.warn(`bName=${bName} load error: ${err}`);
                            }
                            reject(null);
                        } else {
                            resolve(data);
                        }
                    }
                );
            })
        );
    };

    /**
     * 加载单个资源
     * @param bName 资源包名
     * @param resName 资源路径
     * @param resType 资源类型
     * @param isCache 是否缓存
     * @param version 版本号
     * @returns
     */
    export const res = <T extends Asset>(
        args: string | ResArgsT<T>,
        resName?: string,
        resType?: new (...args: any[]) => T,
        isCache: boolean = false,
        version: string | null = null
    ): Promise<T> => {
        let bName: string;
        let isUseRemote: boolean = true;
        if (typeof args === "object") {
            bName = args.bName;
            isUseRemote = args.isUseRemote ?? true;
            resName = args.resName;
            resType = args.resType;
            isCache = args.isCache ?? false;
            version = args.version ?? null;
        } else {
            bName = args;
            isUseRemote = true;
        }
        if (isCache) {
            const asset = _assetMap.get(`${bName}_${resName}_${version || ""}`) as T;
            if (asset) {
                return Promise.resolve(asset);
            }
        }

        return Promise.resolve(
            getBundle({ bName, version, isUseRemote }).then((bundle) => {
                return new Promise<T>((resolve, reject) => {
                    bundle.load(resName, resType, null, (err: Error, data: T) => {
                        if (err) {
                            if (DEBUG) {
                                console.warn(`bName=${bName} resName=${resName} res error: ${err}`);
                            }
                            reject(null);
                        } else {
                            if (isCache) {
                                _assetMap.set(`${bName}_${resName}_${version || ""}`, data);
                            }
                            resolve(data);
                        }
                    });
                });
            })
        );
    };

    export const clearCacheResT = <T extends Asset>(res: T) => {
        assetManager.releaseAsset(res);
    };

    export const dir = <T extends Asset>(
        args: string | ResArgsT<T>,
        resName?: string,
        onProgress?: Function,
        version: string | null = null
    ): Promise<T[]> => {
        let bName: string;
        let isUseRemote: boolean = true;
        if (typeof args === "object") {
            bName = args.bName;
            isUseRemote = args.isUseRemote ?? true;
            resName = args.resName;
            version = args.version ?? null;
        } else {
            bName = args;
            isUseRemote = true;
        }
        return Promise.resolve(
            getBundle({ bName, version, isUseRemote }).then((bundle) => {
                return new Promise<T[]>((resolve, reject) => {
                    bundle.loadDir(
                        resName,
                        (finish: number, total: number, item: any) => {
                            onProgress && onProgress(finish, total, item);
                        },
                        (err: Error, data: T[]) => {
                            if (err) {
                                if (DEBUG) {
                                    console.warn(`bName=${bName} resName=${resName} dir error: ${err}`);
                                }
                                reject(null);
                            } else {
                                resolve(data);
                            }
                        }
                    );
                });
            })
        );
    };

    /**
     * 加载目录资源
     * @param bName 资源包名
     * @param resName 资源路径
     * @param resType 资源类型
     * @param isCache 是否缓存
     * @param onProgress 加载进度
     * @param version 版本号
     * @returns
     */
    export function dirT<T extends Asset>(
        args: string | ResArgsProgress<T>,
        resName?: string,
        resType?: new (...args: any[]) => T,
        isCache: boolean = false,
        onProgress?: (finish: number, total: number, item?: any) => void,
        version: string | null = null
    ): Promise<T[]> {
        let bName: string;
        let isUseRemote: boolean = true;
        if (typeof args === "object") {
            bName = args.bName;
            isUseRemote = args.isUseRemote ?? true;
            resName = args.resName;
            resType = args.resType;
            isCache = args.isCache ?? false;
            version = args.version ?? null;
            onProgress = args.onProgress;
        } else {
            bName = args;
            isUseRemote = true;
        }

        if (isCache) {
            const assets = _assetsMap.get(`${bName}_${resName}_${version || ""}`) as T[];
            if (assets) {
                return Promise.resolve(assets);
            }
        }
        return Promise.resolve(
            getBundle({ bName, version, isUseRemote }).then((bundle) => {
                return new Promise<T[]>((resolve, reject) => {
                    bundle.loadDir(
                        resName,
                        resType,
                        (finish: number, total: number, item: any) => {
                            onProgress?.(finish, total, item);
                        },
                        (err: Error, data: T[]) => {
                            if (err) {
                                if (DEBUG) {
                                    console.warn(`bName=${bName} resName=${resName} dirT error: ${err}`);
                                }
                                reject(null);
                            } else {
                                if (isCache) {
                                    _assetsMap.set(`${bName}_${resName}_${version || ""}`, data);
                                }
                                resolve(data);
                            }
                        }
                    );
                });
            })
        );
    }

    export const atlas = (
        args: string | ResArgs,
        resName?: string,
        isCache: boolean = false,
        version: string | null = null
    ): Promise<SpriteAtlas> => {
        let bName: string;
        let isUseRemote: boolean = true;
        if (typeof args === "object") {
            bName = args.bName;
            isUseRemote = args.isUseRemote ?? true;
            resName = args.resName;
            isCache = args.isCache ?? false;
            version = args.version ?? null;
        } else {
            bName = args;
            isUseRemote = true;
        }
        return res({ bName, resName, resType: SpriteAtlas, isCache, version, isUseRemote });
    };

    export const spriteFrame = (
        args: string | ResArgs,
        resName?: string,
        isCache: boolean = false,
        version: string | null = null
    ): Promise<SpriteFrame> => {
        let bName: string;
        let isUseRemote: boolean = true;
        if (typeof args === "object") {
            bName = args.bName;
            isUseRemote = args.isUseRemote ?? true;
            resName = args.resName;
            isCache = args.isCache ?? false;
            version = args.version ?? null;
        } else {
            bName = args;
            isUseRemote = true;
        }
        if (!resName.endsWith("spriteFrame")) {
            resName = `${resName}/spriteFrame`;
        }
        return res({ bName, resName, resType: SpriteFrame, isCache, version, isUseRemote });
    };

    export const spineData = (
        args: string | ResArgs,
        resName?: string,
        isCache: boolean = false,
        version: string | null = null
    ): Promise<sp.SkeletonData> => {
        let bName: string;
        let isUseRemote: boolean = true;
        if (typeof args === "object") {
            bName = args.bName;
            isUseRemote = args.isUseRemote ?? true;
            resName = args.resName;
            isCache = args.isCache ?? false;
            version = args.version ?? null;
        } else {
            bName = args;
            isUseRemote = true;
        }
        return res({ bName, resName, resType: sp.SkeletonData, isCache, version, isUseRemote });
    };

    export const prefab = (
        args: string | ResArgs,
        resName?: string,
        isCache: boolean = false,
        version: string | null = null
    ): Promise<Prefab> => {
        let bName: string;
        let isUseRemote: boolean = true;
        if (typeof args === "object") {
            bName = args.bName;
            isUseRemote = args.isUseRemote ?? true;
            resName = args.resName;
            isCache = args.isCache ?? false;
            version = args.version ?? null;
        } else {
            bName = args;
            isUseRemote = true;
        }
        return res({ bName, resName, resType: Prefab, isCache, version, isUseRemote });
    };

    export const audioClip = (
        args: string | ResArgs,
        resName?: string,
        isCache: boolean = false,
        version: string | null = null
    ): Promise<AudioClip> => {
        let bName: string;
        let isUseRemote: boolean = true;
        if (typeof args === "object") {
            bName = args.bName;
            isUseRemote = args.isUseRemote ?? true;
            resName = args.resName;
            isCache = args.isCache ?? false;
            version = args.version ?? null;
        } else {
            bName = args;
            isUseRemote = true;
        }
        return res({ bName, resName, resType: AudioClip, isCache, version, isUseRemote });
    };

    export const animClip = (
        args: string | ResArgs,
        resName?: string,
        isCache: boolean = false,
        version: string | null = null
    ): Promise<AnimationClip> => {
        let bName: string;
        let isUseRemote: boolean = true;
        if (typeof args === "object") {
            bName = args.bName;
            isUseRemote = args.isUseRemote ?? true;
            resName = args.resName;
            isCache = args.isCache ?? false;
            version = args.version ?? null;
        } else {
            bName = args;
            isUseRemote = true;
        }
        return res({ bName, resName, resType: AnimationClip, isCache, version, isUseRemote });
    };

    export const json = (
        args: string | ResArgs,
        resName?: string,
        isCache: boolean = false,
        version: string | null = null
    ): Promise<JsonAsset> => {
        let bName: string;
        let isUseRemote: boolean = true;
        if (typeof args === "object") {
            bName = args.bName;
            isUseRemote = args.isUseRemote ?? true;
            resName = args.resName;
            isCache = args.isCache ?? false;
            version = args.version ?? null;
        } else {
            bName = args;
            isUseRemote = true;
        }
        return res({ bName, resName, resType: JsonAsset, isCache, version, isUseRemote });
    };

    export const font = (
        args: string | ResArgs,
        resName?: string,
        isCache: boolean = false,
        version: string | null = null
    ): Promise<Font> => {
        let bName: string;
        let isUseRemote: boolean = true;
        if (typeof args === "object") {
            bName = args.bName;
            isUseRemote = args.isUseRemote ?? true;
            resName = args.resName;
            isCache = args.isCache ?? false;
            version = args.version ?? null;
        } else {
            bName = args;
            isUseRemote = true;
        }
        return res({ bName, resName, resType: Font, isCache, version, isUseRemote });
    };

    export const bundle = (args: string | BundleArgs): Promise<AssetManager.Bundle> => {
        return getBundle(typeof args === "object" ? args : { bName: args, version: null, isUseRemote: true });
    };

    export const preloadT = <T extends Asset>(
        args: string | BundleArgs,
        resPath: string,
        resType: new (...args: any[]) => T,
        onProgress?: (finish: number, total: number, item: any) => void,
        onComplete?: () => void
    ) => {
        bundle(typeof args === "object" ? args : { bName: args, version: null, isUseRemote: true }).then(
            (bundleData) => {
                bundleData.preloadDir(
                    resPath,
                    resType,
                    (finish: number, total: number, item: any) => {
                        onProgress?.(finish, total, item);
                    },
                    () => {
                        onComplete?.();
                    }
                );
            }
        );
    };

    export const releaseBundle = (args: string | BundleArgs) => {
        bundle(typeof args === "object" ? args : { bName: args, version: null, isUseRemote: true }).then(
            (bundleData) => {
                if (bundleData) {
                    bundleData.releaseAll();
                }
            }
        );
    };
}
