import { _decorator, Button, CCString, Component, Node, Sprite, SpriteFrame } from "cc";
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
    @property({ displayName: "是否显示设置" })
    public isShowSetBk: boolean = true;

    @property({ displayName: "是否在onLoad时设置" })
    private isOnLoad: boolean = true;

    @property({ displayName: "资源包名称" })
    private _bundleName: string = "";
    @property({
        type: CCString,
        displayName: "资源包名称",
        visible() {
            return this.isShowSetBk;
        }
    })
    public set bundleName(value: string) {
        this._bundleName = value;
    }

    public get bundleName() {
        return this._bundleName;
    }

    @property({ displayName: "语言key" })
    private _langKey: string = "";
    @property({
        type: CCString,
        displayName: "语言key",
        visible() {
            return this.isShowSetBk;
        }
    })
    public set langKey(value: string) {
        this._langKey = value;
    }

    public get langKey() {
        if (!this._langKey) {
            if (this.node?.name.startsWith("Langi")) {
                this._langKey = this.node.name.substring(5);
            } else {
                this._langKey = this.node?.name || "";
            }
        }
        return this._langKey;
    }

    @property({ displayName: "语言路径" })
    private _langPath: string = "";
    @property({
        type: CCString,
        displayName: "语言路径",
        visible() {
            return this.isShowSetBk;
        }
    })
    public set langPath(value: string) {
        this._langPath = value;
    }

    public get langPath() {
        return this._langPath || "lang";
    }

    @property({ displayName: "初始语言key" })
    private _initLangKey: string = "";

    public get initLangKey() {
        return this._initLangKey;
    }

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

    protected onLoad(): void {
        if (this.isOnLoad) {
            this._updateSprite();
        }
    }

    @preloadEvent(GEventName.LangChange)
    public updateLangSprite() {
        this._updateSprite();
        this.setBtnStateSpr(this._btn);
    }

    private async _updateSprite() {
        const spriteFrame = await this._getSpriteFrame();
        if (spriteFrame && this.isValid) {
            if (!this._sprite) this._sprite = this.getComponent(Sprite);
            this._sprite.spriteFrame = spriteFrame;
        }
    }

    private async _getSpriteFrame(
        langKey: string = this.langKey,
        langPath: string = this.langPath,
        bundleName: string = this.bundleName
    ): Promise<SpriteFrame> {
        if (!langKey || !bundleName) {
            console.warn(`langKey:${langKey}-bundleName:${bundleName}`);
            return null;
        }
        return await ResLoad.spriteFrame(bundleName, `${langPath}/${LangMgr.lang}/${langKey}`, true);
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

    public setBk(bundleName: string, langKey: string, langPath: string = "lang") {
        this._bundleName = bundleName;
        this._langKey = langKey;
        this._langPath = langPath;
        if (!this._sprite) this._sprite = this.getComponent(Sprite);
        if (!this._sprite) this._sprite = this.addComponent(Sprite)!;
        this._updateSprite();
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
        ls.isOnLoad = false;
        ls._sprite = ls.getComponent(Sprite);
        if (!ls._sprite) ls._sprite = ls.addComponent(Sprite)!;
        ls._langKey = key;
        ls._initLangKey = key;
        ls._langPath = langPath;
        ls._bundleName = bundleName;
        ls._updateSprite();
    }
}
