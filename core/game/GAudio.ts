import { AudioClip } from "cc";
import { AudioMgr } from "../AudioMgr";
import { ResLoad } from "../ResMgr";

export namespace GAudio {
    export const bgm = async (bName: string, pName: string, loop: boolean = true): Promise<AudioClip> => {
        const sound = await ResLoad.audioClip(bName, pName, true);
        if (!sound) {
            console.warn(`bgm not found: ${bName} ${pName}`);
            return null;
        }
        AudioMgr.playBgm(sound, loop);
        return sound;
    };

    export const effect = async (
        bName: string,
        pName: string,
        volume: number = AudioMgr.effectVolume
    ): Promise<AudioClip> => {
        const sound = await ResLoad.audioClip(bName, pName, true);
        if (!sound) {
            console.warn(`effect not found: ${bName} ${pName}`);
            return null;
        }
        AudioMgr.playEffect(sound, volume);
        return sound;
    };

    export const stopAudio = (isStop: boolean) => {
        AudioMgr.stopAudio(isStop);
    };

    export const pauseBgm = (isPauseBgm: boolean) => {
        AudioMgr.pauseBgm(isPauseBgm);
    };

    export const stopBgm = (isStopBgm: boolean) => {
        AudioMgr.stopBgm(isStopBgm);
    };

    export const stopEffect = (isStopEffect: boolean) => {
        AudioMgr.stopEffect(isStopEffect);
    };

    export const isStopBgm = () => {
        return AudioMgr.isStopBgm;
    };

    export const isStopEffect = () => {
        return AudioMgr.isStopEffect;
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

    //#region 弃用方法
    /**
     * @deprecated
     * 请使用 stopAudio 代替
     */
    export const setIsStop = (isStop: boolean) => {
        AudioMgr.setIsStop(isStop);
    };

    /**
     * @deprecated
     * 请使用 pauseBgm 代替
     */
    export const setIsPauseBgm = (isBgmPlaying: boolean) => {
        AudioMgr.setIsPauseBgm(isBgmPlaying);
    };

    /**
     * @deprecated
     * 请使用 stopBgm 代替
     */
    export const setIsStopBgm = (isStopBgm: boolean) => {
        AudioMgr.setIsStopBgm(isStopBgm);
    };

    /**
     * @deprecated
     * 请使用 isStopBgm 代替
     */
    export const getIsStopBgm = () => {
        return AudioMgr.isStopBgm;
    };

    /**
     * @deprecated
     * 请使用 isStopEffect 代替
     */
    export const getIsStopEffect = () => {
        return AudioMgr.isStopEffect;
    };

    /**
     * @deprecated
     * 请使用 stopEffect 代替
     */
    export const setIsStopEffect = (isStopEffect: boolean) => {
        AudioMgr.setIsStopEffect(isStopEffect);
    };
    //#endregion
}
