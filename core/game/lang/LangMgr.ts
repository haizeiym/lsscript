import { Events } from "../../EventMgr";
import { ResLoad } from "../../ResMgr";
import { Tools } from "../../ToolsMgr";
import { GEventName } from "../GEventsName";
export class LangMgr {
    private static _instance: LangMgr = null;
    private static _lang: string = "";
    private static _txtBundlerName: string = "";

    private _langTxtData: { [key: string]: string } = {};
    private _langTxtKey: { [key: string]: string } = {};

    public static get instance(): LangMgr {
        if (!this._instance) {
            this._instance = new LangMgr();
        }
        return this._instance;
    }

    public static get keys(): { [key: string]: string } {
        return this._instance._langTxtKey;
    }

    public static get lang(): string {
        return this._lang;
    }

    public static set lang(value: string) {
        if (this._lang !== value) {
            this._lang = value;
            this.instance.loadLangData();
        }
    }

    public static get txtBundlerName(): string {
        return this._txtBundlerName;
    }

    public static set txtBundlerName(value: string) {
        if (this._txtBundlerName !== value) {
            this._txtBundlerName = value;
            this.instance.loadLangData();
        }
    }

    public static init(txtBundlerName: string, lang: string) {
        this._lang = lang;
        this._txtBundlerName = txtBundlerName;
        this.instance.loadLangData();
    }

    private async loadLangData() {
        try {
            const jsonAsset = await ResLoad.json(LangMgr._txtBundlerName, `${LangMgr.lang}`);
            if (jsonAsset) {
                this._langTxtData = jsonAsset.json;
                this._langTxtKey = Object.keys(this._langTxtData).reduce((acc, key) => {
                    acc[key] = key;
                    return acc;
                }, {} as { [key: string]: string });
                Events.emit(GEventName.LangChange);
            }
        } catch (error) {
            console.error(`Failed to load language data: ${error}`);
        }
    }

    public getText(key: string, ...option: [Record<string, string | number>] | Array<string | number>): string {
        const text = this._langTxtData[key];
        if (text) {
            return Tools.formatString(text, ...option);
        }
        return `${key}（未配置）`;
    }
}
