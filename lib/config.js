/** @format */

// Navigation Menu Items Configuration
export const NAVIGATION_CONFIG = {
  base: [
    { name: "דף הבית", href: "/dashboard", icon: "Home" },
    { name: "פרופיל", href: "/dashboard/profile", icon: "UserCircle" },
    { name: "תכנים", href: "/dashboard/content", icon: "BookOpen" },
    { name: "הגדרות", href: "/dashboard/settings", icon: "Settings" },
    { name: "דיווח הוצאה", href: "/dashboard/expenses", icon: "Receipt" },
  ],
  admin: [
    { name: "ניהול משתמשים", href: "/dashboard/users", icon: "UserPlus" },
    { name: "הוספת תוכן", href: "/dashboard/content/new", icon: "FileText" },
  ],
  instructor: [
    { name: "הוספת תוכן", href: "/dashboard/content/new", icon: "FileText" },
  ],
};

// Calendar Configuration
export const CALENDAR_CONFIG = {
  monthNames: [
    "ינואר",
    "פברואר",
    "מרץ",
    "אפריל",
    "מאי",
    "יוני",
    "יולי",
    "אוגוסט",
    "ספטמבר",
    "אוקטובר",
    "נובמבר",
    "דצמבר",
  ],
  weekDays: ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"],
  dummyEvents: {
    "2025-01-15": [{ title: "פגישת צוות", type: "meeting" }],
    "2025-01-20": [{ title: "הדרכה חדשה", type: "training" }],
  },
};

// Time-based Greetings Configuration
export const GREETINGS_CONFIG = {
  morning: {
    start: 5,
    end: 12,
    text: "בוקר טוב",
  },
  afternoon: {
    start: 12,
    end: 17,
    text: "צהריים טובים",
  },
  evening: {
    start: 17,
    end: 21,
    text: "ערב טוב",
  },
  night: {
    text: "לילה טוב",
  },
};

// Authentication Configuration
export const AUTH_CONFIG = {
  FIXED_PASSWORD: process.env.FIXED_PASSWORD,
  tempEmailDomain: process.env.TEMP_EMAIL_DOMAIN || "@temp.com",
};

// Layout Configuration
export const LAYOUT_CONFIG = {
  sideNavWidth: "w-1/6",
  mainContentWidth: "w-5/6",
};

// Default User Configuration
export const DEFAULT_USER_CONFIG = {
  defaultRole: "user",
  defaultName: "Temporary User",
};
