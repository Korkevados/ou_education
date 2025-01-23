/** @format */

import { getUserDetails } from "@/app/actions/auth";
import UserManagementClient from "@/components/UserManagementClient";
import { redirect } from "next/navigation";

export default async function UserManagement() {
  const user = await getUserDetails();

  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Dummy data for 10 guides
  const dummyUsers = [
    {
      id: "1",
      name: "David Cohen",
      role: "GUIDE",
      activityCenter: "Jerusalem",
      phone: "050-1234567",
    },
    {
      id: "2",
      name: "Sarah Levy",
      role: "GUIDE",
      activityCenter: "Tel Aviv",
      phone: "052-2345678",
    },
    {
      id: "3",
      name: "Moshe Gold",
      role: "GUIDE",
      activityCenter: "Haifa",
      phone: "054-3456789",
    },
    {
      id: "4",
      name: "Rachel Ben-David",
      role: "GUIDE",
      activityCenter: "Beer Sheva",
      phone: "053-4567890",
    },
    {
      id: "5",
      name: "Daniel Avraham",
      role: "GUIDE",
      activityCenter: "Jerusalem",
      phone: "050-5678901",
    },
    {
      id: "6",
      name: "Leah Shapiro",
      role: "GUIDE",
      activityCenter: "Tel Aviv",
      phone: "052-6789012",
    },
    {
      id: "7",
      name: "Yosef Klein",
      role: "GUIDE",
      activityCenter: "Haifa",
      phone: "054-7890123",
    },
    {
      id: "8",
      name: "Miriam Stern",
      role: "GUIDE",
      activityCenter: "Jerusalem",
      phone: "053-8901234",
    },
    {
      id: "9",
      name: "Yaakov Friedman",
      role: "GUIDE",
      activityCenter: "Tel Aviv",
      phone: "050-9012345",
    },
    {
      id: "10",
      name: "Ruth Weiss",
      role: "GUIDE",
      activityCenter: "Beer Sheva",
      phone: "052-0123456",
    },
  ];

  return (
    <div className="p-4 bg-white max-h-full shadow-lg">
      <UserManagementClient initialUsers={dummyUsers} />
    </div>
  );
}
