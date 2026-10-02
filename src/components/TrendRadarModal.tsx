import React, { useState } from 'react';
import {
  X,
  Search,
  Sparkles,
  TrendingUp,
  Globe,
  ExternalLink,
  Flame,
  Wand2,
  CheckCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { CADDesign } from '../types/cad';

interface TrendRadarModalProps {
  onApplyTrendCad: (prompt: string, category: string) => void;
  onClose: () => void;
}

export const TrendRadarModal: React.FC<TrendRadarModalProps> = ({
  onApplyTrendCad,
  onClose,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('3d printing and laser engraving best sellers');
  const [analysisText, setAnalysisText] = useState<string>('');
  const [groundingSources, setGroundingSources] = useState<any[]>([]);
  const [searchQueries, setSearchQueries] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  const categories = [
    { id: '3d printing and laser engraving best sellers', label: '🔥 All-Time Best Sellers' },
    { id: 'trending personalized gifts 3d print laser etsy', label: '🎁 Personalized Gifts' },
    { id: 'aesthetic home decor succulent planters desk organizers etsy', label: '🪴 Home & Desk Decor' },
    { id: 'polymer clay cutters and cookie cutters jewelry making etsy', label: '🌸 Craft & Clay Cutters' },
    { id: 'fidget toys articulated desk accessories etsy viral', label: '⚙️ Fidgets & Toys' },
  ];

  const handleFetchTrends = async (cat: string) => {
    setIsLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch('/api/trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: cat }),
      });
      const data = await res.json();
      if (data.success) {
        setAnalysisText(data.analysis || '');
        setGroundingSources(data.grounding?.sources || []);
        setSearchQueries(data.grounding?.queries || []);
      }
    } catch (err) {
      console.error('Failed to fetch trends:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Preset quick ideas to immediately build CAD
  const quickTrendIdeas = [
    {
      title: 'Minimalist Hexagon Geometric Planter with Tray',
      category: 'Home Decor',
      prompt: 'Minimalist faceted hexagon succulent planter with internal drainage hole and matching drip saucer tray for Etsy home decor.',
      price: '$18 - $24',
    },
    {
      title: 'Personalized Art Deco Hotel Motel Keychain',
      category: 'Personalized Gifts',
      prompt: 'Vintage hotel motel diamond name keychain with custom relief lettering, border groove, and key ring loop.',
      price: '$10 - $16',
    },
    {
      title: 'Botanical Floral Clay Earring Cutter',
      category: 'Craft & Baking',
      prompt: 'Botanical wildflower polymer clay earring cutter with 0.7mm knife edge, stepped reinforcement wall, and ergonomic press grip.',
      price: '$8 - $14',
    },
    {
      title: 'Modular Desk Organizer Bin with Scoop Front',
      category: 'Desk Organization',
      prompt: 'Stackable desk organizer bin with rounded inner scoop radius, compartment divider, and clean modern aesthetic.',
      price: '$14 - $22',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[88vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">
                  Etsy Market Intelligence & Trend Radar
                </h2>
                <span className="text-[11px] font-semibold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800/60 flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Live Google Search Grounding
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Discover viral 3D printed and laser engraved products with high Etsy buyer demand
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Pills & Run Search */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedCategory(c.id);
                  handleFetchTrends(c.id);
                }}
                className={`px-3 py-1.5 text-xs rounded-xl font-medium whitespace-nowrap transition ${
                  selectedCategory === c.id
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleFetchTrends(selectedCategory)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>{isLoading ? 'Scanning Etsy Trends...' : 'Scan Live Market'}</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Quick Trend Launchers */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              One-Click High Demand Etsy Templates
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {quickTrendIdeas.map((idea, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-800/40 border border-slate-700/60 rounded-xl hover:border-amber-500/60 hover:bg-slate-800/70 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-900/60">
                        {idea.category}
                      </span>
                      <span className="text-[11px] font-mono text-emerald-400 font-bold">
                        {idea.price}
                      </span>
                    </div>
                    <h5 className="text-xs font-bold text-slate-100 mt-2">{idea.title}</h5>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{idea.prompt}</p>
                  </div>

                  <button
                    onClick={() => {
                      onApplyTrendCad(idea.prompt, idea.category);
                      onClose();
                    }}
                    className="mt-3 w-full py-1.5 bg-amber-500/15 hover:bg-amber-500 hover:text-slate-950 text-amber-300 text-xs font-bold rounded-lg border border-amber-500/30 transition flex items-center justify-center gap-1.5"
                  >
                    <Wand2 className="w-3 h-3" />
                    <span>Generate Parametric CAD</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Real-time Grounded Analysis Results */}
          {hasSearched && (
            <div className="p-5 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold text-slate-200">
                    Live Google Search Grounding Analysis
                  </h4>
                </div>
                {searchQueries.length > 0 && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    Query: "{searchQueries[0]}"
                  </span>
                )}
              </div>

              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400 text-xs">
                  <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
                  <span>Synthesizing live Etsy buyer search data & market margins...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="prose prose-invert prose-xs text-xs text-slate-300 leading-relaxed whitespace-pre-line max-w-none">
                    {analysisText}
                  </div>

                  {/* Grounding Source Citations */}
                  {groundingSources.length > 0 && (
                    <div className="pt-3 border-t border-slate-800/80">
                      <h5 className="text-[11px] font-semibold text-slate-400 mb-2">
                        Live Grounded Web Sources:
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {groundingSources.slice(0, 4).map((source, i) => (
                          <a
                            key={i}
                            href={source.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg"
                          >
                            <span>{source.title}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
