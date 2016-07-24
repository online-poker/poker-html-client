interface TablePlayer extends PlayerStatusInfo {
    IsCurrent?: boolean;
    IsDealer?: boolean;
    RawCards?: number[];
    WinAmount?: number;
    TotalBet?: number;
    WasInGame?: boolean;
}
