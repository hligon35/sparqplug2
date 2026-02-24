# SP2Layout.md — Copy/Paste Scaffold Prompt (SparQ Plug)

Use this file as a **single copy/paste prompt** in another Copilot chat/window to have it scaffold the new SparQ Plug version so it matches this repo’s current layout and styling **exactly**, but with the **new architecture**:

- **Web**: Vite + React SPA (React Router)
- **Mobile**: Expo + React Native (React Navigation)
- **API**: Express (Firebase Admin token verification)
- **Shared**: workspace package `@sparq2/shared` consumed by all tiers

This prompt is intentionally strict: it forces Copilot to reuse the project’s existing visual primitives (Tailwind/NativeWind class patterns, cards/rows/inputs/modals), while also enforcing the new auth + API boundary rules (Firebase ID token → Bearer → Express middleware verify).

---

## PROMPT (paste everything between the lines)

---

You are working in a monorepo with 3 runtime tiers: **Web (React SPA)**, **Mobile (Expo RN)**, **API (Express)**, plus a shared workspace package `@sparq2/shared`. The public brand is **SparQ Plug** (never show “SparQPlug2” in UI text).

GOAL
- Scaffold the entire SparQ Plug UI/UX end‑to‑end so it renders **pixel-consistent** with the app’s current design system and patterns.
- Implement the **new architecture boundaries** exactly:
  - Web/Mobile authenticate with Firebase Client SDK
  - Web/Mobile call API with `Authorization: Bearer <FirebaseIdToken>`
  - API verifies token with Firebase Admin before protected work
  - Shared code in `@sparq2/shared` is used everywhere for consistent types/constants

ABSOLUTE CONSTRAINTS (DO NOT VIOLATE)
1) Match the existing design system exactly.
   - Use **NativeWind + Tailwind default palette** (no new custom palette unless you mirror defaults).
   - Use the same class patterns already used in this repo:
     - Surfaces: `bg-white`, `border border-gray-200`
     - Radii: `rounded-xl`, `rounded-2xl`, `rounded-3xl`, `rounded-full`
     - Spacing: `px-4` as default screen inset, `gap-4` for vertical stacks, cards use `p-4`.
     - Text: titles are `font-semibold` or `font-bold`; subtitles use `opacity-70`.
   - Keep inline hex values that already exist (do not “improve” them):
     - white `#FFFFFF`
     - text `#111827`
     - badge danger red `#DC2626`
     - primary indigo join banner uses `#4F46E5` and indigo palette.

   Web must visually match Mobile.
   - Web uses Tailwind classes to mirror the same surface/radius/spacing rules.
   - Mobile uses NativeWind and the existing className patterns.

2) Do NOT invent new UI libraries, theme systems, or component frameworks.
  - Web: React + React Router (no Next.js).
  - Mobile: React Navigation.
  - Styling: Tailwind/NativeWind only.

3) Do NOT rename the public brand in any screen.
   - Always display **SparQ Plug**.

4) Connect all points end‑to‑end.
   - Every UI action must call the **tier-appropriate API client boundary** (no ad-hoc fetch scattered around).
   - Web must call the API only via `apiClient.ts` and attach Firebase ID tokens.
   - Mobile must call the API only via `apiClient.ts` and attach Firebase ID tokens.
   - API must verify Firebase ID tokens via middleware before protected work.
   - Preserve current offline-aware UI patterns where they already exist (tasks/notes/files):
     - Show “Offline mode …” status
     - Provide a Sync action for admins

5) Do not change existing styling primitives.
  - Mobile: reuse/extend `src/components/ui/*` instead of creating parallel components.
  - Web: create a small matching component set that mirrors the same semantics and class patterns (do not create a new theme).

6) Follow the new navigation/routing architecture exactly.
  - Web uses React Router with an outlet-style guard (`ProtectedRoute`) and an authenticated app shell.
  - Mobile uses a single `RootNavigator` auth switch:
    - if `loading`: render nothing (or a minimal blank screen)
    - if no user: show Login only
    - if authenticated: show the feature stack

7) Respect the new auth gating rules.
  - Remove any “dev-only auth” assumptions from scaffolding.
  - Auth is real and always-on for both Web and Mobile.

FIRST, READ THE CODEBASE (MANDATORY)
- Inspect and treat these existing UI primitives as canonical for the visual system:
  - `src/components/ui/Screen.tsx` (background, safe area, scroll padding, top padding=12, bottom inset logic)
  - `src/components/ui/Card.tsx`
  - `src/components/ui/SectionHeader.tsx`
  - `src/components/ui/ListRow.tsx`
  - `src/components/ui/FloatingLabelInput.tsx`
  - `src/components/ui/SelectField.tsx`
  - `src/components/ui/MultiSelectField.tsx`
  - `src/components/ui/ModalSurface.tsx`
  - `src/components/ui/OverlayStack.tsx` (StackModal behavior)

