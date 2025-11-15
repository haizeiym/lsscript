interface eData {
    isOnce: boolean;
    target?: any;
    callback: (...args: unknown[]) => void;
}

export class Events {
    private static _eventData: {
        events: { [eName: string]: eData[] };
        targets: { [targetId: string]: Set<string> };
    } = {
        events: Object.create(null),
        targets: Object.create(null)
    };

    public static get eventData() {
        return this._eventData;
    }

    private static _addEvent(eName: string, callback: (...args: unknown[]) => void, target: any, isOnce: boolean) {
        let list = this._eventData.events[eName];
        if (!list) {
            list = this._eventData.events[eName] = [];
        }

        const hasTarget = target != null;
        if (list.some((ed) => ed.callback === callback && (hasTarget ? ed.target === target : ed.target == null))) {
            console.warn(`${isOnce ? "once" : ""}事件${eName}已存在`);
            return;
        }

        list.push({ isOnce, callback, target });

        if (hasTarget) {
            const targetId = this._getTargetKey(target);
            if (!this._eventData.targets[targetId]) {
                this._eventData.targets[targetId] = new Set();
            }
            this._eventData.targets[targetId].add(eName);
        }
    }

    private static _getTargetKey(target: any): string {
        return target.uuid ?? target._id;
    }

    static on(eName: string, callback: (...args: unknown[]) => void, target?: any) {
        this._addEvent(eName, callback, target, false);
    }

    static once(eName: string, callback: (...args: unknown[]) => void, target?: any) {
        this._addEvent(eName, callback, target, true);
    }

    static off(eName: string, callback: (...args: unknown[]) => void, target?: any) {
        const list = this._eventData.events[eName];
        if (!list) return;

        const newList = list.filter((item) =>
            target ? !(item.callback === callback && item.target === target) : item.callback !== callback
        );

        if (newList.length === 0) {
            delete this._eventData.events[eName];
            if (target != null) {
                const targetId = this._getTargetKey(target);
                const eventSet = this._eventData.targets[targetId];
                if (eventSet) {
                    eventSet.delete(eName);
                    if (eventSet.size === 0) {
                        delete this._eventData.targets[targetId];
                    }
                }
            }
        } else {
            this._eventData.events[eName] = newList;
        }
    }

    static emit(eName: string, ...args: unknown[]) {
        const list = this._eventData.events[eName];
        if (!list?.length) return;

        const toRemove: eData[] = [];
        const snapshot = [...list];
        for (const item of snapshot) {
            if (item.target) {
                item.callback.apply(item.target, args);
            } else {
                item.callback(...args);
            }
            if (item.isOnce) toRemove.push(item);
        }

        if (toRemove.length) {
            const toRemoveSet = new Set(toRemove);
            const newList = list.filter((item) => !toRemoveSet.has(item));
            if (newList.length === 0) {
                delete this._eventData.events[eName];
            } else {
                this._eventData.events[eName] = newList;
            }
        }
    }

    static clear(eName: string) {
        const list = this._eventData.events[eName];
        if (!list) return;

        for (const item of list) {
            if (item.target != null) {
                const targetId = this._getTargetKey(item.target);
                const eventSet = this._eventData.targets[targetId];
                if (eventSet) {
                    eventSet.delete(eName);
                    if (eventSet.size === 0) {
                        delete this._eventData.targets[targetId];
                    }
                }
            }
        }

        delete this._eventData.events[eName];
    }

    static clearAll() {
        this._eventData = {
            events: Object.create(null),
            targets: Object.create(null)
        };
    }

    static clearTarget(target: any) {
        const targetId = this._getTargetKey(target);
        const eventSet = this._eventData.targets[targetId];
        if (!eventSet) return;

        for (const eName of eventSet) {
            const list = this._eventData.events[eName];
            if (list) {
                const newList = list.filter((item) => item.target !== target);
                if (newList.length === 0) {
                    delete this._eventData.events[eName];
                } else {
                    this._eventData.events[eName] = newList;
                }
            }
        }

        delete this._eventData.targets[targetId];
    }
}
