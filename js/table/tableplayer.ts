interface TablePlayer extends PlayerStatusInfo {
    IsCurrent?: boolean;
    IsDealer?: boolean;
    IsBigBlind?: boolean;
    IsSmallBlind?: boolean;
    RawCards?: number[];
    WinAmount?: number;
    TotalBet?: number;
    WasInGame?: boolean;
}
