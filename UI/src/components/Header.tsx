import { Moon, Sun, Menu, X, Home, Briefcase, Calculator, Image as ImageIcon, Phone } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CallActionModal } from './CallActionModal';

export function Header() {
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);

  // -- Secret logo click counter --
  const clickCount = useRef(0);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogoClick = useCallback(() => {
    clickCount.current += 1;
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => {
      clickCount.current = 0;
    }, 3000);

    if (clickCount.current >= 5) {
      clickCount.current = 0;
      navigate('/admin-login');
    }
  }, [navigate]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Home', path: '/', icon: Home, type: 'link' },
    { label: 'Services', path: '/#services', icon: Briefcase, type: 'anchor' },
    { label: 'Budget Planner', path: '/#calculator', icon: Calculator, type: 'anchor' },
    { label: 'Contact', path: '/#contact', icon: Phone, type: 'anchor' },
  ];

  const handleNavClick = (link: typeof navLinks[0]) => {
    setIsMobileMenuOpen(false);
    if (link.type === 'anchor') {
      const id = link.path.split('#')[1];
      if (location.pathname === '/') {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate('/');
        // Small delay to allow home page to mount before scrolling
        setTimeout(() => {
          document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      }
    } else {
      navigate(link.path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-background/80 backdrop-blur-md py-3 shadow-md' : 'bg-transparent py-5'
    }`}>
      <div className="container mx-auto px-6 flex items-center justify-between">
        
        {/* Logo & Brand */}
        <div className="flex items-center gap-3 relative group">
          <button
            onClick={handleLogoClick}
            className="relative rounded-full focus:outline-none select-none overflow-hidden h-10 w-10 md:h-12 md:w-12 border-2 border-primary/20 hover:border-primary transition-colors"
          >
            <img
              src="../../assets/logo.jpg"
              alt="Shree Constructions"
              className="h-full w-full object-contain"
            />
          </button>



          <div className="text-left hidden sm:block">
            <h1 className="font-display text-lg font-bold tracking-tight text-foreground leading-none">
              Shree Constructions
            </h1>
            <p className="text-[10px] text-muted-foreground font-body tracking-wider mt-1 opacity-70">
              Your Vision, Our Artistry
            </p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 bg-muted/30 backdrop-blur-sm p-1.5 rounded-2xl border border-border/50">
          {navLinks.map((link) => (
            <button
              key={link.label}
              onClick={() => handleNavClick(link)}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                location.pathname === link.path || (link.type === 'anchor' && location.pathname === '/' && location.hash === link.path.split('#')[1])
                  ? 'bg-background text-primary shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={toggleTheme}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-muted/50 border border-border/50 hover:bg-muted transition-colors"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-foreground" /> : <Moon className="w-4 h-4 text-foreground" />}
          </button>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <button 
            onClick={() => setIsCallModalOpen(true)}
            className="hidden xl:flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white font-bold text-xs hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
          >
            <Phone className="w-3.5 h-3.5" />
            Call Now
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`fixed inset-0 z-40 lg:hidden transition-all duration-500 ${
        isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}>
        <div className="absolute inset-0 bg-background/95 backdrop-blur-xl" />
        <div className="relative h-full flex flex-col p-8 pt-24">
          <div className="space-y-4">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNavClick(link)}
                className="w-full flex items-center gap-4 p-5 rounded-2xl bg-muted/50 border border-border/50 text-foreground font-bold text-lg hover:bg-primary/10 hover:border-primary/20 transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center border border-border group-hover:bg-primary group-hover:text-white transition-all">
                  <link.icon className="w-6 h-6" />
                </div>
                {link.label}
              </button>
            ))}
          </div>
          
          <div className="mt-auto p-6 bg-primary/5 rounded-3xl border border-primary/10 text-center space-y-4">
            <h4 className="font-display font-bold text-foreground">Need Assistance?</h4>
            <p className="text-xs text-muted-foreground">Expert consultation is just a call away.</p>
            <button 
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsCallModalOpen(true);
              }}
              className="w-full py-4 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-primary/20"
            >
              <Phone className="w-4 h-4" />
              Call Now
            </button>
          </div>
        </div>
      </div>

      {/* Call Action Modal */}
      <CallActionModal 
        isOpen={isCallModalOpen} 
        onClose={() => setIsCallModalOpen(false)} 
      />
    </header>
  );
}
