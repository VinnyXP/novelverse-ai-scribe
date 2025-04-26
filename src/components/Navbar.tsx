
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Menu, X, BookOpen, PenTool, Search, User } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn] = useState(false); // In a real app, this would come from an auth context

  return (
    <nav className="bg-background border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <BookOpen size={24} className="text-novel-600" />
              <span className="text-xl font-bold text-foreground">NovelVerse</span>
            </Link>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/browse" className="text-foreground hover:text-novel-600 transition-colors px-3 py-2">
              Browse
            </Link>
            <Link to="/create" className="text-foreground hover:text-novel-600 transition-colors px-3 py-2">
              Create
            </Link>
            <div className="relative">
              <input
                type="text"
                placeholder="Search stories..."
                className="bg-secondary rounded-full pl-10 pr-4 py-1 text-sm w-60 focus:outline-none focus:ring-2 focus:ring-novel-600"
              />
              <Search className="absolute left-3 top-1.5 text-muted-foreground" size={16} />
            </div>
            {isLoggedIn ? (
              <Link to="/profile">
                <div className="w-8 h-8 bg-novel-600 rounded-full flex items-center justify-center text-white">
                  <User size={16} />
                </div>
              </Link>
            ) : (
              <Button variant="outline" className="border-novel-600 text-novel-600 hover:bg-novel-600 hover:text-white">
                Sign In
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-foreground hover:text-novel-600 focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-background border-b border-border animate-fade-in">
          <div className="px-2 pt-2 pb-4 space-y-1 sm:px-3">
            <Link 
              to="/browse" 
              className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-secondary"
              onClick={() => setIsOpen(false)}
            >
              Browse
            </Link>
            <Link 
              to="/create" 
              className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-secondary"
              onClick={() => setIsOpen(false)}
            >
              Create
            </Link>
            <div className="px-3 py-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search stories..."
                  className="bg-secondary rounded-full pl-10 pr-4 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-novel-600"
                />
                <Search className="absolute left-3 top-1.5 text-muted-foreground" size={16} />
              </div>
            </div>
            {isLoggedIn ? (
              <Link 
                to="/profile" 
                className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-secondary"
                onClick={() => setIsOpen(false)}
              >
                Profile
              </Link>
            ) : (
              <div className="px-3 py-2">
                <Button variant="outline" className="w-full border-novel-600 text-novel-600 hover:bg-novel-600 hover:text-white">
                  Sign In
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
