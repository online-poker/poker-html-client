/// <reference types="jquery" />
/// <reference path="../typings/jquery.d.ts" />

$.wait = function (time) {
    return $.Deferred(function (dfd) {
        timeService.setTimeout(dfd.resolve, time);
    });
};
