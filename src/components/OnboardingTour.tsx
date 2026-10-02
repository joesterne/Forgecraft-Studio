import React, { useState, useEffect, useRef } from 'react';
import {
  Compass,
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Sliders,
  Printer,
  Flame,
  Download,
  Sparkles,
  Eye,
  Layers,
  ArrowRight,
} from 'lucide-react';

export interface TourStep {
  id: string;
  targetSelector: string;
  tabToActivate?: 'dimensions' | 'slicer' | 'laser';
  title: string;
  subtitle: string;
  description: string;
  tip?: string;
  badge: string;
  badgeColor: string;
  icon: React.ReactNode;
  positionPreference?: 'bottom' | 'top' | 'left' | 'right';
}

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  onTabChange?: (tab: 'dimensions' | 'slicer' | 'laser') => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  isOpen,
  onClose,
  onTabChange,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const steps: TourStep[] = [
    {
      id: 'viewport',
      targetSelector: '#tour-viewport',
      title: 'Real-Time 3D CAD Canvas',
      subtitle: 'Inspect, Rotate & Examine Meshes',
      description:
        'Left-click to rotate, right-click to pan, and scroll to zoom. Toggle wireframe overlays, clipping plane slice views, and material rendering to ensure watertight geometry before printing.',
      tip: 'Click the camera viewcube presets (Top, Front, Iso) to align your workspace instantly.',
      badge: 'Interactive 3D',
      badgeColor: 'bg-blue-950/80 text-blue-300 border-blue-800/80',
      icon: <Eye className="w-5 h-5 text-blue-400" />,
      positionPreference: 'bottom',
    },
    {
      id: 'dimensions',
      targetSelector: '#tour-tab-dimensions',
      tabToActivate: 'dimensions',
      title: 'Parametric Dimensions Studio',
      subtitle: 'Millimeter-Accurate Part Geometry',
      description:
        'Tune width, depth, height, custom wall thickness, corner bevels, and drainage holes. Every slider modification dynamically updates the Three.js mesh and calculates material consumption.',
      tip: 'Use standard millimeter dimensions or switch templates from the Etsy Niche header bar.',
      badge: 'Step 1: Geometry',
      badgeColor: 'bg-indigo-950/80 text-indigo-300 border-indigo-800/80',
      icon: <Sliders className="w-5 h-5 text-indigo-400" />,
      positionPreference: 'left',
    },
    {
      id: 'slicer',
      targetSelector: '#tour-tab-slicer',
      tabToActivate: 'slicer',
      title: '3D Slicer & Profit Optimizer',
      subtitle: 'Material Densities & Recharts Analytics',
      description:
        'Choose from PLA, PETG, ABS, TPU, or Resin. Explore the animated Recharts cost visualizer, tracking raw filament weight, electricity consumption, and Etsy transaction fees for maximum profit.',
      tip: 'Adjust the Batch Multiplier (1x to 25x) to project batch production and wholesale margins.',
      badge: 'Step 2: Slicing & Cost',
      badgeColor: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80',
      icon: <Printer className="w-5 h-5 text-emerald-400" />,
      positionPreference: 'left',
    },
    {
      id: 'laser',
      targetSelector: '#tour-tab-laser',
      tabToActivate: 'laser',
      title: 'Laser Cutting & Vector Studio',
      subtitle: 'Kerf Compensation & Multi-Layer Vectors',
      description:
        'Generate industry-standard layered SVG and AutoCAD DXF files (Red=Cut, Blue=Score, Black=Engrave). Configure kerf offsets to ensure friction-tight joinery and inlays on laser cutters.',
      tip: 'Tuned profiles available for Diode (10W/20W), CO2 (45W/55W), and Fiber lasers.',
      badge: 'Step 3: Laser Vectors',
      badgeColor: 'bg-rose-950/80 text-rose-300 border-rose-800/80',
      icon: <Flame className="w-5 h-5 text-rose-400" />,
      positionPreference: 'left',
    },
    {
      id: 'export',
      targetSelector: '#tour-export-button',
      title: 'Export & Bulk ZIP Package',
      subtitle: 'Download Bambu/Prusa STL & Laser SVG',
      description:
        'Download binary .STL meshes for 3D slicing, layered .SVG files for laser software, or open the Cloud Library to select multiple models for a consolidated manufacturing ZIP archive.',
      tip: 'The Cloud Library auto-saves your designs and maintains non-destructive version history.',
      badge: 'Final Step: Production',
      badgeColor: 'bg-amber-950/80 text-amber-300 border-amber-800/80',
      icon: <Download className="w-5 h-5 text-amber-400" />,
      positionPreference: 'bottom',
    },
  ];

  const currentStep = steps[currentStepIndex];

  // Sync tab when step changes
  useEffect(() => {
    if (!isOpen) return;

    if (currentStep.tabToActivate && onTabChange) {
      onTabChange(currentStep.tabToActivate);
    }
  }, [currentStepIndex, isOpen]);

  // Measure target element position
  useEffect(() => {
    if (!isOpen) return;

    const updateRect = () => {
      const el = document.querySelector(currentStep.targetSelector);
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);
        // Scroll target into view if outside viewport
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      } else {
        setTargetRect(null);
      }
    };

    updateRect();
    const timer = setTimeout(updateRect, 150);
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
    };
  }, [currentStepIndex, isOpen, currentStep.targetSelector]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCompleteTour();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex]);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleCompleteTour();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleCompleteTour = () => {
    localStorage.setItem('forgecraft_tour_completed', 'true');
    onClose();
  };

  if (!isOpen) return null;

  // Calculate Tooltip position based on target rect
  const getTooltipStyle = (): React.CSSProperties => {
    const tooltipWidth = 380;
    const padding = 16;
    const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

    if (!targetRect) {
      // Centered fallback
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        position: 'fixed',
        width: Math.min(tooltipWidth, windowWidth - 32),
      };
    }

    const { top, bottom, left, right, width, height } = targetRect;
    let computedTop = bottom + 12;
    let computedLeft = left + width / 2 - tooltipWidth / 2;

    // Prefer left or bottom positioning based on preference
    if (currentStep.positionPreference === 'left') {
      if (left > tooltipWidth + padding) {
        computedLeft = left - tooltipWidth - 16;
        computedTop = Math.max(padding, top);
      } else {
        computedLeft = Math.max(padding, left);
        computedTop = bottom + 12;
      }
    } else if (currentStep.positionPreference === 'bottom') {
      computedTop = bottom + 14;
      computedLeft = left + width / 2 - tooltipWidth / 2;
    }

    // Boundary constraints
    if (computedLeft + tooltipWidth > windowWidth - padding) {
      computedLeft = windowWidth - tooltipWidth - padding;
    }
    if (computedLeft < padding) {
      computedLeft = padding;
    }
    if (computedTop + 320 > windowHeight - padding) {
      computedTop = Math.max(padding, top - 320);
    }

    return {
      top: `${computedTop}px`,
      left: `${computedLeft}px`,
      position: 'fixed',
      width: Math.min(tooltipWidth, windowWidth - 32),
    };
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dark backdrop overlay with cutout spotlight */}
      <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[2px] transition-all duration-300" />

      {/* Target Element Spotlight Ring */}
      {targetRect && (
        <div
          className="fixed pointer-events-none transition-all duration-300 rounded-2xl ring-4 ring-blue-500/80 shadow-[0_0_50px_rgba(59,130,246,0.35)] z-40"
          style={{
            top: `${Math.max(0, targetRect.top - 6)}px`,
            left: `${Math.max(0, targetRect.left - 6)}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`,
            backgroundColor: 'transparent',
          }}
        />
      )}

      {/* Floating Tooltip Card */}
      <div
        ref={tooltipRef}
        style={getTooltipStyle()}
        className="z-50 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl p-5 text-slate-100 flex flex-col gap-4 animate-fadeIn"
      >
        {/* Header with step pill & Close */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-slate-800 text-blue-400 rounded-xl border border-slate-700">
              {currentStep.icon}
            </div>
            <div>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${currentStep.badgeColor}`}
              >
                {currentStep.badge}
              </span>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Step {currentStepIndex + 1} of {steps.length}
              </p>
            </div>
          </div>

          <button
            onClick={handleCompleteTour}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
            title="Skip Tour (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title & Description */}
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-slate-100 tracking-tight">
            {currentStep.title}
          </h3>
          <p className="text-xs font-medium text-blue-400">
            {currentStep.subtitle}
          </p>
          <p className="text-xs text-slate-300 leading-relaxed pt-1">
            {currentStep.description}
          </p>
        </div>

        {/* Pro Tip Box */}
        {currentStep.tip && (
          <div className="p-2.5 bg-blue-950/40 border border-blue-900/60 rounded-xl text-[11px] text-blue-200 flex items-start gap-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
            <span>{currentStep.tip}</span>
          </div>
        )}

        {/* Stepper Dots & Navigation Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 mt-1">
          {/* Progress Dots */}
          <div className="flex items-center gap-1.5">
            {steps.map((step, idx) => (
              <button
                key={step.id}
                onClick={() => setCurrentStepIndex(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentStepIndex
                    ? 'w-6 bg-blue-500'
                    : idx < currentStepIndex
                    ? 'w-2 bg-emerald-500'
                    : 'w-2 bg-slate-700 hover:bg-slate-600'
                }`}
                title={`Go to Step ${idx + 1}: ${step.title}`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {currentStepIndex > 0 && (
              <button
                onClick={handlePrev}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1 transition border border-slate-700"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
            >
              <span>
                {currentStepIndex === steps.length - 1 ? 'Finish Tour' : 'Next'}
              </span>
              {currentStepIndex === steps.length - 1 ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
