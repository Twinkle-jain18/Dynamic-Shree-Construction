import { useState, useMemo } from 'react';
import { 
  Calculator, 
  Ruler, 
  Building2, 
  Paintbrush, 
  ArrowRight, 
  MapPin, 
  Layers, 
  Home, 
  ShieldCheck,
  Info,
  ExternalLink,
  Sun,
  Layout,
  Star
} from 'lucide-react';

/**
 * Real-world Indian construction market rates per sq.ft
 * Categorized by Location and Quality Tier
 */
const MARKET_RATES = {
  RURAL: {
    STANDARD: 1700,
    PREMIUM: 2300,
    LUXURY: 3200
  },
  URBAN: {
    STANDARD: 2100,
    PREMIUM: 2313,
    LUXURY: 4200
  },
  METROPOLITAN: {
    STANDARD: 2800,
    PREMIUM: 3800,
    LUXURY: 5500
  }
};

const CALCULATION_CONFIG = {
  breakdown: {
    CIVIL: 0.65,        // 65% for Structure & Civil
    FINISHING: 0.35,    // 35% for Finishing & Services
  },
  multipliers: {
    DUPLEX: 1.15,       // 15% vertical increment for duplex (civil complexity)
    EXTRA_FLOOR: 0.10,  // 10% per extra floor
    // Finishing premiums (if not already covered by Luxury rates)
    INTERIOR_SEMI: 0.08, 
    INTERIOR_FULL: 0.20,
    EXTERIOR: 0.05,
  }
};

type QualityTier = 'STANDARD' | 'PREMIUM' | 'LUXURY';
type LocationType = 'METROPOLITAN' | 'URBAN' | 'RURAL';

interface CostCalculatorProps {
  onConsult?: (message: string) => void;
}

