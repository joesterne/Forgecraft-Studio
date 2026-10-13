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
- **Export Standards:** Direct download of official binary `.STL` (compact and compatible with Bambu Studio, PrusaSlicer, Cura, OrcaSlicer, Lychee), ASCII text `.STL`, Bambu Studio `.3MF`, and laser/CNC vectors (`.SVG`, `.DXF`).
- **1-Click Share & Copy Buttons:** Every export option includes dedicated **"Copy download link"** (shareable deep link for remote teammates) and **"Copy file path"** (calibrated for OctoPrint, Klipper, or SD card printer queues) buttons.
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
- **Print Cost Calculator (Material Density × Filament Price + Hourly Machine Labor):**
  - **Dynamic Cost Engine:** Directly multiplies estimated part weight in grams (calculated using true physical material density: PLA $1.24\text{ g/cm}^3$, PETG $1.27\text{ g/cm}^3$, ABS $1.05\text{ g/cm}^3$, TPU $1.21\text{ g/cm}^3$, Resin $1.15\text{ g/cm}^3$) by a user-defined filament price per kg ($\$5 - \$250/\text{kg}$).
  - **Configurable Machine Labor Rate:** Dynamically computes total machine run cost by multiplying print hours by a configurable hourly machine labor rate ($\$0.00 - \$35.00/\text{hr}$ with quick presets for Hobby $\$0/\text{hr}$, Print Farm $\$1.50/\text{hr}$, Prosumer $\$3.00/\text{hr}$, and Commercial Shop $\$6.00/\text{hr}$).
  - **Interactive Formula Banner:** Displays live mathematical breakdown: $[ (\text{Weight}/1000) \times \$_{\text{kg}} ] + [ \text{Hours} \times \$_{\text{hr}} ] + \text{Power} = \text{Unit Cost}$.
  - **Batch Production Scaling:** Simulates multi-unit farm runs ($1\times, 5\times, 10\times, 25\times, 50\times$) with total batch material, total machine time, total COGS, and targeted retail profit margins.
- **Animated Recharts Production & Cost Visualizer:**
  - **Reactive Entrance Animations:** Bars smoothly animate upward from the baseline with an `ease-out` curve whenever print settings (layer height, infill %, wall loops, spool cost, labor rate, batch multiplier) are updated.
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
- **Team Collaboration & Iteration Notes System:**
  - **Categorized Threads:** Leave notes tagged as **Iteration Log** (🔄), **Production & Slicing** (⚙️), **QA & Print Test** (✅), **Client Feedback** (💬), or **General Team Note** (📝).
  - **Role Profiles:** Tag authors by team role (`Maker`, `Designer`, `Print Tech`, `Shop Manager`, `Client`) with color-coded badges and avatars.
  - **Version Stamping:** Automatically stamps notes with the active design revision (e.g., `v1`, `v2`, `v3`) to maintain an audit trail across geometric modifications.
  - **Pin to Top & Resolution Tracking:** Pin high-priority maker warnings or mark action items as resolved.
  - **Cloud Library Badges:** Cards display live note counts, open action item counters, and prominent preview callouts for pinned team directives.
  - **Quick Starter Templates:** 1-click templates for print test logs, wall adjustments, tolerance warnings, and Etsy buyer requests.
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

### 8. Bambu Lab Studio & AMS 4-Color Integration
- **Native `.3MF` Project Engine:** Generates official multi-file Bambu Studio and OrcaSlicer `.3mf` archives including:
  - 3D model XML geometry centered dynamically for the target printer's build volume.
  - Multi-material color group metadata mapping the model to the active AMS slot.
  - `Metadata/BambuStudio.json` with slicer parameters, nozzle diameter, and bed coordinates.
  - `Metadata/model_settings.config` and `Metadata/slice_info.config` pre-tuned for Bambu printers.
  - `Metadata/README_BAMBU.txt` containing step-by-step printing instructions.
