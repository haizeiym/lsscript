import { Button, Component, Label, Node, Sprite } from "cc";

export class BindUI {
    private dicBtn = new Map<string, Button>();
    private dicImg = new Map<string, Sprite>();
    private dicTxt = new Map<string, Label>();
    private dicNode = new Map<string, Node>();
    private dicLangi = new Map<string, Node>();
    private dicLangt = new Map<string, Node>();
    private _data: unknown = null;
    private bNode: Node = null;

    // 缓存组件类型，避免重复创建
    private static readonly ButtonType = Button;
    private static readonly SpriteType = Sprite;
    private static readonly LabelType = Label;

    public static Creator(node: Node, isDeep: boolean = false): BindUI {
        const bUI = new BindUI();
        bUI._BindUI(node, isDeep);
        return bUI;
    }

    private _BindUI(node: Node, isDeep: boolean) {
        if (!this.bNode) this.bNode = node;
        const queue: Node[] = [node];

        while (queue.length > 0) {
            const currentNode = queue.shift()!;
            const currentChildren = currentNode.children;

            for (let i = 0, len = currentChildren.length; i < len; i++) {
                const child = currentChildren[i];
                this._CollectUI(child);
                if (isDeep && child.children.length > 0) queue.push(child);
            }
        }
    }

    private _CollectUI(node: Node) {
        const name = node.name;
        if (name.startsWith("Node")) {
            this.dicNode.set(name, node);
        } else if (name.startsWith("Langi")) {
            this.dicLangi.set(name, node);
            this._setComponent<Sprite>(node, BindUI.SpriteType, this.dicImg);
        } else if (name.startsWith("Langt")) {
            this.dicLangt.set(name, node);
            this._setComponent<Label>(node, BindUI.LabelType, this.dicTxt);
        } else if (name.startsWith("Btn")) {
            this._setComponent<Button>(node, BindUI.ButtonType, this.dicBtn);
        } else if (name.startsWith("Img")) {
            this._setComponent<Sprite>(node, BindUI.SpriteType, this.dicImg);
        } else if (name.startsWith("Txt")) {
            this._setComponent<Label>(node, BindUI.LabelType, this.dicTxt);
        }
    }

    private _setComponent<T extends Component>(node: Node, com: new (...args: any[]) => T, dic: Map<string, T>) {
        const comp = node.getComponent(com);
        if (comp) dic.set(node.name, comp);
    }

    public Btn(name: string): Button {
        return this.dicBtn.get(name);
    }

    public Txt(name: string): Label {
        return this.dicTxt.get(name);
    }

    public Img(name: string): Sprite {
        return this.dicImg.get(name);
    }

    private _getNodeAndBind<T extends Node>(node: T | null, isDeep: boolean, bindOnce: boolean = false): T | null {
        if (!node) return null;
        this._BindUI(node, isDeep && !bindOnce);
        return node;
    }

    public NodeT<T extends Component>(name: string, com: new (...args: any[]) => T, isDeep: boolean = false): T | null {
        const node = this.dicNode.get(name);
        if (!node) return null;
        if (isDeep) this._BindUI(node, true);
        return node.getComponent(com);
    }

    public Node(name: string, isDeep: boolean = false): Node | null {
        return this._getNodeAndBind(this.dicNode.get(name), isDeep);
    }

    public NodeOnce(name: string): Node | null {
        return this._getNodeAndBind(this.dicNode.get(name), false, true);
    }

    public Langt(name: string, isDeep: boolean = false): Node | null {
        return this._getNodeAndBind(this.dicLangt.get(name), isDeep);
    }

    public Langi(name: string, isDeep: boolean = false): Node | null {
        return this._getNodeAndBind(this.dicLangi.get(name), isDeep);
    }

    public get Langis(): Node[] {
        return Array.from(this.dicLangi.values());
    }

    public get Btns(): Button[] {
        return Array.from(this.dicBtn.values());
    }

    public get Nodes(): Node[] {
        return Array.from(this.dicNode.values());
    }

    public get Txts(): Label[] {
        return Array.from(this.dicTxt.values());
    }

    public get Imgs(): Sprite[] {
        return Array.from(this.dicImg.values());
    }

    public get BNode(): Node {
        return this.bNode;
    }

    public set Data(data: unknown) {
        this._data = data;
    }

    public get Data(): unknown {
        return this._data;
    }

    public Clear() {
        this.dicTxt.clear();
        this.dicImg.clear();
        this.dicBtn.clear();
        this.dicNode.clear();
        this.dicLangi.clear();
        this.dicLangt.clear();
        this._data = null;
        this.bNode = null;
    }
}
