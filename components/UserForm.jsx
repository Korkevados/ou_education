/** @format */
"use client";
import { useState, useEffect } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { getActivityCenters } from "@/app/actions/users";
import { Loader2, PlusCircle, Check } from "lucide-react";

const formSchema = z.object({
  id: z.string().optional(),
  name: z
    .string()
    .min(2, {
      message: "נא להזין שם מלא באורך של 2 תווים לפחות.",
    })
    .refine((val) => /^[\u0590-\u05FF\s]+$/.test(val), {
      message: "נא להזין שם בעברית בלבד.",
    }),
  phone: z
    .string()
    .refine((val) => /^[0-9-]+$/.test(val), {
      message: "נא להזין מספר טלפון תקין עם ספרות ומקפים בלבד.",
    })
    .refine(
      (val) => {
        // Remove hyphens for validation
        const cleanPhone = val.replace(/-/g, "");
        return cleanPhone.length === 10 && cleanPhone.startsWith("05");
      },
      {
        message: "מספר טלפון חייב להכיל 10 ספרות ולהתחיל ב-05.",
      }
    ),
  email: z.string().email({
    message: "נא להזין כתובת אימייל תקינה.",
  }),
  role: z.enum(["ADMIN", "MANAGER", "GUIDE"], {
    message: "נא לבחור תפקיד תקף.",
  }),
  is_active: z.boolean().optional(),
  activityCenter: z.string().optional(),
  activityCity: z.string().optional(),
  password: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 8, {
      message: "סיסמה חייבת להכיל לפחות 8 תווים.",
    })
    .refine((val) => !val || /[A-Z]/.test(val), {
      message: "סיסמה חייבת להכיל לפחות אות גדולה אחת באנגלית.",
    })
    .refine((val) => !val || /[a-z]/.test(val), {
      message: "סיסמה חייבת להכיל לפחות אות קטנה אחת באנגלית.",
    }),
});

