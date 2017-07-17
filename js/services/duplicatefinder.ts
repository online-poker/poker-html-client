class DuplicateFinder {
    private dataEvents: any[][];

    constructor() {
        this.dataEvents = [];
    }

    public registerEvent(data: any[]) {
        this.dataEvents.push(data);
        while (this.dataEvents.length > 8) {
            this.dataEvents.shift();
        }
    }

    public clear() {
        this.dataEvents = [];
    }

    public erase(callbackfn: (value: any[], index: number, array: any[][]) => boolean) {
        this.dataEvents = this.dataEvents.filter(callbackfn);
    }

    public validateDuplicateEvents() {
        let target = this.dataEvents.slice(0);
        let duplicatesCount = 0;
        for (let i = 0; i < target.length; i++) {
            const current = target[i];
            for (let j = i + 1; j < target.length; j++) {
                const test = target[j];
                if (test.length !== current.length) {
                    continue;
                }

                let notFound = false;
                for (let k = 0; k < current.length; k++) {
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
    public printDebug() {
        // tslint:disable-next-line:no-console
        console.log("Duplicate events detected.");
        this.dataEvents.forEach((_) => {
            // tslint:disable-next-line:no-console
            console.log(JSON.stringify(_));
        });
    }
}
