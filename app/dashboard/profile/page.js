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
  phone: z
    .string()
    .min(10, { message: "מספר הטלפון חייב להכיל 10 ספרות" })
    .max(10, { message: "מספר הטלפון חייב להכיל 10 ספרות" })
    .regex(/^05\d{8}$/, {
      message: "מספר הטלפון חייב להתחיל ב-05 ולהכיל 10 ספרות",
    }),
  email: z
    .string()
    .min(1, { message: "שדה זה הוא חובה" })
    .email({ message: "כתובת האימייל אינה תקינה" }),
  activityCenter: z.string().optional(),
});

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(null);
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [otp, setOtp] = useState("");

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      activityCenter: "",
    },
    mode: "all",
  });

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const userDetails = await getUserDetails();
        if (userDetails) {
          setUser(userDetails);
          form.reset({
            name: userDetails.name || "",
            phone: userDetails.phone || "",
            email: userDetails.email || "",
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
    <div className="flex flex-col h-full" dir="rtl">
      <div className="flex justify-between items-center p-6 border-b">
        <h1 className="text-2xl font-bold">הפרופיל שלי</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 flex-1">
        <div className="flex flex-col bg-white rounded-lg shadow-sm">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-lg font-semibold">פרטים אישיים</h2>
            <Button
              variant="outline"
              onClick={() => {
                if (isEditing) {
                  const isValid = form.trigger();
                  if (isValid) {
                    form.handleSubmit(handleFormSubmit)();
                  }
                } else {
                  setIsEditing(true);
                }
              }}
              disabled={isSaving}>
              {isEditing ? (isSaving ? "שומר..." : "שמור פרטים") : "שנה פרטים"}
            </Button>
          </div>
          <div className="p-6 flex-1">
            <Form {...form}>
              <form
                id="profile-form"
                onSubmit={form.handleSubmit(handleFormSubmit)}
                className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>שם מלא</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="הכנס שם מלא"
                          {...field}
                          value={field.value || ""}
                          disabled={!isEditing}
                          className={`${!isEditing ? "bg-gray-50" : ""} ${
                            fieldState.error ? "border-red-500" : ""
                          }`}
                        />
                      </FormControl>
                      {fieldState.error && (
                        <p className="text-sm font-medium text-red-500 mt-1">
                          {fieldState.error.message}
                        </p>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>דואר אלקטרוני</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="הכנס דואר אלקטרוני"
                          type="email"
                          {...field}
                          value={field.value || ""}
                          disabled={!isEditing}
                          className={`${!isEditing ? "bg-gray-50" : ""} ${
                            fieldState.error ? "border-red-500" : ""
                          }`}
                        />
                      </FormControl>
                      {fieldState.error && (
                        <p className="text-sm font-medium text-red-500 mt-1">
                          {fieldState.error.message}
                        </p>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>מספר טלפון</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="05XXXXXXXX"
                          {...field}
                          value={field.value || ""}
                          disabled={!isEditing}
                          className={`px-2 ${!isEditing ? "bg-gray-50" : ""} ${
                            fieldState.error ? "border-red-500" : ""
                          }`}
                          maxLength={10}
                          inputMode="numeric"
                          pattern="05[0-9]{8}"
                        />
                      </FormControl>
                      {fieldState.error && (
                        <p className="text-sm font-medium text-red-500 mt-1">
                          {fieldState.error.message}
                        </p>
                      )}
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>
        </div>

        <div className="flex flex-col bg-white rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold p-4 border-b">פרטי תפקיד</h2>
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
              {user.activityCenter && (
                <div className="space-y-2">
                  <p className="text-gray-600">מרכז פעילות</p>
                  <p className="font-medium">{user.activityCenter}</p>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-gray-600">מרכז פעילות</p>
                <p className="font-medium">שדרות</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="p-6 sm:p-8">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl">אישור שינויים</DialogTitle>
            <DialogDescription className="text-base">
              האם אתה בטוח שברצונך לשמור את השינויים?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 justify-start mt-6">
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                setShowConfirmDialog(false);
                setIsEditing(false);
                form.reset();
              }}>
              ביטול
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => saveChanges(pendingChanges)}
              disabled={isSaving}>
              {isSaving ? "שומר..." : "שמור"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* OTP Verification Dialog */}
      <Dialog open={showOtpVerification} onOpenChange={setShowOtpVerification}>
        <DialogContent className="p-6 sm:p-8">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl">אימות מספר טלפון</DialogTitle>
            <DialogDescription className="text-base">
              הזן את הקוד שנשלח למספר הטלפון החדש שלך
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <Input
              placeholder="הכנס קוד אימות"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="text-center text-lg"
              maxLength={6}
            />
          </div>
          <DialogFooter className="flex gap-2 justify-start">
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                setShowOtpVerification(false);
                setIsEditing(false);
                setOtp("");
                form.reset();
              }}>
              ביטול
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
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
