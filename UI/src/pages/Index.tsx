import { useState } from 'react';
import { Header } from '@/components/Header';
import { WatermarkLogo } from '@/components/WatermarkLogo';
import logo from '../../assets/logo.jpg';
import { Services } from '@/components/Services';
import { Stats } from '@/components/Stats';
import { VideoSection } from '@/components/VideoSection';
import { CostCalculator } from '@/components/CostCalculator';
import { Reviews } from '@/components/Reviews';
import { Contact } from '@/components/Contact';
import { SmartAssistant } from '@/components/SmartAssistant';

const Index = () => {
  const [estimateMsg, setEstimateMsg] = useState<string>('');
  const [estimateService, setEstimateService] = useState<string>('');

  const handleConsult = (msg: string, service?: string) => {
    setEstimateMsg(msg);
    if (service) setEstimateService(service);
    
    // Smooth scroll to contact section
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <WatermarkLogo />
      <Header />
      
      <main className="relative z-10 pt-16 md:pt-24 pb-6 md:pb-10">
        <div className="container mx-auto px-6">
          {/* Hero Section */}
          <section className="text-center mb-8 md:mb-12 opacity-0 animate-fade-up">
            <h2 className="font-display text-4xl md:text-7xl font-bold text-foreground mb-4 md:mb-6 leading-tight">
              Building Dreams,<br />
              <span className="text-primary italic">Crafting Excellence</span>
            </h2>
            <p className="font-body text-sm md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Transforming individual visions into architectural masterpieces. Explore our legacy of exceptional constructions.
            </p>
          </section>
 
           {/* Stats */}
           <Stats />
 
           {/* Services */}
           <Services />
 
           {/* Video Showcase */}
           <VideoSection />
 
           {/* Cost Estimation Calculator */}
           <CostCalculator onConsult={handleConsult} />
 
           {/* Reviews Section */}
           <Reviews />
 
           {/* Contact Section */}
           <Contact initialMessage={estimateMsg} initialService={estimateService} />
         </div>
       </main>
 
        <footer className="relative z-10 bg-card border-t border-border py-16">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                <div className="flex items-center gap-3 mb-4 justify-center md:justify-start">
                  <img src={logo} alt="Logo" className="h-10 w-10 rounded-full grayscale opacity-50" />
                  <span className="font-display font-bold text-lg tracking-tight text-foreground/80">Shree Constructions</span>
                </div>
                <p className="font-body text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                  © 2026 Shree Constructions. Built with Integrity & Vision.
                </p>
              </div>

              <div className="flex flex-col items-center md:items-end gap-4">
                <div className="flex items-center gap-6">
                  <a href="https://www.linkedin.com/in/twinkle-taleda-1779b9407/?skipRedirect=true" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" title="LinkedIn">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                  </a>
                  <a href="https://github.com/Twinkle-jain18" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" title="GitHub">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                  </a>
                </div>
                <div className="text-[10px] font-body text-muted-foreground/60">
                  Designed & Developed by <span className="text-foreground font-bold hover:text-primary transition-colors cursor-default">Twinkle Taleda</span>
                </div>
              </div>
            </div>
          </div>
        </footer>

      <SmartAssistant onAction={handleConsult} />
    </div>
  );
};

export default Index;