- Inspect existing screen layouts for spacing/typography patterns to mirror:
  - `src/screens/LoginScreen.tsx`
  - `src/screens/DashboardScreen.tsx`
  - `src/screens/AccountsScreen.tsx`
  - `src/screens/ClientDetailsScreen.tsx`
  - `src/screens/TasksScreen.tsx`

Do NOT treat the existing `App.tsx` (tabs+stacks) as the target architecture for the new version.

CANONICAL LAYOUT RULES (MUST MATCH)
- Screen container:
  - Mobile: use `Screen` for all app screens (except auth if already different).
  - Web: create a `WebScreen` (or similarly named) wrapper that mirrors `Screen`’s visual intent:
    - same background image
    - same default content inset
    - same vertical spacing defaults
  - Default inset: `px-4`.
  - Default vertical stack spacing inside screen: `gap-4`.
  - Background image must be used via `Screen`/`WebScreen` (do not replace).
- Cards:
  - `rounded-2xl border border-gray-200 bg-white p-4`.
- List rows:
  - `py-3` rows with bottom divider `border-b border-gray-100`.
- Inputs:
  - Floating label style and padding exactly as in `FloatingLabelInput`.
- Modals:
  - Always use `StackModal` + `ModalSurface` for picker/add/edit flows.
  - Scrim: `bg-black/50`.

NAVIGATION (NEW VERSION)
MOBILE NAVIGATION
- Use `RootNavigator.tsx` as an auth switch:
  - `loading === true` → render nothing
  - `user == null` → show Login only
  - authenticated → show a stack of feature screens:
    - Dashboard
    - Clients
    - Tasks
    - Notes
    - Files

WEB ROUTING (NEW VERSION)
- Use React Router in `App.tsx` with:
  - `/login` public
  - authenticated shell routes protected via `ProtectedRoute` (outlet-style)
  - feature pages mounted under the authenticated shell

MOBILE LAYOUT + METRICS (KEEP VISUALS CONSISTENT)
- Keep `Screen` padding rules (from `src/components/ui/Screen.tsx`):
  - contentTopPadding: 12
  - scroll content paddingBottom: safe-area bottom + 24 (or equivalent)
  - default horizontal inset className: `px-4`

WEB LAYOUT (NEW VERSION)
- Use an authenticated app shell for protected pages.
- Desktop shell (≥1024px) must preserve the same visual system:
  - Left sidebar width 280px
  - Topbar height 56px
  - Content max width 1200px, centered, padding 24px
- Narrow layout (<1024px): stacked layout (no persistent sidebar).

Do not reuse Expo Web or React Navigation for Web.

NEW ROUTE MAP (SOURCE OF TRUTH)

Web (React Router)
- Public:
  - `/login`
- Protected (behind `ProtectedRoute`):
  - `/` (Dashboard)
  - `/clients`
  - `/tasks`
  - `/notes`
  - `/files`

Mobile (React Navigation)
- RootNavigator auth switch:
  - `Login`
  - Authenticated stack:
    - `Dashboard`
    - `Clients`
    - `ClientDetails`
    - `Tasks`
    - `Notes`
    - `Files`

ASSETS + DEEP LINKS (MUST MATCH)
- Background image used by `Screen`: `assets/sparqplugbg.png` (do not replace)
- Logo image used by auth: `assets/sparqpluglogo.png`
- URL scheme: `sparqplug`

SCREENS TO SCAFFOLD (ALL REQUIRED)
You must provide these screens/components so the app is complete, even if some are placeholders. They must still follow the exact design system.

AUTH
1) Login
- Must match existing `LoginScreen` layout:
  - White full background, safe area padding
  - Logo image at top (`assets/sparqpluglogo.png`) inside a centered container maxWidth 440
  - Card with SectionHeader, FloatingLabelInput fields, password eye icon button, submit pressable
  - Toggle Sign in/Sign up.
2) Register
- May be the same screen toggle as current; keep exact UX.

CORE
3) Dashboard
- Must match existing dashboard cards and metric tiles.
- Keep the upcoming Meet indigo banner behavior.
4) Clients
- List view must match the currently mounted Clients route:
  - Mirror the `AccountsScreen` layout: top `SectionHeader` (outside Card) + Card list of `ListRow`.
- Detail view must match current `ClientDetailsScreen`:
  - Top card with navigation rows: Tasks, Expenses, Reporting, Contract
  - Notes card containing NotesFeed
  - Files card containing FileManager
- Edit view:
  - Implement as StackModal (mobile) / modal or drawer (web)
  - Use FloatingLabelInput, SelectField, MultiSelectField.
5) Tasks
- Must match existing `TasksScreen` including:
  - Offline indicator row with Sync badge
  - Active tasks surface + Completed card
  - Admin FAB add button bottom-right
  - Add task modal.
- Add a Task detail screen and a Task edit screen if not already present; keep styling consistent.
6) Notes
- Add a Notes “global list” screen and a Note editor modal screen.
- The per-client NotesFeed must remain as is.
7) Files
- Add a Files “global list” screen and a File preview flow.
- The per-client FileManager must remain as is.

