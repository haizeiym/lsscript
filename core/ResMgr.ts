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
    const getBundle = (bName: string): Promise<AssetManager.Bundle> => {
        return new Promise((resolve) => {
            let db = assetManager.getBundle(bName);
            if (db) {
                resolve(db);
            } else {
                assetManager.loadBundle(bName, null, (err: Error, data: AssetManager.Bundle) => {
                    if (err) {
                        resolve(null);
                    } else {
                        resolve(data);
                    }
                });
            }
        });
    };

    const res = <T extends Asset>(bName: string, resName: string, resType: typeof Asset): Promise<T> => {
        return new Promise((resolve) => {
            getBundle(bName).then((bundle) => {
                bundle.load(resName, resType, null, (err: Error, data: T) => {
                    if (err) {
                        resolve(null);
                    } else {
                        resolve(data);
                    }
                });
            });
        });
    };

    export const dir = <T extends Asset>(bName: string, resName: string, onProgress?: Function): Promise<T[]> => {
        return new Promise((resolve) => {
            getBundle(bName).then((bundle) => {
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
        });
    };

    export const atlas = (bName: string, pName: string): Promise<SpriteAtlas> => {
        return res(bName, pName, SpriteAtlas);
    };

    export const spriteFrame = (bName: string, pName: string): Promise<SpriteFrame> => {
        if (!pName.endsWith("spriteFrame")) {
            pName = `${pName}/spriteFrame`;
        }
        return res(bName, pName, SpriteFrame);
    };

    export const spineData = (bName: string, pName: string): Promise<sp.SkeletonData> => {
        return res(bName, pName, sp.SkeletonData);
    };

    export const prefab = (bName: string, pName: string): Promise<Prefab> => {
        return res(bName, pName, Prefab);
    };

    export const audioClip = (bName: string, pName: string): Promise<AudioClip> => {
        return res(bName, pName, AudioClip);
    };

    export const animClip = (bName: string, pName: string): Promise<AnimationClip> => {
        return res(bName, pName, AnimationClip);
    };

    export const json = (bName: string, pName: string): Promise<JsonAsset> => {
        return res(bName, pName, JsonAsset);
    };

    export const font = (bName: string, pName: string): Promise<Font> => {
        return res(bName, pName, Font);
    };

    export const bundle = (bName: string): Promise<AssetManager.Bundle> => {
        return getBundle(bName);
    };
}
