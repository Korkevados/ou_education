<!-- @format -->

# Detailed Code Changes for Database Schema Migration

## 1. Database Infrastructure Changes

### 1.1 Update Database Connection Files

```javascript
// lib/supabase/supabase-server.js - Update schema references
// Update database types/queries to match new schema

// lib/prisma.js - If using Prisma ORM, update Prisma schema
```

### 1.2 Create Database Migration Scripts

```sql
-- Create migration script to transform existing data to new schema
-- Example for user table migration:
ALTER TABLE users
  ADD COLUMN email TEXT,
  ADD COLUMN password TEXT,
  ADD COLUMN full_name TEXT,
  ADD COLUMN user_type TEXT,
  ADD COLUMN position TEXT;

-- Update existing users with default values
UPDATE users
SET
  email = phone || '@temp.com',
  password = '[SECURE_HASHED_PASSWORD]',
  full_name = name,
  user_type = 'GUIDE',
  position = 'GUIDE'
WHERE email IS NULL;
```

## 2. User Management Module Updates

### 2.1 Update UserForm.jsx

```jsx
// components/UserForm.jsx
// Add new form fields

// Update form schema
const formSchema = z.object({
  full_name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  phone: z.string().regex(/^[0-9-]+$/, {
    message: "Please enter a valid phone number.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  user_type: z.enum(["ADMIN", "GUIDE", "TRAINING_MANAGER"]),
  position: z.enum(["CENTER_MANAGER", "GUIDE"]).optional(),
  activityCenter: z.string().min(2, {
    message: "Activity center must be at least 2 characters.",
  }),
});

// Add email field
<FormField
  control={form.control}
  name="email"
  render={({ field }) => (
    <FormItem>
      <FormLabel className="text-right w-full block">Email</FormLabel>
      <FormControl>
        <Input
          placeholder="user@example.com"
          {...field}
          className="text-right"
          dir="rtl"
          disabled={isLoading}
        />
      </FormControl>
      <FormMessage className="text-right" />
    </FormItem>
  )}
/>;
```

### 2.2 Update UserManagementClient.jsx

```jsx
// components/UserManagementClient.jsx

// Update table headers
<TableHeader className="bg-sky-100">
  <TableRow>
    <TableHead className="text-center h-11">Name</TableHead>
    <TableHead className="text-center h-11">Email</TableHead>
    <TableHead className="text-center h-11">
      {/* User type dropdown */}
    </TableHead>
    <TableHead className="text-center h-11">Position</TableHead>
    <TableHead className="text-center h-11">Activity Center</TableHead>
    <TableHead className="text-center h-11">Phone</TableHead>
    <TableHead className="w-[70px] text-center h-11">Actions</TableHead>
  </TableRow>
</TableHeader>;

// Update table rows
{
  paginatedUsers.map((user) => (
    <TableRow key={user.id}>
      <TableCell className="text-center">{user.full_name}</TableCell>
      <TableCell className="text-center">{user.email}</TableCell>
      <TableCell className="text-center">{user.user_type}</TableCell>
      <TableCell className="text-center">{user.position || "—"}</TableCell>
      <TableCell className="text-center">{user.activityCenter}</TableCell>
      <TableCell className="text-center">{user.phone}</TableCell>
      <TableCell className="text-center">{/* Actions dropdown */}</TableCell>
    </TableRow>
  ));
}
```

### 2.3 Update Auth Actions

```javascript
// app/actions/auth.js

// Update validateOtp function
export async function validateOtp(phone, code) {
  // Existing OTP validation code...

  // Update user retrieval to include new fields
  const { data: user, error: userError } = await supabaseadmin
    .from("users")
    .select("*")
    .eq("phone", phone)
    .single();

  // Update session creation with proper email
  const { data: session, error: signInError } =
    await supabase.auth.signInWithPassword({
      email: user.email,
      password: code, // Use OTP code as one-time password
    });

  // Return user with all fields
  return {
    success: true,
    user: {
      id: user.id,
      full_name: user.full_name || user.name,
      phone: user.phone,
      email: user.email,
      supabase_id: user.supabase_id,
      user_type: user.user_type || "GUIDE",
      position: user.position,
      center_id: user.center_id,
      is_active: user.is_active,
    },
  };
}
```

### 2.4 Update User Actions

