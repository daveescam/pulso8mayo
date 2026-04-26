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

  static error(error: unknown, statusCodeOrOptions?: number | { status: number }) {
    console.error("API Error:", error);

    // Extract status code from second argument
    let overrideStatus: number | undefined;
    if (typeof statusCodeOrOptions === 'number') {
      overrideStatus = statusCodeOrOptions;
    } else if (statusCodeOrOptions && typeof statusCodeOrOptions === 'object') {
      overrideStatus = statusCodeOrOptions.status;
    }

    if (error instanceof ApiError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: error.message,
            details: error.details,
          },
        } as ApiResponse<null>,
        { status: overrideStatus || error.statusCode }
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
        { status: overrideStatus || 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      {
        success: false,
        error: {
          message: message,
        },
      } as ApiResponse<null>,
      { status: overrideStatus || 500 }
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
