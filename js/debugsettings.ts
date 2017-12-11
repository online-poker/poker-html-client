interface InitializationDebugSettings {
    stopOnLaunch: boolean;
    stopOnResume: boolean;
    metadata: boolean;
    imagePreloading: boolean;
}

interface IOSDebugSettings {
    hasMultitasking: boolean;
}

interface ActionBlockDebugSettings {
    traceBlocksVisbility: boolean;
}

interface TableViewDebugSettings {
    trace: boolean;
    traceTables: number[];
    reportApiError: boolean;
    traceGameEvents: boolean;
    betLevelChangeDelay: number;
    addonPeriodStartedDelay: number;
}

interface LobbyDebugSettings {
    trace: boolean;
    useTournamentNameForTournamentCaption: boolean;
}

interface HomeDebugSettings {
    traceNews: boolean;
    traceBanners: boolean;
}

interface DeviceDebugSettings {
    orientation: boolean;
    statusbar: boolean;
    events: boolean;
}

interface ConnectionDebugSettings {
    slowInternet: boolean;
    signalR: boolean;
    dataEvents: boolean;
    windowReloadForRetry: boolean;
}

interface ApplicationDebugSettings {
    reloadManager: boolean;
    deactivateOnPause: boolean;
    goToLobbyAfterPause: boolean;
    reloadTablesDataOnResume: boolean;
    debugTimeouts: boolean;
    useUtcDates: boolean;
    debugTabbar: boolean;
}

interface UIDebugSettings {
    tracePopups: boolean;
    tracePages: boolean;
}

interface GameDebugSettings {
    singleSidePots: boolean;
}

interface ReloadDebugSettings {
    traceReload: boolean;
}

class DebugSettings {
    public initialization: InitializationDebugSettings;
    public ios: IOSDebugSettings;
    public actionBlock: ActionBlockDebugSettings;
    public tableView: TableViewDebugSettings;
    public lobby: LobbyDebugSettings;
    public game: GameDebugSettings;
    public home: HomeDebugSettings;
    public device: DeviceDebugSettings;
    public connection: ConnectionDebugSettings;
    public application: ApplicationDebugSettings;
    public ui: UIDebugSettings;
    public reload: ReloadDebugSettings;

    constructor() {
        this.initialization = {
            stopOnLaunch: false,
            stopOnResume: false,
            metadata: false,
            imagePreloading: false,
        };
        this.ios = {
            hasMultitasking: false,
        };
        this.actionBlock = {
            traceBlocksVisbility: false,
        };
        this.game = {
            singleSidePots: true,
        };
        this.tableView = {
            trace: true,
            traceTables: [],
            reportApiError: false,
            traceGameEvents: false,
            betLevelChangeDelay: 4000,
            addonPeriodStartedDelay: 4000,
        };
        this.lobby = {
            trace: false,
            useTournamentNameForTournamentCaption: true,
        };
        this.home = {
            traceNews: false,
            traceBanners: false,
        };
        this.device = {
            events: true,
            orientation: false,
            statusbar: false,
        };
        this.connection = {
            signalR: true,
            slowInternet: false,
            dataEvents: false,
            windowReloadForRetry: true,
        };
        this.application = {
            reloadManager: true,
            deactivateOnPause: false,
            goToLobbyAfterPause: false,
            reloadTablesDataOnResume: false,
            debugTimeouts: true,
            useUtcDates: false,
            debugTabbar: false,
        };
        this.ui = {
            tracePages: false,
            tracePopups: false,
        };
        this.reload = {
            traceReload: false,
        };
    }
}

export const debugSettings = new DebugSettings();
