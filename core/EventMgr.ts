interface eData {
    isOnce: boolean;
    target?: any;
    callback: (...args: unknown[]) => void;
}

const targetEventMap = new WeakMap<any, Set<string>>();

export class Events {
    private static _callbackCache = new Map<Function, Map<string, Map<any, eData>>>();

    private static _eventData: {
        events: { [eName: string]: eData[] };
    } = {
        events: Object.create(null)
    };

    public static get eventData() {
        return this._eventData;
    }

    private static _findInCache(eName: string, callback: Function, target: any): eData | undefined {
        const callbackMap = this._callbackCache.get(callback);
        if (!callbackMap) return undefined;

        const eventMap = callbackMap.get(eName);
        if (!eventMap) return undefined;

        const key = target ?? null;
        return eventMap.get(key);
    }

    private static _addToCache(eName: string, callback: Function, target: any, eData: eData): void {
        if (!this._callbackCache.has(callback)) {
            this._callbackCache.set(callback, new Map());
        }

        const callbackMap = this._callbackCache.get(callback)!;
        if (!callbackMap.has(eName)) {
            callbackMap.set(eName, new Map());
        }

        const eventMap = callbackMap.get(eName)!;
        const key = target ?? null;
        eventMap.set(key, eData);
    }

    private static _removeFromCache(eName: string, callback: Function, target: any): void {
        const callbackMap = this._callbackCache.get(callback);
        if (!callbackMap) return;

        const eventMap = callbackMap.get(eName);
        if (!eventMap) return;

        const key = target ?? null;
        eventMap.delete(key);

        // 清理空的 Map
        if (eventMap.size === 0) {
            callbackMap.delete(eName);
        }
        if (callbackMap.size === 0) {
            this._callbackCache.delete(callback);
        }
    }

    private static _addEvent(eName: string, callback: (...args: unknown[]) => void, target: any, isOnce: boolean) {
        let list = this._eventData.events[eName];
        if (!list) {
            list = this._eventData.events[eName] = [];
        }

        if (this._findInCache(eName, callback, target)) {
            console.warn(`${isOnce ? "once" : ""}事件${eName}已存在`);
            return;
        }

        const eData: eData = { isOnce, callback, target };
        list.push(eData);

        this._addToCache(eName, callback, target, eData);

        const hasTarget = target != null;
        if (hasTarget) {
            if (!targetEventMap.has(target)) {
                targetEventMap.set(target, new Set());
            }
            targetEventMap.get(target)!.add(eName);
        }
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

        this._removeFromCache(eName, callback, target);

        let writeIdx = 0;
        for (let i = 0; i < list.length; i++) {
            const item = list[i];
            const shouldKeep =
                target != null ? !(item.callback === callback && item.target === target) : item.callback !== callback;

            if (shouldKeep) {
                list[writeIdx++] = item;
            }
        }

        if (writeIdx < list.length) {
            list.length = writeIdx;
        }

        if (list.length === 0) {
            delete this._eventData.events[eName];
            if (target != null) {
                const eventSet = targetEventMap.get(target);
                if (eventSet) {
                    eventSet.delete(eName);
                }
            }
        }
    }

    static emit(eName: string, ...args: unknown[]) {
        const list = this._eventData.events[eName];
        if (!list?.length) return;

        const toRemove = new Set<eData>();

        for (const item of list) {
            try {
                if (item.target) {
                    item.callback.apply(item.target, args);
                } else {
                    item.callback(...args);
                }
            } catch (error) {
                console.error(`Event ${eName} callback error:`, error);
            }
            if (item.isOnce) toRemove.add(item);
        }

        if (toRemove.size) {
            const newList = list.filter((item) => !toRemove.has(item));
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
            this._removeFromCache(eName, item.callback, item.target);

            if (item.target != null) {
                const eventSet = targetEventMap.get(item.target);
                if (eventSet) {
                    eventSet.delete(eName);
                }
            }
        }

        delete this._eventData.events[eName];
    }

    static clearAll() {
        this._eventData = {
            events: Object.create(null)
        };
        this._callbackCache.clear();
    }
    static clearTarget(target: any) {
        const eventSet = targetEventMap.get(target);
        if (!eventSet || eventSet.size === 0) return;

        try {
            for (const eName of Array.from(eventSet)) {
                const list = this._eventData.events[eName];
                if (!list) continue;

                let writeIdx = 0;
                for (let i = 0; i < list.length; i++) {
                    const item = list[i];
                    if (item.target !== target) {
                        list[writeIdx++] = item;
                    } else {
                        this._removeFromCache(eName, item.callback, target);
                    }
                }

                if (writeIdx < list.length) {
                    list.length = writeIdx;
                }

                if (list.length === 0) {
                    delete this._eventData.events[eName];
                }
            }
        } finally {
            targetEventMap.delete(target);
        }
    }

    static listenerCount(eName: string): number {
        const list = this._eventData.events[eName];
        return list?.length ?? 0;
    }

    static has(eName: string): boolean {
        return (this._eventData.events[eName]?.length ?? 0) > 0;
    }
}
