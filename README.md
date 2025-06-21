# Server URL Extractor & Validator

Automates extraction, validation, and batch-saving of URLs (from placeholders and anchor tags) inside dynamically generated web pages using Playwright. Designed for efficient link processing, duplicate prevention, and secure test automation.



## 🔧 Features

- **Automated navigation** across multiple `/md/xxxxx.html` pages, decrementing through URLs.
- **Dual source extraction** from `<textarea>` placeholders and valid anchor `<a href="">` tags.
- **Robust regex filters** to exclude placeholder and anchor patterns.
- **Smart skipping**: avoids reprocessing batches already saved in `dropLinks.json` and skips validation for batches present in `validatedLinks.json`.
- **Batch-based processing** groups links and saves incrementally to manage memory.
- **Duplicate-free batching**: avoids saving the same link twice within a batch.
- **Status validation** uses curl for quick checks and falls back to Playwright if needed.
- **Redirection detection** resolves final destination URLs for analysis.
- **Secure credential injection** using `.env` variables for login automation
- **Memory usage tracking** during heavy processing.
- **Detailed console logging** for debugging and monitoring progress.



## ✅ Core Tasks Done

### 1. Link Extraction 
- Extracted URLs from placeholders in textareas with regex, including http(s), www, domain names, and protocol-relative URLs (`//...`).
- Developed a helper function to extract real anchor links from textarea content, ignoring placeholders.

### 2. Duplicate Handling 
- Avoided duplicate URLs within each batch using a `Set`.
- Prevented reprocessing of already validated or saved batches.

### 3. Batch Accumulation & Saving
- Organized links into drop-specific batch groups.
- Merged both placeholder and anchor links into the same batch when found.

### 4. Navigation & Validation Loop  
- Skipped validation for batches already stored in `validatedLinks.json`.
- Used `curl` for speed, with a fallback to Playwright for failed cases.
- Tracked HTTP status codes, redirections, and inclusion status.

### 5. Inclusion Mapping (Optional Analysis)
- Compared resolved URLs against a list of predefined numeric IDs.
- Marked each validated URL with an `included: true/false` flag depending on ID match.
- Used this to filter or analyze relevant URLs based on external data references.

### 6. Regex Improvements  
- Enhanced regex patterns to capture a wider variety of URLs.

### 7. Memory Management & Debugging  
- Added memory usage logs at intervals to monitor and avoid Node.js process crashes.
- Optimized batch clearing and awaited timeouts between batches.

### 8. Environment Handling
- Introduced `.env` config for secure credentials (`SERVER_EMAIL`, `SERVER_PASSWORD`).
- Included `.env.example` for team usage without exposing secrets.
- Uses `.env` credentials in Playwright login tests with strict TypeScript handling.



## 🔁 Regex Details

### 1. Anchor Tag URL Detection
✅ Captures:

- Valid links inside anchor tags (`<a href="...">`)
- Excludes links containing square-bracket placeholders like `[optout]`, `[placeholder]`, etc.

### 2. Placeholder URL Detection
✅ Captures:

- Full URLs starting with `http://` or `https://`
- Protocol-relative URLs like `//example.com`
- `www.` prefixed URLs


## 📁 Project Structure
```
├──/data
│   ├── dropLinks.json         ← Extracted URLs
│   ├── validatedLinks.json    ← Validated links with metadata
├──/tests
│   ├── scraping.spec.ts       ← Drop parsing & link extractor
│   ├── url-validation.spec.ts ← Link status & redirect checker
│   └── helpers/               ← Utility functions
├── .env.example               ← Safe env template
├── run-tests.bat              ← Double-click to run both scraping and validation tests via Windows Terminal
```
## 🚀 Usage
### 1. Install dependencies
```bash
npm install
```

### 2. Set up your environment
```bash
cp data/dropLinks.example.json data/dropLinks.json
cp data/validatedLinks.example.json data/validatedLinks.json
```
```bash
cp .env.example .env
```
And define:
```ini
SERVER_EMAIL=your@email.com
SERVER_PASSWORD=yourPassword
```

### 3. Run Tests
Headless:
```bash
npx playwright test
```
Headed:
```bash
npx playwright test --headed
```

## 🧪 Sample Output
- `dropLinks.json`: Stores batches like `123_drop_1`
- `validatedLinks.json`: Stores validation results with status codes and redirects
