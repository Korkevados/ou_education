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
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  phone: z.string().regex(/^[0-9-]+$/, {
    message: "Please enter a valid phone number.",
  }),
  role: z.enum(["ADMIN", "MANAGER", "GUIDE"]),
  activityCenter: z.string().min(2, {
    message: "Activity center must be at least 2 characters.",
  }),
});

export default function UserForm({ user, onSubmit, onCancel, isLoading }) {
  const [activityCenters, setActivityCenters] = useState([]);
  const [isFetchingCenters, setIsFetchingCenters] = useState(true);
  const [newCenterName, setNewCenterName] = useState("");
  const [isAddingNewCenter, setIsAddingNewCenter] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.name || "",
      phone: user?.phone || "",
      role: user?.role || "GUIDE",
      activityCenter: user?.activityCenter || "",
    },
  });

  // Fetch centers when component mounts
  useEffect(() => {
    const fetchCenters = async () => {
      try {
        const { data, error } = await getActivityCenters();
        if (error) throw error;
        console.log("Fetched centers:", data); // Debug log
        setActivityCenters(data || []); // Ensure we have an array even if data is null
      } catch (error) {
        console.error("Error fetching activity centers:", error);
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
      setActivityCenters([...activityCenters, centerName]);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          console.log("Form submitted");
          console.log("Form values:", form.getValues());
          form.handleSubmit((data) => {
            console.log("Form data being submitted:", data);
            onSubmit(data);
          })(e);
        }}
        className="space-y-4">
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
                  className="text-right"
                  dir="rtl"
                />
              </FormControl>
              <FormMessage className="text-right" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-right w-full block">
                מספר פלאפון
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="הכנס מספר פלאפון"
                  {...field}
                  disabled={isLoading}
                  className="text-right"
                  dir="rtl"
                />
              </FormControl>
              <FormMessage className="text-right" />
            </FormItem>
          )}
        />

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
                  <SelectTrigger className="text-right" dir="rtl">
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
                    value="TRAINING_MANAGER">
                    מנהל הדרכה
                  </SelectItem>
                  <SelectItem
                    className="hover:bg-slate-100 focus:bg-slate-100 text-right"
                    value="ADMIN">
                    מנהל כללי
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage className="text-right" />
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
                      <SelectTrigger className="text-right" dir="rtl">
                        <SelectValue placeholder="בחר מרכז פעילות" />
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
              <FormMessage className="text-right" />
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