export function CostCalculator({ onConsult }: CostCalculatorProps) {
  const [area, setArea] = useState<string>('1200'); 
  const [location, setLocation] = useState<LocationType>('URBAN');
  const [floors, setFloors] = useState<number>(1);
  const [quality, setQuality] = useState<QualityTier>('PREMIUM');
  
  // Package Selection
  const [interiorMode, setInteriorMode] = useState<'NONE' | 'SEMI' | 'FULL'>('NONE');
  const [includeExterior, setIncludeExterior] = useState(false);

  const estimation = useMemo(() => {
    const sqft = parseFloat(area) || 0;
    
    // 1. Get base rate from user-provided table
    let ratePerSqft = MARKET_RATES[location][quality];
    
    // 2. Apply vertical complexity if applicable (Realism adjustment)
    if (floors === 2) {
      ratePerSqft *= CALCULATION_CONFIG.multipliers.DUPLEX;
    } else if (floors > 2) {
      ratePerSqft *= (CALCULATION_CONFIG.multipliers.DUPLEX + (CALCULATION_CONFIG.multipliers.EXTRA_FLOOR * (floors - 2)));
    }

    // 3. Apply finishing premiums if selected
    if (interiorMode === 'SEMI') ratePerSqft *= (1 + CALCULATION_CONFIG.multipliers.INTERIOR_SEMI);
    if (interiorMode === 'FULL') ratePerSqft *= (1 + CALCULATION_CONFIG.multipliers.INTERIOR_FULL);
    if (includeExterior) ratePerSqft *= (1 + CALCULATION_CONFIG.multipliers.EXTERIOR);

    const total = sqft * ratePerSqft;
    
    return {
      civil: total * CALCULATION_CONFIG.breakdown.CIVIL,
      finishing: total * CALCULATION_CONFIG.breakdown.FINISHING,
      total,
      ratePerSqft
    };
  }, [area, location, floors, quality, interiorMode, includeExterior]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <section className="py-20 md:py-32 relative overflow-hidden bg-background" id="calculator">
      {/* Background accents */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10 translate-x-1/2 -translate-y-1/2" />
      
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          
          <div className="flex flex-col lg:flex-row gap-16">
            
            {/* Controls */}
            <div className="flex-1 space-y-10">
              <div className="animate-fade-up">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] md:text-xs font-bold tracking-widest uppercase mb-6 border border-primary/20">
                  <Calculator className="w-3.5 h-3.5" />
                  Estimate Tool
                </div>
                <h2 className="font-display text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
                  Professional <span className="text-primary italic">Budget Planner</span>
                </h2>
                <p className="font-body text-muted-foreground text-sm md:text-base leading-relaxed max-w-lg">
                  Analyze your estimated investment based on region-specific labor trends, material quality, and finishing requirements.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Site Location Tiers */}
                <div className="space-y-6">
                  <h4 className="text-[10px] font-bold text-foreground/40 uppercase tracking-[0.2em] flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" /> Site Location
                  </h4>
                  <div className="grid grid-cols-3 gap-2 p-1 bg-muted/50 rounded-2xl border border-border">
                    {(['METROPOLITAN', 'URBAN', 'RURAL'] as LocationType[]).map((type) => (
                      <button
                        key={type}
                        onClick={() => setLocation(type)}
                        className={`py-3 px-1 rounded-xl text-[9px] md:text-[10px] font-bold transition-all ${
                          location === type 
                            ? 'bg-card text-primary shadow-sm ring-1 ring-primary/20' 
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {type.charAt(0) + type.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Built-up Area (Sq.Ft)</label>
                    <div className="relative group">
                      <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <input 
                        type="number"
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        className="w-full bg-muted/30 border border-border rounded-2xl pl-11 pr-4 py-4 text-sm font-semibold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Construction Type */}
                <div className="space-y-6">
                  <h4 className="text-[10px] font-bold text-foreground/40 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5" /> Project Detail
                  </h4>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Building Type</label>
                      <div className="flex gap-2">
                        {[1, 2, 3].map((f) => (
                          <button
                            key={f}
                            onClick={() => setFloors(f)}
                            className={`flex-1 py-3 rounded-xl border text-[10px] font-bold transition-all ${
                              floors === f 
                                ? 'bg-primary/10 border-primary text-primary' 
                                : 'bg-transparent border-border text-muted-foreground hover:bg-muted'
                            }`}
                          >
                            {f === 1 ? 'Ground' : f === 2 ? 'Duplex' : `G+${f-1} Floor`}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Material Quality</label>
                      <div className="flex gap-2">
                        {(['STANDARD', 'PREMIUM', 'LUXURY'] as QualityTier[]).map((tier) => (
                          <button
                            key={tier}
                            onClick={() => setQuality(tier)}
                            className={`flex-1 py-3 rounded-xl border text-[10px] font-bold transition-all ${
                              quality === tier 
                                ? 'bg-primary/10 border-primary text-primary' 
                                : 'bg-transparent border-border text-muted-foreground hover:bg-muted'
                            }`}
                          >
                            {tier}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Finishing Strategy */}
              <div className="space-y-6 pt-4 border-t border-border/50">
                <h4 className="text-[10px] font-bold text-foreground/40 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Layout className="w-3.5 h-3.5" /> Project Finishing
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Semi Modular */}
                  <button 
                    onClick={() => setInteriorMode(interiorMode === 'SEMI' ? 'NONE' : 'SEMI')}
                    className={`p-5 rounded-2xl border transition-all text-left group ${
                      interiorMode === 'SEMI' ? 'bg-card border-primary text-primary shadow-lg shadow-primary/5' : 'bg-muted/10 border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 mb-3 ${interiorMode === 'SEMI' ? 'bg-primary border-primary text-white' : 'border-muted-foreground/30'}`}>
                      {interiorMode === 'SEMI' && <ShieldCheck className="w-4 h-4" />}
                    </div>
                    <span className="block text-sm font-bold">Semi-Modular</span>
                    <span className="block text-[10px] opacity-60 mt-1">Kitchen & Hall focus.</span>
                  </button>

                  {/* Full Interior */}
                  <button 
                    onClick={() => setInteriorMode(interiorMode === 'FULL' ? 'NONE' : 'FULL')}
                    className={`p-5 rounded-2xl border transition-all text-left group ${
                      interiorMode === 'FULL' ? 'bg-card border-primary text-primary shadow-lg shadow-primary/5' : 'bg-muted/10 border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 mb-3 ${interiorMode === 'FULL' ? 'bg-primary border-primary text-white' : 'border-muted-foreground/30'}`}>
                      {interiorMode === 'FULL' && <ShieldCheck className="w-4 h-4" />}
                    </div>
                    <span className="block text-sm font-bold">Full Interior</span>
                    <span className="block text-[10px] opacity-60 mt-1">Complete whole house.</span>
                  </button>

                  {/* Exterior */}
                  <button 
                    onClick={() => setIncludeExterior(!includeExterior)}
                    className={`p-5 rounded-2xl border transition-all text-left group ${
                      includeExterior ? 'bg-card border-primary text-primary shadow-lg shadow-primary/5' : 'bg-muted/10 border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 mb-3 ${includeExterior ? 'bg-primary border-primary text-white' : 'border-muted-foreground/30'}`}>
                      {includeExterior && <ShieldCheck className="w-4 h-4" />}
                    </div>
                    <span className="block text-sm font-bold">Exterior</span>
                    <span className="block text-[10px] opacity-60 mt-1">Facade & landscape.</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Price Visualization */}
            <div className="lg:w-[400px]">
              <div className="sticky top-32 space-y-8 animate-fade-in-delayed">
                
                {/* Result Card */}
                <div className="bg-foreground text-background rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group border border-primary/20">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/30 transition-all duration-700" />
                  
                  <div className="relative z-10 space-y-8">
                    <div>
                      <p className="text-[10px] font-bold text-primary uppercase tracking-[0.4em] mb-2">Estimated Investment</p>
                      <h2 className="text-4xl md:text-5xl font-display font-bold tabular-nums">
                        {formatCurrency(estimation.total)}
                      </h2>
                    </div>

                    <div className="pt-8 border-t border-background/10 space-y-4">
                      <div className="flex justify-between items-end">
                        <span className="text-[10px] text-background/40 uppercase font-black">Rate Per Sq.Ft</span>
                        <span className="text-2xl font-bold text-primary">₹ {Math.round(estimation.ratePerSqft).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary Breakdown */}
                <div className="bg-card border border-border rounded-3xl p-8 space-y-8">
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <h3 className="text-xs font-black text-foreground uppercase tracking-wider">Breakdown</h3>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Star className="w-3 h-3 text-primary fill-primary" />
                      Premium Standards
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-foreground">Structure & Civil</span>
                        <span className="text-primary">{formatCurrency(estimation.civil)}</span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: '65%' }} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-foreground">Finishing & Services</span>
                        <span className="text-amber-500">{formatCurrency(estimation.finishing)}</span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500" style={{ width: '35%' }} />
                      </div>
                    </div>
                  </div>

                  <div className="pt-6">
                    <button 
                      onClick={() => {
                        if (onConsult) {
                          const summary = `I'm interested in a project: Area: ${area} Sq.Ft, Quality: ${quality}, Floors: ${floors}, Location: ${location.toLowerCase()}. Estimated Budget: ${formatCurrency(estimation.total)}.`;
                          onConsult(summary);
                        }
                      }}
                      className="w-full py-4 bg-primary text-white rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 group"
                    >
                      Discuss Your Project
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <p className="text-[9px] text-center text-muted-foreground mt-4 italic font-body">
                      * Region: {location.toLowerCase()} sectors curated with high-grade TMT & OPC procurement.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </section>
  );
}
