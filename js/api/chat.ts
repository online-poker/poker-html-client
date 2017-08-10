
export class Chat {
    constructor(public host: string) {
    }

    public async send(tableId: number, message: string): Promise<StatusResponse> {
        const data = { message };
        const response = await fetch(this.host + `/api/table/${tableId}/chat`, {
            method: "POST",
            body: JSON.stringify(data),
        });
        const jsonData = await response.json() as ApiResult<StatusResponse>;
        return jsonData;
    }
}
