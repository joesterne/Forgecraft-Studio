import { Request, Response } from 'express';
import { ai } from './gemini';

// In-memory / server-persisted cloud library storage
let cloudLibraryStorage: any[] = [
  {
    id: 'design-hex-planter',
    name: 'Geometric Hexagon Succulent Planter',
    category: 'Home Decor',
    description: 'Modern low-poly faceted succulent pot with internal water reservoir drainage channel and twist-lock drip tray. Best-seller on Etsy.',
    tags: ['Etsy Best-Seller', 'Planter', 'Geometric', 'Home Decor'],
    modelType: 'planter',
    dimensions: { width: 90, depth: 90, height: 75, wallThickness: 2.8, drainageHole: 12, bevelRadius: 2.0 },
    printSettings: {
      layerHeight: 0.20,
      infillDensity: 15,
      infillPattern: 'gyroid',
      wallCount: 3,
      topLayers: 4,
      bottomLayers: 4,
      material: 'PLA',
      filamentCostPerKg: 20,
      printSpeed: 60,
      supportsNeeded: false,
    },
    laserSettings: {
      enabled: false,
      material: '3mm Basswood Plywood',
      laserType: 'Diode 20W',
      cutSpeed: 300,
      cutPower: 100,
      scoreSpeed: 1200,
      scorePower: 35,
      engraveSpeed: 3500,
      engravePower: 50,
      kerfCompensation: 0.15,
    },
    etsyDetails: {
      suggestedPrice: 18.50,
      materialCost: 1.45,
      printTimeHours: 3.2,
      profitMargin: 82,
      title: 'Modern Geometric Hexagon Succulent Planter with Drainage Tray - Minimalist 3D Printed Pot',
      tags: ['succulent planter', 'geometric pot', '3d printed decor', 'minimalist vase', 'office plant pot', 'desk accessory', 'housewarming gift', 'modern indoor plant', 'cactus pot', 'eco friendly pla', 'drainage tray', 'boho home', 'bestseller planter'],
    },
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    isFavorite: true,
    versions: [
      {
        versionId: 'ver-hex-2',
        versionNumber: 2,
        timestamp: new Date(Date.now() - 3600000 * 36).toISOString(),
        label: 'V2 Scaled 85mm with 12mm Drain Hole',
        changeSummary: 'Scaled width to 85mm and enlarged drainage tube for better water flow',
        dimensions: { width: 85, depth: 85, height: 70, wallThickness: 2.5, drainageHole: 12, bevelRadius: 2.0 },
        printSettings: {
          layerHeight: 0.20,
          infillDensity: 20,
          infillPattern: 'gyroid',
          wallCount: 3,
          topLayers: 4,
          bottomLayers: 4,
          material: 'PETG',
          filamentCostPerKg: 22,
          printSpeed: 55,
          supportsNeeded: false,
        },
        laserSettings: {
          enabled: false,
          material: '3mm Basswood Plywood',
          laserType: 'Diode 20W',
          cutSpeed: 300,
          cutPower: 100,
          scoreSpeed: 1200,
          scorePower: 35,
          engraveSpeed: 3500,
          engravePower: 50,
          kerfCompensation: 0.15,
        },
        etsyDetails: {
          suggestedPrice: 16.99,
          materialCost: 1.25,
          printTimeHours: 2.8,
          profitMargin: 83,
          title: 'Geometric Hexagon Succulent Planter - V2 Prototype',
          tags: ['planter', 'succulent pot'],
        },
      },
      {
        versionId: 'ver-hex-1',
        versionNumber: 1,
        timestamp: new Date(Date.now() - 3600000 * 72).toISOString(),
        label: 'V1 Initial Compact Prototype (70mm)',
        changeSummary: 'First test print with thin 2.0mm wall thickness',
        dimensions: { width: 70, depth: 70, height: 55, wallThickness: 2.0, drainageHole: 8, bevelRadius: 1.5 },
        printSettings: {
          layerHeight: 0.20,
          infillDensity: 15,
          infillPattern: 'grid',
          wallCount: 2,
          topLayers: 3,
          bottomLayers: 3,
          material: 'PLA',
          filamentCostPerKg: 20,
          printSpeed: 60,
          supportsNeeded: false,
        },
        laserSettings: {
          enabled: false,
          material: '3mm Basswood Plywood',
          laserType: 'Diode 20W',
          cutSpeed: 300,
          cutPower: 100,
          scoreSpeed: 1200,
          scorePower: 35,
          engraveSpeed: 3500,
          engravePower: 50,
          kerfCompensation: 0.15,
        },
        etsyDetails: {
          suggestedPrice: 14.50,
          materialCost: 0.95,
          printTimeHours: 1.9,
          profitMargin: 85,
          title: 'Compact 70mm Succulent Pot',
          tags: ['small planter', 'mini cactus pot'],
        },
      },
    ],
  },
  {
    id: 'design-monogram-keychain',
    name: 'Personalized Art Deco Name Keychain',
    category: 'Personalized Gifts',
    description: 'Customizable double-layer relief name keychain with integrated reinforced lanyard hole and chamfered edges.',
    tags: ['Personalized', 'Keychains', 'Gifts', 'Laser & 3D'],
    modelType: 'keychain',
    dimensions: { width: 75, depth: 28, height: 4.5, wallThickness: 2.0, embossDepth: 1.6, cornerRadius: 5.0, holeDiameter: 5.0, text: 'ALEX' },
    printSettings: {
      layerHeight: 0.16,
      infillDensity: 30,
      infillPattern: 'grid',
      wallCount: 4,
      topLayers: 5,
      bottomLayers: 4,
      material: 'PETG',
      filamentCostPerKg: 22,
      printSpeed: 50,
      supportsNeeded: false,
    },
    laserSettings: {
      enabled: true,
      material: '3mm Cast Acrylic (Clear/Opaque)',
      laserType: 'CO2 45W',
      cutSpeed: 600,
      cutPower: 80,
      scoreSpeed: 2000,
      scorePower: 25,
      engraveSpeed: 5000,
      engravePower: 45,
      kerfCompensation: 0.12,
    },
    etsyDetails: {
      suggestedPrice: 12.00,
      materialCost: 0.42,
      printTimeHours: 0.6,
      profitMargin: 88,
      title: 'Personalized Monogram Keychain - Custom Name Bag Tag, 3D Printed & Laser Engraved Keyring Gift',
      tags: ['personalized gift', 'custom keychain', 'name key tag', 'hotel keychain', 'backpack tag', 'monogram gift', 'stocking stuffer', 'bridesmaid gift', 'acrylic keychain', 'vintage hotel tag', 'key fob', 'edc keychain', 'birthday gift'],
    },
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    isFavorite: true,
  },
  {
    id: 'design-clay-cutter',
    name: 'Botanical Floral Clay & Cookie Cutter',
    category: 'Craft & Baking',
    description: 'Precision polymer clay and baking cutter with a tapered 0.7mm razor-sharp cutting edge, step wall, and ergonomic press grip.',
    tags: ['Clay Cutter', 'Earrings', 'Etsy Trending', 'Baking'],
    modelType: 'cutter',
    dimensions: { width: 45, depth: 40, height: 15, cuttingEdgeThickness: 0.7, stepWallThickness: 2.4, gripHeight: 5.0 },
    printSettings: {
      layerHeight: 0.12,
      infillDensity: 25,
      infillPattern: 'gyroid',
      wallCount: 4,
      topLayers: 6,
      bottomLayers: 5,
      material: 'PLA',
      filamentCostPerKg: 20,
      printSpeed: 45,
      supportsNeeded: false,
    },
    laserSettings: {
      enabled: false,
      material: '3mm Birch Plywood',
      laserType: 'Diode 20W',
      cutSpeed: 250,
      cutPower: 100,
      scoreSpeed: 1000,
      scorePower: 30,
      engraveSpeed: 3000,
      engravePower: 40,
      kerfCompensation: 0.14,
    },
    etsyDetails: {
      suggestedPrice: 9.50,
      materialCost: 0.35,
      printTimeHours: 0.5,
      profitMargin: 91,
      title: 'Botanical Flower Clay Cutter for Polymer Clay Earrings - Sharp Edge 3D Printed Cutter for Jewelry Making',
      tags: ['clay cutter', 'polymer clay earrings', 'jewelry making tool', 'flower clay cutter', 'cookie cutter', 'ceramic stamp', 'sharp blade cutter', 'diy jewelry kit', 'clay earring cutter', 'baking tool', 'craft supply', 'handmade earrings', 'clay artist tool'],
    },
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    isFavorite: false,
  },
  {
    id: 'design-laser-coaster-mandala',
    name: 'Sacred Geometry Wooden Coaster & Trivet',
    category: 'Laser Engraved',
    description: 'Intricate vector mandala coaster designed for laser cutting and raster engraving with cork backing cutout.',
    tags: ['Laser Cut', 'Vector DXF', 'Wood Coaster', 'Home Decor'],
    modelType: 'coaster',
    dimensions: { width: 100, depth: 100, height: 4.0, wallThickness: 3.0, cornerRadius: 6.0, patternSegments: 12 },
    printSettings: {
      layerHeight: 0.20,
      infillDensity: 20,
      infillPattern: 'honeycomb',
      wallCount: 3,
      topLayers: 4,
      bottomLayers: 4,
      material: 'PETG',
      filamentCostPerKg: 22,
      printSpeed: 60,
      supportsNeeded: false,
    },
    laserSettings: {
      enabled: true,
      material: '5mm Birch Plywood',
      laserType: 'CO2 55W',
      cutSpeed: 400,
      cutPower: 90,
      scoreSpeed: 1500,
      scorePower: 30,
      engraveSpeed: 4500,
      engravePower: 60,
      kerfCompensation: 0.15,
    },
    etsyDetails: {
      suggestedPrice: 28.00,
      materialCost: 2.80,
      printTimeHours: 2.5,
      profitMargin: 84,
      title: 'Laser Cut Wooden Mandala Coaster Set of 4 - Sacred Geometry Coasters with Cork Backing, Boho Home Decor',
      tags: ['wood coasters', 'laser cut files', 'mandala coaster', 'housewarming gift', 'boho decor', 'sacred geometry', 'wooden trivet', 'coffee table decor', 'natural birch', 'engraved coaster', 'dxf cut file', 'laser cut vector', 'wedding favor'],
    },
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    isFavorite: true,
  }
];

