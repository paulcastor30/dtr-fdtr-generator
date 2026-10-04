# Current paper requirement — 4 October 2026

The institution requires F4 / folio, confirmed by the user as **8.5 × 13 inches (215.9 × 330.2 mm)**, for both DTR and FDTR. The current preview, Word output, PDF output, and print stylesheet use this size. Earlier A4 references below record historical work and are superseded by this requirement.

# Continuation audit — 3 October 2026

This delivery continues the existing application. Its interface, calculation model, document generation, and vendored browser libraries were preserved.

## Working and verified

| Requirement | Evidence / result |
| --- | --- |
| Separate DTR and FDTR | Separate schedules, monthly changes, categories, templates, and generation paths; shared personal profile. |
| Minimal monthly input | Saved setup reused; month selection and exceptions precede preview. Full-month details are optional. |
| Browser storage and backup | Setup survives reload; backup download/restore roundtrip passes; monthly reset and undo pass. |
| Editable Word | Generated OOXML `.docx` packages, with native editable tables and text; independent LibreOffice rendering inspected. |
| F4 PDF | DTR: one 8.5 × 13-inch page with two copies. FDTR: two 8.5 × 13-inch pages. PDF uses embedded fonts and vector text/lines positioned from the displayed preview. |
| Reference values | DTR August: 4.0 lecture and 15.0 laboratory hours. FDTR fractional hours retained; Others periods on August 17/24 corrected to 1–5 PM. |
| Preview and download | Review checkbox gates download; preview derives from generated Word bytes. |
| Mobile | 390-pixel layout inspected; month/actions precede saved-setup note; no horizontal overflow. |
| Static hosting | Relative assets work at `/repository-name/`; all browser libraries local; no backend or external requests. |
| GitHub Pages readiness | Included workflow tests, builds, and deploys `dist/` from `main`. No GitHub repository or live deployment exists yet. |
| Reference safety | Original Word/Excel files remain unchanged; personal fixtures and backups excluded from the public package. |

The model suite previously passed all nine tests with the private August fixture. The final browser workflow passed after the blank-day and mobile-order changes. Earlier reference Word/PDF generation and independent document render checks were preserved; no production template was replaced during this continuation.

## Fixed issues retained

- Fractional FDTR hour formatting no longer truncates half-hour entries.
- Extra paragraphs in merged FDTR cells no longer cause preview page overflow.
- Fixed Word table width prevents FDTR column distortion.
- DTR morning cells support compact wrapping without clipping in the inspected example.
- A preview request counter prevents stale asynchronous previews replacing the current form.
- An explicit blank-day choice can clear an automatic weekend label.
- Corrupt stored data is protected from automatic overwrite.

## Unresolved acceptance requirement

**Exact official-template fidelity has not passed.** The source DTR is 8.5 × 13 inches, while the requested output is A4. The current template changes font sizes, spacing, placement, and floating annotations to fit. FDTR is an editable translation of Excel using native Word tables with fitted dimensions. These departures are described in `TEMPLATE-NOTES.md`.

A direct uniform-scaling experiment on the original DTR was rendered at approximately 90%, 86%, and 80%. It caused wrapping and spill into another column/page. Those failed candidates remain private and were not substituted for the working templates. Repeating this approach is not a next task.

The next task is to establish an approved A4 reference: either explicit approval of the current adaptation, or an institution-approved A4 reference supplied by the user. Then compare every generated page against that reference, correct any deviations, and record acceptance. Current page-count/data checks do not constitute exact visual fidelity.

Microsoft Word and the browser renderer can differ in layout. A real nontechnical faculty acceptance session and institution approval have not been performed. The PDF now contains selectable vector text and embedded fonts. Old schedules are not versioned; save a backup before replacing an old term's setup.

## Delivery contents

`DTR-FDTR-Generator.zip` contains source, prepared blank templates, local browser libraries, the built static website, tests, GitHub Pages workflow, and documentation. It excludes personal attendance data, private QA files, backups, and failed experimental forms. Optional template-preparation scripts are maintenance tools; their original local reference files are not required to use or publish the app.

The private August backup is delivered separately for the user's local use. Never add that backup to a public repository.

## Print-blocker fix — 4 October 2026

A valid DTR containing morning entries throughout a 31-day month can make docx-preview grow its single section beyond A4. The former 1126-pixel check cleared the generated document and disabled review and both downloads. Height overflow now produces an advisory while preserving the review checkbox and downloads. PDF export captures unscaled layout dimensions and fits the entire form proportionally onto A4, without cropping or stretching.

