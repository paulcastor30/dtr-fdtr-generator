# DTR & FDTR Generator

A local-first static application for creating separate institutional DTR and FDTR documents. Production files are in `dist/`. No production server, account, cloud conversion service, analytics, or external browser dependencies are needed.

## Use the app

Choose **Create DTR** or **Create FDTR**. Complete Your Information, Your Usual Schedule, and Certification / Signatory. For each month, add only the differences, review the preview, then choose Download Word or Download PDF. Settings contains Save Backup and Restore Backup. Information is stored in the current browser; clearing its data removes that information unless a backup is restored.

## Run locally

Use Node.js 22 or newer. There are no packages to install for building or serving.

```sh
node scripts/build.mjs
node scripts/serve.mjs
```

Open http://127.0.0.1:4173/repository-name/ . The repository prefix is intentional and verifies that relative URLs work on GitHub Pages. Opening `index.html` directly from a disk will not load browser modules/templates; use the preview server or static hosting.

## Publish to GitHub Pages

1. Put this project in a GitHub repository on the `main` branch. Do not commit the private `qa/` directory or personal backup files; both are excluded by `.gitignore`.
2. In the repository's Settings → Pages, choose GitHub Actions as the publishing source.
3. Run **Publish GitHub Pages** in Actions, or push to `main`. The included workflow tests the model, builds `dist/`, and deploys only those static files.

The app has no hard-coded account or repository name. The workflow follows [GitHub's custom Pages workflow guidance](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages). No repository has been created or published automatically.

Alternatively, upload the contents of `dist/` to any ordinary static host. All browser libraries are vendored; no CDN is used during normal operation. HTTPS is recommended by the hosting platform.

## Institutional templates

- DTR is derived from the supplied Word package, retaining its daily table structures and two-copy arrangement. The working template uses native Word tables and fields replaced in place.
- FDTR is an editable Word translation of the supplied Excel form, retaining four activity groups, three entries per category/day, 31 date positions, and the two-page division after day 15.
- Both forms use the institution-required F4 / folio size: **8.5 × 13 inches (215.9 × 330.2 mm), portrait**. The Word section size, displayed preview, exported PDF, and browser print size agree. The prepared form layout is retained; earlier adaptations are documented in `TEMPLATE-NOTES.md`.
- The original reference files are not modified or included in the public website. Published templates contain placeholders, not the supplied person's name, signatories, or August attendance.
- Word output is a real editable `.docx` ZIP package. PDF uses selectable vector text and vector table lines on exact 215.9 × 330.2 mm pages. Its positions come from the displayed preview, and the same bundled Liberation Serif font is used in the preview and embedded in the PDF. F4 fitting is shown in the preview before download, so exporting does not rescale a screenshot.
- Browser rendering and desktop Word are different layout engines. Automated tests and independent LibreOffice rendering have been used; pixel-identical Microsoft Word rendering and a real faculty usability acceptance session are not certified. An institutional review of the prepared layout is still needed before treating it as an approved replacement form.

## Time and schedule rules

The DTR supports one morning and one afternoon/evening period per day, matching its designated cells. The FDTR supports up to three periods per activity category. Overlaps, reversed times, invalid times, and excess capacity are rejected rather than silently dropped. DTR periods crossing noon must be split. Overnight periods are not represented by the references and are not supported. DTR prints hours to one decimal; FDTR activity hours to two decimals and daily totals to one, following the reference presentation. Calculations use minutes before display rounding.

Weekends derive from the calendar. Holidays are entered by the user, never guessed. Leave/no-class/other wording must be supplied by the user, or the user may explicitly leave the day blank. The saved schedule can have start/end dates. Updates to that saved schedule apply when generating any month within those dates; the application does not keep historical schedule versions. Back up before replacing an old term's schedule if old months must be reproduced later.

Spreadsheet import is not included. The supplied Excel workbook is a development reference for the FDTR template, not a file users need to upload each month.

## Verification

```sh
node --test tests/*.test.mjs
```

These tests cover calendar boundaries, leap years, time arithmetic, overlaps, form capacity, month isolation, schedule dates, backup validation, and reference totals when the private fixture is present. Browser test scripts additionally cover first-time setup, saved return, monthly changes, undo, backup restoration, preview gating, downloads, mobile overflow, and absence of external requests. They require Playwright and an installed Chromium browser; this is a development-only dependency.

`qa/` contains private reference fixtures and generated comparison files on the development machine only. Template preparation is optional maintenance, requires the original local files plus python-docx/openpyxl/lxml, and is not part of deployment or normal operation. Public templates are already prepared.

## Included libraries

JSZip, docx-preview 0.3.6, pdf-lib, and @pdf-lib/fontkit 1.1.1 are bundled under `public/vendor/`, with their licenses alongside them. The build uses only the Node.js standard library.

Liberation Serif fonts are bundled under `public/fonts/` with their SIL Open Font License. PDF export runs entirely in the browser, without uploads or runtime CDN requests. Legacy html2canvas files are retained in the vendor directory but are no longer loaded or used.

## Updating the published app

The build assigns a content version to the entry script, stylesheet, and the complete JavaScript module graph. New releases therefore load fresh document/export code even when old canonical script URLs remain cached. `dist/build.json` records the active release, F4 paper requirement, and vector PDF export. Deploy the newly built `dist/` and reopen the published page; a unique `?v=<release>` suffix can also force a fresh HTML request. Browser-saved attendance data stays on the same origin.

## Monthly FDTR Related activities

In the FDTR monthly form, choose **Add a change → Related activity**. Select a date or range, enter the printed description and optional memorandum/special order reference, then choose full day, morning, afternoon/evening or custom periods. Preset hours are editable; lunch is not counted. Full day replaces all recurring work on those dates; half days preserve the other half; custom periods trim only overlapping work. Activities do not carry into another month.

Descriptions print in an available Class/Consultation row, while activity times and hours remain in Related activities. Order references remain in the monthly review and backup. Existing recurring Related activities are retained for compatibility and can be removed manually from saved setup. DTR behavior, templates and export geometry are unchanged.

`tests/fdtr-activities.test.mjs` covers replacement, half days, custom clipping, totals, month/form isolation and backup validation. `scripts/fdtr-activity-check.mjs` covers the browser entry, editing, Word/PDF export and mobile layout.
