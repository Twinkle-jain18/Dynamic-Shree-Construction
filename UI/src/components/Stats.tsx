import { useState, useEffect, useRef } from 'react';
import { fetchAchievements, Achievement } from '@/lib/api';
import * as LucideIcons from 'lucide-react';

function IconComponent({ icon, className }: { icon: string; className?: string }) {
  const isEmoji = (str: string) => /\p{Emoji}/u.test(str);

  // Try to find the icon in Lucide library (case-insensitive match)
  const lucideKey = Object.keys(LucideIcons).find(
    key => key.toLowerCase() === icon.toLowerCase() || 
           key.toLowerCase() === `${icon}2`.toLowerCase() ||
           key.toLowerCase() === icon.replace(/-/g, '').toLowerCase()
  );
  
  const Icon = lucideKey ? (LucideIcons as any)[lucideKey] : null;

  if (Icon) {
    return <Icon className={className} />;
  }

  if (isEmoji(icon)) {
    return <span className="text-2xl md:text-3xl leading-none">{icon}</span>;
  }

  return <LucideIcons.Trophy className={className} />;
}

function useCountUp(target: number, duration = 2000, trigger = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else { setCount(Math.floor(start)); }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, trigger]);
  return count;
}

function StatCard({ item, index, isVisible }: { item: Achievement; index: number; isVisible: boolean }) {
  const count = useCountUp(item.value, 2000, isVisible);
  return (
    <div className={`group bg-card rounded-xl border border-border p-4 md:p-6 flex flex-col items-center text-center hover:shadow-xl hover:-translate-y-1.5 transition-all duration-500 opacity-0 animate-fade-up stagger-${(index % 6) + 1}`}>
      <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3 md:mb-4 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 group-hover:scale-110">
        <IconComponent icon={item.icon} className="w-8 h-8" />
      </div>
      <span className="font-display text-2xl md:text-4xl font-bold text-foreground mb-1 tabular-nums">
        {count}{item.suffix}
      </span>
      <span className="font-body text-muted-foreground text-[10px] md:text-xs uppercase tracking-wider font-medium">
        {item.label}
      </span>
    </div>
  );
}

export function Stats() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    fetchAchievements().then(data => {
      if (data.length > 0) setAchievements(data);
      else {
        // Fallback defaults if DB is empty
        setAchievements([
          { _id: '1', label: 'Projects Completed', value: 50,  suffix: '+', icon: 'building', order: 0 },
          { _id: '2', label: 'Years of Experience', value: 10,  suffix: '+', icon: 'trophy',   order: 1 },
          { _id: '3', label: 'Happy Clients',       value: 100, suffix: '+', icon: 'users',    order: 2 },
          { _id: '4', label: 'Ongoing Projects',    value: 8,   suffix: '+', icon: 'hardhat',  order: 3 },
        ]);
      }
    });
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="mt-4 mb-6 md:mb-10 relative z-10 w-full">
      <div className="container mx-auto px-6">
        <div className="text-center mb-6 md:mb-10 opacity-0 animate-fade-up">
          <h3 className="font-display text-2xl md:text-5xl font-bold text-foreground mb-2 md:mb-3">
            Our Achievements
          </h3>
          <p className="font-body text-sm md:text-base text-muted-foreground max-w-xl mx-auto leading-normal">
            Numbers that reflect our commitment to excellence and client satisfaction.
          </p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {achievements.map((item, index) => (
            <StatCard key={item._id} item={item} index={index} isVisible={isVisible} />
          ))}
        </div>
      </div>
    </section>
  );
}
