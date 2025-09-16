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
                    spSkeleton = spSkeleton as sp.Skeleton;
                    if (!spSkeleton) return;
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
    const compAnimStateMap = new Map<
        Sprite,
        {
            frames: SpriteFrame[];
            loopcount: number;
            frameTime: number;
            defFrameIndex: number;
            curCount: number;
            allCount: number;
            endCallBack?: (comp: Sprite) => void; //所有循环结束回调
            oneEndCallBack?: (comp?: Sprite) => void; //一次循环后回调，无限循环不调用
            frameCallBack?: (comp: Sprite, frameIndex: number) => void; //每帧回调
        }
    >();

    const globalFrameCache = new Map<string, number>();

    const getFrameNumber = (name: string): number => {
        if (globalFrameCache.has(name)) {
            return globalFrameCache.get(name);
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
        globalFrameCache.set(name, num);
        return num;
    };

    const playNextFrame = (comp: Sprite): void => {
        const state = compAnimStateMap.get(comp);
        if (!state || !comp?.isValid) {
            compAnimStateMap.delete(comp);
            NTime.removeObjTime(comp);
            return;
        }

        const { frames, loopcount, defFrameIndex, curCount, allCount, endCallBack, oneEndCallBack, frameCallBack } =
            state;

        state.curCount = curCount + 1;

        if (state.curCount >= allCount) {
            if (loopcount > 0) {
                state.loopcount = loopcount - 1;
                if (state.loopcount <= 0) {
                    compAnimStateMap.delete(comp);
                    NTime.removeObjTime(comp);
                    endCallBack?.(comp);
                    return;
                } else {
                    state.curCount = defFrameIndex;
                    comp.spriteFrame = frames[state.curCount];
                    frameCallBack?.(comp, state.curCount);
                    oneEndCallBack?.(comp);
                }
            } else {
                state.curCount = defFrameIndex;
                comp.spriteFrame = frames[state.curCount];
                frameCallBack?.(comp, state.curCount);
            }
        } else {
            comp.spriteFrame = frames[state.curCount];
            frameCallBack?.(comp, state.curCount);
        }
    };

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

        if (comp instanceof Node) {
            comp = comp.getComponent(Sprite);
        }

        if (!comp?.isValid) {
            console.warn("Sprite组件无效");
            return;
        }

        if (!frames || frames.length === 0) {
            console.warn("frames数组不能为空");
            return;
        }

        if (frameTime <= 0) {
            console.warn("frameTime必须大于0");
            frameTime = 0.1;
        }

        stop(comp);

        const sortedFrames = [...frames].sort((a, b) => {
            return getFrameNumber(a.name) - getFrameNumber(b.name);
        });

        const allCount = sortedFrames.length;
        const curCount = Math.max(0, Math.min(defFrameIndex, allCount - 1));

        compAnimStateMap.set(comp, {
            frames: sortedFrames,
            loopcount,
            frameTime,
            defFrameIndex,
            curCount,
            allCount,
            endCallBack,
            oneEndCallBack,
            frameCallBack
        });

        comp.spriteFrame = sortedFrames[curCount];
        frameCallBack?.(comp, curCount);

        if (comp?.isValid) {
            NTime.addObjTime(comp, frameTime * 1000, () => playNextFrame(comp as Sprite));
        } else {
            compAnimStateMap.delete(comp);
        }
    };

    export const stop = (comp: Sprite | Node): void => {
        if (comp instanceof Node) {
            comp = comp.getComponent(Sprite);
        }
        if (!comp?.isValid) return;

        compAnimStateMap.delete(comp);
        NTime.removeObjTime(comp);
    };

    export const stopAll = (): void => {
        compAnimStateMap.forEach((_, comp) => {
            NTime.removeObjTime(comp);
        });
        compAnimStateMap.clear();
    };
}
