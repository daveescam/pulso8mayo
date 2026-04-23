import { NextRequest } from "next/server";
import { UserService } from "@/lib/services/user-service";
import { ApiHandler } from "@/lib/api/response";
import { updateUserSchema } from "@/lib/validations/user";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const user = await UserService.getUser(id);
        return ApiHandler.success(user);
    } catch (error) {
        return ApiHandler.error(error);
    }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const data = updateUserSchema.parse(body);
        const updatedUser = await UserService.updateUser(id, data);
        return ApiHandler.success(updatedUser);
    } catch (error) {
        return ApiHandler.error(error);
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await UserService.deleteUser(id);
        return ApiHandler.success({ message: "User deleted successfully" });
    } catch (error) {
        return ApiHandler.error(error);
    }
}
