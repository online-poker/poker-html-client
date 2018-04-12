import * as timeService from "../timeservice";

/**
 * Sets timeout
 * @param time Wait time
 */
export function wait(time: number) {
    return new Promise((resolve) => {
        timeService.setTimeout(resolve, time);
    });
}
