# Simplify table data model

- **Date**: 2025-10-26
- **Owner**: ChatGPT

## Purpose

Revisit the saved table data structure and align it with a lightweight “template helper” scope requested by the user.

## Plan / TODO

- [x] Review current spec TableModel and prior proposal to isolate must-have fields
- [x] Draft a simplified JSON model and document rationale in the spec
- [x] Update summary/notes and verify no code changes are required right now

## Notes

- User emphasised keeping the model minimal since complex cases can be handled directly in Typst.

## Summary

- Trimmed the `Cell` type back to editable properties (text + alignment + basic emphasis).
- Added a spec note committing to the “template helper” scope and excluding extra metadata like `dataType`.

Checked that no application code updates are needed yet.

## Next

- Re-evaluate the schema when cell merging or numeric alignment features graduate from “future work”.

## Reflection

Directly pairing the spec with the conversation kept the scope tight; future enhancements can extend the JSON once the UI supports them.

## Pre-PR Checklist

- [ ] Tests added/updated
- [x] Documentation updated
- [ ] Linting (if applicable)
- [ ] Tests (unit/integration)
