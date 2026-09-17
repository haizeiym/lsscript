import { AudioClip, Button, Node, ResolutionPolicy, Size, Widget, gfx, screen, view } from "cc";
import { lsGameData } from "./LSGameData";
import { GAudio } from "./core/game/GAudio";
import { LangLabel } from "./core/game/lang/LangLabel";
import { LangSprite } from "./core/game/lang/LangSprite";

export namespace GG {
    const urlAlphabet = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";

    export const nanoid = (size = 21) => {
        let id = "";
        let i = size;
        while (i--) {
            id += urlAlphabet[(Math.random() * 64) | 0];
        }
        return id;
    };

    export class webgl {
        static gl(): WebGLRenderingContext | WebGL2RenderingContext {
            return gfx.Device.canvas.getContext("webgl2") || gfx.Device.canvas.getContext("webgl");
        }

        static isASTCSupported(gl?: WebGLRenderingContext | WebGL2RenderingContext) {
            if (!gl) {
                gl = this.gl();
            }
            const ext =
                gl.getExtension("WEBGL_compressed_texture_astc") ||
                gl.getExtension("WEBKIT_WEBGL_compressed_texture_astc") ||
                gl.getExtension("MOZ_WEBGL_compressed_texture_astc");

            if (!ext) {
                return false;
            }

            return true;
        }

        static isPVRTCSupported(gl?: WebGLRenderingContext | WebGL2RenderingContext) {
            if (!gl) {
                gl = this.gl();
            }
            const ext =
                gl.getExtension("WEBGL_compressed_texture_pvrtc") ||
                gl.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");

            if (!ext) {
                return false;
            }
            return true;
        }
    }

    export class clsExtra {
        private static _isSyncInitAudio: boolean = false;
        private static readonly EftVolumeKey = "eftVolume";
        private static readonly BgmVolumeKey = "bgmVolume";

        static syncIsStopAudio(): boolean {
            const isStopAudio = this.getIsStopAudio();
            lsGameData.setIsStopAudio(isStopAudio);
            GAudio.stopAudio(isStopAudio);
            return isStopAudio;
        }

        static getIsStopAudio(): boolean {
            return lsGameData.getIsStopAudio();
        }

        static stopAudio(value: boolean) {
            lsGameData.setIsStopAudio(value);
            GAudio.stopAudio(value);
        }

        static pauseBgm(value: boolean) {
            GAudio.pauseBgm(value);
        }

        static stopBgm(value: boolean) {
            lsGameData.setIsStopBgm(value);
            GAudio.stopBgm(value);
        }

        static syncIsStopBgm(): boolean {
            const isStopBgm = this.getIsStopBgm();
            lsGameData.setIsStopBgm(isStopBgm);
            GAudio.stopBgm(isStopBgm);
            return isStopBgm;
        }

        static getIsStopBgm(): boolean {
            return lsGameData.getIsStopBgm();
        }

        static stopEffect(value: boolean) {
            lsGameData.setIsStopEffect(value);
            GAudio.stopEffect(value);
        }

        static syncIsStopEffect(): boolean {
            const isStopEffect = this.getIsStopEffect();
            lsGameData.setIsStopEffect(isStopEffect);
            GAudio.stopEffect(isStopEffect);
            return isStopEffect;
        }

        static getIsStopEffect(): boolean {
            return lsGameData.getIsStopEffect();
        }

        static setEftVolume(volume: number): void {
            lsGameData.setSaveData(this.EftVolumeKey, volume);
            GAudio.setEffectVolume(volume);
        }

        static setBgmVolume(volume: number): void {
            lsGameData.setSaveData(this.BgmVolumeKey, volume);
            GAudio.setBgmVolume(volume);
        }

        static getEftVolume(): number {
            return lsGameData.getSaveData(this.EftVolumeKey, 1);
        }

        static getBgmVolume(): number {
            return lsGameData.getSaveData(this.BgmVolumeKey, 1);
        }

        static async Bgm(bName: string, pName: string, isLoop: boolean = true): Promise<AudioClip> {
            this.isInitAudio();
            return await GAudio.bgm(bName, pName, isLoop);
        }

        static async Effect(bName: string, pName: string, volume: number = 1): Promise<AudioClip> {
            this.isInitAudio();
            return await GAudio.effect(bName, pName, volume);
        }

