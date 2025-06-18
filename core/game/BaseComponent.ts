import { _decorator, Button, Component, instantiate, Node, Prefab, UIOpacity, UITransform } from "cc";
import { BindUI } from "../BindUI";
import { Btn } from "../BtnMgr";
import { Events } from "../EventMgr";
import { NCountFn, NTime } from "../NMgr";
import { ResLoad } from "../ResMgr";
const { ccclass, property } = _decorator;

@ccclass("BaseComponent")
export class BaseComponent extends Component {
    public MData: any = Object.create(null); //防止循环引用中间数据

    private _bindUis: BindUI[] = [];

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

    protected _addClick(node: Node | Button, callback: () => void) {
        Btn.clickBtn(this, node, callback);
    }

    protected _addCommonClick(callback: () => void) {
        Btn.setTargetBtnCallback(this, callback);
    }

    protected _getCountFn(count: number, setEndCall?: () => void): NCountFn {
        const countFn = new NCountFn(count);
        countFn.setEndCall(setEndCall);
        return countFn;
    }

    public addEvent(eName: string, callback: (...args: unknown[]) => void) {
        Events.on(eName, callback, this);
    }

    public resetComponent() {
        NTime.removeObjTime(this);
        Events.clearTarget(this);
        Btn.removeTargetBtnCallback(this);
        this.node.targetOff(this);
        this.MData = Object.create(null);
        this.clearUI();
    }

    public NodeDestroy() {
        if (!this.isValid) return;
        this._destroyBefore();
        this.resetComponent();
        this.node.destroy();
    }

    private clearUI() {
        for (const bUI of this._bindUis) {
            bUI.Clear();
        }
        this._bindUis = [];
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

    public static syncCreate(pn: Prefab | Node, args: any, mData?: any): BaseComponent {
        const node = pn instanceof Prefab ? instantiate(pn) : pn;
        const component = node.getComponent(BaseComponent);
        if (mData) {
            component.MData = Object.assign(Object.create(null), component.MData, mData);
        }
        component.setInit(args);
        return component;
    }

    public static syncCompT<T extends BaseComponent>(
        comp: new (...args: any[]) => T,
        pn: Prefab | Node,
        args: any,
        mData?: any
    ): T {
        const node = pn instanceof Prefab ? instantiate(pn) : pn;
        const component = node.getComponent(comp);
        if (mData) {
            component.MData = Object.assign(Object.create(null), component.MData, mData);
        }
        component.setInit(args);
        return component;
    }
}
