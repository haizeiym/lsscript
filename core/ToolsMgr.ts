export namespace Tools {
    /**
     * 优化的循环方法
     * @param target 目标数组或数字
     * @param callback 回调函数，返回true可提前退出
     * @param options 配置选项
     */
    export const forEach = <T>(
        target: T[] | number,
        callback: (item: T | number, index: number) => void | boolean,
        options: {
            reverse?: boolean; // 是否反向遍历
            step?: number; // 步长
            start?: number; // 起始位置
            end?: number; // 结束位置
        } = {}
    ) => {
        const { reverse = false, step = 1, start, end } = options;

        if (typeof target === "number") {
            const startIndex = start ?? 0;
            const endIndex = end ?? target;
            const direction = reverse ? -1 : 1;

            for (
                let i = reverse ? endIndex - 1 : startIndex;
                reverse ? i >= startIndex : i < endIndex;
                i += step * direction
            ) {
                if (callback(i, i) === true) return;
            }
        } else {
            const len = target.length;
            if (!len) return;

            const startIndex = start ?? 0;
            const endIndex = end ?? len;
            const direction = reverse ? -1 : 1;

            for (
                let i = reverse ? endIndex - 1 : startIndex;
                reverse ? i >= startIndex : i < endIndex;
                i += step * direction
            ) {
                if (callback(target[i], i) === true) return;
            }
        }
    };

    /**
     * 数组处理方法，支持多种操作模式
     * @param array 目标数组
     * @param callback 回调函数
     * @param mode 处理模式
     */
    export const arrayProcess = <T>(
        array: T[],
        callback: (item: T, index: number) => void | boolean,
        mode: "pop" | "shift" | "keep" = "keep"
    ) => {
        if (!array.length) return;

        switch (mode) {
            case "pop":
                while (array.length) {
                    const index = array.length - 1;
                    if (callback(array.pop()!, index) === true) return;
                }
                break;

            case "shift":
                while (array.length) {
                    if (callback(array.shift()!, 0) === true) return;
                }
                break;

            case "keep":
                for (let i = 0, len = array.length; i < len; i++) {
                    if (callback(array[i], i) === true) return;
                }
                break;
        }
    };

    /**
     * 快速数组映射
     * @param array 源数组
     * @param mapper 映射函数
     */
    export const map = <T, R>(array: T[], mapper: (item: T, index: number) => R): R[] => {
        const result: R[] = new Array(array.length);
        for (let i = 0, len = array.length; i < len; i++) {
            result[i] = mapper(array[i], i);
        }
        return result;
    };

    /**
     * 快速数组过滤
     * @param array 源数组
     * @param predicate 过滤函数
     */
    export const filter = <T>(array: T[], predicate: (item: T, index: number) => boolean): T[] => {
        const result: T[] = [];
        for (let i = 0, len = array.length; i < len; i++) {
            if (predicate(array[i], i)) {
                result.push(array[i]);
            }
        }
        return result;
    };

    /**
     * 根据参数返回格式化字符串
     * @param text 源字符串
     * @param option 用于格式化源字符串的数据，可以是键值对，也可以按顺序传参
     * @example
     * // 可使用以下两种调用方式，返回结果都是"测试字符串111--abc..."
     * Tool.formatString("测试字符串%{a1}--%{a2}...", {a1: 111, a2: "abc"});
     * Tool.formatString("测试字符串%{a1}--%{a2}...", 111, "abc");
     */
    export const formatString = (
        text: string,
        ...option: [Record<string, string | number>] | Array<string | number>
    ): string => {
        let result = text;
        if (option.length === 1 && Object.prototype.toString.call(option[0]) === "[object Object]") {
            // 参数为键值对
            for (let arg in option[0] as Record<string, string | number>) {
                if (option[0].hasOwnProperty(arg)) {
                    let reg = new RegExp(`%{${arg}}`, "g");
                    result = result.replace(reg, `${option[0][arg]}`);
                }
            }
        } else {
            // 参数为数组
            option.forEach((value: any) => {
                result = result.replace(/%\{.*?\}/, `${value}`);
            });
        }
        return result;
    };

    /**
     * 高效合并多个数组，支持去重
     * @param arrays 要合并的数组
     * @param deduplicate 是否去重
     */
    export const mergeArrays = <T>(arrays: T[][], deduplicate: boolean = false): T[] => {
        if (arrays.length === 0) return [];
        if (arrays.length === 1) return arrays[0];

        if (deduplicate) {
            // 使用Set去重
            const set = new Set<T>();
            for (const arr of arrays) {
                for (const item of arr) {
                    set.add(item);
                }
            }
            return Array.from(set);
        } else {
            // 计算总长度
            const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
            const result = new Array<T>(totalLength);
            let index = 0;

            // 直接复制到结果数组
            for (const arr of arrays) {
                for (let i = 0; i < arr.length; i++) {
                    result[index++] = arr[i];
                }
            }

            return result;
        }
    };

    /**
     * 打乱数组
     * @param array 源数组
     * @returns 打乱后的数组
     */
    export const shuffle = <T>(array: T[]): T[] => {
        const result = array.slice();
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    };
}
