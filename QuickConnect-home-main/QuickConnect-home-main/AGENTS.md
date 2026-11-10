## Project implementation rules

- Keep the interactive gallery globe isolated in `src/game/globe/` and its scroll-motion math in `src/lib/`; this keeps rendering separate from deterministic, testable motion rules.
