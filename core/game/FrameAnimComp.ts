import { _decorator, Component, Sprite, SpriteFrame } from "cc";
import { NTime } from "../NMgr";
import { ResLoad } from "../ResMgr";
const { ccclass, property } = _decorator;

@ccclass("FrameAnimComp")
export class FrameAnimComp extends Component {
    private _sprite: Sprite = null;
    private _bundleName: string = "";

    private _frameTimeId: number = -1;

    private _endCallBack: (comp: FrameAnimComp) => void = null;
    private _frameEndCallBack: (comp?: FrameAnimComp) => void = null;

    public play(args: {
        bundleName: string;
        frameResPath: string;
        loopcount?: number;
        frameTime?: number;
        endCallBack?: (comp: FrameAnimComp) => void;
        frameEndCallBack?: (comp?: FrameAnimComp) => void;
    }): void {
        this._initView();
        if (args.bundleName && args.frameResPath) {
            this._bundleName = args.bundleName;
            this._endCallBack = args.endCallBack;
            this._frameEndCallBack = args.frameEndCallBack;
            this._playRes(args);
        } else {
            this.NodeDestroy();
        }
    }

    protected _initView(): void {
        this._sprite = this.node.getComponent(Sprite);
        if (!this._sprite) {
            this._sprite = this.node.addComponent(Sprite);
        }
    }

    public get nodeSprite(): Sprite {
        return this._sprite;
    }

    private _playRes(args: {
        bundleName: string;
        frameResPath: string;
        loopcount?: number;
        endCallBack?: (comp: FrameAnimComp) => void;
        frameEndCallBack?: (comp?: FrameAnimComp) => void;
        frameTime?: number;
    }) {
        const self = this;
        const frameTime = args.frameTime || 0.1;
        const endCallBack = args.endCallBack || this._endCallBack;
        const frameEndCallBack = args.frameEndCallBack || this._frameEndCallBack;
        let loopcount = args.loopcount || 0; //0为无限循环
        this.removeTime();

        ResLoad.dirT(args.bundleName, args.frameResPath, SpriteFrame).then((res: SpriteFrame[]) => {
            if (!this.isValid || !this._sprite?.isValid || res.length === 0) {
                this.NodeDestroy();
                return;
            }
            res.sort((a, b) => {
                const numA = parseInt(a.name.match(/\d+/)[0]);
                const numB = parseInt(b.name.match(/\d+/)[0]);
                return numA - numB;
            });
            const allCount = res.length;
            let curCount = 0;
            this._sprite.spriteFrame = res[curCount];
            this._frameTimeId = NTime.addObjTime(this, frameTime * 1000, () => {
                curCount++;
                if (curCount >= allCount) {
                    if (loopcount > 0) {
                        --loopcount;
                        if (loopcount <= 0) {
                            this.removeTime();
                            endCallBack && endCallBack(self);
                        } else {
                            curCount = 0;
                            this._sprite.spriteFrame = res[curCount];
                            frameEndCallBack && frameEndCallBack(self);
                        }
                    } else {
                        curCount = 0;
                        this._sprite.spriteFrame = res[curCount];
                    }
                } else {
                    this._sprite.spriteFrame = res[curCount];
                }
            });
        });
    }

    public resetPlay(args: {
        frameResPath: string;
        bundleName?: string;
        loopcount?: number;
        frameTime?: number;
        endCallBack?: (comp: FrameAnimComp) => void;
        frameEndCallBack?: (comp?: FrameAnimComp) => void;
    }): void {
        if (!this._sprite?.isValid) {
            this.NodeDestroy();
            return;
        }
        this.removeTime();
        this._sprite.spriteFrame = null;
        const bundleName = args.bundleName || this._bundleName;
        const loopcount = args.loopcount || 0;
        const endCallBack = args.endCallBack || this._endCallBack;
        const frameEndCallBack = args.frameEndCallBack || this._frameEndCallBack;
        this._playRes({
            bundleName,
            frameResPath: args.frameResPath,
            loopcount,
            endCallBack,
            frameEndCallBack,
            frameTime: args.frameTime
        });
    }

    public NodeDestroy(): void {
        this.removeTime();
        this._sprite.spriteFrame = null;
        this.destroy();
    }

    public removeTime(): void {
        if (this._frameTimeId !== -1) {
            this._frameTimeId = NTime.removeObjTimeById(this, this._frameTimeId);
        }
    }
}
