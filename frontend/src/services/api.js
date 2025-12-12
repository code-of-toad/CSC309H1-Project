import { BASE_URL } from '../globals';

// -----------------------------------------------------------
// Reusable API helper for sending HTTP requests.
// Automatically:
// - JSON.stringify() bodies exactly once
// - Attaches JWT token
// - Parses JSON
// - Throws standardized errors
// -----------------------------------------------------------
export async function api(path, options = {}) {
    const {
        method = 'GET',
        body,          // plain JS object or undefined
        token,
        headers = {},
        ...rest
    } = options;

    // Build request headers
    const finalHeaders = {
        'Content-Type': 'application/json',
        ...headers,
    };

    if (token) {
        finalHeaders.Authorization = `Bearer ${token}`;
    }

    // Correct: stringify ONLY if body is a plain object
    const finalBody =
        body === undefined
            ? undefined
            : typeof body === 'string'
            ? body
            : JSON.stringify(body);

    // Send request
    const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: finalHeaders,
        body: finalBody,
        credentials: 'include',
        ...rest,
    });

    // Try parsing JSON body
    let data = null;
    try {
        data = await res.json();
    } catch {
        // Response is not JSON, data remains null
    }

    // If not OK → throw standardized error
    if (!res.ok) {
        const message =
            data?.message ||
            data?.error ||
            `Request failed with status ${res.status}`;

        const error = new Error(message);
        error.status = res.status;
        error.data = data;
        throw error;
    }

    return data;
}
