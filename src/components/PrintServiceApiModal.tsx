import React, { useState } from 'react';
import {
  X,
  Share2,
  Cpu,
  CheckCircle,
  Truck,
  Box,
  DollarSign,
  Layers,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Send,
  Loader2,
} from 'lucide-react';
import { CADDesign } from '../types/cad';

interface PrintServiceApiModalProps {
  design: CADDesign;
  onClose: () => void;
}

export const PrintServiceApiModal: React.FC<PrintServiceApiModalProps> = ({
  design,
  onClose,
}) => {
  const [selectedService, setSelectedService] = useState<'slant3d' | 'craftcloud' | 'shapeways' | 'jlc3dp'>('slant3d');
  const [quantity, setQuantity] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState<string | null>(null);

  const { width, depth = width, height, wallThickness = 2.0 } = design.dimensions;
  const isWallOk = wallThickness >= 1.6;
  const fitsStandardBed = width <= 256 && depth <= 256 && height <= 256;

  // Real-time volume calculation
  const bboxCm3 = (width * depth * height) / 1000;
  const estVolumeCm3 = Math.max(2, bboxCm3 * 0.24);
  const weightGrams = Number((estVolumeCm3 * 1.24).toFixed(1));

  const services = {
    slant3d: {
      name: 'Slant 3D',
      subtitle: 'Official Etsy Print-on-Demand Dropship Partner',
      badge: 'Best for Etsy POD',
      leadTime: '2 - 3 business days',
      materials: ['PLA Pro (Matte Black, White, Grey)', 'PETG Industrial'],
      baseCost: 3.40,
      gramRate: 0.045,
      apiEndpoint: 'https://api.slant3d.com/v1/orders',
      features: ['Auto-synced with Etsy orders', 'Blind dropship packaging to customer', 'Zero inventory risk'],
    },
    craftcloud: {
      name: 'Craftcloud by All3DP',
      subtitle: 'Global On-Demand Manufacturing Marketplace',
      badge: '150+ Materials',
      leadTime: '4 - 6 business days',
      materials: ['PA12 Nylon (SLS Laser Sintered)', 'Tough SLA Resin', 'Stainless Steel 316L'],
      baseCost: 9.80,
      gramRate: 0.12,
      apiEndpoint: 'https://api.craftcloud3d.com/v2/rfq',
      features: ['Multi-supplier instant quote', 'Certified industrial ISO 9001', 'High heat deflection materials'],
    },
    shapeways: {
      name: 'Shapeways API',
      subtitle: 'High-Precision Industrial Additive',
      badge: 'Enterprise Additive',
      leadTime: '5 - 8 business days',
      materials: ['Versatile Plastic (Nylon PA12)', 'High Definition Acrylate', 'Brass Casting'],
      baseCost: 14.50,
      gramRate: 0.18,
      apiEndpoint: 'https://api.shapeways.com/v1/orders',
      features: ['Museum-grade finishes', 'Full color sandstone', 'Precious metal casting'],
    },
    jlc3dp: {
      name: 'JLC3DP Factory',
      subtitle: 'High-Speed Rapid Prototyping & Production',
      badge: 'Lowest Unit Cost',
      leadTime: '3 - 5 business days',
      materials: ['SLA 9000R High-Toughness White Resin', 'FDM PETG', 'MJF Nylon'],
      baseCost: 2.90,
      gramRate: 0.048,
      apiEndpoint: 'https://api.jlc3dp.com/v1/quote',
      features: ['Sub-millimeter layer resolution', 'Massive scale production', 'Smooth injection-like finish'],
    },
  };

  const current = services[selectedService];
  const unitPrice = Number((current.baseCost + weightGrams * current.gramRate).toFixed(2));
  // Volume bulk discount
  const discountMultiplier = quantity >= 50 ? 0.75 : quantity >= 20 ? 0.85 : quantity >= 10 ? 0.92 : 1.0;
  const discountedUnitPrice = Number((unitPrice * discountMultiplier).toFixed(2));
  const subtotal = Number((discountedUnitPrice * quantity).toFixed(2));
  const shipping = quantity > 1 ? 7.50 : 4.80;
  const total = Number((subtotal + shipping).toFixed(2));

  const handleSimulateOrder = () => {
    setIsSubmitting(true);
    setOrderStatus('Uploading watertight .STL mesh to print farm...');

    setTimeout(() => {
      setOrderStatus('Automated slicing & geometric validation: PASSED');
    }, 1200);

    setTimeout(() => {
      setOrderStatus('Assigned to automated print farm queue (Batch #84920)');
    }, 2400);

    setTimeout(() => {
      setIsSubmitting(false);
      setOrderStatus('CONFIRMED: Dispatched to farm. Blind shipping label generated.');
      setTrackingNumber(`9400 1118 9956 2026 ${Math.floor(1000 + Math.random() * 9000)}`);
    }, 3600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Direct Print Service & Dropship API
              </h2>
              <p className="text-xs text-slate-400">
                Fulfill Etsy orders automatically with on-demand manufacturing print farms
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

        {/* Content */}
        <div className="p-6 space-y-6 flex-1">
          {/* Service Selector Tabs */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Select Integrated Manufacturing Partner API
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(services) as Array<keyof typeof services>).map((key) => {
                const s = services[key];
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedService(key);
                      setOrderStatus(null);
                    }}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      selectedService === key
                        ? 'bg-blue-600/20 border-blue-500 text-blue-100 shadow-md'
                        : 'bg-slate-800/40 border-slate-700/70 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        {s.badge}
                      </span>
                      <h4 className="text-xs font-bold text-slate-100 mt-2">{s.name}</h4>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-2 font-mono">
                      {s.leadTime}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Automated Manufacturability Check Card */}
          <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Automated Pre-Flight Manufacturability Analysis
            </h4>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400">Dimensions & Bed Fit</span>
                <p className="font-semibold text-slate-100 mt-0.5 font-mono">
                  {width} × {depth} × {height} mm
                </p>
                <span className={`text-[10px] font-medium ${fitsStandardBed ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {fitsStandardBed ? '✅ Fits 256mm Build Volume' : '⚠️ Requires Industrial Bed'}
                </span>
              </div>

              <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400">Wall Thickness</span>
                <p className="font-semibold text-slate-100 mt-0.5 font-mono">
                  {wallThickness} mm
                </p>
                <span className={`text-[10px] font-medium ${isWallOk ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isWallOk ? '✅ Ejection Safe (≥1.6mm)' : '❌ Risk of Fragility (<1.6mm)'}
                </span>
              </div>

              <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400">Estimated Weight</span>
                <p className="font-semibold text-slate-100 mt-0.5 font-mono">
                  {weightGrams} grams
                </p>
                <span className="text-[10px] text-slate-400">
                  Vol: {estVolumeCm3.toFixed(1)} cm³
                </span>
              </div>
            </div>
          </div>

          {/* Pricing & Quantity Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">Order Quantity</span>
                <div className="flex items-center gap-1.5">
                  {[1, 5, 20, 50].map((qty) => (
                    <button
                      key={qty}
                      onClick={() => setQuantity(qty)}
                      className={`px-2.5 py-1 text-xs font-mono rounded-lg transition ${
                        quantity === qty
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {qty}x
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-xs text-slate-400 space-y-1.5 pt-2 border-t border-slate-700/60">
                <div className="flex justify-between">
                  <span>Unit Price:</span>
                  <span className="font-mono text-slate-200">${discountedUnitPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span>Quantity:</span>
                  <span className="font-mono text-slate-200">{quantity} units</span>
                </div>
                <div className="flex justify-between">
                  <span>Standard Shipping:</span>
                  <span className="font-mono text-slate-200">${shipping}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-emerald-400 pt-1 border-t border-slate-700">
                  <span>Total Direct Cost:</span>
                  <span className="font-mono">${total}</span>
                </div>
              </div>
            </div>

            {/* Service Highlights */}
            <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/60 space-y-2.5">
              <h5 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-blue-400" />
                {current.name} Integration Features
              </h5>
              <ul className="text-xs text-slate-300 space-y-1.5">
                {current.features.map((feat, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-2 text-[10px] text-slate-400 font-mono">
                API Endpoint: {current.apiEndpoint}
              </div>
            </div>
          </div>

          {/* Order Simulation Status Feedback */}
          {orderStatus && (
            <div className="p-4 bg-blue-950/40 border border-blue-500/40 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-300">
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                )}
                <span>{orderStatus}</span>
              </div>

              {trackingNumber && (
                <div className="text-xs text-slate-300 pt-2 border-t border-blue-900/60 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-slate-400">
                    <Truck className="w-3.5 h-3.5 text-emerald-400" /> Simulated Tracking #:
                  </span>
                  <span className="font-mono font-bold text-emerald-300">{trackingNumber}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Etsy Seller Net Margin: <strong className="text-emerald-400 font-mono">~{design.etsyDetails?.profitMargin || 80}%</strong>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSimulateOrder}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>Dispatch via {current.name} API</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
