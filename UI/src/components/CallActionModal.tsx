import { Phone, MessageCircle, X, ExternalLink } from 'lucide-react';

interface CallActionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CallActionModal({ isOpen, onClose }: CallActionModalProps) {
  if (!isOpen) return null;

  const numbers = [
    { label: 'Primary Contact', value: '9620085363', display: '+91 9620085363' },
    { label: 'Secondary Contact', value: '9164409666', display: '+91 9164409666' }
  ];

  const handleWhatsApp = (num: string) => {
    window.open(`https://wa.me/91${num}`, '_blank');
  };

  const handleCall = (num: string) => {
    window.location.href = `tel:${num}`;
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-md" />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-sm bg-card border border-border shadow-2xl rounded-[2.5rem] overflow-hidden animate-scale-up">
        {/* Header decoration */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary/20 via-primary to-primary/20" />
        
        <div className="p-8">
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20">
              <Phone className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <h3 className="font-display text-2xl font-bold text-foreground">Contact Us</h3>
            <p className="font-body text-xs text-muted-foreground mt-2 px-6">
              Connect with our experts directly or start a conversation on WhatsApp.
            </p>
          </div>

          <div className="space-y-4">
            {numbers.map((num) => (
              <div key={num.value} className="p-5 rounded-2xl bg-muted/30 border border-border/50 space-y-4 group hover:border-primary/30 transition-all">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">{num.label}</span>
                  <span className="text-lg font-display font-bold text-foreground leading-none">{num.display}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleCall(num.value)}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary/90 active:scale-95 transition-all shadow-lg shadow-primary/20"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Call
                  </button>
                  <button
                    onClick={() => handleWhatsApp(num.value)}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white border border-border text-[#25D366] font-bold text-xs hover:bg-muted active:scale-95 transition-all"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    WhatsApp
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-border flex flex-col items-center">
            <button 
              onClick={onClose}
              className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest"
            >
              Close Window
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
