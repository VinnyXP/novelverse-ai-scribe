
import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-background border-t border-border py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="mb-6 md:mb-0">
            <Link to="/" className="flex items-center space-x-2">
              <BookOpen size={24} className="text-novel-600" />
              <span className="text-xl font-bold text-foreground">NovelVerse</span>
            </Link>
            <p className="mt-2 text-muted-foreground max-w-md">
              A platform for AI-generated web novels, where imagination knows no bounds.
              Create, read, and share stories brought to life by artificial intelligence.
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase mb-4">
                Explore
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/browse" className="text-muted-foreground hover:text-novel-600">
                    Browse Stories
                  </Link>
                </li>
                <li>
                  <Link to="/create" className="text-muted-foreground hover:text-novel-600">
                    Create Story
                  </Link>
                </li>
                <li>
                  <Link to="/tags" className="text-muted-foreground hover:text-novel-600">
                    Tags
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase mb-4">
                Account
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/signin" className="text-muted-foreground hover:text-novel-600">
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link to="/signup" className="text-muted-foreground hover:text-novel-600">
                    Register
                  </Link>
                </li>
                <li>
                  <Link to="/profile" className="text-muted-foreground hover:text-novel-600">
                    My Profile
                  </Link>
                </li>
                <li>
                  <Link to="/my-stories" className="text-muted-foreground hover:text-novel-600">
                    My Stories
                  </Link>
                </li>
              </ul>
            </div>
            
            <div className="col-span-2 sm:col-span-1">
              <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase mb-4">
                About
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/about" className="text-muted-foreground hover:text-novel-600">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/how-it-works" className="text-muted-foreground hover:text-novel-600">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-muted-foreground hover:text-novel-600">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-muted-foreground hover:text-novel-600">
                    Terms & Privacy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-8 border-t border-border pt-8 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} NovelVerse AI Scribe. All rights reserved.
          </p>
          <div className="mt-4 sm:mt-0 flex space-x-6">
            <a href="#" className="text-muted-foreground hover:text-novel-600">
              Twitter
            </a>
            <a href="#" className="text-muted-foreground hover:text-novel-600">
              Discord
            </a>
            <a href="#" className="text-muted-foreground hover:text-novel-600">
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