Verified with `scripts/print-check.mjs`: the previously blocked tall preview remains reviewable; both Word and PDF download; the PDF contains one A4 page and preserves the form proportions. The existing DTR/FDTR browser workflow and eight available model tests pass; the private August-fixture test remains skipped because the fixture is absent.

## PDF layout capture fix — 4 October 2026

PDF export now freezes the preview's computed styles and rasterizes its HTML using the browser's native SVG/HTML renderer. This replaces html2canvas text reconstruction, which could change spacing, underline placement, and table text alignment. The existing proportional A4 fit and review gate remain in place. Export does not modify the displayed preview.

Visually compared the signature names, separate underlines, certification lines, and in-charge labels against browser screenshots. `scripts/pdf-layout-check.mjs` verifies actual downloaded DTR and FDTR PDFs at desktop and mobile widths: the embedded images match the captured preview pixels, page counts remain one/two, and preview markup remains unchanged. The print-blocker regression, full workflow checks, and eight available model tests pass. The private reference-fixture test remains skipped.

## Vector PDF refinement — 4 October 2026

The previous image exports remained soft when zoomed and fitted the image to A4 only after review. The current exporter removes the page image completely: text uses embedded Liberation Serif fonts, table borders and underlines are vector lines, and placement is measured from browser text ranges. Native baseline probes preserve the preview's line positions. The preview uses the same bundled font and displays the A4 fit before review. Both DTR and FDTR exports remain local and make no external requests.

Independent PDF parsing verifies selectable names/months, embedded fonts, zero page-image objects, expected A4 page counts, text-run positions and widths against browser ranges, and desktop/mobile placement within 0.01 point. The original print-blocker regression and complete workflow checks pass. Poppler-rendered DTR and both FDTR pages were visually inspected, including a DTR signature crop rendered at 384 dpi. Eight available model tests pass; the private reference test is skipped. PDF and browser viewers can apply different screen antialiasing, but the exported text is no longer resolution-limited.

## F4 paper-size update — 4 October 2026

A shared paper definition now drives Word generation, preview fitting, PDF dimensions, and fit-to-screen calculations. Prepared templates and the maintenance script use 12240 × 18720 twips; exported PDFs use 612 × 936 points. The interface identifies F4 as 8.5 × 13 inches. Print CSS uses the same dimensions.

Both Word downloads and every PDF page were checked for the confirmed dimensions. The vector PDF checks retain selectable text, embedded fonts, expected one/two-page output, and agreement with desktop/mobile preview positions. The printing regression and complete application workflow checks pass. Only paper-size attributes in the prepared template XML changed; template text and table formatting are retained.

## Supplied PDF diagnosis and cache fix — 4 October 2026

The supplied app download was an older A4 raster export: one 2382 × 3408 RGB image at approximately 291 dpi, no font objects, and a 595.276 × 841.89-point page. The supplied Word conversion contained embedded Times New Roman fonts on a 612 × 936-point page. This explains the softness when zoomed and confirms that the supplied download did not originate from the current F4 vector exporter.

Build output now uses a content-versioned entry script, stylesheet, complete module graph, vendor URLs, and template URLs. Local preview HTML/canonical assets revalidate, while versioned assets can be cached immutably. The PDF layout check deliberately replaces the old unversioned app/documents/vector module URLs with failing stale scripts; the release still downloads vector PDFs with embedded fonts and the confirmed F4 dimensions. Deploying the new build is required to update the live site.

FDTR monthly Related activities: verified full and half days, custom periods, lunch exclusion, overlap replacement, descriptions in Word and PDF, order references, backup roundtrip, month isolation and mobile dialog. Existing workflow and PDF geometry checks pass. A separate comparison confirmed the DTR document XML is identical to the original exporter. Templates, vector exporter and paper size are unchanged.

FDTR office arrangement: calculation tests reproduce 6-to-8-hour office days, 2-to-8-hour consultation-only days, and 10-hour totals for office work plus evening teaching. Verified lunch/weekend/date exclusions, custom settings, manual mode, daily overrides, Related activities interaction, backup migration, full weeks crossing month boundaries and consultation shortage warnings. Browser workflow and vector PDF geometry regression checks passed. DTR templates and exporter unchanged.

Interface refinement: passed full setup/change/backup workflows, FDTR office and activity checks, keyboard skip link, native modal focus containment and return, retained focus during dynamic dialog updates, 320px reflow, doubled interface text and reduced-motion checks. axe-core 4.10.3 found zero automated WCAG A/AA violations across 11 tested interface states (institutional document rendering excluded from the web-interface audit). PDF geometry, embedded fonts, selectable text and desktop/mobile export checks passed. This is automated verification, not an accessibility certification or screen-reader user study. Model, templates and document exporters were preserved byte-for-byte.
