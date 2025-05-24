import { Node, sp } from "cc";

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
