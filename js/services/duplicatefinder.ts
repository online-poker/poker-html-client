class DuplicateFinder {
    dataEvents: any[][];

    constructor() {
        this.dataEvents = [];
    }

    registerEvent(data: any[]) {
        this.dataEvents.push(data);
        while (this.dataEvents.length > 8) {
            this.dataEvents.shift();
        }
    }

    clear() {
        this.dataEvents = [];
    }

    erase(callbackfn: (value: any[], index: number, array: any[][]) => boolean) {
        this.dataEvents = this.dataEvents.filter(callbackfn);
    }

    validateDuplicateEvents() {
        var target = this.dataEvents.slice(0);
        var duplicatesCount = 0;
        for (var i = 0; i < target.length; i++) {
            var current = target[i];
            for (var j = i + 1; j < target.length; j++) {
                var test = target[j];
                if (test.length !== current.length) {
                    continue;
                }

                var notFound = false;
                for (var k = 0; k < current.length; k++) {
                    if (current[k] !== test[k]) {
                        notFound = true;
                        break;
                    }
                }

                if (notFound) {
                    continue;
                }

                duplicatesCount++;
                target = target.splice(j, 1);
                j--;
            }
        }

        if (duplicatesCount > 0) {
            return true;
        }

        return false;
    }
    printDebug() {
        console.log("Duplicate events detected.");
        this.dataEvents.forEach((_) => {
            console.log(JSON.stringify(_));
        });
    }
}
