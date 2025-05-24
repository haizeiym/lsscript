import { _decorator, Component, Label } from "cc";
import { eventsOnLoad, preloadEvent } from "../BaseDescriptor";
import { GEventName } from "../GEventsName";
import { LangMgr } from "./LangMgr";
const { ccclass, property, requireComponent, disallowMultiple } = _decorator;

@eventsOnLoad()
@ccclass("LangLabel")
@requireComponent(Label)
@disallowMultiple
export class LangLabel extends Component {
    private _langKey: string = ""; //格式：Langt开头

    public get langKey(): string {
        return this._langKey;
    }

    public set langKey(value: string) {
        this._langKey = value;
        this.updateText();
    }

    private _label: Label = null;

    protected onLoad() {
        this._label = this.getComponent(Label);
        let key = this.node.name.substring(5); //格式：Langt开头
        if (key) {
            this.langKey = key;
        }
    }

    @preloadEvent(GEventName.LangChange)
    public updateLabel() {
        this.updateText();
    }

    private updateText() {
        if (this._label && this._langKey) {
            this._label.string = LangMgr.instance.getText(this._langKey);
        }
    }
}
