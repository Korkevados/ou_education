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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Check,
  X,
  FileText,
  Upload,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import React from "react";

const formSchema = z.object({
  amount: z.string().min(1, {
    message: "יש להזין סכום",
  }),
  receipt: z.any().optional(),
});

// Dummy data for expenses
const dummyExpenses = [
  {
    id: 1,
    date: new Date("2024-03-20T10:00:00"),
    amount: 150.5,
    managerApproved: true,
    accountantApproved: false,
    receiptUrl: "https://example.com/receipt1.pdf",
  },
  {
    id: 2,
    date: new Date("2024-03-19T15:30:00"),
    amount: 75.2,
    managerApproved: true,
    accountantApproved: true,
    receiptUrl: "https://example.com/receipt2.pdf",
  },
  // Add more dummy data as needed
];

export default function ExpensesPage() {
  const [user, setUser] = useState(null);
  const [expenses, setExpenses] = useState(dummyExpenses);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showExpensesTable, setShowExpensesTable] = useState(false);
  const [expandedRows, setExpandedRows] = useState(new Set());

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
      receipt: null,
    },
  });

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const userDetails = await getUserDetails();
        setUser(userDetails);
        // TODO: Fetch user's expenses from Supabase
        // const { data, error } = await supabase
        //   .from('expenses')
        //   .select('*')
        //   .eq('userId', userDetails.id)
        //   .order('date', { ascending: false });
      } catch (error) {
        console.error("Error fetching user details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, []);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      // TODO: Handle file upload preview if needed
    }
  };

  const onSubmit = async (data) => {
    try {
      const currentDate = new Date();
      const fileName = `${user.name}_${format(
        currentDate,
        "yyyyMMdd_HHmmss"
      )}_${data.amount}`;

      // TODO: Upload file to Supabase bucket
      // const { data: fileData, error: fileError } = await supabase.storage
      //   .from('expenses')
      //   .upload(`${user.id}/${fileName}`, selectedFile);

      // TODO: Create expense record in Supabase
      // const { data: expenseData, error: expenseError } = await supabase
      //   .from('expenses')
      //   .insert([
      //     {
      //       userId: user.id,
      //       date: currentDate,
      //       amount: parseFloat(data.amount),
      //       receiptUrl: fileData.path,
      //       managerApproved: false,
      //       accountantApproved: false,
      //     },
      //   ]);

      // For now, just update local state
      const newExpense = {
        id: Date.now(),
        date: currentDate,
        amount: parseFloat(data.amount),
        managerApproved: false,
        accountantApproved: false,
        receiptUrl: URL.createObjectURL(selectedFile),
      };

      setExpenses([newExpense, ...expenses]);
      form.reset();
      setSelectedFile(null);
    } catch (error) {
      console.error("Error submitting expense:", error);
    }
  };

  const toggleRow = (id) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(id)) {
      newExpandedRows.delete(id);
    } else {
      newExpandedRows.add(id);
    }
    setExpandedRows(newExpandedRows);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        טוען...
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-full relative" dir="rtl">
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setShowExpensesTable(!showExpensesTable)}
        className="md:hidden fixed bottom-4 left-4 z-10 bg-blue-500 text-white p-3 rounded-full shadow-lg">
        {showExpensesTable ? <ChevronRight /> : <ChevronLeft />}
      </button>

      {/* Expenses Table */}
      <div
        className={`
          w-full md:w-3/4 p-6 border-l
          ${showExpensesTable ? "block" : "hidden"}
          md:block
          transition-all duration-300 ease-in-out
        `}>
        <h2 className="text-2xl font-bold mb-6">הוצאות אחרונות</h2>
        <div className="bg-white rounded-lg shadow-sm">
          {/* Mobile Table */}
          <div className="md:hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead className="text-right">תאריך</TableHead>
                  <TableHead className="text-right">סכום</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <React.Fragment key={expense.id}>
                    <TableRow
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleRow(expense.id)}>
                      <TableCell className="p-2">
                        {expandedRows.has(expense.id) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        {format(expense.date, "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        ₪{expense.amount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                    {expandedRows.has(expense.id) && (
                      <TableRow key={`${expense.id}-expanded`}>
                        <TableCell colSpan={3} className="bg-gray-50 p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">שעה:</span>
                              <span>{format(expense.date, "HH:mm")}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">אישור מנהל:</span>
                              {expense.managerApproved ? (
                                <Check className="text-green-500" />
                              ) : (
                                <X className="text-red-500" />
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">
                                אישור הנהח״ש:
                              </span>
                              {expense.accountantApproved ? (
                                <Check className="text-green-500" />
                              ) : (
                                <X className="text-red-500" />
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">קבלה:</span>
                              <a
                                href={expense.receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:text-blue-700 flex items-center gap-2"
                                onClick={(e) => e.stopPropagation()}>
                                <FileText className="h-4 w-4" />
                                <span>צפה בקבלה</span>
                              </a>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">תאריך</TableHead>
                  <TableHead className="text-center">סכום</TableHead>
                  <TableHead className="text-center">אישור מנהל</TableHead>
                  <TableHead className="text-center">אישור הנהח״ש</TableHead>
                  <TableHead className="text-center">קבלה</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="text-center">
                      {format(expense.date, "dd/MM/yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="text-center">
                      ₪{expense.amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      {expense.managerApproved ? (
                        <Check className="mx-auto text-green-500" />
                      ) : (
                        <X className="mx-auto text-red-500" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {expense.accountantApproved ? (
                        <Check className="mx-auto text-green-500" />
                      ) : (
                        <X className="mx-auto text-red-500" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <a
                        href={expense.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center text-blue-500 hover:text-blue-700">
                        <FileText className="h-4 w-4" />
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Expense Form */}
      <div
        className={`
          w-full md:w-1/4 p-2 h-full
          ${showExpensesTable ? "hidden" : "block"}
          md:block
          transition-all duration-300 ease-in-out
        `}>
        <div className="bg-white p-4 h-full rounded-lg shadow-sm">
          <h2 className="text-2xl font-bold mb-6">דיווח הוצאה</h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>סכום</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="הכנס סכום"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>תאריך</FormLabel>
                <Input
                  type="text"
                  value={format(new Date(), "dd/MM/yyyy HH:mm")}
                  disabled
                  className="bg-gray-100"
                />
              </div>

              <div className="space-y-2">
                <FormLabel>העלאת קבלה</FormLabel>
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id="receipt-upload"
                  />
                  <label
                    htmlFor="receipt-upload"
                    className="flex items-center gap-2 px-4 py-2 bg-white border rounded-md cursor-pointer hover:bg-gray-50 w-full">
                    <Upload className="h-4 w-4" />
                    <span className="truncate">
                      {selectedFile ? selectedFile.name : "בחר קובץ"}
                    </span>
                  </label>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={!selectedFile}>
                דווח הוצאה
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
