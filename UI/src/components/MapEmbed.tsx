import { MapPin } from 'lucide-react';

export function MapEmbed() {
  return (
    <div className="mt-12 opacity-0 animate-fade-up stagger-2">
      <h4 className="font-display text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
        <MapPin className="w-6 h-6 text-primary" />
        Find Us Here
      </h4>
      <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border">
        <iframe
          src="https://www.google.com/maps?q=Double+Road+Mahalingpur+587312&output=embed"
          width="100%"
          height="400"
          style={{ border: 0, display: 'block' }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Shree Construction Office Location"
          className="w-full"
        />
      </div>
      <div className="mt-4 flex justify-end">
        <a
          href="https://www.google.com/maps/search/?api=1&query=Double+Road+Mahalingpur+587312"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          Open in Google Maps →
        </a>
      </div>
    </div>
  );
}