export default function UserForm({ user, onSubmit, onCancel, isLoading }) {
  const [activityCenters, setActivityCenters] = useState([]);
  const [isFetchingCenters, setIsFetchingCenters] = useState(true);
  const [newCenterName, setNewCenterName] = useState("");
  const [isAddingNewCenter, setIsAddingNewCenter] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const isNewUser = !user;

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: user?.id || "",
      name: user?.full_name || "",
      phone: user?.phone || "",
      email: user?.email || "",
      role: user?.user_type || "GUIDE",
      activityCenter: user?.center_name || "",
      activityCity: "",
      is_active: user?.is_active !== undefined ? user.is_active : true,
      password: "",
    },
    mode: "all", // Validate on blur and on change
  });

  // Trigger validation on each field when component mounts
  useEffect(() => {
    // Validate each field when the form first loads
    const triggerValidation = async () => {
      const fields = Object.keys(form.getValues());
      for (const field of fields) {
        if (form.getValues()[field]) {
          await form.trigger(field);
        }
      }
    };

    triggerValidation();
  }, [form]);

  // Form submit handler to clean phone number
  const handleFormSubmit = async (data) => {
    try {
      setFormError(""); // Clear any previous errors
      console.log("Form data before cleaning:", data);

      // Clean the phone number by removing hyphens
      const cleanedData = {
        ...data,
        phone: data.phone.replace(/-/g, ""),
      };
      console.log("Form data after cleaning:", cleanedData);

      // Call the onSubmit function and properly await the result
      const result = await onSubmit(cleanedData);
      console.log("Server response:", result);

      // Check if there was an error returned from the server
      if (result && result.error) {
        console.error("Form submission error from server:", result.error);
        setFormError(result.error);
        return false; // Prevent dialog from closing
      }

      // If we get here, submission was successful
      return true;
    } catch (error) {
      console.error("Form submission exception:", error);
      setFormError(error.message || "אירעה שגיאה. נסו שנית מאוחר יותר.");
      return false; // Prevent dialog from closing
    }
  };

  // Fetch centers when component mounts
  useEffect(() => {
    const fetchCenters = async () => {
      try {
        console.log("UserForm: Fetching activity centers");
        const { data, error } = await getActivityCenters();
        if (error) {
          console.error("UserForm: Error fetching centers:", error);
          throw error;
        }
        console.log("UserForm: Fetched centers:", data); // Debug log
        setActivityCenters(data || []); // Ensure we have an array even if data is null
      } catch (error) {
        console.error("UserForm: Error in fetchCenters:", error);
        setActivityCenters([]); // Set empty array on error
      } finally {
        setIsFetchingCenters(false);
      }
    };

    fetchCenters();
  }, []);

  // Function to add a new center to the list
  const addNewCenterToList = (centerName) => {
    if (!activityCenters.includes(centerName)) {
      console.log(`Adding new center to list: ${centerName}`);
      setActivityCenters([...activityCenters, centerName]);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={async (e) => {
          e.preventDefault(); // Prevent default form submission
          console.log("Form submitted");

          // Trigger validation on all fields and show errors
          const isValid = await form.trigger();
          console.log("Form validation result:", isValid);

          if (!isValid) {
            console.log("Form validation failed");

            // Force display validation errors for each field
            const fields = Object.keys(form.getValues());
            for (const field of fields) {
              await form.trigger(field);
            }

            return; // Don't proceed if validation fails
          }

          const data = form.getValues();
          console.log("Form data being submitted:", data);

          const success = await handleFormSubmit(data);
          console.log("Submission success:", success);

          // Note: Dialog closure is handled by UserManagementClient
        }}
        className="space-y-4">
        {/* Display server-side form errors */}
        {formError && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
            role="alert">
            <div className="font-bold">שגיאה:</div>
            <div>{formError}</div>
          </div>
        )}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-right w-full block">שם מלא</FormLabel>
              <FormControl>
                <Input
                  placeholder="הכנס שם"
                  {...field}
                  disabled={isLoading}
                  className={`text-right ${
                    form.formState.errors.name ? "border-red-500 bg-red-50" : ""
                  }`}
                  dir="rtl"
                />
              </FormControl>
              {form.formState.errors.name && (
                <p className="text-right text-red-500 text-sm font-bold mt-1 mr-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-right w-full block">
                כתובת אימייל
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="הכנס כתובת אימייל"
                  {...field}
                  disabled={isLoading}
                  className={`text-right ${
                    form.formState.errors.email
                      ? "border-red-500 bg-red-50"
                      : ""
                  }`}
                  dir="rtl"
                />
              </FormControl>
              {form.formState.errors.email && (
                <p className="text-right text-red-500 text-sm font-bold mt-1 mr-1">
                  {form.formState.errors.email.message}
                </p>
              )}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-right w-full block">
                מספר טלפון
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="הכנס מספר טלפון"
                  {...field}
                  disabled={isLoading}
                  className={`text-right ${
                    form.formState.errors.phone
                      ? "border-red-500 bg-red-50"
                      : ""
                  }`}
                  dir="rtl"
                />
              </FormControl>
              {form.formState.errors.phone && (
                <p className="text-right text-red-500 text-sm font-bold mt-1 mr-1">
                  {form.formState.errors.phone.message}
                </p>
              )}
            </FormItem>
          )}
        />

        {isNewUser && (
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-right w-full block">
                  סיסמא (אופציונלי)
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="הכנס סיסמא או השאר ריק ליצירת סיסמא אוטומטית"
                      type={showPassword ? "text" : "password"}
                      {...field}
                      disabled={isLoading}
                      className={`text-right pr-10 ${
                        form.formState.errors.password
                          ? "border-red-500 bg-red-50"
                          : ""
                      }`}
                      dir="rtl"
                    />
                    <button
                      type="button"
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </FormControl>
                {form.formState.errors.password && (
                  <p className="text-right text-red-500 text-sm font-bold mt-1 mr-1">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-right w-full block">תפקיד</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isLoading}>
                <FormControl>
                  <SelectTrigger
                    className={`text-right ${
                      form.formState.errors.role
                        ? "border-red-500 bg-red-50"
                        : ""
                    }`}
                    dir="rtl">
                    <SelectValue placeholder="בחר תפקיד" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-white border shadow-lg">
                  <SelectItem
                    className="hover:bg-slate-100 focus:bg-slate-100 text-right"
                    value="GUIDE">
                    מדריך
                  </SelectItem>
                  <SelectItem
                    className="hover:bg-slate-100 focus:bg-slate-100 text-right"
                    value="MANAGER">
                    מנהל הדרכה
                  </SelectItem>
                  <SelectItem
                    className="hover:bg-slate-100 focus:bg-slate-100 text-right"
                    value="ADMIN">
                    מנהל כללי
                  </SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.role && (
                <p className="text-right text-red-500 text-sm font-bold mt-1 mr-1">
                  {form.formState.errors.role.message}
                </p>
              )}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-end space-x-3 space-x-reverse rtl:space-x-reverse">
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-600"
                />
              </FormControl>
              <FormLabel className="text-right">המשתמש פעיל</FormLabel>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="activityCenter"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-right w-full block">
                מרכז פעילות
              </FormLabel>
              {isAddingNewCenter ? (
                <div className="space-y-2">
                  <Input
                    placeholder="הכנס שם מרכז חדש"
                    value={newCenterName}
                    onChange={(e) => {
                      console.log("New center name:", e.target.value);
                      setNewCenterName(e.target.value);
                    }}
                    className="text-right"
                    dir="rtl"
                  />
                  <FormField
                    control={form.control}
                    name="activityCity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-right w-full block">
                          עיר המרכז
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="הכנס שם העיר"
                            {...field}
                            disabled={isLoading}
                            className="text-right"
                            dir="rtl"
                          />
                        </FormControl>
                        <FormMessage className="text-right text-red-500 font-bold mr-1" />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-start space-x-reverse space-x-2">
                    <Button
                      type="button"
                      onClick={() => {
                        if (newCenterName.trim().length >= 2) {
                          field.onChange(newCenterName);
                          console.log("New center confirmed:", newCenterName);
                          // Add the new center to the list of centers
                          addNewCenterToList(newCenterName);
                          setIsAddingNewCenter(false);
                        }
                      }}
                      className="bg-green-600 hover:bg-green-700">
                      <Check className="ml-2 h-4 w-4" />
                      אישור
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsAddingNewCenter(false);
                        setNewCenterName("");
                      }}>
                      ביטול
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <Select
                    onValueChange={(value) => {
                      console.log("Activity center selected:", value);
                      if (value === "NEW") {
                        setIsAddingNewCenter(true);
                      } else {
                        field.onChange(value);
                      }
                    }}
                    defaultValue={field.value}
                    disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger
                        className={`text-right ${
                          form.formState.errors.activityCenter
                            ? "border-red-500 bg-red-50"
                            : ""
                        }`}
                        dir="rtl">
                        <SelectValue placeholder="בחר מרכז פעילות (אופציונלי)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white border shadow-lg">
                      {activityCenters.map((center) => (
                        <SelectItem
                          key={center}
                          value={center}
                          className="hover:bg-slate-100 focus:bg-slate-100 text-right">
                          {center}
                        </SelectItem>
                      ))}
                      <SelectItem
                        value="NEW"
                        className="text-blue-600 hover:bg-slate-100 focus:bg-slate-100 text-right">
                        <div className="flex items-center">
                          <PlusCircle className="ml-2 h-4 w-4" />
                          הוסף מרכז חדש
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-2 text-blue-600 border-blue-600 hover:bg-blue-50"
                    onClick={() => setIsAddingNewCenter(true)}>
                    <PlusCircle className="ml-2 h-4 w-4" />
                    הוסף מרכז חדש
                  </Button>
                </>
              )}
              <FormMessage className="text-right text-red-500 font-bold mr-1" />
            </FormItem>
          )}
        />

        <div className="flex justify-start space-x-reverse space-x-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            {user ? "עדכן משתמש" : "הוסף משתמש"}
          </Button>
          <Button
            variant="outline"
            type="button"
            onClick={onCancel}
            disabled={isLoading}>
            ביטול
          </Button>
        </div>
      </form>
    </Form>
  );
}
