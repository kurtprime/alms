# GEMINI.md: Project Analysis

This document provides a comprehensive overview of the `alms` project, its architecture, technologies, and development conventions, as analyzed on December 15, 2025.

## 1. Project Overview

This project is a multi-tenant **Advanced Learning Management System (ALMS)** built with a modern web stack. The application allows different organizations (acting as schools or classes) to manage their members (teachers and students), subjects, and enrollments. The system supports distinct user roles, invitations, and a clear separation of data between organizations. The architecture is built around a Next.js frontend and a tRPC API layer, with a PostgreSQL database managed by the Drizzle ORM.

## 2. Technology Stack

- **Framework:** [Next.js](https://nextjs.org/) (v15) with Turbopack
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **API Layer:** [tRPC](https://trpc.io/) for end-to-end typesafe APIs.
- **Database ORM:** [Drizzle ORM](https://orm.drizzle.team/)
- **Database:** [PostgreSQL](https://www.postgresql.org/)
- **Authentication:** `better-auth`
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/) (inferred), built upon [Radix UI](https://www.radix-ui.com/) primitives and styled with [Tailwind CSS](https://tailwindcss.com/).
- **File Uploads:** [UploadThing](https://uploadthing.com/)
- **State Management:** [TanStack React Query](https://tanstack.com/query/latest)
- **Forms:** [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/) for schema validation.
- **Package Manager:** [pnpm](https://pnpm.io/)

## 3. Project Structure & Conventions

- **Path Aliases:** The project uses the `@/*` alias for imports from the `src/` directory (e.g., `@/components/ui/button`).
- **API Routing:** API routes are handled by tRPC. The main router is likely defined in `src/trpc/routers/_app.ts`.
- **UI Components:** Reusable UI components are located in `src/components/ui`, following the `shadcn/ui` convention.
- **Application Routing:** The application uses the Next.js App Router, with route groups for different sections like `(auth)`, `(dashboard)`, `(student)`, and `(teacher)`.
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) is used for styling.
- **Database Schema:** The schema is defined using Drizzle ORM in a modular structure under `src/db/schemas/`. The main schema file `src/db/schema.ts` aggregates these modules and defines the relationships.

## 4. Data Model

The database schema is organized into three main areas: Authentication, Organizations, and Subjects.

- **`user`:** The central table for all users. It includes a global `role` enum (`admin`, `teacher`, `student`, `user`).
- **`organization`:** Represents a tenant, such as a school, class, or institution.
- **`member`:** A pivot table linking a `user` to an `organization` with a specific `role` within that organization (e.g., `owner`, `teacher`, `student`). This is the core of the multi-tenancy model.
- **`session`:** Tracks user sessions and, importantly, the `activeOrganizationId` the user is currently interacting with.
- **`subjects`:** Defines the courses or subjects available.
- **`classSubjects`:** A pivot table that represents a specific instance of a `subject` being taught by a `teacher` (`user`) within a specific `class` (`organization`).

## 5. Building and Running

The project is managed with `pnpm`.

### Running the Development Server

To run the application in development mode, use the following command:

```bash
pnpm dev
```

This command concurrently executes three tasks:
1.  `dev:next`: Starts the Next.js development server with Turbopack (`next dev --turbopack`).
2.  `db:update`: Pushes any changes from the Drizzle schema files (`src/db/schema.ts`) to the PostgreSQL database (`npx drizzle-kit push`).
3.  `dev:webhook`: Starts an `ngrok` tunnel to expose the local server, likely for webhook development or testing.

### Building for Production

To create a production-ready build, run:

```bash
pnpm build
```

### Linting

To check the code against the project's ESLint rules, run:

```bash
pnpm lint
```
