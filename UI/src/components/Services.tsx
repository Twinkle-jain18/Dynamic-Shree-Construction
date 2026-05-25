import { useState, useEffect } from 'react';
import servicesDataRaw from '@/data/services.json';
import { Service, MediaItem } from '@/types/service';
import { ServiceCard } from './ServiceCard';
import { ServiceDetailDynamic } from './ServiceDetailDynamic';
import { fetchServiceContent, fetchCategories, fetchAllContent } from '@/lib/api';

const staticServicesData = servicesDataRaw as Service[];

/** Build a Service object for a category that has no static entry in services.json */
function buildDynamicService(name: string): Service {
  return {
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    title: name,
    shortDescription: 'Explore our work and media for this service category.',
    longDescription: `We provide professional ${name} services with exceptional quality and attention to detail. Browse our gallery of completed projects below.`,
    image: '/assets/services/building.jpg', // generic fallback image
  };
}

export function Services() {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [dynamicMedia, setDynamicMedia] = useState<MediaItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [showAll, setShowAll] = useState(false);

  // Dynamic categories from DB, merged with static data
  const [servicesData, setServicesData] = useState<Service[]>(staticServicesData);

  // Fetch categories and media to merge into final services data
  useEffect(() => {
    const loadServices = async () => {
      try {
        const [cats, allMedia] = await Promise.all([
          fetchCategories(),
          fetchAllContent()
        ]);

        if (!cats || cats.length === 0) return;

        const merged: Service[] = cats.map(cat => {
          // 1. Find the first image in this category from the DB for cover recovery
          const categoryMedia = (allMedia || []).find((m: any) => 
            m.service.toLowerCase() === cat.name.toLowerCase() && m.type === 'image'
          );
          
          const coverImage = categoryMedia?.fileUrl;

          // 2. Match with static data to preserve descriptions/materials
          const staticMatch = staticServicesData.find(
            s => s.title.toLowerCase() === cat.name.toLowerCase()
          );

          if (staticMatch) {
            return {
              ...staticMatch,
              image: coverImage || staticMatch.image // Prefer DB image if found
            };
          }

          // 3. Fallback to dynamic stub
          const dynamic = buildDynamicService(cat.name);
          return {
            ...dynamic,
            image: coverImage || dynamic.image
          };
        });

        setServicesData(merged);
      } catch (err) {
        console.error("Failed to load dynamic services:", err);
      }
    };

    loadServices();
  }, []);

  // Clamp to 3 on mobile unless "Show All" is pressed
  const displayedServices =
    typeof window !== 'undefined' && window.innerWidth < 768 && !showAll
      ? servicesData.slice(0, 3)
      : servicesData;

  // Whenever a service is selected, fetch its dynamic media from the API
  useEffect(() => {
    if (!selectedService) { setDynamicMedia([]); return; }

    let cancelled = false;
    setLoadingMedia(true);
    setDynamicMedia([]);

    fetchServiceContent(selectedService.title)
      .then(items => {
        if (cancelled) return;
        const mapped: MediaItem[] = items.map((item: any) => ({
          type: item.type,
          src: item.fileUrl,
          description: item.description,
        }));
        setDynamicMedia(mapped);
      })
      .catch(() => {
        // silently fall back to static images inside ServiceDetailDynamic
      })
      .finally(() => {
        if (!cancelled) setLoadingMedia(false);
      });

    return () => { cancelled = true; };
  }, [selectedService]);

  return (
    <>
      <section className="mt-4 mb-6 md:mb-10 relative z-10 w-full" id="services">
        <div className="container mx-auto px-6">
          <div className="text-center mb-6 md:mb-10 opacity-0 animate-fade-up stagger-1">
            <h3 className="font-display text-2xl md:text-5xl font-bold text-foreground mb-2 md:mb-3">
              Our Services
            </h3>
            <p className="font-body text-sm md:text-base text-muted-foreground max-w-xl mx-auto leading-normal">
              Delivering excellence across every spectrum of construction and design. Discover our specialized divisions below.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 md:gap-8">
            {displayedServices.map((service, index) => (
              <div key={service.id} className="w-full sm:w-[340px] md:w-[360px]">
                <ServiceCard
                  service={service}
                  index={index}
                  onClick={(s) => setSelectedService(s)}
                />
              </div>
            ))}
          </div>

          {/* Show More/Less Button for Mobile */}
          {servicesData.length > 3 && (
            <div className="mt-8 flex justify-center md:hidden">
              <button
                onClick={() => setShowAll(!showAll)}
                className="px-6 py-2.5 rounded-xl border border-primary text-primary font-bold text-sm hover:bg-primary hover:text-white transition-all duration-300"
              >
                {showAll ? 'Show Less' : 'Show All Services'}
              </button>
            </div>
          )}
        </div>
      </section>

      <ServiceDetailDynamic
        service={selectedService}
        dynamicMedia={dynamicMedia}
        loadingMedia={loadingMedia}
        onClose={() => setSelectedService(null)}
      />
    </>
  );
}
