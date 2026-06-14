import { ECSComponent, ECSComponentClass } from "./ECSComponent";

export class ECSEntity {
    public readonly id: number;
    private readonly components: Map<number, ECSComponent> = new Map();
    /** 组件增删时通知 Context，用于维护各系统的匹配列表 */
    private readonly onChanged: (entity: ECSEntity) => void;
    private _destroyed = false;

    constructor(id: number, onChanged: (entity: ECSEntity) => void) {
        this.id = id;
        this.onChanged = onChanged;
    }

    public get destroyed(): boolean {
        return this._destroyed;
    }

    /** 添加组件；若同类型组件已存在则覆盖 */
    public addComponent<T extends ECSComponent>(componentClass: ECSComponentClass<T>): T {
        if (this._destroyed) {
            console.warn(`[ECS] addComponent on destroyed entity ${this.id}`);
        }
        const comp = new componentClass();
        this.components.set(componentClass.typeId, comp);
        this.onChanged(this);
        return comp;
    }

    public getComponent<T extends ECSComponent>(componentClass: ECSComponentClass<T>): T | null {
        return (this.components.get(componentClass.typeId) as T) ?? null;
    }

    public hasComponent(componentClass: ECSComponentClass): boolean {
        return this.components.has(componentClass.typeId);
    }

    public hasAllComponents(componentClasses: readonly ECSComponentClass[]): boolean {
        for (let i = 0; i < componentClasses.length; i++) {
            if (!this.components.has(componentClasses[i].typeId)) {
                return false;
            }
        }
        return true;
    }

    public removeComponent(componentClass: ECSComponentClass): void {
        if (this.components.delete(componentClass.typeId)) {
            this.onChanged(this);
        }
    }

    /** @internal 由 ECSContext.destroyEntity 调用，外部请使用 context.destroyEntity(id) */
    public destroy(): void {
        this._destroyed = true;
        this.components.clear();
    }
}
