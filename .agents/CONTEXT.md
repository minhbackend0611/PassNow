# PassNow Project Context & Design System

## 1. Technical Stack
- **Frontend**: React 18.3, TypeScript 5.4, Vite 5, Tailwind CSS 3.4
- **State Management**: Zustand 4
- **Routing**: React Router v6
- **Forms**: React Hook Form 7 + Zod
- **Backend as a Service**: Firebase SDK 10 (Auth, Firestore, Storage, Realtime Database)
- **UI Components**: shadcn/ui (Radix UI primitives)

---

## 2. Design System Tokens (from DESIGN.md)

### Colors (HSL / Hex representation)
- **Primary (Sustainability Green)**: `#006b2c` / `--color-primary`
- **Secondary (Amber Gold)**: `#855300` / `--color-secondary`
- **Secondary Container (CTA/Highlight)**: `#fea619`
- **Surface**: `#f4fcf0`
- **Background**: `#f4fcf0`
- **Surface Container Lowest**: `#ffffff` (Base surface for cards)
- **Text (On Surface)**: `#171d16`
- **Muted Text (On Surface Variant)**: `#3e4a3d`
- **Outline**: `#6e7b6c`
- **Outline Variant**: `#bdcaba`

### Typography (Inter Font)
- **Headline XL**: font-size: 36px, line-height: 44px, font-weight: 700
- **Headline XL Mobile**: font-size: 28px, line-height: 34px, font-weight: 700
- **Headline LG**: font-size: 24px, line-height: 32px, font-weight: 600
- **Headline MD**: font-size: 20px, line-height: 28px, font-weight: 600
- **Body LG**: font-size: 18px, line-height: 28px, font-weight: 400
- **Body MD**: font-size: 16px, line-height: 24px, font-weight: 400
- **Body SM**: font-size: 14px, line-height: 20px, font-weight: 400
- **Label MD**: font-size: 14px, line-height: 20px, font-weight: 500
- **Label SM**: font-size: 12px, line-height: 16px, font-weight: 600

### Border Radius & Spacing
- **Default Radius**: `rounded-2xl` (16px) for cards, `rounded-lg` (8px) for buttons/inputs
- **Base Spacing Grid**: Multiples of 8px
  - `stack-xs`: 4px
  - `stack-sm`: 8px
  - `stack-md`: 16px
  - `stack-lg`: 32px
  - `gutter`: 24px
  - `margin-mobile`: 16px

---

## 3. UI/UX Rules
- **Responsive Layout**: Mobile-first design.
- **Bottom Navigation**: Used on mobile; top/side nav on desktop.
- **Tonal Elevation**: Pure White (#FFFFFF) surfaces with a thin border (`border-outline-variant`) and a very soft shadow.
- **Micro-animations**: Subtle transitions on interactive elements.
- **No Native Alert Dialogs**: Use `sonner` toast notification or custom modals.
