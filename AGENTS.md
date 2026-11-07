# Project configuration

- Declare npm packages imported by edge functions in the root package.json so the managed Deno checks can resolve them without changing function source.
- Include Node and Vite ambient types in the app TypeScript configuration because the source tree includes Node test-runner tests alongside browser code.