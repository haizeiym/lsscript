import { Component, Node, sp, Sprite, SpriteFrame, tween, Tween } from "cc";
import { NTime } from "./NMgr";

export namespace AnimSp {
    const isValid = (spSkeleton: sp.Skeleton): boolean => {
        let isValid = spSkeleton && spSkeleton.isValid;
        if (!isValid) console.warn("spSkeleton不可以用");
        return isValid;
    };

    export const stop = (spSkeleton: sp.Skeleton | Node): boolean => {
        if (spSkeleton instanceof Node) {
            spSkeleton = spSkeleton.getComponent(sp.Skeleton);
        }
        if (!isValid(spSkeleton)) return false;
        spSkeleton.loop = false;
        spSkeleton.paused = true;
        spSkeleton.setEndListener(null);
        spSkeleton.setCompleteListener(null);
        return true;
    };

    export const play = (
        spSkeleton: sp.Skeleton | Node,
        animName: string,
        loopcount: number = 0,
        endCallBack: (spSkeleton?: sp.Skeleton) => void = null,
        timeScale: number = 1,
        premultipliedAlpha: boolean = false
    ): sp.spine.Animation => {
        if (spSkeleton instanceof Node) {
            spSkeleton = spSkeleton.getComponent(sp.Skeleton);
            if (!spSkeleton) {
                console.warn("组件不存在");
                return;
            }
        }
        if (!isValid(spSkeleton)) return;

        if (!animName) {
            console.warn("animName不能为空");
            return;
        }
        spSkeleton.timeScale = timeScale;
        const fAnimation = spSkeleton.findAnimation(animName);
        if (!fAnimation) {
            stop(spSkeleton);
            endCallBack && endCallBack(spSkeleton);
            return null;
        }
        spSkeleton.premultipliedAlpha = premultipliedAlpha;
        spSkeleton.loop = true;
        spSkeleton.paused = false;
        spSkeleton.setAnimation(0, animName);
        if (loopcount > 0) {
            spSkeleton.setCompleteListener(() => {
                if (--loopcount <= 0) {
                    spSkeleton.skeletonData = null;
                    stop(spSkeleton);
                    endCallBack && endCallBack(spSkeleton);
                }
            });
        }
        return fAnimation;
    };

    export const cSpData = (
        spSkeleton: sp.Skeleton,
        sdata: sp.SkeletonData,
        animName: string = null,
        loopcount: number = 0,
        endCallBack: (spSkeleton?: sp.Skeleton) => void = null,
        timeScale: number = 1,
        premultipliedAlpha: boolean = false
    ): sp.spine.Animation => {
        if (!isValid(spSkeleton)) return;
        if (!sdata) {
            endCallBack?.(spSkeleton);
            console.error("sdata不能为空");
            return;
        }
        spSkeleton.skeletonData = sdata;
        if (!animName) return;
        return play(spSkeleton, animName, loopcount, endCallBack, timeScale, premultipliedAlpha);
    };
}

export namespace AnimTw {
    export const backIn = (overshoot: number = 1.70158) => {
        return (k: number) => {
            return k * k * ((overshoot + 1) * k - overshoot);
        };
    };

    export const backOut = (overshoot: number = 1.70158) => {
        return (k: number) => {
            k = k - 1;
            return 1 + k * k * ((overshoot + 1) * k + overshoot);
        };
    };

    export const targetTw = new Map<Component, Tween[]>();

    export const addTgTw = <T1 extends Component, T2 extends object = any>(
        target: T1,
        target2?: T2 | Tween<T2>
    ): Tween<T2> => {
        let tws = targetTw.get(target);
        if (!tws) {
            tws = [];
            targetTw.set(target, tws);
        }
        const ttw = target2 ? (target2 instanceof Tween ? target2 : tween(target2)) : tween();
        tws.push(ttw);
        return ttw;
    };

