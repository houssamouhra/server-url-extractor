# Server URL Extractor & Validator

This project automates extraction, validation, and batch saving of URLs from dynamic web pages using Playwright. It is designed to navigate through a sequence of pages, detect URLs in placeholders and anchors, and save them efficiently to JSON files.

---

## Features

- **Automated navigation** across multiple `/md/xxxxx.html` pages, decrementing through URLs.
- **URL extraction** from textareas and anchor tags using robust regex patterns.
- **Placeholder and anchor link detection**, skipping irrelevant placeholders.
- **Batch processing and saving** extracted URLs into JSON files to manage memory efficiently.
- **Memory usage monitoring** to avoid process crashes during long loops.
- **Flexible options** to skip the current URL or start checks from a specific page.
- **Detailed console logging** for debugging and monitoring progress.

---

## Core Tasks Done

### 1. URL Extraction Logic  
- Extracted URLs from placeholders in textareas with regex, including http(s), www, domain names, and protocol-relative URLs (`//...`).
- Developed a helper function to extract real anchor links from textarea content, ignoring placeholders.

### 2. Batch Processing & Saving  
- Implemented batch accumulation of URLs and periodic saving to a JSON file to prevent memory overflow.
- Created a robust file export helper (`saveLinksToJson`) handling file existence, reading, parsing, and merging.

### 3. Navigation & Validation Loop  
- Built a function to iterate over up to 100 previous `/md/xxxxx.html` URLs, loading each page and checking for valid URLs.
- Added options to include or skip the current URL in the checks.
- Added error handling and detailed logging for page navigation, URL extraction results, and memory usage.

### 4. Regex Improvements  
- Enhanced regex patterns to capture a wider variety of URLs, including protocol-relative URLs starting with `//`.

### 5. Memory Management & Debugging  
- Added memory usage logs at intervals to monitor and avoid Node.js process crashes due to high memory consumption.
- Optimized batch clearing and awaited timeouts between batches.

---

## Regex Details
- Handles full URLs with http(s) scheme.

- Supports URLs starting with www..

- Detects domain-like patterns such as example.com.

- Matches protocol-relative URLs starting with //.

## Dependencies
- [Playwright](https://playwright.dev/) — For browser automation and page interaction.
- [Node.js](https://nodejs.org/en) fs and path modules — For file operations.


## Usage
### Install dependencies
```powershell
npm install
```
And run:
### Headless test:
```powershell
npx playwright test
```
### Or Headed test (with visible browser window):
```powershell
npx playwright test --headed
```