- **Target Printer Fleet Profiles:**
  - **Bambu Lab X1-Carbon:** 256×256×256mm, 500mm/s, 20,000mm/s² accel, Micro LiDAR, heated chamber.
  - **Bambu Lab X1E:** 256×256×256mm, 320°C hotend, 60°C heated chamber, enterprise networking.
  - **Bambu Lab P1S:** 256×256×256mm, enclosed CoreXY, high-speed auxiliary cooling.
  - **Bambu Lab P1P:** 256×256×256mm, open frame CoreXY speed platform.
  - **Bambu Lab A1:** 256×256×256mm, full-size bed slinger with active noise cancelling and AMS Lite.
  - **Bambu Lab A1 mini:** 180×180×180mm, compact high-precision platform with quick-swap nozzles.
- **Bambu AMS Multi-Color Slot Manager:**
  - Configure 4 multi-material slots with Bambu filament profiles (PLA Basic, PLA Matte, Silk, Tough, PETG HF, PETG-CF, ABS, ASA, TPU 95A, and Support for PLA).
  - Visual color swatch palette with instant slot assignment and active toolhead selection.
  - Real-time 3D canvas viewport synchronization rendering the model in the active AMS filament color.
- **Build Plate & Nozzle Customization:**
  - Plate options: Gold Textured PEI, Smooth PEI / High Temp, Engineering, and Cool Plate.
  - Nozzle diameters: 0.2mm (fine detail / jewelry), 0.4mm (standard), 0.6mm (speed / composite), and 0.8mm (high flow).
  - Speed presets: Silent (50%), Standard (100%), Sport (124%), and Ludicrous (166%).
- **High-Speed Velocity Comparison:** Real-time production velocity calculator showing hours saved on Bambu CoreXY (~2.6× faster than traditional 60mm/s bed slingers).
- **Thermal & Volumetric Tuning:** Automatic hotend and bed temperature recommendations based on selected material and plate type.
- **Export Everywhere:** 1-Click `.3MF` downloads available in the header Export dropdown, 3D viewport quick export button, dedicated Bambu Lab Workbench tab, Slicer panel, and Cloud Library cards.

### 9. Interactive Onboarding Tour
- **Step-by-Step Tooltip Walkthrough:** Highlights key operational areas for new makers:
  1. **Interactive 3D CAD Canvas:** Orbit, pan, zoom, wireframe, slice plane, and viewcube controls.
  2. **Parametric Dimensions Studio:** Dynamic millimeter adjustments, custom walls, and drainage holes.
  3. **3D Slicer & Profit Optimizer:** Material densities (PLA, PETG, ABS, TPU, Resin) and animated Recharts breakdown.
  4. **Bambu Lab Studio:** Printer selection (X1C/P1S/A1), AMS multi-color slot manager, and native `.3MF` downloads.
  5. **Laser Cutting & Engraving Studio:** Kerf offset settings and multi-layer vector export (Cut, Score, Engrave).
  6. **Export & Bulk ZIP Archive:** Direct downloads and batch-packaging workflows.
- **Smart Target Spotlight:** Dims the surrounding interface with a high-contrast glowing spotlight and position-aware tooltips.
- **Seamless Tab Switching:** Automatically switches between Dimensions, Slicer, Bambu Lab, and Laser tabs to reveal corresponding controls during each step.
- **Persistent Progress:** Remembers completion state via `localStorage` with a persistent **"Tour"** button in the header bar for anytime replay.

### 10. AI Lifestyle Mockup Generator Studio
- **3D-to-Lifestyle Staging:** Transforms the live 3D parametric CAD design into commercial 4:3 product photography tailored for Etsy listing covers and social promotion.
- **Etsy Bestseller Scene Presets:**
  - **🪴 Nordic Oak Workspace:** Light Scandinavian desk, ceramic coffee cup, and sunny potted succulent.
  - **🌿 Sunlit Boho Living Room:** Reclaimed floating shelf, trailing ivy, terracotta pottery, and golden hour sun.
  - **📐 Artisan Maker Studio:** Architect cutting mat, stainless calipers, woodworking tools, and pastel filament spools.
  - **🛁 Modern Marble Vanity:** Polished white Carrara marble counter, eucalyptus sprigs, and luxury spa lighting.
  - **📦 Etsy Unboxing Flatlay:** Kraft paper shipping box, handwritten thank-you card, twine ribbon, and dried lavender.
  - **✨ Custom Creative Mode:** Text prompt editor allowing specialized staging and styling adjustments.
