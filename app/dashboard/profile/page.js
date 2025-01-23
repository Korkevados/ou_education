/** @format */

"use client";

import { useEffect, useState } from "react";
import { getUserDetails } from "@/app/actions/auth";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "השם חייב להכיל לפחות 2 תווים",
  }),
  phone: z.string().min(9, {
    message: "מספר הטלפון חייב להכיל לפחות 9 ספרות",
  }),
  activityCenter: z.string().optional(),
});

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(null);
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [otp, setOtp] = useState("");

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      activityCenter: "",
    },
  });

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const userDetails = await getUserDetails();
        setUser(userDetails);
        if (userDetails) {
          form.reset({
            name: userDetails.name,
            phone: userDetails.phone,
            activityCenter: userDetails.activityCenter || "",
          });
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [form]);

  const handleFormSubmit = async (data) => {
    setPendingChanges(data);
    if (data.phone !== user.phone) {
      // Phone number was changed, show OTP verification
      try {
        // TODO: Implement send OTP
        console.log("Sending OTP to:", data.phone);
        setShowOtpVerification(true);
      } catch (error) {
        console.error("Error sending OTP:", error);
      }
    } else {
      // No phone change, show regular confirmation
      setShowConfirmDialog(true);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      setIsSaving(true);
      // TODO: Implement verify OTP
      console.log("Verifying OTP:", otp);
      // If OTP is valid, proceed with save
      await saveChanges(pendingChanges);
      setShowOtpVerification(false);
      setOtp("");
    } catch (error) {
      console.error("Error verifying OTP:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const saveChanges = async (data) => {
    try {
      setIsSaving(true);
      // TODO: Implement update user profile
      console.log("Updating profile:", data);
      setUser({ ...user, ...data });
      setShowConfirmDialog(false);
      setPendingChanges(null);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        טוען...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]" dir="rtl">
      <div className="flex justify-between items-center p-6 border-b">
        <h1 className="text-2xl font-bold">הפרופיל שלי</h1>
        <Button
          className="bg-white"
          type="submit"
          form="profile-form"
          disabled={isSaving}>
          {isSaving ? "שומר..." : "שמור שינויים"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 flex-1">
        <div className="flex flex-col bg-white rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold p-4 border-b">פרטים אישיים</h2>
          <div className="p-6 flex-1">
            <Form {...form}>
              <form
                id="profile-form"
                onSubmit={form.handleSubmit(handleFormSubmit)}
                className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>שם מלא</FormLabel>
                      <FormControl>
                        <Input placeholder="הכנס שם מלא" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>מספר טלפון</FormLabel>
                      <FormControl>
                        <Input placeholder="הכנס מספר טלפון" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="activityCenter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>מרכז פעילות</FormLabel>
                      <FormControl>
                        <Input placeholder="הכנס מרכז פעילות" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>
        </div>

        <div className="flex flex-col bg-white rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold p-4 border-b">פרטי משתמש</h2>
          <div className="p-6 flex-1">
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-gray-600">תפקיד</p>
                <p className="font-medium">
                  {user.role === "GUIDE" && "מדריך"}
                  {user.role === "TRAINING_MANAGER" && "מנהל הדרכה"}
                  {user.role === "ADMIN" && "מנהל כללי"}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-gray-600">דואר אלקטרוני</p>
                <p className="font-medium">ppp@gmail.com</p>
              </div>
              {/* <div className="space-y-2">
                <p className="text-gray-600">דואר אלקטרוני</p>
                <p className="font-medium">{user.email}</p>
              </div> */}

              <div className="space-y-2">
                <p className="text-gray-600">מרכז פעילות</p>
                <p className="font-medium">שדרות</p>
              </div>

              {/* {user.activityCenter && (
                <div className="space-y-2">
                  <p className="text-gray-600">מרכז פעילות</p>
                  <p className="font-medium">{user.activityCenter}</p>
                </div>
              )} */}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>אישור שינויים</DialogTitle>
            <DialogDescription>
              האם אתה בטוח שברצונך לשמור את השינויים?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}>
              ביטול
            </Button>
            <Button
              onClick={() => saveChanges(pendingChanges)}
              disabled={isSaving}>
              {isSaving ? "שומר..." : "שמור"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* OTP Verification Dialog */}
      <Dialog open={showOtpVerification} onOpenChange={setShowOtpVerification}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>אימות מספר טלפון</DialogTitle>
            <DialogDescription>
              הזן את הקוד שנשלח למספר הטלפון החדש שלך
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="הכנס קוד אימות"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="text-center text-lg"
              maxLength={6}
            />
          </div>
          <DialogFooter className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowOtpVerification(false);
                setOtp("");
              }}>
              ביטול
            </Button>
            <Button
              onClick={handleVerifyOtp}
              disabled={isSaving || otp.length < 6}>
              {isSaving ? "מאמת..." : "אמת קוד"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
