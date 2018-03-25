import * as timeService from "../timeservice";

export function wait(time: number) {
    return new Promise((resolve) => {
        timeService.setTimeout(resolve, time);
    });
}