```javascript
// app/actions/users.js

// Update createUser function
export async function createUser(userData) {
  try {
    const supabase = await supabaseAdmin();

    // First, check if a user with this email already exists
    const { data: existingUserByEmail } = await supabase
      .from("users")
      .select("*")
      .eq("email", userData.email)
      .single();

    if (existingUserByEmail) {
      return { error: "A user with this email already exists" };
    }

    // Check if a user with this phone number already exists
    const { data: existingUserByPhone } = await supabase
      .from("users")
      .select("*")
      .eq("phone", userData.phone)
      .single();

    if (existingUserByPhone) {
      return { error: "A user with this phone number already exists" };
    }

    // Create auth user in Supabase
    const { data: authUser, error: authError } =
      await supabase.auth.admin.createUser({
        email: userData.email,
        phone: userData.phone,
        email_confirm: true,
        user_metadata: {
          full_name: userData.full_name,
          user_type: userData.user_type,
        },
      });

    if (authError) throw authError;

    // Get or create the center
    // [Existing center code...]

    // Create the user with new fields
    const { data: newUser, error } = await supabase
      .from("users")
      .insert([
        {
          full_name: userData.full_name,
          phone: userData.phone,
          email: userData.email,
          supabase_id: authUser.user.id, // Store Supabase auth ID
          user_type: userData.user_type,
          position: userData.position,
          center_id: centerId,
          is_active: true,
        },
      ])
      .select();

    if (error) throw error;
    return { data: newUser };
  } catch (error) {
    console.error("Error creating user:", error);
    return { error: "Failed to create user" };
  }
}
```

## 3. Create Activity Centers Management

### 3.1 Create CentersForm.jsx

```jsx
// components/CentersForm.jsx
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Center name must be at least 2 characters.",
  }),
  city: z.string().min(2, {
    message: "City must be at least 2 characters.",
  }),
  manager_id: z.string().optional(),
});

export default function CentersForm({
  center,
  managers,
  onSubmit,
  onCancel,
  isLoading,
}) {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: center?.name || "",
      city: center?.city || "",
      manager_id: center?.manager_id || "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-right w-full block">
                Center Name
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter center name"
                  {...field}
                  className="text-right"
                  dir="rtl"
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage className="text-right" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-right w-full block">City</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter city"
                  {...field}
                  className="text-right"
                  dir="rtl"
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage className="text-right" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="manager_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-right w-full block">
                Center Manager
              </FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isLoading}>
                <FormControl>
                  <SelectTrigger className="text-right" dir="rtl">
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-white border shadow-lg">
                  <SelectItem value="">None</SelectItem>
                  {managers.map((manager) => (
                    <SelectItem
                      key={manager.id}
                      value={manager.id}
                      className="hover:bg-slate-100 focus:bg-slate-100 text-right">
                      {manager.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage className="text-right" />
            </FormItem>
          )}
        />

        <div className="flex justify-start space-x-reverse space-x-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            {center ? "Update Center" : "Add Center"}
          </Button>
          <Button
            variant="outline"
            type="button"
            onClick={onCancel}
            disabled={isLoading}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

### 3.2 Create CentersManagementClient.jsx

```jsx
// components/CentersManagementClient.jsx
"use client";
import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CentersForm from "./CentersForm";
import {
  createCenter,
  updateCenter,
  deleteCenter,
} from "@/app/actions/centers";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 6;

