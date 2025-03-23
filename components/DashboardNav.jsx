/** @format */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getUserDetails } from "@/app/actions/auth";
import * as Icons from "lucide-react";
import { NAVIGATION_CONFIG } from "@/lib/config";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";

function DashboardNav() {
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const details = await getUserDetails();
        console.log("User details:", details);

        if (details && details.role) {
          setUserRole(details.role);
        } else {
          console.log("No user role found in details");
          setError("פרטי משתמש חסרים");
        }
      } catch (error) {
        console.error("Error fetching user role:", error);

        // אם הסשן לא קיים או פג תוקף, עבור לדף ההתחברות
        if (error.message?.includes("No session found")) {
          router.push("/verify");
        }

        setError("שגיאה בטעינת פרטי משתמש");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, [router]);

  const getMenuItems = () => {
    let items = [...NAVIGATION_CONFIG.base];

    // רק אם יש תפקיד, התאם את התפריט
    if (userRole) {
      if (userRole === "מנהל כללי" || userRole === "ADMIN") {
        items = [...items, ...NAVIGATION_CONFIG.admin];
      } else if (userRole === "מדריך" || userRole === "GUIDE") {
        items = [...items, ...NAVIGATION_CONFIG.instructor];
      } else if (userRole === "מנהל הדרכה" || userRole === "TRAINING_MANAGER") {
        items = [...items, ...NAVIGATION_CONFIG.training_manager];
      }
    }

    return items;
  };

  if (isLoading) {
    return (
      <nav className="h-full bg-white shadow-lg flex items-center justify-center">
        <div className="text-center">
          <Spinner className="w-8 h-8 text-sky-600" />
          <p className="mt-2 text-sky-900 text-sm">טוען תפריט...</p>
        </div>
      </nav>
    );
  }

  if (error) {
    return (
      <nav className="h-full bg-white shadow-lg flex items-center justify-center">
        <div className="text-center p-4">
          <div className="text-red-500 mb-2">
            <Icons.AlertCircle className="h-8 w-8 mx-auto" />
          </div>
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={() => router.push("/verify")}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors">
            התחברות מחדש
          </button>
        </div>
      </nav>
    );
  }

  return (
    <nav className="h-full bg-white shadow-lg">
      <ul className="space-y-2 p-4">
        {getMenuItems().map((item) => {
          const Icon = Icons[item.icon];
          return (
            <li key={item.name}>
              <Link
                href={item.href}
                className="flex items-center space-x-3 p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors duration-200">
                <Icon className="h-5 w-5 ml-3" />
                <span>{item.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default DashboardNav;
