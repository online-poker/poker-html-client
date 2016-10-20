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