    export const delTgTw = <T extends Component>(target: T, tw?: Tween | object): void => {
        const tws = targetTw.get(target);
        if (!tws?.length) return;

        if (!tw) {
            tws.forEach((tween) => {
                tween.stop();
            });
            targetTw.delete(target);
            return;
        }

        const index = tw instanceof Tween ? tws.indexOf(tw) : tws.findIndex((t) => t.getTarget() === tw);
        if (index !== -1) {
            tws.splice(index, 1)[0].stop();
            if (tws.length === 0) {
                targetTw.delete(target);
            }
        }
    };
}

export namespace AnimFa {
    const compTimeIdMap = new Map<Sprite, number>();

    export const play = (opt: {
        comp: Sprite | Node;
        frames: SpriteFrame[];
        loopcount?: number;
        frameTime?: number;
        defFrameIndex?: number;
        endCallBack?: (comp: Sprite) => void;
        oneEndCallBack?: (comp?: Sprite) => void;
        frameCallBack?: (comp: Sprite, frameIndex: number) => void;
    }): void => {
        let {
            comp,
            frames,
            loopcount = 0,
            frameTime = 0.1,
            defFrameIndex = 0,
            endCallBack = null,
            oneEndCallBack = null,
            frameCallBack = null
        } = opt;

        // 获取Sprite组件
        if (comp instanceof Node) {
            comp = comp.getComponent(Sprite);
        }
        if (!comp?.isValid) return;

        // 清理之前的定时器
        if (compTimeIdMap.delete(comp)) {
            NTime.removeObjTime(comp);
        }

        // 优化帧排序：使用缓存避免重复计算
        const frameCache = new Map<string, number>();
        frames.sort((a, b) => {
            // 使用缓存获取数字
            const getFrameNumber = (name: string): number => {
                if (frameCache.has(name)) {
                    return frameCache.get(name);
                }
                const match = name.match(/\d+(?=\D*$)/);
                if (!match) {
                    console.warn(`Invalid frame name format: ${name}`);
                    return 0;
                }
                const num = parseInt(match[0]);
                if (isNaN(num)) {
                    console.warn(`Failed to parse number from: ${name}`);
                    return 0;
                }
                frameCache.set(name, num);
                return num;
            };

            return getFrameNumber(a.name) - getFrameNumber(b.name);
        });

        const allCount = frames.length;
        let curCount = Math.min(defFrameIndex, allCount - 1); // 确保初始索引有效
        comp.spriteFrame = frames[curCount];
        frameCallBack?.(comp, curCount);
        // 优化定时器回调
        const timeId = NTime.addObjTime(comp, frameTime * 1000, () => {
            if (!comp?.isValid) {
                if (compTimeIdMap.delete(comp)) {
                    NTime.removeObjTime(comp);
                }
                return;
            }

            curCount++;
            if (curCount >= allCount) {
                if (loopcount > 0) {
                    --loopcount;
                    if (loopcount <= 0) {
                        if (compTimeIdMap.delete(comp)) {
                            NTime.removeObjTime(comp);
                        }
                        endCallBack?.(comp);
                    } else {
                        curCount = defFrameIndex;
                        comp.spriteFrame = frames[curCount];
                        frameCallBack?.(comp, curCount);
                        oneEndCallBack?.(comp);
                    }
                } else {
                    curCount = defFrameIndex;
                    comp.spriteFrame = frames[curCount];
                    frameCallBack?.(comp, curCount);
                }
            } else {
                comp.spriteFrame = frames[curCount];
                frameCallBack?.(comp, curCount);
            }
        });

        compTimeIdMap.set(comp, timeId);
    };

    export const stop = (comp: Sprite | Node): void => {
        if (comp instanceof Node) {
            comp = comp.getComponent(Sprite);
        }
        if (!comp?.isValid) return;
        if (compTimeIdMap.delete(comp)) {
            NTime.removeObjTime(comp);
        }
    };

    export const stopAll = (): void => {
        compTimeIdMap.forEach((timeId, comp) => {
            NTime.removeObjTime(comp);
        });
        compTimeIdMap.clear();
    };
}
