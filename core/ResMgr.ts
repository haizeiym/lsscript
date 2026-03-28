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
        isUseCache?: boolean; //是否使用缓存
        version?: string | null;
        isUseRemote?: boolean;
    };

    type ResArgsT<T extends Asset> = ResArgs & {
        resType: new (...args: any[]) => T;
    };

    type ResArgsProgress<T extends Asset> = ResArgsT<T> & {
        onProgress?: (finish: number, total: number, item?: AssetManager.RequestItem) => void;
    };

    const _assetBundleMap = new Map<string, AssetManager.Bundle>();
    const _isPreloadBundleMap = new Map<string, boolean>();

    const parseArgs = <T extends Asset>(
        args: string | ResArgs | ResArgsT<T> | ResArgsProgress<T> | BundleArgs,
        resName?: string,
        isUseCache: boolean = false,
        version: string | null = null,
        resType?: new (...args: any[]) => T,
        onProgress?: (finish: number, total: number, item?: AssetManager.RequestItem) => void
    ) => {
        if (typeof args === "object") {
            const r = args as any;
            return {
                bName: r.bName as string,
                resName: r.resName as string,
                isUseCache: (r.isUseCache ?? false) as boolean,
                version: (r.version ?? null) as string | null,
                isUseRemote: (r.isUseRemote ?? true) as boolean,
                resType: r.resType as new (...args: any[]) => T,
                onProgress: r.onProgress as (finish: number, total: number, item?: AssetManager.RequestItem) => void
            };
        }
        return {
            bName: args as string,
            resName,
            isUseCache,
            version,
            isUseRemote: true,
            resType,
            onProgress
        };
    };

    const getLastPathSegment = (url: string): string => {
        if (!/^https?:\/\//i.test(url)) return "";
        const { pathname } = new URL(url);
        return pathname.split("/").filter(Boolean).pop() ?? "";
    };

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

        let db = _assetBundleMap.get(bName);
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
                            _assetBundleMap.set(bName, data);
                            resolve(data);
                        }
                    }
                );
            })
        );
    };

    /**
     * 加载单个资源，单独加载spriteFrame资源时，需要在resName后添加/spriteFrame
     * 例如：res("path1/path2/名称/spriteFrame")
     * @param bName 资源包名
     * @param resName 资源路径
     * @param resType 资源类型
     * @param isUseCache 是否使用缓存
     * @param version 版本号
     * @returns
     */
    export const res = async <T extends Asset>(
        args: string | ResArgsT<T>,
        resName?: string,
        resType?: new (...args: any[]) => T,
        isUseCache: boolean = false,
        version: string | null = null
    ): Promise<T> => {
        const p = parseArgs(args, resName, isUseCache, version, resType);
        const bundle = await getBundle(p);
        if (!bundle) return Promise.resolve(null);
        if (p.isUseCache) {
            const info = bundle.getInfoWithPath(p.resName, p.resType);
            if (info) {
                const asset = AssetManager.instance.assets.get(info.uuid);
                if (asset && asset.isValid) {
                    return Promise.resolve(asset as T);
                }
            }
        }

        return new Promise<T>((resolve, reject) => {
            bundle.load(p.resName, p.resType, null, (err: Error, data: T) => {
                if (err) {
                    if (DEBUG) {
                        console.warn(`bName=${p.bName} resName=${p.resName} res error: ${err}`);
                    }
                    reject(null);
                } else {
                    resolve(data);
                }
            });
        });
    };

    export const dir = async <T extends Asset>(
        args: string | ResArgsT<T>,
        resName?: string,
        onProgress?: (finish: number, total: number, item?: AssetManager.RequestItem) => void,
        isUseCache: boolean = false,
        version: string | null = null
    ): Promise<T[]> => {
        const p = parseArgs(args, resName, isUseCache, version, undefined, onProgress);
        const bundle = await getBundle(p);
        if (!bundle) return Promise.resolve([]);
        if (p.isUseCache) {
            const items = bundle.getDirWithPath(p.resName);
            const resList: T[] = [];
            items.forEach((item) => {
                const asset = assetManager.assets.get(item.uuid);
                if (asset && asset.isValid) {
                    resList.push(asset as T);
                }
            });
            if (resList.length === items.length) {
                return Promise.resolve(resList);
            }
        }

        return new Promise<T[]>((resolve, reject) => {
            bundle.loadDir(
                p.resName,
                (finish: number, total: number, item: AssetManager.RequestItem) => {
                    p.onProgress && p.onProgress(finish, total, item);
                },
                (err: Error, data: T[]) => {
                    if (err) {
                        if (DEBUG) {
                            console.warn(`bName=${p.bName} resName=${p.resName} dir error: ${err}`);
                        }
                        reject(null);
                    } else {
                        resolve(data);
                    }
                }
            );
        });
    };

    /**
     * 加载目录资源
     * @param bName 资源包名
     * @param resName 资源路径
     * @param resType 资源类型
     * @param isUseCache 是否使用缓存
     * @param onProgress 加载进度
     * @param version 版本号
     * @returns
     */
    export const dirT = async <T extends Asset>(
        args: string | ResArgsProgress<T>,
        resName?: string,
        resType?: new (...args: any[]) => T,
        isUseCache: boolean = false,
        onProgress?: (finish: number, total: number, item?: AssetManager.RequestItem) => void,
        version: string | null = null
    ): Promise<T[]> => {
        const p = parseArgs(args, resName, isUseCache, version, resType, onProgress);
        const bundle = await getBundle(p);
        if (!bundle) return Promise.resolve([]);
        if (p.isUseCache) {
            const items = bundle.getDirWithPath(p.resName, p.resType);
            const resList: T[] = [];
            items.forEach((item) => {
                const asset = assetManager.assets.get(item.uuid);
                if (asset && asset.isValid) {
                    resList.push(asset as T);
                }
            });
            if (resList.length === items.length) {
                return Promise.resolve(resList);
            }
        }

        return new Promise<T[]>((resolve, reject) => {
            bundle.loadDir(
                p.resName,
                p.resType,
                (finish: number, total: number, item: AssetManager.RequestItem) => {
                    p.onProgress?.(finish, total, item);
                },
                (err: Error, data: T[]) => {
                    if (err) {
                        if (DEBUG) {
                            console.warn(`bName=${p.bName} resName=${p.resName} dirT error: ${err}`);
                        }
                        reject(null);
                    } else {
                        resolve(data);
                    }
                }
            );
        });
    };

    /**
     * 多个bundle加载目录资源
     * @param args 资源路径及类型{bundleName: {dirPath: 类型|类型[]|[]}} //为空数组时加载所有资源
     * @param onProgress 加载进度
     * @param groupSize 分组大小
     */
    export const loadingDirT = async (
        args: {
            [bundleName: string]: {
                [dirPath: string]: (new (...args: any[]) => Asset) | (new (...args: any[]) => Asset)[];
            };
        },
        onProgress?: (finish: number, total: number, res?: Asset) => void,
        groupSize: number = 500
    ): Promise<void> => {
        const bundleMap = new Map<string, { path: string; resType: (new (...args: any[]) => Asset) | null }[]>();
        let allCount = 0;

        for (const bundleName in args) {
            const bundle = await getBundle({ bName: bundleName, version: null, isUseRemote: true });
            const pathObj = args[bundleName];
            let list = bundleMap.get(bundleName);
            if (!list) {
                list = [];
                bundleMap.set(bundleName, list);
            }

            for (const dirPath in pathObj) {
                const raw = pathObj[dirPath];
                const types = (Array.isArray(raw) ? raw : [raw]) as (new (...args: any[]) => Asset)[];
                const n = types.length;
                for (let t = 0; t < (n || 1); t++) {
                    const rt = n ? types[t] : null;
                    const items = rt != null ? bundle.getDirWithPath(dirPath, rt) : bundle.getDirWithPath(dirPath);
                    for (let k = 0; k < items.length; k++) {
                        list.push({ path: items[k].path, resType: rt });
                        allCount++;
                    }
                }
            }
        }

        let finishCount = 0;
        bundleMap.forEach(async (items, bundleName) => {
            for (let i = 0; i < items.length; i += groupSize) {
                const group = items.slice(i, i + groupSize);
                await Promise.all(
                    group.map(async ({ path, resType }) => {
                        const resData = await res(bundleName, path, resType, true);
                        onProgress?.(++finishCount, allCount, resData);
                    })
                );
            }
        });
    };

    const _createLoader = <T extends Asset>(resType: new (...args: any[]) => T, suffix?: string) => {
        return (
            args: string | ResArgs,
            resName?: string,
            isUseCache = false,
            version: string | null = null
        ): Promise<T> => {
            const p = parseArgs(args, resName, isUseCache, version);
            if (suffix && p.resName && !p.resName.endsWith(suffix)) {
                p.resName = `${p.resName}/${suffix}`;
            }
            return res({ ...p, resType } as ResArgsT<T>);
        };
    };

    export const atlas = _createLoader(SpriteAtlas);
    export const spineData = _createLoader(sp.SkeletonData);
    export const prefab = _createLoader(Prefab);
    export const audioClip = _createLoader(AudioClip);
    export const animClip = _createLoader(AnimationClip);
    export const json = _createLoader(JsonAsset);
    export const font = _createLoader(Font);
    export const spriteFrame = _createLoader(SpriteFrame, "spriteFrame");

    export const bundle = (args: string | BundleArgs): Promise<AssetManager.Bundle> => {
        return getBundle(parseArgs(args));
    };

    export const preloadT = <T extends Asset>(
        args: string | BundleArgs,
        resPath: string,
        resType: new (...args: any[]) => T,
        onProgress?: (finish: number, total: number, item: any) => void,
        onComplete?: () => void,
        isUsePreload: boolean = true
    ) => {
        const p = parseArgs(args, resPath, undefined, undefined, resType, onProgress);
        const key = `${p.bName}_${resPath}_${resType.name}`;
        if (isUsePreload && _isPreloadBundleMap.get(key)) {
            onComplete?.();
            return;
        }
        getBundle(p).then((bundleData) => {
            bundleData.preloadDir(
                resPath,
                resType,
                (finish: number, total: number, item: any) => {
                    p.onProgress?.(finish, total, item);
                },
                () => {
                    if (isUsePreload) {
                        _isPreloadBundleMap.set(key, true);
                    }
                    onComplete?.();
                }
            );
        });
    };

    export const releaseBundle = (args: string | BundleArgs) => {
        getBundle(parseArgs(args)).then((bundleData) => {
            if (bundleData) {
                bundleData.releaseAll();
            }
        });
    };

    export const clearCacheResT = <T extends Asset>(res: T) => {
        assetManager.releaseAsset(res);
    };
}
