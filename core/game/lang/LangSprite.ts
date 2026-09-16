import { _decorator, Button, CCString, Component, Node, Sprite, SpriteFrame } from "cc";
import { EDITOR } from "cc/env";
import { ResLoad } from "../../ResMgr";
import { eventsOnLoad, preloadEvent } from "../BaseDescriptor";
import { GEventName } from "../GEventsName";
import { LangMgr } from "./LangMgr";
const { ccclass, property, requireComponent, disallowMultiple, executeInEditMode } = _decorator;

declare const require: any;
declare const Editor: any;
const fs = EDITOR ? require("fs") : null;
const path = EDITOR ? require("path") : null;

/**
 * 多语言图片组件
 * 1. 通常挂载在以 Langi 开头的节点上
 * 2. 编辑器模式下根据引用的图片自动获取与更新 bundleName 和 langPath
 */
@eventsOnLoad()
@ccclass("LangSprite")
@executeInEditMode
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
    private _lastSpriteFrame: SpriteFrame = null;
    private _isUpdatingMeta: boolean = false;

    public changeBundleName(bundleName: string) {
        this._bundleName = bundleName;
        this._updateSprite();
    }

    public changeUrl(key: string, langPath: string) {
        this._langKey = key;
        if (langPath) {
            this._langPath = langPath;
        }
        this._updateSprite();
    }

    protected onLoad(): void {
        if (EDITOR) {
            this._lastSpriteFrame = this.getComponent(Sprite)?.spriteFrame || null;
            this._autoUpdateBundleAndLangPath();
            return;
        }
        if (this.isOnLoad) {
            this._updateSprite();
        }
    }

    protected update(dt: number): void {
        if (EDITOR) {
            const currentFrame = this.getComponent(Sprite)?.spriteFrame || null;
            if (currentFrame !== this._lastSpriteFrame) {
                this._lastSpriteFrame = currentFrame;
                this._autoUpdateBundleAndLangPath();
            }
        }
    }

    public onValidate(): void {
        if (EDITOR) {
            const currentFrame = this.getComponent(Sprite)?.spriteFrame || null;
            if (currentFrame !== this._lastSpriteFrame) {
                this._lastSpriteFrame = currentFrame;
                this._autoUpdateBundleAndLangPath();
            }
        }
    }

    public resetInEditor(): void {
        if (EDITOR) {
            this._lastSpriteFrame = this.getComponent(Sprite)?.spriteFrame || null;
            this._autoUpdateBundleAndLangPath();
        }
    }

    /**
     * 在编辑器模式下根据 Sprite 引用的图片自动更新 bundleName 和 langPath
     */
    private async _autoUpdateBundleAndLangPath() {
        if (!EDITOR) return;
        if (this._isUpdatingMeta) return;

        const sprite = this.getComponent(Sprite);
        const spriteFrame = sprite?.spriteFrame;

        if (!spriteFrame) {
            this._bundleName = "";
            this._langPath = "";
            return;
        }

        this._isUpdatingMeta = true;
        try {
            const filePath = await this._getSpriteFrameFilePath(spriteFrame);
            if (filePath) {
                const bundleInfo = LangSprite.findBundleInfo(filePath);
                if (bundleInfo) {
                    this._bundleName = bundleInfo.bundleName;
                    this._langPath = LangSprite.resolveLangPath(bundleInfo.bundleDir, filePath);
                } else {
                    this._bundleName = "";
                    this._langPath = "";
                }
            }
        } catch (err) {
            console.warn("[LangSprite] 自动获取 bundleName / langPath 失败:", err);
        } finally {
            this._isUpdatingMeta = false;
        }
    }

    /**
     * 在编辑器模式下获取 SpriteFrame 对应的图片文件物理路径
     */
    private async _getSpriteFrameFilePath(spriteFrame: SpriteFrame): Promise<string> {
        if (!spriteFrame) return "";
        const uuid = (spriteFrame as any)._uuid || (spriteFrame as any).uuid;
        if (!uuid) return "";

        let filePath = "";
        if (typeof Editor !== "undefined" && Editor?.Message?.request) {
            try {
                let assetInfo = await Editor.Message.request("asset-db", "query-asset-info", uuid);
                if ((!assetInfo || !assetInfo.file) && typeof uuid === "string" && uuid.includes("@")) {
                    assetInfo = await Editor.Message.request("asset-db", "query-asset-info", uuid.split("@")[0]);
                }
                if (assetInfo) {
                    filePath = assetInfo.file || "";
                    if (!filePath && assetInfo.path && path) {
                        const projectPath = Editor.Project?.path;
                        if (projectPath && assetInfo.path.startsWith("db://assets/")) {
                            filePath = path.join(
                                projectPath,
                                "assets",
                                assetInfo.path.substring("db://assets/".length)
                            );
                        }
                    }
                }
            } catch (err) {
                console.warn("[LangSprite] query-asset-info 异常:", err);
            }
        }

        return filePath;
    }

    /**
     * 根据图片绝对路径向上查找父级目录的 .meta 文件，确定 bundle 目录和 bundleName
     */
    public static findBundleInfo(filePath: string): { bundleDir: string; bundleName: string } | null {
        if (!fs || !path || !filePath) return null;
        try {
            let currentDir = path.dirname(filePath);
            while (currentDir && currentDir !== "/" && path.basename(currentDir) !== "") {
                if (path.basename(currentDir) === "assets") {
                    break;
                }
                const metaPath = currentDir + ".meta";
                if (fs.existsSync(metaPath)) {
                    try {
                        const metaContent = fs.readFileSync(metaPath, "utf-8");
                        const metaJson = JSON.parse(metaContent);
                        if (metaJson && metaJson.userData && metaJson.userData.isBundle === true) {
                            let bundleName = "";
                            if (
                                typeof metaJson.userData.bundleName === "string" &&
                                metaJson.userData.bundleName.trim() !== ""
                            ) {
                                bundleName = metaJson.userData.bundleName.trim();
                            } else {
                                bundleName = path.basename(currentDir);
                            }
                            return { bundleDir: currentDir, bundleName };
                        }
                    } catch (e) {
                        console.warn("[LangSprite] 解析 meta 文件失败:", metaPath, e);
                    }
                }
                const parentDir = path.dirname(currentDir);
                if (parentDir === currentDir) break;
                currentDir = parentDir;
            }
        } catch (err) {
            console.warn("[LangSprite] 查找 Bundle 目录异常:", err);
        }
        return null;
    }

    /**
     * 根据 bundle 目录和图片路径，截取 langPath
     * 规则：A->B->C->zh->c.png，如 A 为 bundle 目录，则 langPath 为 B/C
     */
    public static resolveLangPath(bundleDir: string, filePath: string): string {
        if (!bundleDir || !filePath || !path) return "";
        const rel = path.relative(bundleDir, filePath).replace(/\\/g, "/");
        const parts = rel.split("/").filter(Boolean);
        // 移除文件名 (例如 c.png)
        parts.pop();

        const langSet = new Set([
            "zh",
            "en",
            "tc",
            "tw",
            "hk",
            "vn",
            "vi",
            "id",
            "th",
            "ja",
            "ko",
            "de",
            "es",
            "fr",
            "ru",
            "pt",
            "my",
            "ar",
            "hi",
            "zh-cn",
            "zh-tw",
            "zh_cn",
            "zh_tw",
            "en-us",
            "en_us"
        ]);
        if (LangMgr.lang) {
            langSet.add(LangMgr.lang.toLowerCase());
        }

        // 优先在路径分段中匹配已知语言目录
        let langIndex = -1;
        for (let i = 0; i < parts.length; i++) {
            if (langSet.has(parts[i].toLowerCase())) {
                langIndex = i;
                break;
            }
        }

        if (langIndex >= 0) {
            return parts.slice(0, langIndex).join("/");
        }

        // 若未匹配到已知语言目录，默认以文件直接上级目录作为语言目录
        return parts.slice(0, -1).join("/");
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
