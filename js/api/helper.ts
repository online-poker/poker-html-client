
export function getRequestInit(): RequestInit {
    const defaultHeaders = new Headers();
    defaultHeaders.append("Content-Type", "application/json");

    if (authToken) {
        defaultHeaders.append("X-AuthToken", authToken);
        return {
            credentials: "include",
            headers: defaultHeaders,
        };
    }

    return {
        headers: defaultHeaders,
    };
}

export function getPostRequestInit(data?: any): RequestInit {
    const requestInit = getRequestInit();
    requestInit.method = "POST";
    if (data !== undefined) {
        requestInit.body = JSON.stringify(data);
    }

    return requestInit;
}

export function getPutRequestInit(data?: any): RequestInit {
    const requestInit = getRequestInit();
    requestInit.method = "PUT";
    if (data !== undefined) {
        requestInit.body = JSON.stringify(data);
    }

    return requestInit;
}

export function getDeleteRequestInit(data?: any): RequestInit {
    const requestInit = getRequestInit();
    requestInit.method = "DELETE";
    if (data !== undefined) {
        requestInit.body = JSON.stringify(data);
    }

    return requestInit;
}
