/** @format */

import { getUserDetails } from "@/app/actions/auth";
import { getUsers } from "@/app/actions/users";
import UserManagementClient from "@/components/UserManagementClient";
import { redirect } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";

export default async function UserManagement() {
  const user = await getUserDetails();

  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Fetch real users data
  const { data: users, error } = await getUsers();

  if (error) {
    console.error("Error fetching users:", error);
    return (
      <div className="p-4 bg-white max-h-full shadow-lg">
        <div className="flex flex-col items-center justify-center p-8">
          <div className="text-red-500 text-xl mb-4">שגיאה בטעינת המשתמשים</div>
          <div className="text-gray-600">פרטי השגיאה: {error}</div>
        </div>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="p-4 bg-white max-h-full shadow-lg">
        <div className="flex flex-col items-center justify-center p-8">
          <div className="text-gray-600 mb-4">לא נמצאו משתמשים במערכת</div>
          <UserManagementClient initialUsers={[]} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white max-h-full shadow-lg">
      <UserManagementClient initialUsers={users} />
    </div>
  );
}
