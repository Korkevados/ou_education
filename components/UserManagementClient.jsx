/** @format */
"use client";
import { useState, useMemo, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MoreVertical, Plus, ChevronDown } from "lucide-react";
import UserForm from "./UserForm";
import { createUser, updateUser, deleteUser } from "@/app/actions/users";
import { toast } from "sonner";

// Calculate items per page based on viewport height to avoid scrolling
const ITEMS_PER_PAGE = 6; // Adjusted for typical screen sizes
const ROLES = ["ADMIN", "GUIDE", "MANAGER"];

export default function UserManagementClient({ initialUsers }) {
  const [users, setUsers] = useState(initialUsers);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("name");
  const [selectedRole, setSelectedRole] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Filter and paginate users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const searchLower = searchTerm.toLowerCase();
      const roleMatch = selectedRole ? user.role === selectedRole : true;

      const searchMatch =
        filterBy === "name"
          ? user.name.toLowerCase().includes(searchLower)
          : filterBy === "phone"
          ? user.phone.includes(searchTerm)
          : true;

      return searchMatch && roleMatch;
    });
  }, [users, searchTerm, filterBy, selectedRole]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleAddUser = async (userData) => {
    try {
      setIsLoading(true);
      console.log("handleAddUser called with:", userData);

      // Check if using "NEW" as activity center
      if (userData.activityCenter === "NEW") {
        console.error(
          "Error: Activity center is set to 'NEW'. This should be replaced with an actual center name."
        );
        toast.error("יש להזין שם מרכז פעילות");
        setIsLoading(false);
        return;
      }

      const { data, error } = await createUser(userData);
      console.log("createUser response:", { data, error });

      if (error) {
        toast.error(error);
        return;
      }

      // Add the new user to the list
      setUsers([...users, { ...userData, id: data.id }]);
      setIsAddUserOpen(false);
      toast.success("המשתמש נוצר בהצלחה");
    } catch (error) {
      console.error("Error adding user:", error);
      toast.error("שגיאה ביצירת המשתמש");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = async (userData) => {
    try {
      setIsLoading(true);
      const { error } = await updateUser(editingUser.id, userData);

      if (error) {
        toast.error(error);
        return;
      }

      // Update the user in the list
      setUsers(
        users.map((user) =>
          user.id === editingUser.id ? { ...user, ...userData } : user
        )
      );
      setIsAddUserOpen(false);
      setEditingUser(null);
      toast.success("המשתמש עודכן בהצלחה");
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("שגיאה בעדכון המשתמש");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      setIsLoading(true);
      const { error } = await deleteUser(userId);

      if (error) {
        toast.error(error);
        return;
      }

      // Remove the user from the list
      setUsers(users.filter((user) => user.id !== userId));
      toast.success("המשתמש נמחק בהצלחה");
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("שגיאה במחיקת המשתמש");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setIsAddUserOpen(false);
    setEditingUser(null);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold">ניהול משתמשים</h1>
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogTrigger asChild>
            <Button disabled={isLoading}>
              <Plus className="mr-2 h-4 w-4" />
              הוסף משתמש
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingUser ? "ערוך משתמש" : "הוסף משתמש חדש"}
              </DialogTitle>
            </DialogHeader>
            <UserForm
              user={editingUser}
              onSubmit={editingUser ? handleEditUser : handleAddUser}
              onCancel={handleCloseDialog}
              isLoading={isLoading}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-row justify-between shrink-0 mb-2 flex gap-4">
        <Input
          placeholder="חיפוש לפי שם או מספר פלאפון..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />

        <div className="shrink-0 gap-2 mt-2 bg-sky-50 rounded-md border">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1 || isLoading}>
            הקודם
          </Button>
          <span className="py-2 px-4">
            עמוד {currentPage} מתוך {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || isLoading}>
            הבא
          </Button>
        </div>
      </div>

      <div className="grow flex flex-col bg-sky-50 rounded-md border">
        <Table>
          <TableHeader className="bg-sky-100">
            <TableRow>
              <TableHead className="text-center h-11">שם</TableHead>
              <TableHead className="text-center h-11">
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center justify-center w-full">
                    {selectedRole || "תפקיד"}{" "}
                    <ChevronDown className="mr-2 h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      className="bg-sky-50 hover:bg-slate-400 items-left"
                      onClick={() => setSelectedRole("")}>
                      הכל
                    </DropdownMenuItem>
                    {ROLES.map((role) => (
                      <DropdownMenuItem
                        key={role}
                        onClick={() => setSelectedRole(role)}
                        className="bg-sky-50 hover:bg-slate-400">
                        {role}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableHead>
              <TableHead className="text-center h-11">מרכז פעילות</TableHead>
              <TableHead className="text-center h-11">מספר טלפון</TableHead>
              <TableHead className="w-[70px] text-center h-11">
                פעולות
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.map((user) => (
              <TableRow
                key={user.phone}
                className="h-12 hover:bg-sky-100 transition-colors">
                <TableCell className="text-center">{user.name}</TableCell>
                <TableCell className="text-center">{user.role}</TableCell>
                <TableCell className="text-center">
                  {user.activityCenter}
                </TableCell>
                <TableCell className="text-center">{user.phone}</TableCell>
                <TableCell className="text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        disabled={isLoading}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingUser(user);
                          setIsAddUserOpen(true);
                        }}>
                        ערוך
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDeleteUser(user.id)}>
                        מחק
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {/* Add empty rows to maintain consistent height */}
            {paginatedUsers.length < ITEMS_PER_PAGE &&
              Array(ITEMS_PER_PAGE - paginatedUsers.length)
                .fill(0)
                .map((_, index) => (
                  <TableRow key={`empty-${index}`} className="h-12">
                    <TableCell className="text-center">&nbsp;</TableCell>
                    <TableCell className="text-center">&nbsp;</TableCell>
                    <TableCell className="text-center">&nbsp;</TableCell>
                    <TableCell className="text-center">&nbsp;</TableCell>
                    <TableCell className="text-center">&nbsp;</TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
