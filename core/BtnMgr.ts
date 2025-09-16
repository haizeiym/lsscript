import { Button, Component, Node } from "cc";

export type BtnCallback = (btn?: Node | Button) => void;

export class Btn {
    private static _commonBtnCallback: BtnCallback; //全部按钮公共方法
    private static _targetBtnCallback: Map<Component, BtnCallback> = new Map(); //当前target按钮公共方法

    public static setCommonBtnCallback(callback: BtnCallback) {
        this._commonBtnCallback = callback;
    }

    public static setTargetBtnCallback(target: Component, callback: BtnCallback) {
        this._targetBtnCallback.set(target, callback);
    }

    public static removeTargetBtnCallback(target: Component) {
        this._targetBtnCallback.delete(target);
    }

    public static clickBtn(target: Component, btnNode: Node | Button, callback: BtnCallback) {
        if (btnNode instanceof Button) btnNode = btnNode.node;
        btnNode.off(Button.EventType.CLICK);
        btnNode.on(
            Button.EventType.CLICK,
            () => {
                this._commonBtnCallback && this._commonBtnCallback();
                this._targetBtnCallback.get(target)?.();
                callback.apply(target, [btnNode]);
            },
            target
        );
    }
}
