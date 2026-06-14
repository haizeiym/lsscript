import { ECSComponentClass } from "./ECSComponent";
import type { ECSContext } from "./ECSContext";
import { ECSEntity } from "./ECSEntity";

export abstract class ECSSystem {
    protected context!: ECSContext;
    /** 由 Context 在实体/组件变化时增量维护的匹配实体集合，update 时零过滤成本 */
    private readonly matched: Set<ECSEntity> = new Set();

    /**
     * 系统关心的组件类型组合。
     * 建议用字段实现（readonly filterComponents = [CompA, CompB]），避免 getter 重复创建数组。
     */
    public abstract readonly filterComponents: readonly ECSComponentClass[];

    /** 每帧更新逻辑，entities 为已匹配 filterComponents 的实体集合；dt 可选，按需使用 */
    public abstract update(entities: ReadonlySet<ECSEntity>, dt?: number): void;

    public init(context: ECSContext): void {
        this.context = context;
    }

    /** @internal 实体组件变化时由 Context 调用，重新评估匹配关系 */
    public refreshEntity(entity: ECSEntity): void {
        if (entity.hasAllComponents(this.filterComponents)) {
            this.matched.add(entity);
        } else {
            this.matched.delete(entity);
        }
    }

    /** @internal 实体销毁时由 Context 调用 */
    public removeEntity(entity: ECSEntity): void {
        this.matched.delete(entity);
    }

    /** @internal 每帧由 Context 调用 */
    public tick(dt?: number): void {
        this.update(this.matched, dt);
    }

    /** @internal 系统被移除或 Context 清空时由 Context 调用 */
    public clearEntities(): void {
        this.matched.clear();
    }
}
