import { NextResponse } from "next/server";
import { ApiError } from "./error";
import { ZodError } from "zod";

type ApiResponse<T> = {
    success: boolean;
    data?: T;
    error?: {
        message: string;
        details?: unknown;
        code?: string;
    };
};

export class ApiHandler {
    static success<T>(data: T, statusCode: number = 200) {
        return NextResponse.json(
            { success: true, data } as ApiResponse<T>,
            { status: statusCode }
        );
    }

    static error(error: unknown) {
        console.error("API Error:", error);

        if (error instanceof ApiError) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        message: error.message,
                        details: error.details,
                    },
                } as ApiResponse<null>,
                { status: error.statusCode }
            );
        }

        if (error instanceof ZodError) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        message: "Validation Error",
                        details: error.flatten(),
                    },
                } as ApiResponse<null>,
                { status: 400 }
            );
        }

        return NextResponse.json(
            {
                success: false,
                error: {
                    message: "Internal Server Error",
                },
            } as ApiResponse<null>,
            { status: 500 }
        );
    }
}

/**
 * Helper function for success responses
 */
export function apiResponse<T>(data: T, statusCode: number = 200) {
    return ApiHandler.success(data, statusCode);
}

/**
 * Helper function for error responses
 */
export function apiError(message: string, statusCode: number = 500, details?: unknown) {
    return NextResponse.json(
        {
            success: false,
            error: {
                message,
                details,
            },
        } as ApiResponse<null>,
        { status: statusCode }
    );
}
