"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    branchId: string | null;
    image?: string;
    phone?: string;
}

interface UserEditSheetProps {
    user: User | null;
    isOpen: boolean;
    onClose: () => void;
    onUserUpdated: (user: User) => void;
    branches?: any[]; // Pass available branches
}

export function UserEditSheet({ user, isOpen, onClose, onUserUpdated, branches = [] }: UserEditSheetProps) {
    const [isLoading, setIsLoading] = useState(false);

    if (!user) return null;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const updates = {
            name: formData.get("name") as string,
            role: formData.get("role") as string,
            branchId: formData.get("branchId") as string || null,
            phone: formData.get("phone") as string
        };

        try {
            const res = await fetch(`/api/users/${user.id}`, {
                method: "PATCH",
                body: JSON.stringify(updates),
                headers: { "Content-Type": "application/json" }
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error?.message || "Failed to update user");
            }

            const response = await res.json();
            const updatedUser = response.data; // Extract from API wrapper
            onUserUpdated({ ...user, ...updatedUser });
            toast.success("User updated successfully");
            onClose();
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : "Failed to update user");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="sm:max-w-[500px]">
                <SheetHeader>
                    <SheetTitle>Edit Profile</SheetTitle>
                    <SheetDescription>
                        Update personal details and permissions for {user.name}.
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-6">
                    {/* Header with Avatar */}
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={user.image} />
                            <AvatarFallback className="text-lg">{user.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h3 className="font-medium text-lg">{user.name}</h3>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" name="name" defaultValue={user.name} required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input id="phone" name="phone" defaultValue={user.phone || ""} placeholder="+52..." />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <Select name="role" defaultValue={user.role}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ADMIN">Admin</SelectItem>
                                        <SelectItem value="GERENTE">Gerente</SelectItem>
                                        <SelectItem value="EMPLEADO">Empleado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="branchId">Assigned Branch</Label>
                                <Select name="branchId" defaultValue={user.branchId || "global"}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select branch" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="global">All Branches (Global)</SelectItem>
                                        {branches.map(b => (
                                            <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <SheetFooter>
                        <SheetClose asChild>
                            <Button variant="outline" type="button">Cancel</Button>
                        </SheetClose>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
