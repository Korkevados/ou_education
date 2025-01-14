/** @format */

"use client";

import { useState } from "react";
import {
  Folder,
  File,
  MoreVertical,
  Plus,
  Upload,
  FolderPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Dummy data for folders and files
const dummyData = {
  folders: [
    {
      id: 1,
      name: "חגים ומועדים",
      parentId: null,
    },
    {
      id: 2,
      name: "כישורי חיים",
      parentId: null,
    },
    {
      id: 3,
      name: "ראש השנה",
      parentId: 1,
    },
  ],
  files: [
    {
      id: 1,
      name: "מערך שיעור - ראש השנה.pdf",
      folderId: 1,
      type: "pdf",
      size: "2.5MB",
      createdAt: "2024-03-15",
    },
    {
      id: 2,
      name: "פעילות קבוצתית.docx",
      folderId: 3,
      type: "docx",
      size: "1.8MB",
      createdAt: "2024-03-14",
    },
  ],
};

export default function ContentPage() {
  const [currentFolder, setCurrentFolder] = useState(null);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  // Get current folder's content
  const getCurrentContent = () => {
    const folders = dummyData.folders.filter(
      (f) => f.parentId === currentFolder
    );
    const files = currentFolder
      ? dummyData.files.filter((f) => f.folderId === currentFolder)
      : [];
    return { folders, files };
  };

  // Get breadcrumb path
  const getBreadcrumb = () => {
    const path = [];
    let current = currentFolder;

    while (current) {
      const folder = dummyData.folders.find((f) => f.id === current);
      if (folder) {
        path.unshift(folder);
        current = folder.parentId;
      } else {
        break;
      }
    }

    return path;
  };

  const { folders, files } = getCurrentContent();
  const breadcrumb = getBreadcrumb();

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">ניהול תכנים</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNewFolderDialog(true)}
              className="hover:bg-gray-100">
              <FolderPlus className="h-4 w-4 ml-2  hover:text-sky-600" />
              תיקייה חדשה
            </Button>
            <Button variant="outline" size="sm" className="hover:bg-gray-100">
              <Upload className="h-4 w-4 ml-2 hover:text-sky-600" />
              העלאת קובץ
            </Button>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center mt-4 text-sm text-gray-600">
          <button
            onClick={() => setCurrentFolder(null)}
            className="hover:text-sky-600">
            ראשי
          </button>
          {breadcrumb.map((folder, index) => (
            <div key={folder.id} className="flex items-center">
              <span className="mx-2">/</span>
              <button
                onClick={() => setCurrentFolder(folder.id)}
                className="hover:text-sky-600">
                {folder.name}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-auto">
        {/* Folders */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {folders.map((folder) => (
            <div
              key={folder.id}
              className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer group">
              <div className="flex items-center justify-between">
                <div
                  className="flex items-center flex-1"
                  onClick={() => setCurrentFolder(folder.id)}>
                  <Folder className="h-5 w-5 text-sky-600 ml-2" />
                  <span className="text-sm font-medium">{folder.name}</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>שנה שם</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      מחק
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>

        {/* Files */}
        {files.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4">קבצים</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <File className="h-5 w-5 text-gray-600 ml-2" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{file.name}</span>
                        <span className="text-xs text-gray-500">
                          {file.size} • {file.createdAt}
                        </span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>הורד</DropdownMenuItem>
                        <DropdownMenuItem>שנה שם</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          מחק
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* New Folder Dialog */}
      {showNewFolderDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex p-4 items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">תיקייה חדשה</h2>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="w-full p-2 border rounded-md mb-4"
              placeholder="שם התיקייה"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewFolderDialog(false);
                  setNewFolderName("");
                }}>
                ביטול
              </Button>
              <Button
                onClick={() => {
                  // TODO: Implement folder creation
                  setShowNewFolderDialog(false);
                  setNewFolderName("");
                }}>
                צור
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
