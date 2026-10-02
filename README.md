# ForgeCraft Studio 🛠️✨
### AI 3D Print & Laser CAD for Etsy Creators

ForgeCraft Studio is a parametric 3D CAD generator and precision vector manufacturing suite tailored specifically for Etsy makers and digital fabrication sellers. It turns natural language ideas into watertight `.STL` 3D printable models, multi-layer laser cutting vector files (`.SVG`, `.DXF`), and optimized Etsy product listings.

---

## 🚀 Key Features

### 1. Parametric 3D Model Generation (.STL)
- **Etsy Bestseller Templates:**
  - **Geometric Planters:** Parametric polygons (3–16 sides, twist options), watertight wall thickness, internal drainage channels, and snap-fit saucer trays.
  - **Personalized Keychains:** Dual-layer relief lettering, reinforced lanyard rings, and corner beveling.
  - **Polymer Clay & Cookie Cutters:** 0.7mm sharp cutting knife edges, stepped reinforcement frame, and ergonomic finger press grips.
  - **Laser Mandala Coasters:** Intricate radial fretwork with recessed cork backing pocket.
  - **Gridfinity Desk Organizers:** Stacking lips, interior compartment dividers, and smooth scooping corners.
  - **Sculptural Vases:** Procedural lofted and fluted geometric home decor.
- **Export Standards:** Direct download of official binary `.STL` (compact and compatible with Bambu Studio, PrusaSlicer, Cura, OrcaSlicer, Lychee) and ASCII text `.STL`.
- **Viewport Hovering 'Quick Export' Button:** A floating one-click action button on the 3D canvas that dynamically adapts to the current workbench:
  - **Slicer / Dimensions Workspace:** Triggers an instant one-click download of binary `.STL` (Bambu Studio & Prusa ready).
  - **Laser & Vector Workspace:** Triggers an instant one-click download of layered `.SVG` (LightBurn, Glowforge, and xTool ready).
  - Provides active visual confirmation (`Downloaded! ✓`) without needing to navigate dropdown menus.

### 2. "Describe a Design & Create It" (Voice & Text CAD)
- **Natural Language Input:** Type or speak any product idea (e.g. *"A modern 8-sided faceted succulent planter, 85mm wide with drainage hole and matching drip tray"*).
- **Gemini Parametric Conversion:** Powered by `gemini-3.5-flash` to extract calibrated millimeter dimensions, wall thickness, bevel radii, relief depths, and slicer profiles.
- **Gemini Live Spoken Audio Feedback:** Synthesizes spoken voice confirmation using `gemini-3.8-flash-lite-tts`, explaining dimensions, manufacturing recommendations, and estimated retail price.
- **Interactive Copilot Chat (`ForgeCopilot`):** In-studio AI engineer supporting conversational model mutations (e.g. *"make it 15mm taller"* or *"change the text to EMMA"*).

### 3. Material Weight Estimator & Recharts Print Optimizer
- **Live Gram Weight Calculation:** Computes part weight in grams using physical volume integration:
  $$\text{Part Weight (g)} = \text{Total Displaced Volume } (\text{cm}^3) \times \text{Material Density } (\text{g/cm}^3)$$
- **Material Density Comparison:** Real-time side-by-side weight comparisons:
  - **PLA / PLA Pro:** $1.24\text{ g/cm}^3$ (Standard eco-friendly filament)
  - **PETG Tough:** $1.27\text{ g/cm}^3$ ($+2.4\%$ heavier than PLA)
  - **ABS / ASA:** $1.05\text{ g/cm}^3$ ($-15.3\%$ lighter than PLA)
  - **TPU 95A:** $1.21\text{ g/cm}^3$ (Flexible impact elastomer)
  - **SLA Resin:** $1.15\text{ g/cm}^3$ (High-detail photopolymer)