export default function CentersManagementClient({ initialCenters, managers }) {
  const [centers, setCenters] = useState(initialCenters);
  const [isAddCenterOpen, setIsAddCenterOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Filter and paginate centers
  const filteredCenters = useMemo(() => {
    return centers.filter((center) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        center.name.toLowerCase().includes(searchLower) ||
        center.city.toLowerCase().includes(searchLower)
      );
    });
  }, [centers, searchTerm]);

  const totalPages = Math.ceil(filteredCenters.length / ITEMS_PER_PAGE);
  const paginatedCenters = filteredCenters.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleAddCenter = async (centerData) => {
    try {
      setIsLoading(true);
      const { data, error } = await createCenter(centerData);

      if (error) {
        toast.error(error);
        return;
      }

      setCenters([...centers, data]);
      setIsAddCenterOpen(false);
      toast.success("Center created successfully");
    } catch (error) {
      console.error("Error adding center:", error);
      toast.error("Error creating center");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCenter = async (centerData) => {
    try {
      setIsLoading(true);
      const { error } = await updateCenter(editingCenter.id, centerData);

      if (error) {
        toast.error(error);
        return;
      }

      setCenters(
        centers.map((center) =>
          center.id === editingCenter.id ? { ...center, ...centerData } : center
        )
      );
      setIsAddCenterOpen(false);
      setEditingCenter(null);
      toast.success("Center updated successfully");
    } catch (error) {
      console.error("Error updating center:", error);
      toast.error("Error updating center");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCenter = async (centerId) => {
    try {
      setIsLoading(true);
      const { error } = await deleteCenter(centerId);

      if (error) {
        toast.error(error);
        return;
      }

      setCenters(centers.filter((center) => center.id !== centerId));
      toast.success("Center deleted successfully");
    } catch (error) {
      console.error("Error deleting center:", error);
      toast.error("Error deleting center");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setIsAddCenterOpen(false);
    setEditingCenter(null);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with title, search and add button */}
      {/* Table of centers */}
      {/* Pagination controls */}
      {/* Dialog for add/edit center */}
    </div>
  );
}
```

### 3.3 Create Centers API Actions

```javascript
// app/actions/centers.js
import supabaseAdmin from "@/lib/supabase/supabase-admin";
import createClient from "@/lib/supabase/supabase-server";

/**
 * Get all centers
 */
export async function getCenters() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("centers").select(`
      id,
      name,
      city,
      manager_id,
      users!manager_id (
        id,
        full_name
      )
    `);

    if (error) throw error;

    // Format the data for easier consumption
    const formattedData = data.map((center) => ({
      id: center.id,
      name: center.name,
      city: center.city,
      manager_id: center.manager_id,
      manager_name: center.users ? center.users.full_name : null,
    }));

    return { data: formattedData };
  } catch (error) {
    console.error("Error fetching centers:", error);
    return { error: "Failed to fetch centers" };
  }
}

/**
 * Get managers eligible to be center managers
 */
export async function getEligibleManagers() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("users")
      .select("id, full_name")
      .eq("user_type", "GUIDE")
      .eq("position", "CENTER_MANAGER");

    if (error) throw error;
    return { data };
  } catch (error) {
    console.error("Error fetching eligible managers:", error);
    return { error: "Failed to fetch eligible managers" };
  }
}

/**
 * Create a new center
 */
export async function createCenter(centerData) {
  try {
    const supabase = await supabaseAdmin();

    // Create the center
    const { data, error } = await supabase
      .from("centers")
      .insert([
        {
          name: centerData.name,
          city: centerData.city,
          manager_id: centerData.manager_id || null,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return { data };
  } catch (error) {
    console.error("Error creating center:", error);
    return { error: "Failed to create center" };
  }
}

/**
 * Update an existing center
 */
export async function updateCenter(centerId, centerData) {
  try {
    const supabase = await supabaseAdmin();

    // Update the center
    const { data, error } = await supabase
      .from("centers")
      .update({
        name: centerData.name,
        city: centerData.city,
        manager_id: centerData.manager_id || null,
      })
      .eq("id", centerId)
      .select()
      .single();

    if (error) throw error;
    return { data };
  } catch (error) {
    console.error("Error updating center:", error);
    return { error: "Failed to update center" };
  }
}

/**
 * Delete a center
 */
export async function deleteCenter(centerId) {
  try {
    const supabase = await supabaseAdmin();

    // Check if center has associated users
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id")
      .eq("center_id", centerId);

    if (usersError) throw usersError;

    if (users.length > 0) {
      return { error: "Cannot delete center with associated users" };
    }

    // Delete the center
    const { error } = await supabase
      .from("centers")
      .delete()
      .eq("id", centerId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error deleting center:", error);
    return { error: "Failed to delete center" };
  }
}
```

## 4. Create New Dashboard Pages

### 4.1 Create Centers Management Page

```jsx
// app/dashboard/centers/page.js
import { getUserDetails } from "@/app/actions/auth";
import { getCenters, getEligibleManagers } from "@/app/actions/centers";
import CentersManagementClient from "@/components/CentersManagementClient";
import { redirect } from "next/navigation";

export default async function CentersManagement() {
  const user = await getUserDetails();

  if (!user || user.user_type !== "ADMIN") {
    redirect("/dashboard");
  }

  // Fetch centers and managers data
  const { data: centers, error: centersError } = await getCenters();
  const { data: managers, error: managersError } = await getEligibleManagers();

  if (centersError || managersError) {
    console.error("Error fetching data:", { centersError, managersError });
    return (
      <div className="p-4 bg-white max-h-full shadow-lg">
        <div className="text-red-500">Error loading data</div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white max-h-full shadow-lg">
      <CentersManagementClient
        initialCenters={centers || []}
        managers={managers || []}
      />
    </div>
  );
}
```
