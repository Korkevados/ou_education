/** @format */

export default function Footer() {
  return (
    <footer className="bg-sky-900 text-white py-4">
      <div className="max-w-7xl mx-auto px-3 text-center">
        <p className="text-sm md:text-md">
          כל הזכויות שמורות © OU {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
