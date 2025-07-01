import { _decorator, Button, Component, instantiate, Node, Prefab, UIOpacity, UITransform } from "cc";
import { BindUI } from "../BindUI";
import { Btn } from "../BtnMgr";
import { Events } from "../EventMgr";
import { NCountFn, NTime } from "../NMgr";
import { ResLoad } from "../ResMgr";
const { ccclass, property } = _decorator;

@ccclass("BaseComponent")
export class BaseComponent extends Component {
    private _mData: any = null;

    public set MData(value: any) {
        this._mData = value;
    }

    public get MData() {
        if (!this._mData) this._mData = Object.create(null);
        return this._mData;
    }

    private _bindUis: BindUI[] = null;

    private _countFns: NCountFn[] = null;

    // _setInit --- onLoad --- start
    protected _setInit(parent: Node, beforeParentCall?: (arg?: any) => void): void {
        this.init();
        beforeParentCall && beforeParentCall(this);
        this.node.setParent(parent);
    }

    protected start(): void {
        this._start();
    }

    protected init(): void {
        this._initView();
        this._initData();
        this._initEvent();
    }

    protected _getUI(node: Node, isDeep: boolean = false): BindUI {
        let bUI = BindUI.Creator(node, isDeep);
        if (!this._bindUis) this._bindUis = [];
        this._bindUis.push(bUI);
        return bUI;
    }

    protected _addTime(duration: number, loopcall: () => void, loopcount?: number, endcall?: () => void): number {
        return NTime.addObjTime(this, duration * 1000, loopcall, loopcount, endcall);
    }

    protected _addTimeOnce(duration: number, callback: () => void): number {
        return NTime.addObjTimeOnce(this, duration * 1000, callback);
    }

    protected _removeTime(id: number) {
        NTime.removeObjTimeById(this, id);
    }

    protected _addEventOnce(eName: string, callback: (...args: unknown[]) => void) {
        Events.once(eName, callback, this);
    }

    protected _emit(eName: string, ...args: unknown[]) {
        Events.emit(eName, ...args);
    }

    protected _UIT(node?: Node): UITransform {
        if (!node) node = this.node;
        let transform = node.getComponent(UITransform);
        if (!transform) {
            transform = node.addComponent(UITransform);
        }
        return transform;
    }

    protected _UIO(node?: Node): UIOpacity {
        if (!node) node = this.node;
        let opacity = node.getComponent(UIOpacity);
        if (!opacity) {
            opacity = node.addComponent(UIOpacity);
        }
        return opacity;
    }

    protected _addClick(node: Node | Button, callback: (btn?: Button) => void) {
        Btn.clickBtn(this, node, callback);
    }

    protected _addCommonClick(callback: (btn?: Button) => void) {
        Btn.setTargetBtnCallback(this, callback);
    }

    protected _getCountFn(count: number, setEndCall?: () => void): NCountFn {
        const countFn = new NCountFn(count);
        countFn.setEndCall(setEndCall);
        if (!this._countFns) this._countFns = [];
        this._countFns.push(countFn);
        return countFn;
    }

    public addEvent(eName: string, callback: (...args: unknown[]) => void) {
        Events.on(eName, callback, this);
    }

    public resetComponent() {
        NTime.removeObjTime(this);
        Events.clearTarget(this);
        Btn.removeTargetBtnCallback(this);
        this.MData = null;
        this.clearCountFn();
        this.clearUI();
    }

    public NodeDestroy() {
        if (this.isValid) {
            this._destroyBefore();
            this.resetComponent();
            this.destroy();
        }

        if (this.node?.isValid) {
            this.node.destroy();
        }
    }

    private clearCountFn() {
        if (!this._countFns) return;
        for (const countFn of this._countFns) {
            countFn.reset();
            countFn.setEndCall(null);
        }
        this._countFns = null;
    }

    private clearUI() {
        if (!this._bindUis) return;
        for (const bUI of this._bindUis) {
            bUI.Clear();
        }
        this._bindUis = null;
    }

    public setInit(args?: unknown, args1?: unknown, args2?: unknown): void {
        if (args instanceof Node && !args1 && !args2) {
            this._setInit(args);
        }
    }

    protected _destroyBefore() {}

    protected _initView() {}

    protected _initData() {}

    protected _initEvent() {}

    protected _start() {}

    public static asyncCreate(BName: string, PPath: string, args: any, mData?: any): Promise<BaseComponent | null> {
        return Promise.resolve(
            ResLoad.prefab(BName, PPath).then((prefab) => {
                if (args instanceof Node) {
                    if (!args.isValid) {
                        return null;
                    }
                } else {
                    if (!args.parent?.isValid) {
                        return null;
                    }
                    if (!args.bundleName) {
                        args.bundleName = BName;
                    }
                }
                const component = instantiate(prefab).getComponent(BaseComponent);
                if (mData) {
                    component.MData = Object.assign(Object.create(null), component.MData, mData);
                }
                component.setInit(args);
                return component;
            })
        );
    }

    public static syncCreate<T extends BaseComponent>(pn: Prefab | Node, args: any, mData?: any): T {
        const node = pn instanceof Prefab ? instantiate(pn) : pn;
        const component = node.getComponent(BaseComponent);
        if (mData) {
            component.MData = Object.assign(Object.create(null), component.MData, mData);
        }
        component.setInit(args);
        return component as T;
    }
}
