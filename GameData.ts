import { sys } from "cc";

const VoiceKey = {
    isStopAudio: "is_stopAudio",
    isStopBgm: "is_stopBgm",
    isStopEffect: "is_stopEffect"
} as const;

export class GameData {
    public static setSaveData(key: string, value: any) {
        try {
            sys.localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            sys.localStorage.setItem(key, null);
        }
    }

    public static getSaveData(key: string, defaultValue?: any) {
        const value = sys.localStorage.getItem(key);
        if (value === null) {
            return defaultValue;
        }
        try {
            return JSON.parse(value);
        } catch (error) {
            return defaultValue;
        }
    }

    //全局存储是否播放音乐/音效
    public static setIsStopAudio(isStopAudio: boolean) {
        this.setSaveData(VoiceKey.isStopAudio, isStopAudio ? 1 : 0);
    }

    public static getIsStopAudio(): boolean {
        return this.getSaveData(VoiceKey.isStopAudio, 0) === 1;
    }

    //全局存储是否停止背景音乐
    public static setIsStopBgm(isStopBgm: boolean) {
        this.setSaveData(VoiceKey.isStopBgm, isStopBgm ? 1 : 0);
    }

    public static getIsStopBgm(): boolean {
        return this.getSaveData(VoiceKey.isStopBgm, 0) === 1;
    }

    //全局存储是否停止音效
    public static setIsStopEffect(isStopEffect: boolean) {
        this.setSaveData(VoiceKey.isStopEffect, isStopEffect ? 1 : 0);
    }

    public static getIsStopEffect(): boolean {
        return this.getSaveData(VoiceKey.isStopEffect, 0) === 1;
    }
}


export const lsGameData = GameData;

