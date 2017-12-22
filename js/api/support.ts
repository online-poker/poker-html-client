import { getPostRequestInit } from "./helper";

export class Support {
    constructor(public host: string) {
    }
    public async contactUs(fullName: string, email: string, subject: string, message: string): Promise<StatusResponse> {
        const data = { fullName, email, subject, message };
        const response = await fetch(this.host + `/api/tickets`, getPostRequestInit(data));
        const jsonData = await response.json() as StatusResponse;
        return jsonData;
    }
}
