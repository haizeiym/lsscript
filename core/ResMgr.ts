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

export namespace ResLoad {
    const _assetsMap = new Map<string, unknown[]>();
    const _assetMap = new Map<string, unknown>();

    const getBundle = (bName: string, version: string | null = null): Promise<AssetManager.Bundle> => {
        let db = assetManager.getBundle(bName);
        if (db) {
            return Promise.resolve(db);
        }

        return Promise.resolve(
            new Promise<AssetManager.Bundle>((resolve) => {
                assetManager.loadBundle(
                    bName,
                    !version ? null : { version },
                    (err: Error, data: AssetManager.Bundle) => {
                        if (err) {
                            console.warn(`bName=${bName} load error: ${err}`);
                            resolve(null);
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
        bName: string,
        resName: string,
        resType: new (...args: any[]) => T,
        isCache: boolean = false,
        version: string | null = null
    ): Promise<T> => {
        if (isCache) {
            const asset = _assetMap.get(`${bName}_${resName}_${version || ""}`) as T;
            if (asset) {
                return Promise.resolve(asset);
            }
        }

        return Promise.resolve(
            getBundle(bName, version)?.then((bundle) => {
                return new Promise<T>((resolve) => {
                    bundle.load(resName, resType, null, (err: Error, data: T) => {
                        if (err) {
                            resolve(null);
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

    /**
     * 清除缓存
     * @param bName 资源包名
     * @param resName 资源路径
     * @param version 版本号
     * @param isReleAsset 是否释放资源
     */
    export const clearCacheRes = <T extends Asset>(
        bName: string,
        resName: string,
        version: string | null = null,
        isReleAsset: boolean = true
    ) => {
        const key = `${bName}_${resName}_${version || ""}`;
        if (isReleAsset) {
            clearCacheResT(_assetMap.get(key) as T);
        }
        _assetMap.delete(key);
    };

    export const clearCacheResT = <T extends Asset>(res: T) => {
        assetManager.releaseAsset(res);
    };

    export const dir = <T extends Asset>(
        bName: string,
        resName: string,
        onProgress?: Function,
        version: string | null = null
    ): Promise<T[]> => {
        return Promise.resolve(
            getBundle(bName, version)?.then((bundle) => {
                return new Promise<T[]>((resolve) => {
                    bundle.loadDir(
                        resName,
                        (finish: number, total: number, item: any) => {
                            onProgress && onProgress(finish, total, item);
                        },
                        (err: Error, data: T[]) => {
                            if (err) {
                                resolve(null);
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
    export const dirT = <T extends Asset>(
        bName: string,
        resName: string,
        resType: new (...args: any[]) => T,
        isCache: boolean = false,
        onProgress?: (finish: number, total: number, item?: any) => void,
        version: string | null = null
    ): Promise<T[]> => {
        if (isCache) {
            const assets = _assetsMap.get(`${bName}_${resName}_${version || ""}`) as T[];
            if (assets) {
                return Promise.resolve(assets);
            }
        }
        return Promise.resolve(
            getBundle(bName, version)?.then((bundle) => {
                return new Promise<T[]>((resolve) => {
                    bundle.loadDir(
                        resName,
                        resType,
                        (finish: number, total: number, item: any) => {
                            onProgress && onProgress(finish, total, item);
                        },
                        (err: Error, data: T[]) => {
                            if (err) {
                                resolve(null);
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
    };

    /**
     * 清除缓存
     * @param bName 资源包名
     * @param resName 资源名
     * @param version 版本号
     * @param isReleAsset 是否释放资源
     */
    export const clearCacheDirT = <T extends Asset>(
        bName: string,
        resName: string,
        version: string | null = null,
        isReleAsset: boolean = true
    ) => {
        const key = `${bName}_${resName}_${version || ""}`;
        if (isReleAsset) {
            (_assetsMap.get(key) as T[])?.forEach((asset) => {
                assetManager.releaseAsset(asset);
            });
        }
        _assetsMap.delete(key);
    };

    export const atlas = (
        bName: string,
        pName: string,
        isCache: boolean = false,
        version: string | null = null
    ): Promise<SpriteAtlas> => {
        return res(bName, pName, SpriteAtlas, isCache, version);
    };

    export const spriteFrame = (
        bName: string,
        pName: string,
        isCache: boolean = false,
        version: string | null = null
    ): Promise<SpriteFrame> => {
        if (!pName.endsWith("spriteFrame")) {
            pName = `${pName}/spriteFrame`;
        }
        return res(bName, pName, SpriteFrame, isCache, version);
    };

    export const spineData = (
        bName: string,
        pName: string,
        isCache: boolean = false,
        version: string | null = null
    ): Promise<sp.SkeletonData> => {
        return res(bName, pName, sp.SkeletonData, isCache, version);
    };

    export const prefab = (
        bName: string,
        pName: string,
        isCache: boolean = false,
        version: string | null = null
    ): Promise<Prefab> => {
        return res(bName, pName, Prefab, isCache, version);
    };

    export const audioClip = (
        bName: string,
        pName: string,
        isCache: boolean = false,
        version: string | null = null
    ): Promise<AudioClip> => {
        return res(bName, pName, AudioClip, isCache, version);
    };

    export const animClip = (
        bName: string,
        pName: string,
        isCache: boolean = false,
        version: string | null = null
    ): Promise<AnimationClip> => {
        return res(bName, pName, AnimationClip, isCache, version);
    };

    export const json = (
        bName: string,
        pName: string,
        isCache: boolean = false,
        version: string | null = null
    ): Promise<JsonAsset> => {
        return res(bName, pName, JsonAsset, isCache, version);
    };

    export const font = (
        bName: string,
        pName: string,
        isCache: boolean = false,
        version: string | null = null
    ): Promise<Font> => {
        return res(bName, pName, Font, isCache, version);
    };

    export const bundle = (bName: string, version: string | null = null): Promise<AssetManager.Bundle> => {
        return getBundle(bName, version);
    };
}
