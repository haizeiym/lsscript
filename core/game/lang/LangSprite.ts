import { _decorator, Button, Component, Node, Sprite, SpriteFrame } from "cc";
import { ResLoad } from "../../ResMgr";
import { eventsOnLoad, preloadEvent } from "../BaseDescriptor";
import { GEventName } from "../GEventsName";
import { LangMgr } from "./LangMgr";
const { ccclass, property, requireComponent, disallowMultiple } = _decorator;

/**
 * 多语言图片手动添加到名称以Langi开头的节点上
 */
@eventsOnLoad()
@ccclass("LangSprite")
@requireComponent(Sprite)
@disallowMultiple
export class LangSprite extends Component {
    private _initLangKey: string = "";
    private _langKey: string = "";
    private _langPath: string = "";
    private _bundleName: string = "";

    private _sprite: Sprite = null;
    private _btn: Button = null;

    public changeBundleName(bundleName: string) {
        this._bundleName = bundleName;
        this._updateSprite();
    }

    public changeUrl(key: string, langPath: string = "lang") {
        this._langKey = key;
        this._langPath = langPath;
        this._updateSprite();
    }

    public get langKey() {
        return this._langKey;
    }

    public get langPath() {
        return this._langPath;
    }

    public get initLangKey() {
        return this._initLangKey;
    }

    @preloadEvent(GEventName.LangChange)
    public updateLangSprite() {
        // 只在语言改变时更新
        this._updateSprite();
        this.setBtnStateSpr(this._btn);
    }

    private async _updateSprite() {
        const spriteFrame = await this._getSpriteFrame();
        if (spriteFrame) {
            this._sprite.spriteFrame = spriteFrame;
        }
    }

    private async _getSpriteFrame(langKey: string = this._langKey, langPath: string = this._langPath): Promise<SpriteFrame> {
        return await ResLoad.spriteFrame(this._bundleName, `${langPath}/${LangMgr.lang}/${langKey}`);
    }

    public async setBtnStateSpr(btn: Button, suffix: string = "un", suffixDis: string = "dis") {
        if (btn && btn.isValid && btn.target === this.node && btn.transition === Button.Transition.SPRITE) {
            if (!this._btn) this._btn = btn;
            let spr = await this._getSpriteFrame();
            if (spr) {
                btn.normalSprite = spr;
                btn.hoverSprite = spr;
            }
            spr = await this._getSpriteFrame(`${this._langKey}${suffix}`);
            if (!spr) spr = btn.normalSprite;
            if (spr) btn.pressedSprite = spr;
            spr = await this._getSpriteFrame(`${this._langKey}${suffixDis}`);
            if (!spr) spr = btn.normalSprite;
            if (spr) btn.disabledSprite = spr;
        }
    }

    /**
     * 手动添加多语言图片
     * @param parnet 父节点
     * @param bundleName 资源包名称
     * @param langPath 语言路径
     */
    public static add(parnet: Node, bundleName: string, langPath: string = "lang") {
        const name = parnet.name;
        const key = name.substring(5); //节点以Langi开头
        if (!key) {
            console.error(`LangSprite add: ${name} 名称格式错误`);
            return;
        }
        let ls = parnet.getComponent(LangSprite);
        if (!ls) ls = parnet.addComponent(LangSprite);
        ls._sprite = ls.getComponent(Sprite);
        if (!ls._sprite) ls._sprite = ls.addComponent(Sprite)!;
        ls._langKey = key;
        ls._initLangKey = key;
        ls._langPath = langPath;
        ls._bundleName = bundleName;
        ls._updateSprite();
    }
}
