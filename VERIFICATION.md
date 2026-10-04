# Continuation audit — 3 October 2026

This delivery continues the existing application. Its interface, calculation model, document generation, and vendored browser libraries were preserved.

## Working and verified

| Requirement | Evidence / result |
| --- | --- |
| Separate DTR and FDTR | Separate schedules, monthly changes, categories, templates, and generation paths; shared personal profile. |
| Minimal monthly input | Saved setup reused; month selection and exceptions precede preview. Full-month details are optional. |
| Browser storage and backup | Setup survives reload; backup download/restore roundtrip passes; monthly reset and undo pass. |
| Editable Word | Generated OOXML `.docx` packages, with native editable tables and text; independent LibreOffice rendering inspected. |
| A4 PDF | DTR: one A4 page with two copies. FDTR: two A4 pages. PDF uses the displayed DOCX preview at 3× resolution. |
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

Microsoft Word and the browser renderer can differ in layout. A real nontechnical faculty acceptance session and institution approval have not been performed. The PDF is printable raster output, not searchable text. Old schedules are not versioned; save a backup before replacing an old term's setup.

## Delivery contents

`DTR-FDTR-Generator.zip` contains source, prepared blank templates, local browser libraries, the built static website, tests, GitHub Pages workflow, and documentation. It excludes personal attendance data, private QA files, backups, and failed experimental forms. Optional template-preparation scripts are maintenance tools; their original local reference files are not required to use or publish the app.

The private August backup is delivered separately for the user's local use. Never add that backup to a public repository.

## Print-blocker fix — 4 October 2026

A valid DTR containing morning entries throughout a 31-day month can make docx-preview grow its single section beyond A4. The former 1126-pixel check cleared the generated document and disabled review and both downloads. Height overflow now produces an advisory while preserving the review checkbox and downloads. PDF export captures unscaled layout dimensions and fits the entire form proportionally onto A4, without cropping or stretching.

Verified with `scripts/print-check.mjs`: the previously blocked tall preview remains reviewable; both Word and PDF download; the PDF contains one A4 page and preserves the form proportions. The existing DTR/FDTR browser workflow and eight available model tests pass; the private August-fixture test remains skipped because the fixture is absent.

## PDF layout capture fix — 4 October 2026

PDF export now freezes the preview's computed styles and rasterizes its HTML using the browser's native SVG/HTML renderer. This replaces html2canvas text reconstruction, which could change spacing, underline placement, and table text alignment. The existing proportional A4 fit and review gate remain in place. Export does not modify the displayed preview.

Visually compared the signature names, separate underlines, certification lines, and in-charge labels against browser screenshots. `scripts/pdf-layout-check.mjs` verifies actual downloaded DTR and FDTR PDFs at desktop and mobile widths: the embedded images match the captured preview pixels, page counts remain one/two, and preview markup remains unchanged. The print-blocker regression, full workflow checks, and eight available model tests pass. The private reference-fixture test remains skipped.
