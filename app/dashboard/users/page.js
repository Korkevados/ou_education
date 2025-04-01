/** @format */

"use client";
import getUserDetails from "@/app/actions/auth";
import { getUsers } from "@/app/actions/users";
import UserManagementClient from "@/components/UserManagementClient";
import { redirect } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { useEffect, useState } from "react";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUserAndFetchData = async () => {
      try {
        // Check user role
        const user = await getUserDetails();
        if (!user || user.role !== "ADMIN") {
          redirect("/dashboard");
        }

        // Fetch users data
        const { data: users1, error } = await getUsers();
        if (error) {
          console.error("Error fetching users:", error);
          return;
        }
        console.log(users1);
        setUsers(users1);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUserAndFetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="p-4 bg-white max-h-full shadow-lg">
        <div className="flex flex-col items-center justify-center p-8">
          <Spinner className="w-8 h-8 mb-4" />
          <div className="text-gray-600">טוען משתמשים...</div>
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
