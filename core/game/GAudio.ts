import { AudioMgr } from "../AudioMgr";
import { ResLoad } from "../ResMgr";

export namespace GAudio {
    export const bgm = (bName: string, pName: string, loop: boolean = true) => {
        ResLoad.audioClip(bName, pName).then((sound) => {
            AudioMgr.playBgm(sound, loop);
        });
    };

    export const effect = (bName: string, pName: string) => {
        ResLoad.audioClip(bName, pName).then((sound) => {
            AudioMgr.playEffect(sound);
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
        AudioMgr.setEffectVolume(volume);
    };

    export const setBgmVolume = (volume: number) => {
        AudioMgr.setBgmVolume(volume);
    };
}
