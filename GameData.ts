import { sys } from "cc";

export class GameData {
    public static setSaveData(key: string, value: any) {
        sys.localStorage.setItem(key, JSON.stringify(value));
    }

    public static getSaveData(key: string, defaultValue?: any) {
        return JSON.parse(sys.localStorage.getItem(key) || defaultValue);
    }

    public static setBoolSaveData(key: string, value: boolean) {
        this.setSaveData(key, value ? 1 : 0);
    }

    public static getBoolSaveData(key: string, defaultValue?: boolean) {
        return this.getSaveData(key, defaultValue ? 1 : 0) === 1;
    }

    //全局存储是否播放音效
    public static setVoiceState(isPlayAudio: boolean) {
        this.setSaveData("isPlayAudio", isPlayAudio ? 1 : 0);
    }

    public static getVoiceState(): boolean {
        return this.getSaveData("isPlayAudio", 1) === 1;
    }
}

// 测试子模块提交
