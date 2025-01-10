/** @format */

export default function ContentPage() {
  return (
    <div
      className="flex flex-1 h-full flex-col items-center justify-center"
      dir="rtl">
      <div className="space-y-6 bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-center">פרופיל משתמש</h1>
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-gray-600">שם מלא</p>
            <p className="font-medium">kk</p>
          </div>
          <div className="space-y-2">
            <p className="text-gray-600">מספר טלפון</p>
            <p className="font-medium">kk</p>
          </div>
          <div className="space-y-2">
            <p className="text-gray-600">תפקיד</p>
            <p className="font-medium"></p>
          </div>
        </div>
      </div>
    </div>
  );
}
