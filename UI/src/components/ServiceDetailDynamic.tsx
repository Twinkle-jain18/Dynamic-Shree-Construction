import { useEffect } from 'react';
import {
  X,
  Package,
  Layers,
  Box,
  Droplets,
  Component,
  FileText,
  Monitor,
  Map,
  Calculator,
  Maximize,
  Palette,
  Sun,
  Image as ImageIcon,
  Pipette,
  Grid,
  Feather,
  Settings,
} from 'lucide-react';
import { Service, MediaItem } from '@/types/service';
import { ServiceSlider } from './ServiceSlider';
import { BackButton } from './BackButton';

interface ServiceDetailDynamicProps {
  service: Service | null;
  onClose: () => void;
  /** Media fetched live from the API */
  dynamicMedia: MediaItem[];
  loadingMedia: boolean;
}

// Icon mapping helper
const MaterialIcon = ({ name }: { name: string }) => {
  const icons: Record<string, any> = {
    package: Package,
    layers: Layers,
    box: Box,
    droplets: Droplets,
    component: Component,
    'file-text': FileText,
    monitor: Monitor,
    map: Map,
    calculator: Calculator,
    maximize: Maximize,
    palette: Palette,
    sun: Sun,
    image: ImageIcon,
    swatch: Pipette,
    grid: Grid,
    feather: Feather,
    settings: Settings,
  };
  const Icon = icons[name.toLowerCase()] || Box;
  return <Icon className="w-6 h-6 md:w-8 md:h-8 text-primary" />;
};

export function ServiceDetailDynamic({
  service,
  onClose,
  dynamicMedia,
  loadingMedia,
}: ServiceDetailDynamicProps) {
  useEffect(() => {
    if (service) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [service]);

  if (!service) return null;

  // Determine which media to show in the gallery:
  // - If API returned items → use those
  // - Otherwise fall back to static JSON images
  const apiHasContent = dynamicMedia.length > 0;

  // For "special" (Building Construction) split into interior/exterior from API by description, or fallback to static
  const getGalleryMedia = (): {
    main?: MediaItem[];
    interior?: MediaItem[];
    exterior?: MediaItem[];
  } => {
    if (loadingMedia) return {};

    if (service.isSpecial) {
      if (apiHasContent) {
        // Partition: items with description containing "exterior" → exterior, rest → interior
        const ext = dynamicMedia.filter((m) =>
          (m as any).description?.toLowerCase().includes('exterior')
        );
        const int_ = dynamicMedia.filter(
          (m) => !(m as any).description?.toLowerCase().includes('exterior')
        );
        // If no partition hit, show all in both
        return {
          interior: int_.length > 0 ? int_ : dynamicMedia,
          exterior: ext.length > 0 ? ext : dynamicMedia,
        };
      }
      return { interior: service.interior, exterior: service.exterior };
    }

    // Normal service
    if (apiHasContent) return { main: dynamicMedia };
    return { main: service.images };
  };

  const gallery = getGalleryMedia();

  return (
    <div
      className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md overflow-y-auto animate-fade-in py-10 md:py-20 px-4 scroll-smooth"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl mx-auto bg-card rounded-3xl shadow-2xl animate-fade-up min-h-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <BackButton onClick={onClose} label="✕ Close" className="top-4 right-4 left-auto z-50" />

        <div className="p-6 md:p-14 lg:p-16">
          {/* Hero */}
          <div className="max-w-4xl mx-auto text-center space-y-4 md:space-y-6 mb-12 md:mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] md:text-xs font-bold uppercase tracking-widest animate-fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Our Service
            </div>

            <h2 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold text-foreground leading-[1.1]">
              {service.title}
            </h2>

            <p className="font-body text-base md:text-lg lg:text-xl text-muted-foreground/80 leading-relaxed max-w-2xl mx-auto">
              {service.longDescription || service.shortDescription}
            </p>
          </div>

          {/* Materials */}
          {service.materials && service.materials.length > 0 && (
            <div className="border-t border-border/50 pt-8 mt-10 md:pt-12 md:mt-16 animate-fade-up stagger-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                  <h3 className="font-display text-xl md:text-2xl font-bold text-foreground">
                    Materials &amp; Components Used
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1">
                    Foundational elements that ensure quality performance.
                  </p>
                </div>
              </div>

              <div className="relative group">
                <div className="flex overflow-x-auto pb-4 gap-4 no-scrollbar scroll-smooth snap-x snap-mandatory">
                  {service.materials.map((material, idx) => (
                    <div
                      key={idx}
                      className="group/card flex-shrink-0 w-[140px] md:w-[180px] bg-background rounded-xl border border-border/50 p-4 md:p-6 text-center hover:shadow-md hover:border-primary/30 transition-all duration-300 snap-start"
                    >
                      <div className="w-10 h-10 md:w-14 md:h-14 bg-primary/5 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover/card:scale-110 transition-transform duration-300">
                        <MaterialIcon name={material.icon || 'box'} />
                      </div>
                      <h4 className="text-xs md:text-sm font-bold text-foreground mb-1 line-clamp-1">
                        {material.name}
                      </h4>
                      <p className="text-[10px] md:text-xs text-muted-foreground leading-tight line-clamp-2">
                        {material.description}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="absolute top-0 right-0 bottom-4 w-12 bg-gradient-to-l from-card to-transparent pointer-events-none md:hidden" />
              </div>
            </div>
          )}

          {/* Gallery */}
          <div className="border-t border-border/50 pt-8 mt-10 md:pt-12 md:mt-16 animate-fade-up stagger-2">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-display text-xl md:text-2xl font-bold text-foreground">
                  {service.isSpecial ? 'Visual Projects' : 'Project Gallery'}
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                  {apiHasContent
                    ? `${dynamicMedia.length} item${dynamicMedia.length !== 1 ? 's' : ''} from live database`
                    : `Real-world examples of our ${service.title} expertise.`}
                </p>
              </div>
              {/* Live indicator */}
              {apiHasContent && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-[10px] font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Live
                </div>
              )}
            </div>

            {/* Loading spinner */}
            {loadingMedia && (
              <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground/50">
                <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-sm font-body">Loading latest projects…</span>
              </div>
            )}

            {!loadingMedia && service.isSpecial ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-[2px] bg-primary rounded-full" />
                    <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                      Interior Designs
                    </h4>
                  </div>
                  <ServiceSlider media={gallery.interior || []} title="Interior" />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-[2px] bg-primary rounded-full" />
                    <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                      Exterior Builds
                    </h4>
                  </div>
                  <ServiceSlider media={gallery.exterior || []} title="Exterior" />
                </div>
              </div>
            ) : !loadingMedia ? (
              <div className="max-w-4xl mx-auto">
                <ServiceSlider media={gallery.main || []} title="Gallery" />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
