import { Button, Node, Widget } from "cc";
import { GAudio } from "./core/game/GAudio";
import { LangLabel } from "./core/game/lang/LangLabel";
import { LangSprite } from "./core/game/lang/LangSprite";
import { GameData } from "./GameData";

export namespace GG {
    export class clsExtra {
        private static _initAudio: boolean = false;
        private static _isPlayAudio: boolean = false;
        static get isPlayAudio(): boolean {
            if (!this._initAudio) {
                this._initAudio = true;
                this._isPlayAudio = GameData.getVoiceState();
            }
            return this._isPlayAudio;
        }

        static set isPlayAudio(value: boolean) {
            this._isPlayAudio = value;
            GameData.setVoiceState(value);
            GAudio.setIsStop(!value);
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
         * @param useInit 是否使用初始化key
         */
        static changiLangKey(node: Node, key: string, useInit: boolean = true) {
            let ls = node.getComponent(LangSprite);
            if (ls) {
                if (useInit) {
                    ls.changeUrl(`${ls.initLangKey}${key}`);
                } else {
                    ls.changeUrl(key);
                }
            }
        }

        /**
         * 多语言文字设置
         * @param node 节点
         * @param key 多语言key
         */
        static changtLangKey(node: Node, key: string) {
            let ls = node.getComponent(LangLabel);
            if (ls) {
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
    }
}
