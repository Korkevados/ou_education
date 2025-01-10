/** @format */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import * as Icons from "lucide-react";
import { NAVIGATION_CONFIG } from "@/lib/config";
import { getUserDetails } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/actions/auth";

export default function DashboardHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const details = await getUserDetails();
        setUserRole(details.role);
      } catch (error) {
        console.error("Error fetching user role:", error);
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

  return (
    <>
      <header className="bg-sky-900 text-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand */}
            <div className="flex-shrink-0">
              <Link href="/dashboard" className="text-xl font-bold">
                OU Israel
              </Link>
            </div>

            {/* Desktop Navigation - Hidden on mobile */}
            <nav className="hidden md:flex items-center space-x-4">
              <Button variant="ghost" onClick={() => signOut()}>
                התנתק
              </Button>
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-white hover:text-gray-300 focus:outline-none focus:text-gray-300">
                <Icons.Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Navigation Menu - Slide from right */}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-sky-900 transform transition-transform duration-300 ease-in-out z-50 md:hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}>
        <div className="flex justify-between items-center p-4 border-b border-sky-800">
          <h2 className="text-white text-xl font-bold">תפריט</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white hover:text-gray-300">
            <Icons.X className="h-6 w-6" />
          </button>
        </div>
        <div className="overflow-y-auto h-[calc(100%-4rem)]">
          <nav className="px-2 pt-2 pb-3 space-y-1">
            {getMenuItems().map((item) => {
              const Icon = Icons[item.icon];
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center text-white hover:bg-sky-800 px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsOpen(false)}>
                  <Icon className="h-5 w-5 ml-3" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
            <button
              onClick={() => {
                setIsOpen(false);
                signOut();
              }}
              className="w-full flex items-center text-white hover:bg-sky-800 px-3 py-2 rounded-md text-base font-medium">
              <Icons.LogOut className="h-5 w-5 ml-3" />
              <span>התנתק</span>
            </button>
          </nav>
        </div>
      </div>
    </>
  );
}
