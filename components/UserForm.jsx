/** @format */
"use client";
import { useState } from "react";
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

export default function UserForm({ user, onSubmit, onCancel }) {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.name || "",
      phone: user?.phone || "",
      role: user?.role || "GUIDE",
      activityCenter: user?.activityCenter || "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>שם מלא</FormLabel>
              <FormControl>
                <Input placeholder="הכנס שם" {...field} />
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
              <FormLabel>מספר פלאפון</FormLabel>
              <FormControl>
                <Input placeholder="הכנס מספר פלאפון" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>תפקיד</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר תפקיד" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="GUIDE">Guide</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
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

        <div className="flex justify-end space-x-2">
          <Button variant="outline" type="button" onClick={onCancel}>
            ביטול
          </Button>
          <Button type="submit">{user ? "עדכן משתמש" : "ערוך משתמש"}</Button>
        </div>
      </form>
    </Form>
  );
}
