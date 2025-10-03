import { AudioMgr } from "../AudioMgr";
import { ResLoad } from "../ResMgr";

export namespace GAudio {
    export const bgm = (bName: string, pName: string, loop: boolean = true) => {
        ResLoad.audioClip(bName, pName, true).then((sound) => {
            if (!sound) {
                console.warn(`bgm not found: ${bName} ${pName}`);
                return;
            }
            AudioMgr.playBgm(sound, loop);
        });
    };

    export const effect = (bName: string, pName: string, volume: number = AudioMgr.effectVolume) => {
        ResLoad.audioClip(bName, pName, true).then((sound) => {
            if (!sound) {
                console.warn(`effect not found: ${bName} ${pName}`);
                return;
            }
            AudioMgr.playEffect(sound, volume);
        });
    };

    export const setIsStop = (isStop: boolean) => {
        AudioMgr.setIsStop(isStop);
    };

    export const setIsPauseBgm = (isBgmPlaying: boolean) => {
        AudioMgr.setIsPauseBgm(isBgmPlaying);
    };

    export const setIsStopBgm = (isStopBgm: boolean) => {
        AudioMgr.setIsStopBgm(isStopBgm);
    };

    export const getIsStopBgm = () => {
        return AudioMgr.isStopBgm;
    };

    export const getIsStopEffect = () => {
        return AudioMgr.isStopEffect;
    };

    export const setIsStopEffect = (isStopEffect: boolean) => {
        AudioMgr.setIsStopEffect(isStopEffect);
    };

    export const setEffectVolume = (volume: number) => {
        AudioMgr.effectVolume = volume;
    };

    export const getEffectVolume = () => {
        return AudioMgr.effectVolume;
    };

    export const setBgmVolume = (volume: number) => {
        AudioMgr.setBgmVolume(volume);
    };
}
