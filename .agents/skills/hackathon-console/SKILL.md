```markdown
# hackathon-console Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill introduces the core development patterns and conventions used in the `hackathon-console` repository, a TypeScript project built with the Next.js framework. You'll learn how to structure files, write code, follow commit conventions, and organize tests to maintain consistency and quality across the codebase.

## Coding Conventions

### File Naming
- Use **camelCase** for all file names.
  - Example: `userProfile.ts`, `dashboardPage.tsx`

### Import Style
- Use **alias-based imports** for modules.
  - Example:
    ```typescript
    import { getUser } from '@/services/userService';
    ```

### Export Style
- Use **named exports** for all modules.
  - Example:
    ```typescript
    // In userService.ts
    export function getUser(id: string) { ... }
    ```

### Commit Messages
- Follow the **Conventional Commits** specification.
- Use the `feat` prefix for new features.
- Keep commit messages concise (average ~67 characters).
  - Example:
    ```
    feat: add user authentication to dashboard page
    ```

## Workflows

_No automated workflows detected in this repository._

## Testing Patterns

- **Test File Naming:** Use the pattern `*.test.*` for test files.
  - Example: `userService.test.ts`
- **Testing Framework:** Not explicitly detected. (Check project dependencies for specifics.)
- **Test Example:**
  ```typescript
  // userService.test.ts
  import { getUser } from '@/services/userService';

  test('should fetch user by ID', () => {
    const user = getUser('123');
    expect(user.id).toBe('123');
  });
  ```

## Commands

| Command | Purpose |
|---------|---------|
| /commit-convention | Show commit message guidelines |
| /file-naming       | Show file naming conventions   |
| /import-style      | Show import statement examples |
| /export-style      | Show export statement examples |
| /testing-patterns  | Show test file and structure guidelines |
```
