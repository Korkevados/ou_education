/** @format */

import { getUserDetails } from "@/app/actions/auth";
import { getUsers } from "@/app/actions/users";
import UserManagementClient from "@/components/UserManagementClient";
import { redirect } from "next/navigation";

export default async function UserManagement() {
  const user = await getUserDetails();

  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Fetch real users data
  const { data: users, error } = await getUsers();
  console.log(users);
  if (error) {
    console.error("Error fetching users:", error);
    // You might want to handle this error differently
    return (
      <div className="p-4 bg-white max-h-full shadow-lg">
        <div className="text-red-500">שגיאה בטעינת המשתמשים</div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white max-h-full shadow-lg">
      <UserManagementClient initialUsers={users} />
    </div>
  );
}
