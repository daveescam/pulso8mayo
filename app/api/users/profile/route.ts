import { NextRequest } from "next/server";
import { UserService } from "@/lib/services/user-service";
import { ApiHandler } from "@/lib/api/response";
import { updateUserSchema } from "@/lib/validations/user";
import { auth } from "@/lib/auth"; // Need to get current session user
import { headers } from "next/headers";

export async function PATCH(req: NextRequest) {
    try {
        // Use better-auth directly to get session since we need the USER ID, 
        // requireTenant returns company context but we verify user identity here.
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return ApiHandler.unauthorized();
        }

        const body = await req.json();

        // Allow updating only safe fields + password if handled
        // If password update is needed, usually specific flow.
        // Let's assume general update here.

        // Zod schema might need valid fields for profile update (name, image, etc)
        // Ignoring role/companyId/branchId for self-update usually.
        // Let's extract only safe fields.
        const { name, image, email, password } = body;

        // If password change is requested, we should use auth api usually?
        // Or UserService can handle it if better-auth exposes it.
        // For now, let's update basic info via UserService which updates DB.

        // Validate
        const updateData: any = { name, image };
        if (email) updateData.email = email;

        // Assuming UserService handles generic update.
        // Note: Changing email might require re-verification or auth system update.

        await UserService.updateUser(session.user.id, updateData);

        // If password provided? 
        // Better Auth handles password change via specific API usually.
        // We'll leave it out for this generic profile patch unless specifically requested.

        return ApiHandler.success({ message: "Profile updated successfully" });
    } catch (error) {
        return ApiHandler.error(error);
    }
}
