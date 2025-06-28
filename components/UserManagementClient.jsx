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
import {
  createUser,
  updateUser,
  activateUser,
  deactivateUser,
  getUsers,
} from "@/app/actions/users";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Calculate items per page based on viewport height to avoid scrolling
const ITEMS_PER_PAGE = 6; // Adjusted for typical screen sizes
const ROLES = ["ADMIN", "GUIDE", "MANAGER"];

export default function UserManagementClient({ initialUsers }) {
  const [users, setUsers] = useState(initialUsers);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Filter and paginate users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const searchLower = searchTerm.toLowerCase();
      const roleMatch = selectedRole ? user.user_type === selectedRole : true;
      const statusMatch =
        selectedStatus === "active"
          ? user.is_active
          : selectedStatus === "inactive"
          ? !user.is_active
          : true;

      let searchMatch = true;
      if (searchTerm) {
        // Clean up the search term and phone number for comparison
        const cleanSearchTerm = searchTerm.replace(/[-\s]/g, "");
        const cleanPhone = user.phone.replace(/[-\s]/g, "");

        // Check if matches either name or phone
        searchMatch =
          user.full_name.toLowerCase().includes(searchLower) ||
          cleanPhone.includes(cleanSearchTerm);
      }

      return searchMatch && roleMatch && statusMatch;
    });
  }, [users, searchTerm, selectedRole, selectedStatus]);

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
        return { error: "יש להזין שם מרכז פעילות" };
      }

      const { data, error } = await createUser(userData);
      console.log("createUser response:", { data, error });

      if (error) {
        console.error("Server returned an error:", error);
        toast.error(error);
        return { error };
      }

      // Fetch updated users list
      const { data: updatedUsers, error: fetchError } = await getUsers();
      if (fetchError) {
        console.error("Error fetching updated users:", fetchError);
        toast.error("נוצר משתמש חדש אך לא ניתן לרענן את הרשימה");
      } else {
        setUsers(updatedUsers);
      }

      setIsAddUserOpen(false);
      toast.success("המשתמש נוצר בהצלחה");
      return { success: true };
    } catch (error) {
      console.error("Exception in handleAddUser:", error);
      const errorMessage = error.message || "שגיאה ביצירת המשתמש";
      toast.error(errorMessage);
      return { error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = async (userData) => {
    console.log("handleEditUser called with:", userData);
    try {
      setIsLoading(true);
      console.log("handleEditUser called with:", userData);

      const { data, error } = await updateUser({
        userId: userData.id,
        ...userData,
      });
      console.log("updateUser response:", { data, error });

      if (error) {
        console.error("Server returned an error:", error);
        toast.error(error);
        return { error };
      }

      // Update the user in the list
      setUsers(
        users.map((user) =>
          user.id === userData.id
            ? {
                ...user,
                full_name: userData.name,
                phone: userData.phone,
                email: userData.email,
                user_type: userData.role,
                is_active: userData.is_active,
                center_name: userData.activityCenter,
              }
            : user
        )
      );

      setIsAddUserOpen(false);
      setEditingUser(null);
      toast.success("המשתמש עודכן בהצלחה");
      return { success: true };
    } catch (error) {
      console.error("Exception in handleEditUser:", error);
      const errorMessage = error.message || "שגיאה בעדכון המשתמש";
      toast.error(errorMessage);
      return { error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivateUser = async (userId) => {
    try {
      setIsLoading(true);
      const { data, error } = await activateUser(userId);

      if (error) {
        toast.error(error);
        return;
      }

      // Update the user in the list
      setUsers(
        users.map((user) =>
          user.id === userId
            ? {
                ...user,
                is_active: true,
                activation_date: new Date().toISOString(),
              }
            : user
        )
      );

      // Dispatch custom event to refresh approval badge
      window.dispatchEvent(new CustomEvent("approval-action-completed"));

      toast.success("המשתמש אושר והופעל בהצלחה");
    } catch (error) {
      console.error("Error activating user:", error);
      toast.error("שגיאה באישור המשתמש");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivateUser = async (userId) => {
    try {
      setIsLoading(true);
      const { data, error } = await deactivateUser(userId);

      if (error) {
        toast.error(error);
        return;
      }

      // Update the user in the list
      setUsers(
        users.map((user) =>
          user.id === userId
            ? {
                ...user,
                is_active: false,
                updated_at: new Date().toISOString(),
              }
            : user
        )
      );

      // Dispatch custom event to refresh approval badge
      window.dispatchEvent(new CustomEvent("approval-action-completed"));

      toast.success("המשתמש הושבת בהצלחה");
    } catch (error) {
      console.error("Error deactivating user:", error);
      toast.error("שגיאה בהשבתת המשתמש");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setIsAddUserOpen(false);
    setEditingUser(null);
  };

  // Handle form submission
  const handleFormSubmit = async (formData) => {
    setIsLoading(true);
    console.log("UserManagement: Form data received:", formData);

    try {
      let result;

      if (editingUser) {
        // Update existing user
        console.log(
          `UserManagement: Updating user ${editingUser.id}:`,
          formData
        );
        result = await updateUser(formData);
      } else {
        // Create new user
        console.log("UserManagement: Creating new user:", formData);
        result = await createUser(formData);
      }

      console.log("UserManagement: Server response:", result);

      // Check for errors in the response
      if (result && result.error) {
        console.error("UserManagement: Error from server:", result.error);
        setIsLoading(false);
        return { error: result.error }; // Return error to form
      }

      // Refresh user list on success
      setUsers(
        users.map((user) =>
          user.id === result.id
            ? {
                ...user,
                full_name: formData.name,
                phone: formData.phone,
                email: formData.email,
                user_type: formData.role,
                is_active: formData.is_active,
                center_name: formData.activityCenter,
              }
            : user
        )
      );
      // Close dialog only on success
      setIsAddUserOpen(false);
      setEditingUser(null);
      setIsLoading(false);
      toast.success("המשתמש עודכן בהצלחה");
      return true; // Indicate success
    } catch (error) {
      console.error("UserManagement: Exception during submission:", error);
      setIsLoading(false);
      const errorMessage = error.message || "אירעה שגיאה. נסו שנית מאוחר יותר.";
      toast.error(errorMessage);
      return { error: errorMessage }; // Return error to form
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 flex justify-between items-center mb-2">
        <div className="flex items-baseline gap-4">
          <h1 className="text-2xl font-bold">ניהול משתמשים</h1>
          <span className="text-sm text-gray-500">
            (סה"כ: {users.length} | פעילים:{" "}
            {users.filter((u) => u.is_active).length} | לא פעילים:{" "}
            {users.filter((u) => !u.is_active).length})
          </span>
        </div>
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
              onSubmit={editingUser ? handleEditUser : handleFormSubmit}
              onCancel={handleCloseDialog}
              isLoading={isLoading}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-row justify-between shrink-0 mb-2 flex gap-4">
        <div className="flex gap-2 items-center">
          <Input
            placeholder="חיפוש לפי שם או מספר טלפון..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm text-right"
            dir="rtl"
          />
        </div>

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
              <TableHead className="text-center h-11">
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center justify-center w-full">
                    {selectedStatus === "active"
                      ? "פעילים"
                      : selectedStatus === "inactive"
                      ? "לא פעילים"
                      : "סטטוס"}{" "}
                    <ChevronDown className="mr-2 h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      className="bg-sky-50 hover:bg-slate-400 items-left"
                      onClick={() => setSelectedStatus("")}>
                      הכל
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSelectedStatus("active")}
                      className="bg-sky-50 hover:bg-slate-400">
                      פעילים
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSelectedStatus("inactive")}
                      className="bg-sky-50 hover:bg-slate-400">
                      לא פעילים
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableHead>
              <TableHead className="w-[70px] text-center h-11">
                פעולות
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.map((user) => (
              <TableRow
                key={user.id}
                className={`h-12 hover:bg-sky-100 transition-colors ${
                  !user.is_active ? "bg-gray-100 text-gray-500" : ""
                }`}>
                <TableCell className="text-center">{user.full_name}</TableCell>
                <TableCell className="text-center">{user.user_type}</TableCell>
                <TableCell className="text-center">
                  {user.center_id
                    ? user.center_name || "מרכז פעילות"
                    : "ללא מרכז"}
                </TableCell>
                <TableCell className="text-center">{user.phone}</TableCell>
                <TableCell className="text-center">
                  {user.is_active ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                      פעיל
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                      לא פעיל
                    </span>
                  )}
                </TableCell>
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
                    <DropdownMenuContent
                      align="start"
                      side="right"
                      className="bg-white border shadow-lg min-w-[120px]">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingUser(user);
                          setIsAddUserOpen(true);
                        }}
                        className="text-right hover:bg-slate-100 cursor-pointer">
                        ערוך
                      </DropdownMenuItem>
                      {!user.is_active ? (
                        <DropdownMenuItem
                          className="text-right text-green-600 hover:bg-slate-100 cursor-pointer"
                          onClick={() => handleActivateUser(user.id)}>
                          אשר משתמש
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          className="text-right text-red-600 hover:bg-slate-100 cursor-pointer"
                          onClick={() => handleDeactivateUser(user.id)}>
                          השבת משתמש
                        </DropdownMenuItem>
                      )}
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
                    <TableCell className="text-center">&nbsp;</TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