        static isInitAudio() {
            if (this._isSyncInitAudio) return;
            this._isSyncInitAudio = true;
            this.syncIsStopAudio();
            this.syncIsStopBgm();
            this.syncIsStopEffect();
        }

        /**
         * 手动添加多语言图片,有LangSprite操作要在方法之后
         * @param nodes 节点数组
         * @param bundleName 资源包名称
         * @param langPath 语言路径
         */
        static langsAdd(nodes: Node[], bundleName: string, langPath: string = "lang") {
            for (const node of nodes) {
                LangSprite.add(node, bundleName, langPath);
            }
        }

        /**
         * 按钮多语言设置
         * @param node //按钮多语言图片节点
         * @param btn  //按钮
         * @param suffix //后缀
         */
        static langBtnStateSpr(node: Node, btn: Button, suffix: string = "un", suffixDis: string = "dis") {
            node.getComponent(LangSprite)?.setBtnStateSpr(btn, suffix, suffixDis);
        }

        /**
         * 多语言图片设置
         * @param node 节点
         * @param key 多语言key
         * @param langPath 多语言路径
         */
        static changiLangKey(node: Node, key: string, langPath: string = null) {
            let ls = node.getComponent(LangSprite);
            if (ls) {
                ls.changeUrl(key, langPath);
            }
        }

        /**
         * 多语言图片设置
         * @param node 节点
         * @param key 多语言key
         * @param useInit 是否使用初始化key
         */

        static changiLangBk(args: {
            node: Node;
            bundleName: string;
            langKey?: string;
            isAddLangSprite?: boolean;
            extraLangKey?: string;
            langPath?: string;
        }) {
            let ls = args.node.getComponent(LangSprite);
            if (!ls) {
                if (args.isAddLangSprite ?? false) {
                    ls = args.node.addComponent(LangSprite);
                } else {
                    return;
                }
            }
            const langKey = args.extraLangKey ? `${args.extraLangKey}_${ls.langKey}` : (args.langKey ?? ls.langKey);
            ls.setBk(args.bundleName, langKey, args.langPath ?? "lang");
        }

        /**
         * 多语言文字设置
         * @param node 节点
         * @param key 多语言key
         */
        static changtLangKey(node: Node, key: string, option: any = null) {
            let ls = node.getComponent(LangLabel);
            if (ls) {
                ls.langOption = option;
                ls.langKey = key;
            }
        }

        /**
         * 添加Widget组件(项目切换分辨率时会自动改变尺寸，手动添加)
         * @param node 节点
         * @param dis 对齐方式
         */
        public static addWidget(
            node: Node,
            dis?: {
                top?: number;
                left?: number;
                right?: number;
                bottom?: number;
                isAlignBottom?: boolean;
                isAlignLeft?: boolean;
                isAlignRight?: boolean;
                isAlignTop?: boolean;
            }
        ): void {
            let widget = node.getComponent(Widget);
            if (!widget) {
                widget = node.addComponent(Widget);
            }
            widget.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
            widget.isAlignBottom = dis?.isAlignBottom ?? true;
            widget.isAlignLeft = dis?.isAlignLeft ?? true;
            widget.isAlignRight = dis?.isAlignRight ?? true;
            widget.isAlignTop = dis?.isAlignTop ?? true;
            widget.top = dis?.top ?? 0;
            widget.left = dis?.left ?? 0;
            widget.right = dis?.right ?? 0;
            widget.bottom = dis?.bottom ?? 0;
        }

        public static get sx(): number {
            return view.getVisibleSize().width / view.getDesignResolutionSize().width;
        }

        public static get sy(): number {
            return view.getVisibleSize().height / view.getDesignResolutionSize().height;
        }
    }

    export class canvasExtra {
        static adapt(resolution: Size | number, y?: number): void {
            if (typeof resolution === "number") {
                y = y ?? view.getDesignResolutionSize().height;
                resolution = new Size(resolution, y);
            }
            const resRatio = resolution.width / resolution.height;
            const winSize = screen.windowSize;
            const screenRatio = winSize.width / winSize.height;
            if (screenRatio > resRatio) {
                view.setDesignResolutionSize(resolution.width, resolution.height, ResolutionPolicy.FIXED_HEIGHT);
            } else {
                view.setDesignResolutionSize(resolution.width, resolution.height, ResolutionPolicy.FIXED_WIDTH);
            }
        }
    }
}
