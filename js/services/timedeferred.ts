/// <reference types="jquery" />
/// <reference path="../typings/jquery.d.ts" />
import * as timeService from "../timeService";

export function wait(time) {
    return $.Deferred(function (dfd) {
        timeService.setTimeout(dfd.resolve, time);
    });
}
