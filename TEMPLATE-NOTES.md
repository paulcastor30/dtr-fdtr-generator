# Institutional form adaptation and verification

The supplied references, not a redesigned web table, determine the output. The website interface is independent of their document styles.

## User-authorized decisions

- Use institution-required F4 / folio portrait, **8.5 × 13 inches (215.9 × 330.2 mm)**, for both forms. This supersedes the earlier A4 requirement.
- Use the Excel FDTR as the authoritative layout for an editable Word equivalent.
- Correct the August 17 and 24 Others periods from stored 01:00–05:00 to 13:00–17:00.

## Layout inherited from the earlier A4 adaptation

DTR: two source-derived copies are held in a borderless outer table so they remain side by side on one page. Inner date/table columns follow the source proportions. Daily rows are fitted to 16 points. Type is scaled for A4; narrow morning cells use 8-point type and allow a compact second line. Source floating schedule annotations are replaced with explicit official/regular-hours fields to avoid overlapping anchors on the smaller page. Name/month/signature underlines and the source's literal certification wording, including “above us”, are retained. The source renderer's trailing blank page is not reproduced.

FDTR: source cell merges, borders, alignment, and wording are translated into native Word tables. Each day has three rows and four independent activity groups. The two pages hold days 1–15 and 16–31 respectively. Rows are fitted to 12 points and source type sizes are proportionally reduced. The source's blank divider rows become an explicit page break. Spreadsheet text that overflowed neighboring empty cells is represented by merged Word cells. There is no new monthly total or new certification text.

The source-derived layout has therefore been adapted, not preserved pixel for pixel. These layout choices originated in the earlier A4 conversion. The current change updates paper dimensions to F4 and retains the prepared tables, text, and spacing. Exact institutional-format acceptance remains unverified.

## Verified in this build

- Separate DTR and FDTR calculation categories, schedule entries, monthly changes, templates, and output pages.
- August source time entries reproduced; DTR totals 4.0 lecture and 15.0 laboratory hours.
- FDTR fractional entries preserved as 0.50 and 1.50 hours, with daily totals recomputed from all four categories.
- The two corrected Others periods are 1:00–5:00 PM.
- Browser Word preview and PDF generated from the same DOCX bytes.
- DTR one F4 page, two copies; FDTR two F4 pages, with certification/signatures after day 31.
- Independent Word-file rendering used to inspect every generated page; original files left unchanged.
- No faculty identity, actual attendance fixture, or signatory names included in the public output.

## Limits that need human acceptance

A browser DOCX renderer and Microsoft Word may differ in text shaping, line breaks, and font substitution. The browser preview and PDF share bundled Liberation Serif fonts; the PDF embeds the font and exports selectable vector text. It does not redistribute Microsoft's fonts. Exact Word/browser pixel equivalence and institution approval of the A4 changes have not been established. A real nontechnical faculty usability session has not yet been performed. These are outstanding acceptance checks, not claims that the app has passed them.