If you add Billing/Settings/Admin later, keep it consistent and protected (but do not invent it unless requirements explicitly ask for it).

COMPONENT LIBRARY (REQUIRED)
Create/ensure these components exist (reusing current primitives):
- Button (primary/secondary/ghost)
- Input (Floating label)
- Select, MultiSelect
- Textarea (multiline FloatingLabelInput)
- Card
- List item (ListRow)
- Avatar
- Badge
- Tabs (chip-style on mobile; tab row on web)
- Modal (StackModal + ModalSurface)
- Drawer (web only; mobile fallback to modal)
- Table (web only; use existing styling)
- Floating action button (mobile)
- Toast/notification (if you add, keep minimal and consistent)
- File uploader
- Client card
- Task card
- Note preview card

INTERACTION + STATES (MUST IMPLEMENT CONSISTENTLY)
- Loading states:
  - Use header action label swap: “Loading…” or “Please wait…”
  - Use spinners only when an existing screen already uses them; otherwise prefer inline “Loading…” text
- Empty states:
  - Use muted text `text-sm opacity-70`, spacing `py-6` or `py-8`
- Error states:
  - Use `statusText` via `Screen` where possible
  - Inline error: `text-xs text-red-600` only when already used (Profile)
- Disabled states:
  - Use opacity reduction (`opacity-40` / `opacity-50`)

DATA + INTEGRATION RULES (MUST MATCH NEW ARCH)

Shared package
- Create/use `packages/shared` (or equivalent workspace package) exported as `@sparq2/shared`.
- Put shared types/constants there (route names, resource names, DTOs, user roles).

Web (Vite React SPA)
- Entry: `main.tsx` mounts React and wraps with `BrowserRouter` + `AuthProvider`.
- Routing: `App.tsx` defines routes with React Router.
- Auth layer: `AuthProvider.tsx` listens to `onAuthStateChanged` and exposes:
  - `{ user, loading, loginWithEmail, loginWithGoogle, logout }`
- Protected access: `ProtectedRoute.tsx` redirects to `/login` when unauthenticated and otherwise renders nested routes.
- API client boundary: `apiClient.ts`
  - reads `VITE_API_BASE_URL`
  - gets `firebaseAuth.currentUser.getIdToken()`
  - sends `Authorization: Bearer <idToken>`
- Feature pages: CRUD-style pages use `CrudResourcePage.tsx` (list/create/delete) hitting API resource paths (`/clients`, `/tasks`, `/notes`, `/files`).

Mobile (Expo RN)
- Navigation: `RootNavigator.tsx` is the auth switch described above.
- Auth layer: `AuthProvider.tsx` exposes `{ user, loading, loginWithEmail, logout }`.
- Firebase client config: `firebaseClient.ts` uses RN persistence via AsyncStorage.
- API client boundary: `apiClient.ts`
  - reads `EXPO_PUBLIC_API_BASE_URL`
  - attaches `Authorization: Bearer <idToken>`
  - throws friendly errors for non-2xx responses

API (Express)
- Middleware: `auth.js` verifies Bearer Firebase ID token using Firebase Admin.
- Protected routes must require auth middleware.

Offline-aware behavior
- For offline-aware modules (tasks/notes/files):
  - Mirror existing logic: local store listing, “Offline mode” label, Sync action.

DELIVERABLES
- Create/organize the monorepo so each tier builds and runs.
- Ensure navigation links reach every screen end-to-end (no dead ends):
  - Web: navbar/sidebar links to Dashboard/Clients/Tasks/Notes/Files
  - Mobile: authenticated stack allows reaching Dashboard/Clients/ClientDetails/Tasks/Notes/Files

QUALITY GATES (RUN/VERIFY)
- Typecheck must pass: `npm run typecheck`
- Web must run: `npm run dev` (Vite)
- Mobile must run: `npm run start` (Expo)
- API must run (Express): `npm run dev` or equivalent

ACCEPTANCE CHECKLIST (YOU MUST SELF-VERIFY)
- Visual styling matches the existing primitives exactly:
  - Cards are white with `border-gray-200` and `rounded-2xl`
  - Inputs are floating-label with the same padding/label behavior
  - Modals use the same scrim and ModalSurface header/body spacing
- Web and Mobile both use Firebase Client SDK auth and send Bearer ID tokens to the API.
- API verifies Bearer tokens with Admin SDK before protected work.
- Every requested screen exists and is reachable via navigation.
- All UI copy uses “SparQ Plug”.

IMPORTANT
- Do not output a design doc. Implement the scaffolding in code.
- If anything is ambiguous, choose the simplest option that preserves the existing patterns.

---

## END PROMPT

---

### Notes
- This repo currently relies heavily on Tailwind default tokens via NativeWind. If you introduce any new tokens, they must map 1:1 to Tailwind defaults so visual output remains unchanged.
- For Web shell responsiveness, keep the internal `Screen`/`Card` styling untouched; only wrap screens with a layout container on web.
