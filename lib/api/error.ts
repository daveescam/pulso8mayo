export class ApiError extends Error {
    public statusCode: number;
    public details?: unknown;

    constructor(message: string, statusCode: number = 500, details?: unknown) {
        super(message);
        this.name = "ApiError";
        this.statusCode = statusCode;
        this.details = details;
    }

    static badRequest(message: string, details?: unknown) {
        return new ApiError(message, 400, details);
    }

    static unauthorized(message: string = "Unauthorized") {
        return new ApiError(message, 401);
    }

    static forbidden(message: string = "Forbidden") {
        return new ApiError(message, 403);
    }

    static notFound(message: string = "Not Found") {
        return new ApiError(message, 404);
    }

    static internal(message: string = "Internal Server Error") {
        return new ApiError(message, 500);
    }
}
