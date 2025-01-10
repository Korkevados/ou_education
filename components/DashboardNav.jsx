/** @format */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getUserDetails } from "@/app/actions/auth";
import * as Icons from "lucide-react";
import { NAVIGATION_CONFIG } from "@/lib/config";
import { Spinner } from "@/components/ui/spinner";

function DashboardNav() {
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const details = await getUserDetails();
        setUserRole(details.role);
      } catch (error) {
        console.error("Error fetching user role:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserRole();
  }, []);

  const getMenuItems = () => {
    let items = [...NAVIGATION_CONFIG.base];
    if (userRole === "ADMIN") {
      items = [...items, ...NAVIGATION_CONFIG.admin];
    } else if (userRole === "instructor") {
      items = [...items, ...NAVIGATION_CONFIG.instructor];
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
