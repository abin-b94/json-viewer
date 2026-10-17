# Online JSON Viewer & Formatter

A modern, responsive, privacy-first online **JSON Viewer, Formatter, Validator, and Minifier** built with standard web technologies (HTML5, CSS3, and modern Vanilla ES6+ JavaScript).

Inspect complex JSON payloads with an interactive collapsible tree view, syntax color-coding, full-text search highlighting, and detailed error location reporting.

---

## 🔒 Privacy & Performance Guarantees

- **100% Client-Side:** All parsing, formatting, validation, minification, and tree rendering are performed locally in your browser using the native JavaScript V8 engine.
- **Zero Server Transmission:** Not a single byte of your JSON is ever transmitted to an external server or saved in a remote database.
- **Offline Capable:** Equipped with a Service Worker and PWA Web Manifest, allowing the app to function seamlessly even without an internet connection after initial load.
- **Zero Dependencies:** Pure vanilla JavaScript with zero third-party telemetry, tracking libraries, or external CDNs.

---

## ✨ Key Features

1. **Dual Input Modes:**
   - **Text Editor:** High-performance textarea with synchronized line numbers gutter, caret position counter (Line, Column), and live stats.
   - **File Upload:** Drag-and-drop zone and file picker accepting `.json` and `.txt` files.

2. **Actions Toolbar:**
   - **Format / Beautify:** Pretty-print JSON with clean 2-space indentation.
   - **Minify:** Compact JSON into a single dense line with zero redundant whitespace.
   - **Validate:** Verify JSON syntax and display node count, depth, and payload byte size.
   - **Copy:** 1-click clipboard copy with animated visual feedback.
   - **Load JSON File:** Instant file picker access from any screen.
   - **Example JSON:** Instant 1-click sample dataset containing strings, numbers, booleans, null, nested objects, and arrays.
   - **Clear:** Quick canvas wipe with a clean reset.

3. **Interactive Collapsible Tree Viewer:**
   - Objects `{}` and arrays `[]` with collapsible carets and item count badges (`{ 5 keys }`, `[ 12 items ]`).
   - Distinct color-coded syntax tokens:
     - **Strings:** Emerald green
     - **Numbers:** Cyan blue
     - **Booleans:** Violet purple
     - **Null:** Muted slate italic
     - **Object Keys:** Indigo / bold
     - **Array Indexes:** Compact numeric badges (`0:`, `1:`)
   - **Expand All** and **Collapse All** controls.
   - **Live Search & Filter:** Real-time search highlighting matching keys and values, automatically unfolding nested ancestor branches so search hits are immediately visible.
   - **1-Click Node Copy:** Hover over any node in the tree to copy its specific value or subtree directly.

4. **Resilient Error-Handling:**
   - Detects syntax errors without crashing the application.
   - Pinpoints approximate Line and Column number.
   - Highlights the problematic code snippet with visual caret indicator (`^`).
   - Includes **"Jump to Line"** action to focus and scroll the textarea right to the error.

5. **Design & UX:**
   - Clean, modern minimal UI with crisp typography.
   - Complete **Light & Dark Mode** with automatic system theme synchronization and persistence.
   - Responsive layout with **Split**, **Editor Only**, and **Tree Only** view toggle.
   - Accessible semantic HTML with ARIA roles and labels.

---



## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl` / `Cmd` + `Enter` | Format / Beautify JSON (2 spaces) |
| `Ctrl` / `Cmd` + `Shift` + `C` | Copy output to clipboard |
| `Ctrl` / `Cmd` + `Shift` + `M` | Minify JSON into single line |
| `Ctrl` / `Cmd` + `K` | Focus Search / Filter box |
| `Esc` | Clear search / Close modal |

---

## 📁 Project Structure

```text
jsonViewer/
├── index.html            # Semantic HTML5 entry point and accessible layout
├── manifest.json         # PWA Web App Manifest for installability & offline support
├── sw.js                 # Service Worker caching offline assets
├── sample.json           # Standalone sample JSON file for drag & drop testing
├── README.md             # Complete project documentation and deployment guide
├── css/
│   └── style.css         # Modern responsive styles, light/dark themes, tree styling
├── js/
│   ├── app.js            # Main application orchestrator and event controller
│   ├── json-tree.js      # Collapsible interactive JSON tree renderer & search engine
│   ├── parser.js         # Validation, formatting, minification & syntax error detector
│   └── sample-data.js    # Comprehensive demo JSON data structure
└── icons/
    └── icon.svg          # Crisp vector application icon
```

---

## 🚀 Running Locally

Because the project uses standard ES6 modules (`import` / `export`), it should be served via any local HTTP server (or accessed through an IDE like VS Code Live Server):

### Option 1: Python 3 (Built-in)
```bash
python -m http.server 8080
```
Open [http://localhost:8080](http://localhost:8080) in your browser.

### Option 2: Node.js (npx serve or http-server)
```bash
npx serve .
# or
npx http-server -p 8080
```

---

## 🌐 Deployment Instructions

Because this app consists exclusively of static client-side files, it can be deployed to any static web host in seconds with zero build steps:

### 1. GitHub Pages
1. Push this repository to GitHub.
2. In your repository, go to **Settings** > **Pages**.
3. Under **Build and deployment**, set source to **Deploy from a branch**.
4. Select the `main` branch and `/ (root)` folder.
5. Click **Save**. Your site will be live at `https://<username>.github.io/<repository-name>/`.

### 2. Netlify
- **Drag & Drop:** Drag the entire `jsonViewer` folder directly onto the [Netlify Drop](https://app.netlify.com/drop) dashboard.
- **Git:** Link your repository. Leave the build command empty, and set the publish directory to `.` or `/`.

### 3. Vercel
1. Run `npx vercel` in the project directory, or import the GitHub repository in the Vercel dashboard.
2. Framework preset: **Other / None**.
3. Output directory: `./` (root).
4. Click **Deploy**.

### 4. Cloudflare Pages
1. Connect your Git repository in the Cloudflare Pages dashboard.
2. Build command: *(leave blank)*.
3. Build output directory: `.` (root).
4. Click **Save and Deploy**.

---

## 🧪 Testing the Application

1. **Load Example Data:** Click the **"Example JSON"** button in the toolbar. Notice the tree renders with strings, numbers, booleans, nulls, nested objects, and arrays.
2. **Interactive Collapsing:** Click on any object or array header to collapse/expand it, or use the **"Expand All"** and **"Collapse All"** buttons.
3. **Search & Highlight:** Type a search query (e.g. `Alex` or `price`) in the search box or hit `Ctrl + K`. Matching nodes will be highlighted, and collapsed parent branches will automatically open.
4. **File Import:** Switch to the **"File"** tab and drag & drop `sample.json`, or click the drop box to select a file.
5. **Syntax Error Detection:** Deliberately add a syntax error in the text editor (e.g., delete a closing brace or add a trailing comma `{"key": "val",}`). Notice the error banner with line/column coordinates and the **"Jump to Line"** button.
6. **Theme Switching:** Click the **"Theme"** button in the top right to toggle between light and dark modes.

---

## 📄 License

MIT License. Free for personal, commercial, and open-source usage.