- **Photographic Lighting & Camera Angles:** Supports Golden Hour sunset, 5600K Studio Softbox, Bright Indirect Daylight, 45° Hero Perspectives, and Top-Down Flatlays.
- **3D Viewport Pose Blending:** Captures the live viewport angle and embeds the rendered 3D part directly into the staged scene.
- **One-Click Etsy Publishing:**
  - **Set as Main Listing Photo:** Automatically updates the design's `mockupUrl` and `thumbnailUrl` across the Cloud Library.
  - **Download 4:3 Image:** Instant export of high-resolution images ready for Etsy Seller Dashboard uploads.
  - **Direct Transition to SEO Studio:** Hands off the generated image to the Etsy SEO Listing package.

### 11. Export & Remote Share Hub (1-Click Download, Copy Link & Copy Path)
- **Unified Manufacturing Export Menu:**
  - High-precision export formats accessible directly from the header navigation bar:
    1. **Bambu Studio (`.3MF`):** Native multi-file project archive with tuned AMS 4-color profile.
    2. **Standard `.STL` (Binary):** Compact, watertight 3D mesh (Bambu Studio, PrusaSlicer, Cura, OrcaSlicer).
    3. **ASCII `.STL` (Text):** Human-readable plain text CAD mesh with facet normals.
    4. **Laser Cut & Engrave `.SVG`:** Industry-standard vector paths (Red Cut `#FF0000`, Blue Score `#0000FF`, Black Engrave `#000000`).
    5. **AutoCAD `.DXF` Vector:** 2D CAD exchange format for CNC milling and shop routers.
    6. **Single Bundle (`.STL` + `.SVG`):** Combined 3D printing and laser vector manufacturing package.
    7. **Bulk Export `.ZIP`:** Multi-design archive consolidating selected or filtered Cloud Library assets.
- **"Copy Download Link" for Remote Teams:**
  - Dedicated **"Copy Link"** button for every single export option in the dropdown.
  - Generates and copies a deep-linked URL (`/?design=<id>&export=<format>`) to the user's clipboard.
  - When opened by remote teammates, clients, or print shop collaborators, ForgeCraft Studio automatically loads the specified model and triggers an automated download of that file format.
  - Direct REST download endpoints available at `/api/export/:designId?format=<format>` for automated CI/CD and curl scripts.
- **"Copy File Path" for 3D Printers & Slicers:**
  - Dedicated **"Copy Path"** button for every export option.
  - Instantly copies formatted printer filesystem and job queue paths to the clipboard for rapid remote upload to OctoPrint, Klipper/Fluidd/Mainsail, Bambu Lab SD, or laser cutter job queues.
- **Target Printer Preset Selector:**
  - 1-Click toggle directly inside the dropdown to customize the copied file path prefix:
    - **SD Card:** `/sdcard/models/<filename>` (Bambu Lab, Prusa, Creality SD cards)
    - **OctoPrint:** `~/.octoprint/uploads/<filename>` (Raspberry Pi print server uploads)
    - **Klipper / Moonraker:** `~/printer_data/gcodes/<filename>` (Voron, RatRig, Klipper printers)
    - **Laser / CNC:** `/laser/jobs/<filename>` (LightBurn and CNC job folders)
- **Copied State Badges & Toast Notifications:**
  - Immediate visual feedback directly on the clicked button (`Copied Link! ✓` or `Copied Path! ✓`) and floating toast notifications confirming the copied link or path.

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
