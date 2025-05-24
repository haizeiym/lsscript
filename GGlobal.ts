import { Button, Node } from "cc";
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
    }
}
