import { Service } from '@/types/service';

interface ServiceCardProps {
  service: Service;
  onClick: (service: Service) => void;
  index: number;
}

export function ServiceCard({ service, onClick, index }: ServiceCardProps) {
  return (
    <div 
      onClick={() => onClick(service)}
      className={`group bg-card rounded-xl border border-border overflow-hidden hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1.5 flex flex-col cursor-pointer opacity-0 animate-fade-up stagger-${(index % 6) + 1} h-full`}
    >
      <div className="relative h-40 md:h-56 overflow-hidden bg-muted">
        <img 
          src={service.image || "/assets/services/default.jpg"} 
          alt={service.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90" />
        <div className="absolute bottom-0 left-0 p-3 md:p-5 w-full">
          <h4 className="font-display text-base md:text-xl font-bold text-white tracking-wide leading-tight">{service.title}</h4>
        </div>
      </div>
      
      <div className="p-3 md:p-6 flex-1 flex flex-col bg-card/50 backdrop-blur-sm">
        <p className="font-body text-sm md:text-base text-muted-foreground leading-normal flex-1 line-clamp-2 md:line-clamp-3">
          {service.shortDescription}
        </p>
        <div className="mt-3 md:mt-4 pt-2 md:pt-3 border-t border-border/40 flex justify-between items-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
          <span className="text-[10px] md:text-xs font-semibold text-primary uppercase tracking-wider">View Details</span>
          <svg className="w-3 h-3 md:w-4 md:h-4 text-primary transform translate-x-1 md:translate-x-0 md:group-hover:translate-x-2 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      </div>
    </div>
  );
}