- **Animated Recharts Production & Cost Visualizer:**
  - **Reactive Entrance Animations:** Bars smoothly animate upward from the baseline with an `ease-out` curve whenever print settings (layer height, infill %, wall loops, spool cost, batch multiplier) are updated.
  - **Comprehensive Resource Breakdown:**
    - **Material Usage** (Blue): Raw filament/resin cost calculated from total grams and spool price per kg.
    - **Energy Costs** (Amber): 3D printer electricity consumption calculated from print time and power draw ($\sim120\text{W}$ at $\$0.15/\text{kWh}$).
    - **Service Fees** (Pink): Marketplace transaction fees ($6.5\%$), payment processing ($3\% + \$0.20$), and packaging/shipping mailers.
    - **Net Profit** (Emerald): Take-home maker profit margin.
  - **Interactive Tooltip:** Hover inspection showing exact dollar amounts, metric units (grams, kWh), and percentage of retail revenue.
  - **Batch Multiplier Selector:** Live toggle between 1x, 5x, 10x, and 25x units to simulate wholesale runs.
- **Physical Printability & Structural Pre-Flight Check:**
  - **Downside Face Normal Analysis:** Scans 3D mesh triangles for steep downward overhang angles ($>45^\circ$). Warns when underside overhangs lack slicer supports.
  - **Thin Wall Detection:** Validates physical wall thickness against standard $0.4\text{mm}$ nozzle perimeters ($<0.8\text{mm}$ critical delamination risk; $<1.2\text{mm}$ fragility warning).
  - **Aspect Ratio & Bed Adhesion:** Flags tall, slender parts ($>2.8:1$ height-to-width ratio) prone to print-bed detachment or upper-layer wobbling.
  - **Interactive Warning Toast Notification:** Pops up on detected structural risks with severity indicators (Critical / Warning), issue explanation, and **1-Click Auto-Fix** buttons to instantly apply safe parameters.
- **1kg Spool Yield:** Calculates exact number of finished parts producible from a single $1\text{kg}$ ($1000\text{g}$) spool for batch planning.

### 4. Version History & Cloud Checkpoints
- **Non-Destructive History:** Stores a chronological history of every design checkpoint with exact dimensions, slicer settings, laser parameters, and Etsy metadata.
- **1-Click Revert:** Rollback to any prior state directly into the 3D viewport with automated pre-reversion backups.
- **Side-by-Side Diff Inspector:** Compare any historical checkpoint against the current live model (dimensions, weight, material, price).
- **Manual Checkpoints:** Save named snapshots (e.g. *"Client Approved V2"*, *"Thick Wall Prototype"*).
- **Bulk Multi-Select ZIP Archive:** Select multiple models from the Cloud Library to generate and download a single consolidated `.ZIP` bundle (powered by JSZip) containing:
  - High-precision binary `.STL` files (Bambu Lab, Prusa, Cura, Orca ready)
  - Color-coded laser cutting & engraving `.SVG` vector files (Cut, Score, Engrave)
  - AutoCAD `.DXF` vectors for CNC routing
  - Manufacturing specification sheets (`_specs.txt`) with exact infill, temperatures, and Etsy SEO tags
  - Interactive compression progress indicator and batch manifest (`README_BATCH_EXPORT.txt`)

### 5. Laser Engraving & Vector Studio
- **Industry Layer Color Standards:**
  - **Cut Line:** Red (`#FF0000`) through-cut vector path.
  - **Score Line:** Blue (`#0000FF`) surface line marking.
  - **Raster Engrave:** Black (`#000000`) filled surface text and graphics.
- **Kerf Offset Compensation:** Adjustable beam width offset ($0.00 - 0.30\text{mm}$) for snug press-fit inlays and box joints.
- **Calibrated Machine & Material Presets:** Tuned for Diode (10W/20W/40W), $\text{CO}_2$ (45W/55W), and Fiber (20W) lasers on Basswood, Birch Plywood, Cast Acrylic, Leather, Slate, and Anodized Aluminum.
- **Precision Vector Exports:** Download layered `.SVG` (LightBurn / Glowforge / xTool ready), AutoCAD `.DXF`, and printable HTML manufacturing specification sheets.

