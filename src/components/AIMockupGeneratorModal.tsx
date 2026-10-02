import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Camera,
  Image as ImageIcon,
  Download,
  CheckCircle2,
  Wand2,
  RefreshCw,
  Sliders,
  Layers,
  ShoppingBag,
  Sun,
  Eye,
  ArrowRight,
  Maximize2,
  Check,
  Share2,
} from 'lucide-react';
import { CADDesign } from '../types/cad';

interface AIMockupGeneratorModalProps {
  design: CADDesign;
  currentViewportSnapshot?: string | null;
  onSaveMockupToDesign: (mockupUrl: string) => void;
  onOpenEtsyListing?: () => void;
  onClose: () => void;
}

interface SceneOption {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  recommendedFor: string;
  tag: string;
}

export const AIMockupGeneratorModal: React.FC<AIMockupGeneratorModalProps> = ({
  design,
  currentViewportSnapshot,
  onSaveMockupToDesign,
  onOpenEtsyListing,
  onClose,
}) => {
  const [selectedScene, setSelectedScene] = useState<string>('nordic_desk');
  const [selectedLighting, setSelectedLighting] = useState<string>('golden_hour');
  const [selectedAngle, setSelectedAngle] = useState<string>('hero_45');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [use3dReference, setUse3dReference] = useState<boolean>(true);

  const [activeMockupUrl, setActiveMockupUrl] = useState<string>(
    design.etsyDetails?.mockupUrl || design.thumbnailUrl || ''
  );
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationNotice, setGenerationNotice] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [history, setHistory] = useState<Array<{ url: string; scene: string; timestamp: string }>>([
    ...(design.etsyDetails?.mockupUrl
      ? [{ url: design.etsyDetails.mockupUrl, scene: 'Current Saved Mockup', timestamp: 'Saved' }]
      : []),
  ]);

  const sceneOptions: SceneOption[] = [
    {
      id: 'nordic_desk',
      title: 'Nordic Oak Workspace',
      subtitle: 'Light wood desk, ceramic mug, succulent & morning sun',
      icon: '🪴',
      recommendedFor: 'Planters, Organizers, Desk Accessories',
      tag: 'Best Seller',
    },
    {
      id: 'boho_living',
      title: 'Sunlit Boho Living Room',
      subtitle: 'Reclaimed walnut shelf, trailing ivy & golden hour',
      icon: '🌿',
      recommendedFor: 'Home Decor, Vases, Mandala Coasters',
      tag: 'Aesthetic',
    },
    {
      id: 'artisan_maker',
      title: 'Artisan Maker Studio',
      subtitle: 'Cutting mat, calipers, tools & pastel spools',
      icon: '📐',
      recommendedFor: 'Craft Cutters, Tools, Precision CAD',
      tag: 'Behind the Scenes',
    },
    {
      id: 'marble_spa',
      title: 'Modern Marble Vanity',
      subtitle: 'White Carrara marble, water reflections & luxury spa',
      icon: '🛁',
      recommendedFor: 'Jewelry, Keychains, Bathroom Decor',
      tag: 'High-End Luxury',
    },
    {
      id: 'unboxing_flatlay',
      title: 'Etsy Unboxing Flatlay',
      subtitle: 'Kraft gift box, thank you card, twine & dried lavender',
      icon: '📦',
      recommendedFor: 'Gifts, Gift Bundles, Handmade Packaging',
      tag: 'High Conversion',
    },
    {
      id: 'custom',
      title: 'Custom Studio Creative',
      subtitle: 'Specify your own custom studio lighting and staging',
      icon: '✨',
      recommendedFor: 'Custom Shoots & Special Requests',
      tag: 'Creative Mode',
    },
  ];

  const handleGenerateMockup = async () => {
    setIsGenerating(true);
    setIsSaved(false);
    setGenerationNotice('Composing photorealistic studio lighting...');

    try {
      const res = await fetch('/api/generate-mockup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designName: design.name,
          modelType: design.modelType,
          dimensions: design.dimensions,
          material: design.printSettings.material,
          scenePreset: selectedScene,
          lighting: selectedLighting,
          cameraAngle: selectedAngle,
          prompt: customPrompt.trim(),
          canvasSnapshot: use3dReference && currentViewportSnapshot ? currentViewportSnapshot : undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.imageUrl) {
        setActiveMockupUrl(data.imageUrl);
        setGenerationNotice(data.fallbackNotice || 'Generated photorealistic commercial mockup.');
        setHistory((prev) => [
          {
            url: data.imageUrl,
            scene: sceneOptions.find((s) => s.id === selectedScene)?.title || 'Custom Studio',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
          ...prev,
        ]);
      } else {
        setGenerationNotice('Image generation did not return a valid result.');
      }
    } catch (err: any) {
      console.error('Error generating mockup:', err);
      setGenerationNotice('Network error generating mockup. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToDesign = () => {
    if (!activeMockupUrl) return;
    onSaveMockupToDesign(activeMockupUrl);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleDownloadImage = () => {
    if (!activeMockupUrl) return;
    const cleanName = design.name.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    const a = document.createElement('a');
    a.href = activeMockupUrl;
    a.download = `${cleanName}_etsy_mockup.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-fadeIn">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 rounded-2xl shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100">
                  AI Lifestyle Mockup Generator
                </h3>
                <span className="text-[10px] bg-amber-950 text-amber-300 font-semibold px-2 py-0.5 rounded-full border border-amber-800">
                  Etsy 4:3 Commercial Ready
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Turn your 3D CAD model into high-converting lifestyle marketing photos for your Etsy listing.
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

        {/* Modal Body: Split 2-Column Studio */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-6">
          {/* Left Column: Scene & Photography Controls */}
          <div className="lg:col-span-6 flex flex-col gap-5">
            {/* Active Design Context Card */}
            <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 min-w-0">
                {currentViewportSnapshot ? (
                  <img
                    src={currentViewportSnapshot}
                    alt={design.name}
                    className="w-12 h-12 rounded-xl object-cover bg-slate-800 border border-slate-700 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-slate-400">
                    <Camera className="w-5 h-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <span className="text-[10px] text-blue-400 uppercase font-mono block">Active 3D Model</span>
                  <p className="font-bold text-slate-100 truncate">{design.name}</p>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {design.dimensions.width}×{design.dimensions.height}mm • {design.printSettings.material}
                  </span>
                </div>
              </div>

              {currentViewportSnapshot && (
                <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-700/80 hover:border-blue-500 transition">
                  <input
                    type="checkbox"
                    checked={use3dReference}
                    onChange={(e) => setUse3dReference(e.target.checked)}
                    className="accent-blue-500 rounded"
                  />
                  <span>Blend 3D Pose</span>
                </label>
              )}
            </div>

            {/* Scene Preset Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                <span>1. Select Lifestyle Staging Preset</span>
                <span className="text-[10px] text-slate-400 font-normal">Etsy high-conversion environments</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sceneOptions.map((scene) => (
                  <button
                    key={scene.id}
                    onClick={() => setSelectedScene(scene.id)}
                    className={`p-3 rounded-2xl text-left border transition relative flex flex-col justify-between ${
                      selectedScene === scene.id
                        ? 'bg-amber-600/15 border-amber-500 ring-1 ring-amber-500/50 shadow-md'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-lg">{scene.icon}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                            selectedScene === scene.id
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {scene.tag}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-100 mt-1.5">
                        {scene.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                        {scene.subtitle}
                      </p>
                    </div>

                    <span className="text-[9px] text-amber-300/80 font-mono mt-2 block">
                      Target: {scene.recommendedFor}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Studio Lighting & Camera Angle */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  2. Studio Lighting
                </label>
                <select
                  value={selectedLighting}
                  onChange={(e) => setSelectedLighting(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="golden_hour">☀️ Warm Golden Hour</option>
                  <option value="studio_softbox">💡 5600K Studio Softbox</option>
                  <option value="bright_daylight">🪟 Bright Indirect Daylight</option>
                  <option value="moody_ambient">🕯️ Moody Ambient Glow</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  3. Camera Perspective
                </label>
                <select
                  value={selectedAngle}
                  onChange={(e) => setSelectedAngle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="hero_45">📐 45° Commercial Hero</option>
                  <option value="eye_level">👁️ Straight Eye-Level Macro</option>
                  <option value="top_down_flatlay">📦 90° Top-Down Flatlay</option>
                </select>
              </div>
            </div>

            {/* Custom Notes / Specific Styling Prompt */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Custom Styling Notes (Optional)
              </label>
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g. Add subtle autumn maple leaves and a bronze key next to the planter..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Generate Action Button */}
            <button
              onClick={handleGenerateMockup}
              disabled={isGenerating}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs rounded-2xl shadow-xl transition flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>
                {isGenerating
                  ? 'Rendering Lifestyle Mockup...'
                  : 'Generate Commercial Lifestyle Mockup'}
              </span>
            </button>
          </div>

          {/* Right Column: Mockup Canvas Preview & Marketing Hub */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <span>Etsy Listing Mockup Preview (4:3)</span>
              </span>

              {activeMockupUrl && (
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  High Resolution 1000×750
                </span>
              )}
            </div>

            {/* Main Mockup Viewport */}
            <div className="aspect-[4/3] w-full bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden relative shadow-2xl flex items-center justify-center group">
              {activeMockupUrl ? (
                <>
                  <img
                    src={activeMockupUrl}
                    alt="Etsy Lifestyle Mockup"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    referrerPolicy="no-referrer"
                  />

                  {/* Overlay Action Bar on Hover */}
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4 justify-between backdrop-blur-[2px]">
                    <span className="text-xs font-bold text-white drop-shadow">
                      {sceneOptions.find((s) => s.id === selectedScene)?.title || 'Lifestyle Mockup'}
                    </span>
                    <button
                      onClick={handleDownloadImage}
                      className="px-3 py-1.5 bg-slate-900/90 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg border border-slate-700"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center text-slate-500 gap-3">
                  <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 text-slate-400">
                    <Camera className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-300">
                      No mockup generated yet
                    </p>
                    <p className="text-[11px] text-slate-500 max-w-xs mt-1">
                      Choose a staging scene on the left and click "Generate Commercial Lifestyle Mockup".
                    </p>
                  </div>
                </div>
              )}

              {/* In-Progress Loading Overlay */}
              {isGenerating && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-6 text-center z-20">
                  <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20 animate-pulse">
                    <Wand2 className="w-8 h-8 animate-spin" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-100">
                      Generating Photorealistic Mockup...
                    </p>
                    <p className="text-xs text-amber-400 font-mono">
                      {generationNotice || 'Simulating natural light & materials...'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Mockup Action Tools */}
            {activeMockupUrl && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={handleSaveToDesign}
                    className={`py-2 px-3.5 rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 border ${
                      isSaved
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500'
                    }`}
                  >
                    {isSaved ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Saved to Design!</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Set as Main Listing Photo</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDownloadImage}
                    className="py-2 px-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-semibold text-xs transition flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>Download 4:3 Image</span>
                  </button>
                </div>

                {onOpenEtsyListing && (
                  <button
                    onClick={() => {
                      handleSaveToDesign();
                      onClose();
                      onOpenEtsyListing();
                    }}
                    className="w-full py-2 px-3 bg-orange-950/40 hover:bg-orange-950/60 border border-orange-500/40 text-orange-200 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-orange-400" />
                    <span>Apply Mockup & Open Etsy Listing Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Session History Gallery */}
            {history.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Session Mockup History ({history.length})
                </span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {history.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveMockupUrl(item.url)}
                      className={`relative w-20 h-16 rounded-xl overflow-hidden border shrink-0 transition ${
                        activeMockupUrl === item.url
                          ? 'border-amber-400 ring-2 ring-amber-400/50'
                          : 'border-slate-800 hover:border-slate-600 opacity-75 hover:opacity-100'
                      }`}
                      title={`${item.scene} (${item.timestamp})`}
                    >
                      <img
                        src={item.url}
                        alt={item.scene}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-[8px] text-slate-300 truncate px-1 text-center">
                        {item.scene}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
