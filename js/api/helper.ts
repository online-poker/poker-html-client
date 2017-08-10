export function getRequestInit(): RequestInit {
    if (authToken) {
        return {
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "X-AuthToken": authToken,
            },
        };
    }

    return {
        headers: {
            "Content-Type": "application/json",
        },
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