### 6. Direct Print & Dropship API Integration
- Integrated quoting and automated fulfillment hub for:
  - **Slant 3D:** Official Etsy print-on-demand dropship partner for automated US print farm fulfillment.
  - **Craftcloud by All3DP:** Global marketplace across 150+ industrial materials (SLS Nylon, MJF, Metal).
  - **Shapeways API:** Enterprise high-precision additive and metal casting.
  - **JLC3DP Factory:** Rapid prototyping resin and FDM manufacturing.
- Automated pre-flight checks (bed volume fitment, wall thickness safety) and order dispatch simulation with live tracking numbers.

### 7. Etsy Market Intelligence Trend Radar & SEO Studio
- **Google Search Grounding:** Powered by `gemini-3.5-flash` with Google Search Grounding to identify live trending keywords, buyer demand triggers, and retail price sweet spots.
- **SEO Listing Package:** Generates optimized titles (under 140 chars), 13 high-volume search tags, formatted markdown descriptions, and lifestyle photo mockups.

### 8. Interactive Onboarding Tour
- **Step-by-Step Tooltip Walkthrough:** Highlights key operational areas for new makers:
  1. **Interactive 3D CAD Canvas:** Orbit, pan, zoom, wireframe, slice plane, and viewcube controls.
  2. **Parametric Dimensions Studio:** Dynamic millimeter adjustments, custom walls, and drainage holes.
  3. **3D Slicer & Profit Optimizer:** Material densities (PLA, PETG, ABS, TPU, Resin) and animated Recharts breakdown.
  4. **Laser Cutting & Engraving Studio:** Kerf offset settings and multi-layer vector export (Cut, Score, Engrave).
  5. **Export & Bulk ZIP Archive:** Direct downloads and batch-packaging workflows.
- **Smart Target Spotlight:** Dims the surrounding interface with a high-contrast glowing spotlight and position-aware tooltips.
- **Seamless Tab Switching:** Automatically switches between Dimensions, Slicer, and Laser tabs to reveal corresponding controls during each step.
- **Persistent Progress:** Remembers completion state via `localStorage` with a persistent **"Tour"** button in the header bar for anytime replay.

---

## 🔐 Environment Variables & Security

All sensitive credentials and API keys are stored server-side in `.env` and are strictly ignored by Git via `.gitignore`. The browser client never touches private keys directly.

### Required & Optional Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Required | Description |
| :--- | :---: | :--- |
| `GEMINI_API_KEY` | **Yes** | Google Gemini API Key for CAD generation, search grounding, and voice TTS. In Google AI Studio, this is automatically injected via the Secrets panel. |
| `APP_URL` | Optional | Host URL of the application (default: `http://localhost:3000`). |
| `SLANT3D_API_KEY` | Optional | API Key for Slant 3D print-on-demand dropship fulfillment. |
| `CRAFTCLOUD_API_KEY`| Optional | API Key for Craftcloud / All3DP quoting service. |
| `SHAPEWAYS_API_KEY` | Optional | API Key for Shapeways enterprise manufacturing. |
| `JLC3DP_API_KEY` | Optional | API Key for JLC3DP rapid prototyping service. |

> **Security Note:** The `.env` file is listed in `.gitignore` to prevent any keys or secrets from being committed to source control.

---

## 💻 Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Motion
- **Data Visualization:** Recharts (Bar charts with animated reactive keying, custom tooltips, responsive containers)
- **Client-Side Compression:** JSZip (DEFLATE compression for multi-model STL/SVG/DXF batch archives)
- **3D Graphics & CAD:** Three.js (WebGL rendering, OrbitControls, clipping planes, binary STL & ASCII exporters)
- **AI & Grounding:** `@google/genai` TypeScript SDK:
  - `gemini-3.5-flash` for parametric CAD generation and Search Grounding
  - `gemini-3.8-flash-lite-tts` for natural voice audio synthesis
  - `gemini-3.1-flash-image` for product photo mockup generation
- **Backend & Server:** Node.js, Express, Vite middleware

---

## 🛠️ Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create a `.env` file with your Gemini API key:
```bash
echo 'GEMINI_API_KEY="your-gemini-api-key-here"' > .env
```

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 📄 License
MIT License. Built for Etsy makers and 3D printing creators.
