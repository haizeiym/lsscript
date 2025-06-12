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
    const getBundle = (bName: string, version: string | null = null): Promise<AssetManager.Bundle> => {
        return new Promise((resolve) => {
            let db = assetManager.getBundle(bName);
            if (db) {
                resolve(db);
            } else {
                assetManager.loadBundle(bName, { version }, (err: Error, data: AssetManager.Bundle) => {
                    if (err) {
                        resolve(null);
                    } else {
                        resolve(data);
                    }
                });
            }
        });
    };

    const res = <T extends Asset>(
        bName: string,
        resName: string,
        resType: typeof Asset,
        version: string | null = null
    ): Promise<T> => {
        return new Promise(async (resolve) => {
            let bundle = await getBundle(bName, version);
            bundle.load(resName, resType, null, (err: Error, data: T) => {
                if (err) {
                    resolve(null);
                } else {
                    resolve(data);
                }
            });
        });
    };

    export const dir = <T extends Asset>(
        bName: string,
        resName: string,
        onProgress?: Function,
        version: string | null = null
    ): Promise<T[]> => {
        return new Promise(async (resolve) => {
            let bundle = await getBundle(bName, version);
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
    };

    export const dirT = <T extends Asset>(
        bName: string,
        resName: string,
        resType: new (...args: any[]) => T,
        onProgress?: Function,
        version: string | null = null
    ): Promise<T[]> => {
        return new Promise(async (resolve) => {
            let bundle = await getBundle(bName, version);
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
                        resolve(data);
                    }
                }
            );
        });
    };

    export const atlas = (bName: string, pName: string, version: string | null = null): Promise<SpriteAtlas> => {
        return res(bName, pName, SpriteAtlas, version);
    };

    export const spriteFrame = (bName: string, pName: string, version: string | null = null): Promise<SpriteFrame> => {
        if (!pName.endsWith("spriteFrame")) {
            pName = `${pName}/spriteFrame`;
        }
        return res(bName, pName, SpriteFrame, version);
    };

    export const spineData = (
        bName: string,
        pName: string,
        version: string | null = null
    ): Promise<sp.SkeletonData> => {
        return res(bName, pName, sp.SkeletonData, version);
    };

    export const prefab = (bName: string, pName: string, version: string | null = null): Promise<Prefab> => {
        return res(bName, pName, Prefab, version);
    };

    export const audioClip = (bName: string, pName: string, version: string | null = null): Promise<AudioClip> => {
        return res(bName, pName, AudioClip, version);
    };

    export const animClip = (bName: string, pName: string, version: string | null = null): Promise<AnimationClip> => {
        return res(bName, pName, AnimationClip, version);
    };

    export const json = (bName: string, pName: string, version: string | null = null): Promise<JsonAsset> => {
        return res(bName, pName, JsonAsset, version);
    };

    export const font = (bName: string, pName: string, version: string | null = null): Promise<Font> => {
        return res(bName, pName, Font, version);
    };

    export const bundle = (bName: string, version: string | null = null): Promise<AssetManager.Bundle> => {
        return getBundle(bName, version);
    };
}
