/**
 * Convert number in the separator delimited number.
 * @param value Value to convert to string
 * @param separator Digit group separator
 */
export function withCommas(value: string | number, separator: string) {
    const stringValue = value + "";
    const x = stringValue.split(".");
    let x1 = x[0];
    const x2 = x.length > 1 ? "." + x[1] : "";
    const rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, "$1" + separator + "$2");
    }

    return x1 + x2;
}

export function siFormatter(value: number, digits: number, separator: string, fractionalSeparator: string, minConvertibleValue: number) {
    if (value < minConvertibleValue) {
        return withCommas(value.toFixed(0), separator);
    }

    const si = [
        { value: 1, symbol: "" },
        { value: 1E3, symbol: "k" },
        { value: 1E6, symbol: "M" },
        { value: 1E9, symbol: "G" },
        { value: 1E12, symbol: "T" },
        { value: 1E15, symbol: "P" },
        { value: 1E18, symbol: "E" },
    ];
    let i;
    for (i = si.length - 1; i > 0; i--) {
        if (value >= si[i].value) {
            break;
        }
    }
    const x = (value / si[i].value).toString().split(".");
    const x1 = x[0];
    const x2 = x.length > 1 ? ( digits > 0 ? fractionalSeparator + x[1].substr(0, digits) : "" ) : "";
    const formattedNumber = x1 + x2 + si[i].symbol;

    return formattedNumber;
}

/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
function isObject(item: any) {
    return (item && typeof item === "object" && !Array.isArray(item));
}

/**
 * Deep merge two objects.
 * @param target
 * @param ...sources
 */
export function mergeDeep(target: any, ...sources: any[]): any {
    if (!sources.length) { return target; }
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) { Object.assign(target, { [key]: {} }); }
                mergeDeep(target[key], source[key]);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }

    return mergeDeep(target, ...sources);
}
