export namespace Tools {
    /**
     * 将一个Date对象或Date时间戳返回格式化日期字符串
     * @param date Date对象或Date时间戳（毫秒）
     * @param timezoneOffset 时区偏移量（小时），0表示UTC时间，8表示UTC+8，-5表示UTC-5
     * @param format 格式化字符串
     * @example
     * formatDateString(0, 0, "%{YYYY}-%{MM}-%{dd} %{hh}:%{mm}:%{ss}");  // "1970-01-01 00:00:00" (UTC)
     * formatDateString(0, 8, "%{YYYY}-%{MM}-%{dd} %{hh}:%{mm}:%{ss}");  // "1970-01-01 08:00:00" (UTC+8)
     * formatDateString(0, 0, "%{dd}/%{MM}/%{YY}");                      // "01/01/70"
     */
    export const formatDateString = (
        date: number | Date,
        timezoneOffset: number = 0,
        format: string = "%{YYYY}-%{MM}-%{dd} %{hh}:%{mm}:%{ss}"
    ): string => {
        const isUTC = timezoneOffset > 0;
        const adjustedDate = new Date((date instanceof Date ? date.getTime() : date) + timezoneOffset * 60 * 60 * 1000);

        const year = isUTC ? adjustedDate.getUTCFullYear() : adjustedDate.getFullYear();
        const month = isUTC ? adjustedDate.getUTCMonth() + 1 : adjustedDate.getMonth() + 1;
        const days = isUTC ? adjustedDate.getUTCDate() : adjustedDate.getDate();
        const hours = isUTC ? adjustedDate.getUTCHours() : adjustedDate.getHours();
        const minutes = isUTC ? adjustedDate.getUTCMinutes() : adjustedDate.getMinutes();
        const seconds = isUTC ? adjustedDate.getUTCSeconds() : adjustedDate.getSeconds();

        const pad = (num: number): string => (num < 10 ? `0${num}` : `${num}`);

        const data = {
            YYYY: `${year}`,
            YY: pad(year % 100),
            MM: pad(month),
            M: `${month}`,
            dd: pad(days),
            d: `${days}`,
            hh: pad(hours),
            h: `${hours}`,
            mm: pad(minutes),
            m: `${minutes}`,
            ss: pad(seconds),
            s: `${seconds}`
        };

        return formatString(format, data);
    };

    /**
     * 根据参数返回格式化字符串
     * @param text 源字符串
     * @param option 用于格式化源字符串的数据，可以是键值对，也可以按顺序传参
     * @example
     * // 可使用以下两种调用方式，返回结果都是"测试字符串111--abc..."
     * formatString("测试字符串%{a1}--%{a2}...", {a1: 111, a2: "abc"});
     * formatString("测试字符串%{a1}--%{a2}...", 111, "abc");
     */
    export const formatString = (
        text: string,
        ...option: [Record<string, string | number>] | Array<string | number>
    ): string => {
        if (option.length === 0) return text;

        const firstArg = option[0];

        // 判断是否为对象参数（键值对模式）
        if (option.length === 1 && typeof firstArg === "object" && !Array.isArray(firstArg)) {
            const params = firstArg as Record<string, string | number>;
            return text.replace(/%\{(\w+)\}/g, (match, key) => {
                return Object.prototype.hasOwnProperty.call(params, key) ? String(params[key]) : match;
            });
        }

        // 数组参数模式（按顺序替换）
        let index = 0;
        return text.replace(/%\{.*?\}/g, () => {
            return index < option.length ? String(option[index++]) : "";
        });
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

    /**
     * 获取数字小数位长度
     */
    const digitLength = (num: number): number => {
        const eSplit = num.toString().split(/[eE]/);
        const len = (eSplit[0].split(".")[1] || "").length - +(eSplit[1] || 0);
        return len > 0 ? len : 0;
    };

    /**
     * 将小数转为整数(支持科学计数法)
     */
    const float2Fixed = (num: number): number => {
        const str = num.toString();
        if (str.indexOf("e") === -1) {
            return Number(str.replace(".", ""));
        }
        const dLen = digitLength(num);
        return dLen > 0 ? Number(num) * Math.pow(10, dLen) : num;
    };

    /**
     * 精确乘法(参考 number-precision)
     */
    export const times = (num1: number, num2: number): number => {
        const num1Changed = float2Fixed(num1);
        const num2Changed = float2Fixed(num2);
        const baseNum = digitLength(num1) + digitLength(num2);
        return (num1Changed * num2Changed) / Math.pow(10, baseNum);
    };

    export const floatPrecision = (num: number, precision: number = 2): number => {
        if (!isFinite(num)) return num;
        const base = Math.pow(10, precision);
        let result = Math.round(Math.abs(times(num, base))) / base;
        if (num < 0 && result !== 0) {
            result = times(result, -1);
        }
        return result;
    };
}
