import { Node, sp, Sprite, SpriteFrame } from "cc";
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
        spSkeleton.setEndListener(null);
        spSkeleton.setCompleteListener(null);
        spSkeleton.clearAnimation();
        return true;
    };

    export const play = (
        spSkeleton: sp.Skeleton | Node,
        animName: string,
        loopcount: number = 0,
        endCallBack: (spSkeleton?: sp.Skeleton) => void = null
    ): void => {
        if (spSkeleton instanceof Node) {
            spSkeleton = spSkeleton.getComponent(sp.Skeleton);
        }
        if (!stop(spSkeleton)) return;

        if (!animName) {
            console.warn("animName不能为空");
            return;
        }
        let isLoop = loopcount === -1;
        spSkeleton.setAnimation(0, animName, isLoop);
        if (loopcount > 0) {
            spSkeleton.setCompleteListener(() => {
                loopcount--;
                if (loopcount <= 0) {
                    stop(spSkeleton);
                    endCallBack && endCallBack(spSkeleton);
                }
            });
        }
    };

    export const cSpData = (
        spSkeleton: sp.Skeleton,
        sdata: sp.SkeletonData,
        animName: string = null,
        loopcount: number = 0,
        endCallBack: (spSkeleton?: sp.Skeleton) => void = null
    ): void => {
        if (!stop(spSkeleton)) return;
        if (!sdata) {
            console.error("sdata不能为空");
            return;
        }
        spSkeleton.skeletonData = sdata;
        if (!animName) return;
        play(spSkeleton, animName, loopcount, endCallBack);
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
}

export namespace AnimFa {
    const compTimeIdMap = new Map<Sprite, number>();

    export interface optFa {
        comp: Sprite | Node;
        frames: SpriteFrame[];
        loopcount?: number;
        frameTime?: number;
        defFrameIndex?: number;
        endCallBack?: (comp: Sprite) => void;
        oneEndCallBack?: (comp?: Sprite) => void;
    }

    export const play = (opt: optFa): void => {
        let { comp, frames, loopcount, frameTime, defFrameIndex, endCallBack, oneEndCallBack } = opt;
        if (comp instanceof Node) {
            comp = comp.getComponent(Sprite);
        }

        if (compTimeIdMap.delete(comp)) {
            NTime.removeObjTime(comp);
        }

        if (!comp?.isValid) return;

        frameTime = frameTime || 0.1;
        loopcount = loopcount || 0;
        defFrameIndex = defFrameIndex || 0;
        endCallBack = endCallBack || null;
        oneEndCallBack = oneEndCallBack || null;
        frames.sort((a, b) => {
            const matchA = a.name.match(/\d+(?=\D*$)/);
            const matchB = b.name.match(/\d+(?=\D*$)/);

            if (!matchA || !matchB) {
                console.warn(`Invalid frame name format: ${a.name} or ${b.name}`);
                return 0;
            }

            const numA = parseInt(matchA[0]);
            const numB = parseInt(matchB[0]);
            if (isNaN(numA) || isNaN(numB)) {
                console.warn(`Failed to parse numbers from: ${a.name} or ${b.name}`);
                return 0;
            }
            return numA - numB;
        });

        const allCount = frames.length;
        let curCount = defFrameIndex;
        comp.spriteFrame = frames[curCount];
        const timeId = NTime.addObjTime(comp, frameTime * 1000, () => {
            curCount++;
            if (curCount >= allCount) {
                if (loopcount > 0) {
                    --loopcount;
                    if (loopcount <= 0) {
                        if (compTimeIdMap.delete(comp)) {
                            NTime.removeObjTime(comp);
                        }
                        endCallBack && endCallBack(comp);
                    } else {
                        curCount = defFrameIndex;
                        comp.spriteFrame = frames[curCount];
                        oneEndCallBack && oneEndCallBack(comp);
                    }
                } else {
                    curCount = defFrameIndex;
                    comp.spriteFrame = frames[curCount];
                }
            } else {
                comp.spriteFrame = frames[curCount];
            }
        });
        compTimeIdMap.set(comp, timeId);
    };

    export const stop = (comp: Sprite | Node): void => {
        if (comp instanceof Node) {
            comp = comp.getComponent(Sprite);
        }
        if (!comp) return;
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
