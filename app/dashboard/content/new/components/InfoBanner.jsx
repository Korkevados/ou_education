/** @format */

import { Info } from "lucide-react";

export default function InfoBanner() {
  return (
    <div className="flex items-start gap-2 mt-4 p-4 bg-blue-50 rounded-lg">
      <Info className="h-5 w-5 text-blue-500 mt-0.5" />
      <div className="text-sm text-blue-700">
        <p>
          אם הנושא שאתה מחפש אינו קיים, תוכל ליצור נושא חדש. נושא חדש יועבר
          לאישור מנהל ההדרכה לפני שיהיה זמין לשימוש.
        </p>
        <p className="mt-1">
          בינתיים, החומר שהעלית יהיה מקושר לנושא החדש ויופיע ברשימת התכנים שלך.
        </p>
      </div>
    </div>
  );
}
