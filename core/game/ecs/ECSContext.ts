import { ECSEntity } from "./ECSEntity";
import { ECSSystem } from "./ECSSystem";

export class ECSContext {
    private readonly entities: Map<number, ECSEntity> = new Map();
    private readonly systems: ECSSystem[] = [];
    private entityIdCounter = 0;

    /** 实体组件变化回调：增量更新各系统的匹配集合（已销毁实体直接忽略） */
    private readonly entityChanged = (entity: ECSEntity): void => {
        if (!this.entities.has(entity.id)) {
            return;
        }
        for (let i = 0; i < this.systems.length; i++) {
            this.systems[i].refreshEntity(entity);
        }
    };

    // 创建实体
    public createEntity(): ECSEntity {
        const entity = new ECSEntity(++this.entityIdCounter, this.entityChanged);
        this.entities.set(entity.id, entity);
        this.entityChanged(entity); // 让空过滤条件的系统也能立即匹配
        return entity;
    }

    public getEntity(id: number): ECSEntity | undefined {
        return this.entities.get(id);
    }

    // 销毁实体
    public destroyEntity(id: number): void {
        const entity = this.entities.get(id);
        if (!entity) {
            return;
        }
        this.entities.delete(id);
        for (let i = 0; i < this.systems.length; i++) {
            this.systems[i].removeEntity(entity);
        }
        entity.destroy();
    }

    // 添加系统（补扫已存在的实体）
    public addSystem(system: ECSSystem): void {
        system.init(this);
        this.systems.push(system);
        for (const entity of this.entities.values()) {
            system.refreshEntity(entity);
        }
    }

    public removeSystem(system: ECSSystem): void {
        const index = this.systems.indexOf(system);
        if (index >= 0) {
            this.systems.splice(index, 1);
            system.clearEntities();
        }
    }

    // 驱动所有系统运行（匹配列表已增量维护，每帧无过滤、无分配）
    public update(dt?: number): void {
        for (let i = 0; i < this.systems.length; i++) {
            this.systems[i].tick(dt);
        }
    }

    public clear(): void {
        for (const entity of this.entities.values()) {
            entity.destroy();
        }
        this.entities.clear();
        for (let i = 0; i < this.systems.length; i++) {
            this.systems[i].clearEntities();
        }
        this.systems.length = 0;
    }
}
