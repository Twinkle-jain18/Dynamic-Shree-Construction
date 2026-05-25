import { Play } from 'lucide-react';

interface VideoItem {
  src: string;
  poster?: string;
  title: string;
  description: string;
  isYoutube?: boolean;
}

const videos: VideoItem[] = [
  {
    src: 'https://www.youtube.com/embed/fEKT6vEywYM?modestbranding=1&rel=0&showinfo=0&iv_load_policy=3',
    title: 'Precision Architectural Layout',
    description: 'A behind-the-scenes look at the meticulous site marking and architectural layout process for a new residential project.',
    isYoutube: true,
  },
  {
    src: 'https://www.youtube.com/embed/vkew-1KK3Sc?modestbranding=1&rel=0&showinfo=0&iv_load_policy=3',
    title: 'Integrated Construction Excellence',
    description: 'A comprehensive look at our modern construction methodology, from structural integrity to final architectural finishes.',
    isYoutube: true,
  },
  {
    src: 'https://player.vimeo.com/external/494252666.sd.mp4?s=7278734ad583ee3028c2e73703180f68&profile_id=164&oauth2_token_id=57447761',
    poster: '/assets/images/foundation_poster.png',
    title: 'Structural Steel & Foundation',
    description: 'Witness the core structural work and heavy-duty foundation techniques we employ to ensure lasting stability.',
  },
  {
    src: 'https://player.vimeo.com/external/459389137.sd.mp4?s=910df66627041a6774653554625f168&profile_id=164&oauth2_token_id=57447761',
    poster: '/assets/images/architectural_poster.png',
    title: 'Modern High-Rise Construction',
    description: 'A deep dive into our high-scale residential and commercial projects, from skeleton to completion.',
  },
  {
    src: 'https://player.vimeo.com/external/434045526.sd.mp4?s=d00df77727041a674453554625f168&profile_id=164&oauth2_token_id=57447761',
    poster: '/assets/images/villa_poster.png',
    title: 'Luxury Villa Final Showroom',
    description: 'Signature luxury residences where elegant interiors meet world-class architectural exteriors.',
  },
  {
    src: 'https://player.vimeo.com/external/494252666.sd.mp4?s=7278734ad583ee3028c2e73703180f68&profile_id=164&oauth2_token_id=57447761',
    poster: '/assets/images/machinery_poster.png',
    title: 'Heavy Machinery & Earthmoving',
    description: 'Precision earthwork and site preparation using advanced heavy machinery for massive scale projects.',
  },
  {
    src: 'https://player.vimeo.com/external/459389137.sd.mp4?s=910df66627041a6774653554625f168&profile_id=164&oauth2_token_id=57447761',
    poster: '/assets/images/concrete_poster.png',
    title: 'Concrete Pouring & Slab Work',
    description: 'The critical phase of building core stability through expert concrete pouring and structural slab reinforcement.',
  },
];

export function VideoSection() {
  return (
    <section className="mt-8 mb-12 md:mb-20 relative z-10 w-full" id="work">
      <div className="container mx-auto px-6">
        <div className="text-center mb-10 md:mb-16 opacity-0 animate-fade-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] md:text-xs font-bold tracking-widest uppercase mb-6 border border-primary/20">
            <Play className="w-3.5 h-3.5" /> Site Showcases
          </div>
          <h3 className="font-display text-4xl md:text-6xl font-bold text-foreground mb-4 md:mb-6 leading-tight">
            Our Work <span className="text-primary italic">in Action</span>
          </h3>
          <p className="font-body text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Experience the scale, precision, and architectural mastery of Shree Constructions through these live project showcases.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
          {videos.map((video, index) => (
            <div
              key={index}
              className={`group relative rounded-[2rem] overflow-hidden shadow-2xl border border-border bg-card opacity-0 animate-fade-up stagger-${(index % 6) + 1} hover:-translate-y-2 transition-all duration-700 mx-auto w-full`}
            >
              <div className="relative overflow-hidden bg-muted aspect-video">
                {video.isYoutube ? (
                  <div className="relative w-full h-full group/video">
                    <iframe
                      src={video.src}
                      title={video.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                      className="w-full h-full object-cover scale-[1.01]"
                    />
                    {/* Branding Mask Overlay */}
                    <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/60 to-transparent pointer-events-none transition-opacity duration-500 group-hover/video:opacity-0" />
                    <div className="absolute inset-0 border-[3px] border-black/10 pointer-events-none rounded-[2rem] z-10" />
                  </div>
                ) : (
                  <video
                    src={video.src}
                    poster={video.poster}
                    autoPlay
                    muted
                    loop
                    playsInline
                    controls
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    preload="auto"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none opacity-40 group-hover:opacity-20 transition-opacity duration-500" />
              </div>

              <div className="p-8 md:p-10">
                <h4 className="font-display text-xl md:text-2xl font-bold text-foreground mb-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500">
                    <Play className="w-5 h-5 fill-current" />
                  </div>
                  {video.title}
                </h4>
                <p className="font-body text-sm md:text-base text-muted-foreground leading-relaxed">
                  {video.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
