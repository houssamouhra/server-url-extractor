@echo off
cd /d %~dp0

echo Running scraping.spec.ts...
call npx playwright test tests/scraping.spec.ts --headed || echo scraping.spec.ts failed.

echo Running url-validation.spec.ts...
call npx playwright test tests/url-validation.spec.ts --workers=8 || echo url-validation.spec.ts failed.

echo All tests finished.
pause