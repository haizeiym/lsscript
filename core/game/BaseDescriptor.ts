//装饰器

import { Events } from "../EventMgr";

const _mapTarget = new Map<Function, { eName: string; fn: (...args: any[]) => void }[]>();

const targetOn = (target: any) => {
    _mapTarget.forEach((value, key) => {
        if (target instanceof key) {
            if (!value) return;
            for (let i = 0, len = value.length; i < len; i++) {
                let e = value[i];
                Events.on(e.eName, e.fn, target);
            }
        }
    });
};

const targetOff = (target: any) => {
    _mapTarget.forEach((value, key) => {
        if (target instanceof key) {
            if (!value) return;
            for (let i = 0, len = value.length; i < len; i++) {
                let e = value[i];
                Events.off(e.eName, e.fn, target);
            }
        }
    });
};

function rewrite(constructor: any, onKey: string, offKey: string): void {
    let onFunc = constructor.prototype[onKey];
    let offFunc = constructor.prototype[offKey];
    constructor.prototype[onKey] = function () {
        targetOn(this);
        onFunc && onFunc.call(this);
    };

    constructor.prototype[offKey] = function () {
        targetOff(this);
        offFunc && offFunc.call(this);
    };
}

export function eventsOnLoad(): (constructor: any) => void {
    return function (constructor: any) {
        rewrite(constructor, "onLoad", "onDestroy");
    };
}

export function preloadEvent(eName: string): (target: any, funcName: string, descriptor: PropertyDescriptor) => void {
    return function (target: any, funcName: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        const constructor = target.constructor;
        if (!constructor || typeof constructor !== "function") {
            console.error("初始化错误---constructor");
            return;
        }

        let arr = _mapTarget.get(constructor);
        if (arr === undefined) {
            arr = [];
            _mapTarget.set(constructor, arr);
        } else {
            let find = arr.find((e) => {
                return e.eName === eName && e.fn === originalMethod;
            });
            if (find) {
                console.error(`event: ${eName} 重复`);
                return;
            }
        }

        arr.push({
            eName: eName,
            fn: originalMethod
        });
    };
}
