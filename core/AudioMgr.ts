import { AudioClip, AudioSource, director, Node } from "cc";

export class AudioMgr {
    private static _audioSource: AudioSource;

    private static _effectVolume: number = 1.0;
    private static _bgmVolume: number = 1.0;
    private static _isStopEffect: boolean = false;
    private static _isStopBgm: boolean = false;
    private static _isStop: boolean = false;

    public static init(): void {
        if (this._audioSource?.isValid) return;
        let audioMgr = new Node();
        audioMgr.name = "__audioMgr__";
        director.getScene().addChild(audioMgr);
        director.addPersistRootNode(audioMgr);
        this._audioSource = audioMgr.addComponent(AudioSource);
    }

    public static get audioSource() {
        return this._audioSource;
    }

    public static set effectVolume(volume: number) {
        this._effectVolume = volume;
    }

    public static get effectVolume() {
        return this._effectVolume;
    }

    public static setBgmVolume(volume: number) {
        this._bgmVolume = volume;
        this._audioSource.volume = this._bgmVolume;
    }

    public static playEffect(sound: AudioClip, volume: number = this._effectVolume) {
        if (this._isStop || this._isStopEffect) return;
        this._audioSource.playOneShot(sound, volume);
    }

    public static playBgm(sound: AudioClip, loop: boolean = true) {
        this._audioSource.stop();
        if (this._isStop || this._isStopBgm) {
            this._audioSource.clip = sound;
            this._audioSource.loop = loop;
            this._audioSource.volume = this._bgmVolume;
            return;
        }
        this._audioSource.clip = sound;
        this._audioSource.loop = loop;
        this._audioSource.volume = this._bgmVolume;
        this._audioSource.play();
    }

    public static setIsStop(isStop: boolean) {
        if (this._isStop === isStop) return;
        this._isStop = isStop;
        if (this._isStop) {
            this._audioSource.stop();
        } else {
            this._audioSource.play();
        }
    }

    public static setIsPauseBgm(isPauseBgm: boolean) {
        if (this._isStop) return;
        if (isPauseBgm) {
            this._audioSource.play();
        } else {
            this._audioSource.pause();
        }
    }

    public static setIsStopEffect(isStopEffect: boolean) {
        this._isStopEffect = isStopEffect;
    }

    public static get isStopEffect() {
        return this._isStopEffect;
    }

    public static setIsStopBgm(isStopBgm: boolean) {
        if ((this._isStopBgm = isStopBgm)) {
            this._audioSource.stop();
        } else {
            this._audioSource.play();
        }
    }

    public static get isStopBgm() {
        return this._isStopBgm;
    }
}
