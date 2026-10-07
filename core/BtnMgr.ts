import { Button, Component, Node } from "cc";

export type BtnNode = Node | Button;
export type BtnCallback = (btn?: BtnNode) => void;

type TargetBtn = {
    onClick?: BtnCallback;
    onBlock?: BtnCallback;
    blocked?: Set<Node>;
};

export class Btn {
    private static _commonClick: BtnCallback;
    private static _commonBlock: BtnCallback;
    private static _targets = new Map<Component, TargetBtn>();

    public static setCommonBtnCallback(callback: BtnCallback) {
        this._commonClick = callback;
    }

    public static setTargetBtnCallback(target: Component, callback: BtnCallback) {
        this._state(target).onClick = callback;
    }

    public static removeTargetBtnCallback(target: Component) {
        const state = this._targets.get(target);
        if (!state) return;
        state.onClick = undefined;
        this._drop(target, state);
    }

    public static setCommonBlockBtnCallback(callback: BtnCallback) {
        this._commonBlock = callback;
    }

    public static setTargetBlockBtnCallback(target: Component, callback: BtnCallback) {
        this._state(target).onBlock = callback;
    }

    public static removeTargetBlockBtnCallback(target: Component) {
        const state = this._targets.get(target);
        if (!state) return;
        state.onBlock = undefined;
        this._drop(target, state);
    }

    public static blockBtn(target: Component, btnNode: BtnNode | BtnNode[]) {
        const blocked = (this._state(target).blocked ??= new Set());
        this._each(btnNode, (node) => blocked.add(node));
    }

    public static unblockBtn(target: Component, btnNode: BtnNode | BtnNode[]) {
        const state = this._targets.get(target);
        const blocked = state?.blocked;
        if (!blocked) return;
        this._each(btnNode, (node) => blocked.delete(node));
        if (blocked.size === 0) state.blocked = undefined;
        this._drop(target, state);
    }

    public static unblockAllBtn(target: Component) {
        const state = this._targets.get(target);
        if (!state) return;
        state.blocked = undefined;
        this._drop(target, state);
    }

    public static clickBtn(target: Component, btnNode: BtnNode, callback: BtnCallback) {
        const node = this._node(btnNode);
        node.off(Button.EventType.CLICK);
        node.on(
            Button.EventType.CLICK,
            () => {
                const state = this._targets.get(target);
                if (state?.blocked?.has(node)) {
                    this._commonBlock?.(node);
                    state.onBlock?.(node);
                    return;
                }
                this._commonClick?.(node);
                state?.onClick?.(node);
                callback.call(target, node);
            },
            target
        );
    }

    private static _node(btn: BtnNode): Node {
        return btn instanceof Button ? btn.node : btn;
    }

    private static _each(btnNode: BtnNode | BtnNode[], fn: (node: Node) => void) {
        if (Array.isArray(btnNode)) {
            for (let i = 0, n = btnNode.length; i < n; i++) fn(this._node(btnNode[i]));
            return;
        }
        fn(this._node(btnNode));
    }

    private static _state(target: Component): TargetBtn {
        let state = this._targets.get(target);
        if (!state) this._targets.set(target, (state = {}));
        return state;
    }

    private static _drop(target: Component, state: TargetBtn) {
        if (!state.onClick && !state.onBlock && !state.blocked) this._targets.delete(target);
    }
}
