import { _decorator, Component, screen, view } from "cc";
import { GG } from "./GGlobal";
const { ccclass, property } = _decorator;

@ccclass("AdapterCanvas")
export class AdapterCanvas extends Component {
    start() {
        screen.on("window-resize", this.adapt, this);
    }

    private adapt(): void {
        GG.canvasExtra.adapt(view.getDesignResolutionSize());
    }

    onDestroy() {
        screen.off("window-resize", this.adapt, this);
    }
}
