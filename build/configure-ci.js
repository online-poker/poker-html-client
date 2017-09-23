const fs = require('fs');
const assert = require('assert');

function parsePackageJsonVersion(versionString) {
    const versionRgx = /(\d+\.\d+)\.(\d+)($|\-)/;
    const match = versionString.match(versionRgx);
    assert(match !== null, "package.json 'version' should match", () => versionRgx.toString());
    return { majorMinor: match[1], patch: match[2] };
}

/** e.g. 0-dev.20170707 */
function getNightlyPatch(plainPatch) {
    // We're going to append a representation of the current time at the end of the current version.
    // String.prototype.toISOString() returns a 24-character string formatted as 'YYYY-MM-DDTHH:mm:ss.sssZ',
    // but we'd prefer to just remove separators and limit ourselves to YYYYMMDDHHmmss.
    // UTC time will always be implicit here.
    const now = new Date();
    const timeStr = now.toISOString().replace(/:|T|\.|-/g, "").slice(0, 14);

    return `${plainPatch}-dev.${timeStr}`;
}

const content = fs.readFileSync('package.json');
const packageJsonValue = JSON.parse(content);

const { majorMinor, patch } = parsePackageJsonVersion(packageJsonValue.version);
const nightlyPatch = getNightlyPatch(patch);
packageJsonValue.version = `${majorMinor}.${nightlyPatch}`;
fs.writeFileSync('package.json', JSON.stringify(packageJsonValue, /*replacer:*/ undefined, /*space:*/ 4));
fs.writeFileSync('js/version.ts', `export const version = "${packageJsonValue.version}";\n`);
