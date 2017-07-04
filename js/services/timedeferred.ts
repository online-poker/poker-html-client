import * as timeService from "../timeservice";

export function wait(time) {
    return new Promise((resolve) => {
        timeService.setTimeout(resolve, time);
    });
}
