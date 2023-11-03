module.exports = {
    "globals": {
        "ts-jest": {
            "tsConfig": "test-tsconfig.json"
        }
    },
    "transform": {
        ".(ts|tsx)": "ts-jest"
    },
    "testEnvironment": "jsdom",
    "testRegex": "(/__tests__/.*|\\.(test|spec))\\.(ts|tsx|js)$",
    "setupFiles": [
        "./tests/jest-setup.js"
    ],
    "moduleFileExtensions": [
        "ts",
        "tsx",
        "js"
    ],
    "moduleNameMapper": {
        "^poker/(.*)": "<rootDir>/js/$1",
        "^tests/(.*)": "<rootDir>/tests/$1"
    },
    "coveragePathIgnorePatterns": [
        "/node_modules/",
        "/tests/"
    ],
    "coverageThreshold": {
        "global": {
            "branches": 35,
            "functions": 42,
            "lines": 48,
            "statements": 48
        }
    },
    "collectCoverage": true
};
