import { AudioMgr } from "../AudioMgr";
import { ResLoad } from "../ResMgr";

export namespace GAudio {
    export const bgm = (bName: string, pName: string, loop: boolean = true) => {
        ResLoad.audioClip(bName, pName).then((sound) => {
            if (!sound) {
                console.warn(`bgm not found: ${bName} ${pName}`);
                return;
            }
            AudioMgr.playBgm(sound, loop);
        });
    };

    export const effect = (bName: string, pName: string, volume: number = AudioMgr.effectVolume) => {
        ResLoad.audioClip(bName, pName).then((sound) => {
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

    export const setIsBgmPlaying = (isBgmPlaying: boolean) => {
        AudioMgr.setIsBgmPlaying(isBgmPlaying);
    };

    export const setIsEffectPlaying = (isEffectPlaying: boolean) => {
        AudioMgr.setIsEffectPlaying(isEffectPlaying);
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
