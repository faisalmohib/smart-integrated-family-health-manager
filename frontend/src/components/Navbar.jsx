import { Link, useLocation } from "react-router-dom";
import { MessageSquare } from "lucide-react";

function Navbar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Symptom Checker", path: "/symptoms" },
    { name: "Medicine Reminder", path: "/medicine-reminder" },
    { name: "Health Vault", path: "/health-vault" },
    {
      name: "Chat History",
      path: "/chat-history",
      icon: <MessageSquare className="h-4 w-4" />,
    },
  ];

  return (
    <nav className="w-full border-b border-gray-800/60 bg-[#0b1114]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-8">

        {/* Logo */}
        <Link to="/" className="flex items-center space-x-3">
          <svg
            className="h-8 w-8 text-[#00a884]"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M10.5 2.25a1.5 1.5 0 0 0-3 0v4.25a1.5 1.5 0 0 1-1.5 1.5H1.75a1.5 1.5 0 0 0 0 3H6a1.5 1.5 0 0 1 1.5 1.5v4.25a1.5 1.5 0 0 0 3 0V12a1.5 1.5 0 0 1 1.5-1.5h4.25a1.5 1.5 0 0 0 0-3H12a1.5 1.5 0 0 1-1.5-1.5V2.25z" />
            <path
              d="M13.5 21.75a1.5 1.5 0 0 0 3 0v-4.25a1.5 1.5 0 0 1 1.5-1.5h4.25a1.5 1.5 0 0 0 0-3H18a1.5 1.5 0 0 1-1.5-1.5V7.25a1.5 1.5 0 0 0-3 0V12a1.5 1.5 0 0 1-1.5 1.5H7.75a1.5 1.5 0 0 0 0 3H12a1.5 1.5 0 0 1 1.5 1.5v4.25z"
              opacity="0.6"
            />
          </svg>
          <span className="text-xl font-medium tracking-tight text-gray-100">
            SIFHM AI
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center space-x-8 text-sm font-normal text-gray-300 md:space-x-10">
          {navLinks.map((link) => {
            const active = isActive(link.path);
            return (
              <div key={link.path} className="relative py-1">
                <Link
                  to={link.path}
                  className={`flex items-center gap-2 transition-colors hover:text-white ${
                    active ? "font-medium text-white" : ""
                  }`}
                >
                  {link.icon}
                  {link.name}
                </Link>

                {/* Active Underline Highlight */}
                {active && (
                  <div className="absolute bottom-[-21px] left-0 right-0 h-[2px] bg-gray-200" />
                )}
              </div>
            );
          })}
        </div>

        {/* Empty Spacer */}
        <div className="hidden w-24 md:block" />

      </div>
    </nav>
  );
}

export default Navbar;