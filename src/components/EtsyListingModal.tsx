import React, { useState } from 'react';
import {
  X,
  Sparkles,
  ShoppingBag,
  Tag,
  Copy,
  Check,
  Image as ImageIcon,
  DollarSign,
  Package,
  Wand2,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { CADDesign } from '../types/cad';

interface EtsyListingModalProps {
  design: CADDesign;
  onUpdateDesignListing: (title: string, tags: string[], price: number) => void;
  onClose: () => void;
}

export const EtsyListingModal: React.FC<EtsyListingModalProps> = ({
  design,
  onUpdateDesignListing,
  onClose,
}) => {
  const [listingTitle, setListingTitle] = useState(
    design.etsyDetails?.title ||
      `${design.name} - Modern 3D Printed & Laser Manufactured Decor, Unique Etsy Gift`
  );
  const [listingTags, setListingTags] = useState<string[]>(
    design.etsyDetails?.tags || [
      '3d printed',
      'etsy bestseller',
      'custom gift',
      'home decor',
      'handmade',
      'modern design',
      'laser engraved',
      'gift for her',
      'gift for him',
      'desk accessory',
      'sustainable pla',
      'eco friendly',
      'minimalist decor',
    ]
  );
  const [listingPrice, setListingPrice] = useState(design.etsyDetails?.suggestedPrice || 18.99);
  const [description, setDescription] = useState(
    design.etsyDetails?.description ||
      `Transform your space with our precision-crafted ${design.name}.\n\n✨ HIGHLIGHTS:\n- Watertight & structural high-infill design\n- Crafted with eco-friendly, non-toxic PLA and sustainable materials\n- Dimensions: ${design.dimensions.width}mm × ${design.dimensions.depth || design.dimensions.width}mm × ${design.dimensions.height}mm\n- Beautiful matte modern finish\n\n📦 PACKAGING & CARE:\nCarefully hand-checked and packed in recyclable protective mailers. Rinse with lukewarm water.`
  );

  const [mockupUrl, setMockupUrl] = useState<string | null>(design.etsyDetails?.mockupUrl || null);
  const [mockupPrompt, setMockupPrompt] = useState(
    `A gorgeous commercial product photo of a 3D printed ${design.name}, displayed on a light oak minimalist Scandinavian desk with a small succulent and warm natural morning sunlight, 8k professional studio lighting`
  );

  const [isGeneratingListing, setIsGeneratingListing] = useState<boolean>(false);
  const [isGeneratingMockup, setIsGeneratingMockup] = useState<boolean>(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleGenerateAiListing = async () => {
    setIsGeneratingListing(true);
    try {
      const res = await fetch('/api/etsy-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelName: design.name,
          category: design.category,
          description: design.description,
          dimensions: design.dimensions,
          printSettings: design.printSettings,
        }),
      });
      const data = await res.json();
      if (data.success && data.listing) {
        if (data.listing.title) setListingTitle(data.listing.title);
        if (data.listing.tags) setListingTags(data.listing.tags.slice(0, 13));
        if (data.listing.price) setListingPrice(data.listing.price);
        if (data.listing.description) setDescription(data.listing.description);
        onUpdateDesignListing(
          data.listing.title || listingTitle,
          data.listing.tags || listingTags,
          data.listing.price || listingPrice
        );
      }
    } catch (err) {
      console.error('Error generating Etsy listing:', err);
    } finally {
      setIsGeneratingListing(false);
    }
  };

  const handleGenerateAiMockup = async () => {
    setIsGeneratingMockup(true);
    try {
      const res = await fetch('/api/generate-mockup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: mockupPrompt,
          style: 'Commercial Etsy product photography, natural oak desk, bright morning sun, potted plant',
        }),
      });
      const data = await res.json();
      if (data.imageUrl) {
        setMockupUrl(data.imageUrl);
      }
    } catch (err) {
      console.error('Error generating mockup:', err);
    } finally {
      setIsGeneratingMockup(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[88vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-500/10 text-orange-400 rounded-xl border border-orange-500/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">
                  Etsy Listing & Mockup Studio
                </h2>
                <span className="text-[11px] font-semibold text-orange-400 bg-orange-950/60 px-2 py-0.5 rounded-full border border-orange-800/60">
                  SEO & Mockup Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Generate high-converting 140-char title, 13 Etsy tags, pricing, and AI lifestyle mockups
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateAiListing}
              disabled={isGeneratingListing}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50"
            >
              {isGeneratingListing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>{isGeneratingListing ? 'Optimizing SEO...' : 'AI Generate Listing'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Top Row: AI Mockup Photo Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
            <div className="relative aspect-square md:aspect-auto h-48 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center">
              {mockupUrl ? (
                <img
                  src={mockupUrl}
                  alt="Etsy Listing Mockup"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-500 p-4 text-center">
                  <ImageIcon className="w-8 h-8 text-slate-600" />
                  <span className="text-xs">No Mockup Generated Yet</span>
                  <span className="text-[10px] text-slate-600">
                    Click Generate Mockup to render with Gemini
                  </span>
                </div>
              )}
            </div>

            <div className="md:col-span-2 space-y-3 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  AI Listing Photo Prompt (Gemini Vision Preview)
                </label>
                <textarea
                  rows={3}
                  value={mockupPrompt}
                  onChange={(e) => setMockupPrompt(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  Generates styled studio scenes for Etsy cover photos
                </span>
                <button
                  onClick={handleGenerateAiMockup}
                  disabled={isGeneratingMockup}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition disabled:opacity-50"
                >
                  {isGeneratingMockup ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Wand2 className="w-3.5 h-3.5 text-orange-400" />
                  )}
                  <span>{isGeneratingMockup ? 'Rendering Photo...' : 'Generate Photo Mockup'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Title Field */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <label className="font-semibold text-slate-200">
                Optimized Etsy Title ({listingTitle.length}/140 chars)
              </label>
              <button
                onClick={() => handleCopy(listingTitle, 'title')}
                className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 font-medium"
              >
                {copiedSection === 'title' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSection === 'title' ? 'Copied!' : 'Copy Title'}</span>
              </button>
            </div>
            <input
              type="text"
              maxLength={140}
              value={listingTitle}
              onChange={(e) => setListingTitle(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-medium focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Pricing & 13 Tags */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Suggested Retail Price */}
            <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/60 space-y-2">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Listing Price
              </span>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400">$</span>
                <input
                  type="number"
                  step="0.5"
                  value={listingPrice}
                  onChange={(e) => setListingPrice(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-7 pr-3 py-2 text-sm font-bold text-emerald-400 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="text-[10px] text-slate-400">
                Estimated Net Margin: <strong className="text-emerald-400">~{design.etsyDetails?.profitMargin || 85}%</strong>
              </div>
            </div>

            {/* 13 High-Volume Etsy Tags */}
            <div className="md:col-span-2 p-4 bg-slate-800/40 rounded-xl border border-slate-700/60 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-orange-400" /> 13 SEO Search Tags ({listingTags.length}/13)
                </span>
                <button
                  onClick={() => handleCopy(listingTags.join(', '), 'tags')}
                  className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 font-medium"
                >
                  {copiedSection === 'tags' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSection === 'tags' ? 'Copied!' : 'Copy All Tags'}</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {listingTags.map((t, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] bg-slate-900 text-slate-300 border border-slate-700/80 px-2.5 py-1 rounded-lg font-medium"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <label className="font-semibold text-slate-200">
                Etsy Product Description (Markdown formatted)
              </label>
              <button
                onClick={() => handleCopy(description, 'desc')}
                className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 font-medium"
              >
                {copiedSection === 'desc' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSection === 'desc' ? 'Copied!' : 'Copy Description'}</span>
              </button>
            </div>
            <textarea
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-orange-500 leading-relaxed"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Copy fields directly into Etsy Seller Dashboard &gt; Listings &gt; Add Listing
          </span>
          <button
            onClick={() => {
              onUpdateDesignListing(listingTitle, listingTags, listingPrice);
              onClose();
            }}
            className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-lg transition"
          >
            Save to Active CAD Model
          </button>
        </div>
      </div>
    </div>
  );
};
