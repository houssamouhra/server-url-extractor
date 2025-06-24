# 🕸️ Server URL Extractor & Validator

Automates the extraction, validation, and structured saving of URLs from dynamically generated web pages using Playwright. Captures links from both placeholder `<textarea>` content and real `<a href="">` anchors, then validates them using a `curl`-first strategy with Playwright fallback.

Designed for:
- Efficient batch processing of server-side URL drops
- Smart duplicate prevention
- DNS-aware validation
- Secure `.env`-based automation for credentialed scraping
  
Built with resilience and scale in mind — perfect for processing large datasets without reprocessing the same work twice.


## 🔧 Features

- **Automated navigation** across multiple `/md/xxxxx.html` pages, decrementing through URLs.
- **Dual source extraction** from `<textarea>` placeholders and valid anchor `<a href="">` tags within each drop.
- **Robust regex filters** to exclude placeholder and anchor patterns, targeting only real URLs with allowed TLDs and excluding false positives.
- **Smart skipping** logic:
  - Skips scraping if a dropId is already present in `dropLinks.json`
  - Skips validation if a batchId is fully present in `validatedLinks.json`
- **Batch-based processing** saves links incrementally as `dropId_drop_N` batches to control memory and improve clarity.
- **Duplicate-free batching**: avoids saving the same link twice within a batch.
- **Status validation:**
  - Uses `curl` for fast, lightweight URL status checking
  - Automatically falls back to `Playwright` for rich browser-level checks if curl fails or gives uncertain output.
- **Redirection detection** compares normalized final URLs to identify real redirects and capture redirected_url.
- **DNS error detection** classifies failures like ENOTFOUND, EAI_AGAIN, and treats them distinctly with zero status.
- **Secure credential injection** using `.env` variables for login automation
- **Memory usage tracking** logs RAM snapshots after every 10 placeholder tabs processed.
- **Detailed console logging** helps monitor:
  - URL extraction steps
  - Status checks
  - Validation decisions (curl vs playwright)
  - Skip reasons and timing
- **Structured JSON output:**
  - Scraped links → `data/dropLinks.json`
  - Validated links → `data/validatedLinks.json`
  - Grouped by `batchId`, each link contains:
   - `original`: source URL
   - `status`: HTTP status code
   - `redirection`: true/false
   - `redirected_url`: final URL if redirection happened
   - `included`: boolean match for known target IDs
   - `method`: `"curl"` or `"playwright"`
   - `error`: if present (e.g. `"DNS could not be resolved"`)




## ✅ Core Tasks Done

### 1. Link Extraction 
- Extracted URLs from placeholders in textareas with regex, including `http(s)`, `www`, and protocol-relative URLs (`//...`).
- Built a helper to extract both placeholder links and real anchor `<a href="">` links per drop.

### 2. Duplicate Handling 
- Used `Set` logic to avoid duplicate URLs within each drop batch.
- Skipped already saved drops (`dropLinks.json`) and already validated batches (`validatedLinks.json`) to prevent reprocessing.

### 3. Batch Accumulation & Saving
- Grouped links into drop-specific batches: `dropId_drop_N`.
- Merged links from placeholders and anchors into a single batch.
- Saved batches incrementally to JSON to avoid memory overflow.

### 4. Navigation & Validation Loop  
- Decremented through `/md/{id}.html` pages in a loop using Playwright automation.
- Validated extracted links using `curl` for speed.
- Automatically fell back to Playwright for browser-level validation if curl failed or gave ambiguous results.
- Captured and stored HTTP status, redirection info, final URL, and method used.

### 5. Inclusion Mapping (Optional Analysis)
- Compared resolved URLs against a predefined list of numeric target IDs.
- Marked each validated link with `included: true/false` depending on match.
- Enables later filtering and analysis based on external reference lists.

### 6. Regex Improvements  
- Refined regex patterns to allow a wide variety of real URLs while filtering out false positives like `contact.first_name}}`.
- Added support for extended TLDs and shorteners (`.me`, `.li`, `.in`, `.moe`, etc.).

### 7. Memory Management & Debugging  
- Logged memory usage every 10 tabs to track performance.
- Introduced async timeouts and batch size limits to keep Playwright stable during heavy runs.

### 8. Environment Handling
- Introduced `.env` config for secure credentials (`SERVER_EMAIL`, `SERVER_PASSWORD`).
- Included `.env.example` for team usage without exposing secrets.
- Uses `.env` credentials in Playwright login tests with strict TypeScript handling.


## 🔁 Regex Details

### 1. Anchor Tag URL Detection
✅ Captures:

- Real URLs from anchor tags like `<a href="https://example.com">`
-Supports both fully qualified and protocol-relative links

### 2. Placeholder URL Detection
✅ Captures:

- Full URLs with `http://` or `https://` schemes
- Protocol-relative URLs (e.g. `//example.com/path`)
- `www.`-prefixed URLs without protocol
- Domain patterns ending in whitelisted TLDs like `.com`, `.net`, `.io`, `.li`, `.cl`, etc.
🚫 Excludes:

- False positives like `contact.first_name`, `Whew...You`, or bracketed template syntax

## 📁 Project Structure
```
├──/data
│   ├── dropLinks.json         ← Extracted placeholder and anchor URLs grouped by drop ID
│   ├── validatedLinks.json    ← Validated URLs with status, method, redirection info, etc.
├──/tests
│   ├── scraping.spec.ts       ← Extracts links from dynamic drops (textareas + anchors)
│   └── url-validation.spec.ts ← Validates link status (curl + Playwright fallback)
├──/helpers                    ← Utility modules for scraping, login, export, and more
│   ├── checkPreviousMdUrls.ts
│   ├── exportToFile.ts
│   ├── hasValidAnchorLinks.ts
│   ├── login.ts
│   └── waitForDynamicPage.ts
│   
├── .env.example               ← Environment variable template for credentials (non-sensitive)
├── run-tests.bat              ← Windows batch script to run both tests (scraping + validation)
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


## 📄 License
This project is licensed under the [MIT License](LICENSE).

