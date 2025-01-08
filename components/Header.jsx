/** @format */
"use client";

import Link from "next/link";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "./ui/sheet";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Menu } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { signOut } from "@/app/actions/auth";
import { useRouter } from "next/navigation";
import createSupaClient from "@/lib/supabase/supabase";

export default function Header() {
  const [session, setSession] = useState(null);
  const [rendered, setRender] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkauth() {
      const supabase = await createSupaClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        setSession(user);
      });
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setRender(!rendered); // מרענן את הקומפוננטה כשיש שינוי בסשן
      });

      return () => {
        subscription.unsubscribe();
      };
    }
    // בדיקת סשן ראשונית
    checkauth();
    // האזנה לשינויים בסשן
  }, [rendered]);

  // תפריט למשתמש מחובר
  if (session) {
    return (
      <header className="bg-sky-900 text-white">
        <div className="container px-4 py-4">
          <nav className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <Link href="/">
                <Image
                  src="/images/ouisrael_logo.png"
                  height={40}
                  width={40}
                  alt="OU Israel Logo"
                  className="brightness-0 invert"
                />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <Link href="/" className="hover:text-sky-200 transition">
                דף הבית
              </Link>
              <Link href="/about" className="hover:text-sky-200 transition">
                אודות
              </Link>
              <Link href="/contact" className="hover:text-sky-200 transition">
                צור קשר
              </Link>
              <Separator orientation="vertical" className="h-6 bg-sky-700" />
              <div className="flex items-center gap-6">
                <Link href="/profile" className="hover:text-sky-200 transition">
                  פרופיל
                </Link>
                <form action={signOut}>
                  <Button
                    type="submit"
                    variant="destructive"
                    className="hover:bg-red-600 transition">
                    התנתק
                  </Button>
                </form>
              </div>
            </div>

            {/* Mobile Navigation */}
            <Sheet>
              <SheetTrigger className="md:hidden p-2">
                <Menu className="h-6 w-6" />
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-48 bg-sky-900 text-white p-6">
                <SheetTitle className="text-white text-right mb-4 mt-4">
                  תפריט
                </SheetTitle>
                <div className="flex flex-col gap-4">
                  <Link
                    href="/"
                    className="text-lg hover:text-sky-200 transition">
                    דף הבית
                  </Link>
                  <Link
                    href="/about"
                    className="text-lg hover:text-sky-200 transition">
                    אודות
                  </Link>
                  <Link
                    href="/contact"
                    className="text-lg hover:text-sky-200 transition">
                    צור קשר
                  </Link>
                  <Separator className="bg-sky-700" />
                  <div className="flex items-center gap-6">
                    <Link
                      href="/profile"
                      className="hover:text-sky-200 transition">
                      פרופיל
                    </Link>
                    <form action={signOut}>
                      <Button
                        type="submit"
                        variant="destructive"
                        className="hover:bg-red-600 transition">
                        התנתק
                      </Button>
                    </form>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </nav>
        </div>
      </header>
    );
    return (
      <header className="bg-sky-900 text-white">
        <div className="container px-4 py-4">
          <nav className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <Link href="/profile">
                <Image
                  src="/images/ouisrael_logo.png"
                  height={40}
                  width={40}
                  alt="OU Israel Logo"
                  className="brightness-0 invert"
                />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="flex items-center gap-6">
              <Link href="/profile" className="hover:text-sky-200 transition">
                פרופיל
              </Link>
              <form action={signOut}>
                <Button
                  type="submit"
                  variant="destructive"
                  className="hover:bg-red-600 transition">
                  התנתק
                </Button>
              </form>
            </div>
          </nav>
        </div>
      </header>
    );
  }

  // תפריט למשתמש לא מחובר
  return (
    <header className="bg-sky-900 text-white">
      <div className="container px-4 py-4">
        <nav className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link href="/">
              <Image
                src="/images/ouisrael_logo.png"
                height={40}
                width={40}
                alt="OU Israel Logo"
                className="brightness-0 invert"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="hover:text-sky-200 transition">
              דף הבית
            </Link>
            <Link href="/about" className="hover:text-sky-200 transition">
              אודות
            </Link>
            <Link href="/contact" className="hover:text-sky-200 transition">
              צור קשר
            </Link>
            <Separator orientation="vertical" className="h-6 bg-sky-700" />
            <Link
              href="/verify"
              className="bg-sky-700 px-4 py-2 rounded-md hover:bg-sky-600 transition">
              כניסת מדריכים
            </Link>
          </div>

          {/* Mobile Navigation */}
          <Sheet>
            <SheetTrigger className="md:hidden p-2">
              <Menu className="h-6 w-6" />
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-48 bg-sky-900 text-white p-6">
              <SheetTitle className="text-white text-right mb-4 mt-4">
                תפריט
              </SheetTitle>
              <div className="flex flex-col gap-4">
                <Link
                  href="/"
                  className="text-lg hover:text-sky-200 transition">
                  דף הבית
                </Link>
                <Link
                  href="/about"
                  className="text-lg hover:text-sky-200 transition">
                  אודות
                </Link>
                <Link
                  href="/contact"
                  className="text-lg hover:text-sky-200 transition">
                  צור קשר
                </Link>
                <Separator className="bg-sky-700" />
                <Link
                  href="/verify"
                  className="bg-sky-700 px-4 py-2 rounded-md hover:bg-sky-600 transition text-center">
                  כניסת מדריכים
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </nav>
      </div>
    </header>
  );
}
