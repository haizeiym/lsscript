export abstract class ECSComponent {
    private static nextId = 0;
    private static _typeId?: number;

    /**
     * 组件类型唯一 ID，首次访问时惰性分配。
     * 使用 hasOwnProperty 判断，确保每个子类（包括多级继承）都分配到独立 ID，
     * 而不是沿原型链继承父类的 ID。
     */
    public static get typeId(): number {
        if (!Object.prototype.hasOwnProperty.call(this, "_typeId")) {
            Object.defineProperty(this, "_typeId", { value: ++ECSComponent.nextId });
        }
        return this._typeId!;
    }
}

/** 组件类的构造器类型（带静态 typeId） */
export type ECSComponentClass<T extends ECSComponent = ECSComponent> = (new () => T) & {
    readonly typeId: number;
};