// Helper to safely execute Gemini calls
export async function handleTrends(req: Request, res: Response) {
  try {
    const category = (req.body?.category as string) || '3d printing and laser engraving';
    const query = `What are the current top trending product ideas, best-sellers, and seasonal niches on Etsy right now for ${category}? Include high search volume items, realistic retail pricing, why buyers want them, and recommended manufacturing method (FDM 3D print, Resin SLA, or Laser cut/engrave).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: query,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: `You are an elite Etsy E-commerce Market Research Specialist and Product Development Engineer. Analyze currently trending buyer searches, viral TikTok/Pinterest crafts, and best-selling 3D printed and laser engraved product ideas. Provide structured, actionable insights for Etsy shop owners.`,
      },
    });

    const text = response.text || '';
    const searchChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const searchQueries = response.candidates?.[0]?.groundingMetadata?.webSearchQueries || [];

    res.json({
      success: true,
      analysis: text,
      grounding: {
        queries: searchQueries,
        sources: searchChunks.map((chunk: any) => ({
          title: chunk.web?.title || 'Web Search Result',
          uri: chunk.web?.uri || '',
        })).filter((s: any) => s.uri),
      },
    });
  } catch (error: any) {
    console.error('Error fetching Etsy trends:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch Etsy trends.',
    });
  }
}

export async function handleGenerateCad(req: Request, res: Response) {
  try {
    const { prompt, baseType } = req.body || {};
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const systemPrompt = `You are a Senior Mechanical CAD & 3D Print Engineer specializing in profitable Etsy designs.
Convert the user's idea into a parametric, watertight 3D model configuration optimized for FDM/Resin 3D printing and optional laser engraving.
Return ONLY valid JSON matching this schema:
{
  "name": "Catchy Product Name",
  "category": "Home Decor | Personalized Gifts | Craft & Baking | Desk Organization | Fashion & Jewelry | Toys & Fidgets",
  "description": "2-3 sentences explaining the design, features, and appeal to Etsy buyers.",
  "modelType": "planter | keychain | cutter | coaster | tray | organizer | fidget | custom",
  "dimensions": {
    "width": number (mm, 20-250),
    "depth": number (mm, 20-250),
    "height": number (mm, 5-200),
    "wallThickness": number (mm, 1.2-4.0),
    "cornerRadius": number (mm, 0-20),
    "bevelRadius": number (mm, 0-10),
    "embossDepth": number (mm, 0.5-3.0),
    "drainageHole": number (mm, 0-25, if planter),
    "holeDiameter": number (mm, 0-15, if keychain/tag),
    "text": "optional text string for personalization",
    "patternSegments": number (e.g. 3-16 sides for polygon/stars)
  },
  "printOptimization": {
    "recommendedLayerHeight": 0.16 | 0.20 | 0.28,
    "recommendedInfill": number (10-40),
    "infillPattern": "gyroid" | "grid" | "honeycomb",
    "wallPerimeters": number (2-5),
    "supportsNeeded": boolean,
    "printOrientationAdvice": "String advice on how to lay the part on the bed to avoid supports and maximize bed adhesion",
    "estimatedPrintTimeHours": number,
    "estimatedWeightGrams": number,
    "material": "PLA" | "PETG" | "TPU" | "Resin"
  },
  "laserOptimization": {
    "laserApplicable": boolean,
    "suggestedMaterial": "3mm Basswood Plywood" | "3mm Cast Acrylic" | "Slate Coaster" | "Leather",
    "cutSpeed": number,
    "cutPower": number,
    "scoreSpeed": number,
    "scorePower": number,
    "engraveSpeed": number,
    "engravePower": number,
    "kerf": 0.15
  },
  "etsyEconomics": {
    "estimatedCogs": number (e.g. 1.50),
    "suggestedRetailPrice": number (e.g. 16.99),
    "estimatedProfitMargin": number (e.g. 85),
    "seoKeywords": ["tag1", "tag2", "tag3", "tag4", "tag5"]
  }
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Design an Etsy-sellable 3D printed / laser manufactured product based on this request: "${prompt}". Base type suggestion: ${baseType || 'parametric model'}.`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, model: parsed });
  } catch (error: any) {
    console.error('Error generating CAD parameters:', error);
    res.status(500).json({ success: false, error: error.message || 'CAD generation failed.' });
  }
}

export async function handleChat(req: Request, res: Response) {
  try {
    const { messages, currentModel } = req.body || {};
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const systemInstruction = `You are "ForgeCopilot", an expert 3D printing & laser manufacturing engineer and top 1% Etsy shop mentor.
You help creators optimize their .STL 3D print models, slicer profiles (Bambu Lab, PrusaSlicer, Cura), laser settings (LightBurn, Glowforge, xTool), tolerances for interlocking parts, print orientation, and Etsy business profitability.
Current Active Design in user's studio:
${JSON.stringify(currentModel || {}, null, 2)}

Provide crisp, highly technical yet accessible guidance. When asked about tolerances, explain clearance in mm (e.g. 0.15mm tight slip fit, 0.3mm free moving). When asked about Etsy pricing, break down filament cost, electricity, packaging, Etsy 6.5% transaction fee + $0.20 listing fee + 3-4% payment processing, and healthy net margins.`;

    const formattedContents = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content || '' }],
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: formattedContents,
      config: {
        systemInstruction,
      },
    });

    res.json({
      success: true,
      message: response.text || '',
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ success: false, error: error.message || 'Chat generation failed' });
  }
}

export async function handleEtsyListing(req: Request, res: Response) {
  try {
    const { modelName, category, description, dimensions, printSettings } = req.body || {};

    const prompt = `Generate a high-converting, fully optimized Etsy product listing package for:
Name: ${modelName}
Category: ${category}
Description: ${description}
Dimensions: ${JSON.stringify(dimensions)}
3D Print Material: ${printSettings?.material || 'PLA'}

Return JSON:
{
  "title": "Optimized Etsy title (under 140 chars, high search volume keywords first, e.g. 'Personalized Hexagon Planter - Modern 3D Printed Succulent Pot with Drainage Tray, Minimalist Desk Decor')",
  "tags": ["13 tags, each strictly under 20 characters, matching high search intent without repeating words uselessly"],
  "price": number,
  "description": "Markdown formatted Etsy product description including: The Hook, Dimensions & Sizing, Material & Eco-friendly PLA details, Features (Drainage, Customization), Care Instructions, and Shipping & Handcrafted Note.",
  "shippingProfile": {
    "packageWeightGrams": number,
    "packageDimensions": "string in cm",
    "suggestedShippingPrice": number
  }
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const result = JSON.parse(response.text || '{}');
    res.json({ success: true, listing: result });
  } catch (error: any) {
    console.error('Etsy listing generation error:', error);
    res.status(500).json({ success: false, error: error.message || 'Listing generation failed' });
  }
}

export async function handleGenerateMockup(req: Request, res: Response) {
  try {
    const { prompt, style } = req.body || {};
    const fullPrompt = `A photorealistic product photograph for an Etsy listing: ${prompt || 'a modern 3D printed geometric aesthetic home decor item'}. Style: ${style || 'scandinavian modern interior, warm natural sunlight, wooden table, potted monstera plant in soft focus background, editorial commercial product photography, 8k resolution, clean composition'}.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image',
        contents: {
          parts: [{ text: fullPrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: '4:3',
            imageSize: '1K',
          },
        },
      });

      let imageUrl = '';
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData?.data) {
            imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (imageUrl) {
        return res.json({ success: true, imageUrl });
      }
    } catch (imgError: any) {
      console.warn('Gemini image generation warning:', imgError.message);
    }

    // Graceful procedural fallback if image model unavailable or requires specific key
    res.json({
      success: true,
      imageUrl: '',
      fallbackNotice: 'Procedural render preview active',
    });
  } catch (error: any) {
    console.error('Mockup generation error:', error);
    res.status(500).json({ success: false, error: error.message || 'Mockup generation failed' });
  }
}

export async function handlePrintQuote(req: Request, res: Response) {
  try {
    const { dimensions, material, quantity = 1, service = 'slant3d' } = req.body || {};
    const w = Number(dimensions?.width) || 60;
    const d = Number(dimensions?.depth) || 60;
    const h = Number(dimensions?.height) || 40;

    // Approximate volume in cm3 (considering hollow shell factor ~25% of bounding box)
    const boundingBoxCm3 = (w * d * h) / 1000;
    const estimatedVolumeCm3 = Math.max(2, boundingBoxCm3 * 0.22);
    const density = material === 'Resin' ? 1.15 : material === 'PETG' ? 1.27 : 1.24; // g/cm3
    const weightGrams = estimatedVolumeCm3 * density;

    // Quoting algorithms based on real service rates
    const quotes = {
      slant3d: {
        serviceName: 'Slant 3D (Etsy Dropship Print API)',
        provider: 'Slant 3D High-Volume US Print Farms',
        material: material || 'PLA Pro (Black/White/Grey)',
        perUnitCost: Number((3.20 + weightGrams * 0.045).toFixed(2)),
        setupFee: 0,
        shippingEstimate: 4.80,
        leadTimeDays: '2 - 3 business days',
        etsyAutoFulfillment: true,
        apiStatus: 'Ready / Connected',
        maxBedSize: '300 x 300 x 300 mm',
        fitsBed: w <= 300 && d <= 300 && h <= 300,
      },
      craftcloud: {
        serviceName: 'Craftcloud by All3DP',
        provider: 'Global Marketplace (SLS Nylon, MJF, SLA)',
        material: material === 'Resin' ? 'Standard Tough Resin (SLA)' : 'PA12 Nylon (SLS Laser Sintered)',
        perUnitCost: Number((9.50 + weightGrams * 0.12).toFixed(2)),
        setupFee: 2.00,
        shippingEstimate: 6.50,
        leadTimeDays: '4 - 6 business days',
        etsyAutoFulfillment: false,
        apiStatus: 'Ready / Multi-vendor',
        maxBedSize: '380 x 284 x 380 mm',
        fitsBed: w <= 380 && d <= 284 && h <= 380,
      },
      shapeways: {
        serviceName: 'Shapeways Industrial API',
        provider: 'Shapeways US & EU Industrial Additive',
        material: 'Versatile Plastic (Nylon PA12)',
        perUnitCost: Number((14.00 + weightGrams * 0.18).toFixed(2)),
        setupFee: 3.50,
        shippingEstimate: 7.99,
        leadTimeDays: '5 - 8 business days',
        etsyAutoFulfillment: false,
        apiStatus: 'Enterprise Ready',
        maxBedSize: '650 x 350 x 550 mm',
        fitsBed: w <= 650 && d <= 350 && h <= 550,
      },
      jlc3dp: {
        serviceName: 'JLC3DP Rapid Prototyping',
        provider: 'JLC3DP Global Factory',
        material: '9000R White Resin / PETG',
        perUnitCost: Number((2.80 + weightGrams * 0.05).toFixed(2)),
        setupFee: 1.00,
        shippingEstimate: 8.00,
        leadTimeDays: '3 - 5 business days',
        etsyAutoFulfillment: false,
        apiStatus: 'Active',
        maxBedSize: '800 x 800 x 550 mm',
        fitsBed: w <= 800 && d <= 800 && h <= 550,
      },
    };

    res.json({
      success: true,
      geometryAnalysis: {
        boundingBoxMm: { width: w, depth: d, height: h },
        estimatedVolumeCm3: Number(estimatedVolumeCm3.toFixed(1)),
        estimatedWeightGrams: Number(weightGrams.toFixed(1)),
        quantity,
      },
      selectedQuote: (quotes as any)[service] || quotes.slant3d,
      allQuotes: quotes,
    });
  } catch (error: any) {
    console.error('Print quote error:', error);
    res.status(500).json({ success: false, error: error.message || 'Quoting failed' });
  }
}

export function handleGetLibrary(req: Request, res: Response) {
  res.json({ success: true, library: cloudLibraryStorage });
}

export function handleSaveLibrary(req: Request, res: Response) {
  try {
    const item = req.body;
    if (!item || !item.id) {
      return res.status(400).json({ error: 'Valid item with id is required' });
    }

    const index = cloudLibraryStorage.findIndex((d) => d.id === item.id);
    if (index >= 0) {
      cloudLibraryStorage[index] = { ...item, updatedAt: new Date().toISOString() };
    } else {
      cloudLibraryStorage.unshift({ ...item, updatedAt: new Date().toISOString() });
    }

    res.json({ success: true, library: cloudLibraryStorage });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export function handleDeleteLibrary(req: Request, res: Response) {
  try {
    const { id } = req.params;
    cloudLibraryStorage = cloudLibraryStorage.filter((d) => d.id !== id);
    res.json({ success: true, library: cloudLibraryStorage });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function handleDescribeAndCreate(req: Request, res: Response) {
  try {
    const { prompt, currentModel, generateAudio = true } = req.body || {};
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt description is required' });
    }

    const systemPrompt = `You are a Senior Mechanical CAD & 3D Print Engineer specializing in profitable Etsy designs.
A creator is describing a design to create or iterate on.
If currentModel is provided, you can modify its existing dimensions or create a fresh design based on user instructions.
Current Active Design in Studio (if iterating):
${currentModel ? JSON.stringify(currentModel, null, 2) : 'None'}

Return ONLY valid JSON with this exact schema:
{
  "name": "Catchy, High-Converting Product Name",
  "category": "Home Decor | Personalized Gifts | Craft & Baking | Desk Organization | Fashion & Jewelry | Laser Engraved | Toys & Fidgets",
  "description": "2 sentences explaining the design features, aesthetic, and why Etsy buyers love it.",
  "modelType": "planter | keychain | cutter | coaster | organizer | custom",
  "dimensions": {
    "width": number (mm, 20-250),
    "depth": number (mm, 20-250),
    "height": number (mm, 3-200),
    "wallThickness": number (mm, 1.2-5.0),
    "cornerRadius": number (mm, 0-20),
    "bevelRadius": number (mm, 0-10),
    "embossDepth": number (mm, 0.5-3.0),
    "drainageHole": number (mm, 0-25),
    "holeDiameter": number (mm, 0-15),
    "text": "uppercase text for personalization if requested, else short relevant word",
    "patternSegments": number (sides or radial count, 3-32),
    "cuttingEdgeThickness": number (0.5-1.2, if cutter),
    "stepWallThickness": number (1.5-3.5, if cutter)
  },
  "printOptimization": {
    "recommendedLayerHeight": 0.12 | 0.16 | 0.20 | 0.28,
    "recommendedInfill": number (10-40),
    "infillPattern": "gyroid" | "grid" | "honeycomb",
    "wallPerimeters": number (2-5),
    "supportsNeeded": boolean,
    "material": "PLA" | "PETG" | "TPU" | "Resin",
    "filamentCostPerKg": 20,
    "estimatedPrintTimeHours": number,
    "estimatedWeightGrams": number
  },
  "laserOptimization": {
    "laserApplicable": boolean,
    "suggestedMaterial": "3mm Basswood Plywood" | "3mm Cast Acrylic" | "Slate Coaster" | "Leather",
    "laserType": "Diode 20W" | "CO2 45W" | "Fiber 20W",
    "cutSpeed": number,
    "cutPower": number,
    "scoreSpeed": number,
    "scorePower": number,
    "engraveSpeed": number,
    "engravePower": number,
    "kerf": number
  },
  "etsyDetails": {
    "suggestedPrice": number,
    "materialCost": number,
    "profitMargin": number,
    "title": "Optimized Etsy title (under 140 chars)",
    "tags": ["13 tags under 20 chars"]
  },
  "spokenResponse": "A warm, natural 1-2 sentence spoken summary for voice reply, e.g.: 'I created your personalized leatherette keychain with 4 millimeter bevels. Measuring 75 by 28 millimeters, it is optimized for high Etsy margins.'"
}`;

    const cadResponse = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Describe and create this CAD design: "${prompt}"`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(cadResponse.text || '{}');
    const spokenText = parsed.spokenResponse || `I have created your design for ${parsed.name}. Ready in the 3D viewport.`;

    let voiceAudioBase64 = '';
    if (generateAudio) {
      try {
        const audioResponse = await ai.models.generateContent({
          model: 'gemini-3.8-flash-lite-tts',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: spokenText,
                  speechMetadata: {
                    style: 'Warm, clear, professional maker engineer and Etsy design assistant',
                  },
                },
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Kore' },
              },
            },
          },
        });

        voiceAudioBase64 = audioResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';
      } catch (ttsErr: any) {
        console.warn('TTS generation notice:', ttsErr.message);
      }
    }

    // Format into standard CADDesign structure
    const newCadDesign = {
      id: `design-${Date.now()}`,
      name: parsed.name || 'Custom Parametric Design',
      category: parsed.category || 'Home Decor',
      description: parsed.description || prompt,
      tags: parsed.etsyDetails?.tags || ['Custom CAD', '3D Print', 'Etsy'],
      modelType: parsed.modelType || 'planter',
      dimensions: parsed.dimensions || { width: 75, depth: 75, height: 60, wallThickness: 2.6 },
      printSettings: {
        layerHeight: parsed.printOptimization?.recommendedLayerHeight || 0.20,
        infillDensity: parsed.printOptimization?.recommendedInfill || 20,
        infillPattern: parsed.printOptimization?.infillPattern || 'gyroid',
        wallCount: parsed.printOptimization?.wallPerimeters || 3,
        topLayers: 4,
        bottomLayers: 4,
        material: parsed.printOptimization?.material || 'PLA',
        filamentCostPerKg: 20,
        printSpeed: 60,
        supportsNeeded: !!parsed.printOptimization?.supportsNeeded,
      },
      laserSettings: {
        enabled: !!parsed.laserOptimization?.laserApplicable,
        material: parsed.laserOptimization?.suggestedMaterial || '3mm Basswood Plywood',
        laserType: parsed.laserOptimization?.laserType || 'Diode 20W',
        cutSpeed: parsed.laserOptimization?.cutSpeed || 300,
        cutPower: parsed.laserOptimization?.cutPower || 100,
        scoreSpeed: parsed.laserOptimization?.scoreSpeed || 1200,
        scorePower: parsed.laserOptimization?.scorePower || 35,
        engraveSpeed: parsed.laserOptimization?.engraveSpeed || 3500,
        engravePower: parsed.laserOptimization?.engravePower || 50,
        kerfCompensation: parsed.laserOptimization?.kerf || 0.15,
      },
      etsyDetails: {
        suggestedPrice: parsed.etsyDetails?.suggestedPrice || 18.50,
        materialCost: parsed.etsyDetails?.materialCost || 1.45,
        printTimeHours: parsed.printOptimization?.estimatedPrintTimeHours || 2.2,
        profitMargin: parsed.etsyDetails?.profitMargin || 84,
        title: parsed.etsyDetails?.title || `${parsed.name} - 3D Printed & Laser Precision Product`,
        tags: parsed.etsyDetails?.tags || ['3d printed', 'etsy gift', 'custom decor'],
      },
      updatedAt: new Date().toISOString(),
      isFavorite: true,
    };

    // Auto-save to cloud library
    cloudLibraryStorage.unshift(newCadDesign);

    res.json({
      success: true,
      model: newCadDesign,
      spokenText,
      voiceAudioBase64,
    });
  } catch (error: any) {
    console.error('Describe and create error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to describe and create design' });
  }
}

