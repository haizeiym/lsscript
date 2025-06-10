import { _decorator, Component, ResolutionPolicy, screen, view } from "cc";
const { ccclass, property } = _decorator;

@ccclass("AdapterCanvas")
export class AdapterCanvas extends Component {
    start() {
        screen.on("window-resize", this.adapt, this);
        this.adapt();
    }

    private adapt(): void {
        const resolution = view.getDesignResolutionSize();
        let resolutionRatio = resolution.width / resolution.height;
        let winSize = view.getVisibleSize();
        let ratio = winSize.width / winSize.height;
        if (ratio > resolutionRatio) {
            view.setResolutionPolicy(ResolutionPolicy.FIXED_HEIGHT);
        } else {
            view.setResolutionPolicy(ResolutionPolicy.FIXED_WIDTH);
        }
    }

    onDestroy() {
        screen.off("window-resize", this.adapt, this);
    }
}
