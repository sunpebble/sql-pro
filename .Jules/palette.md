## 2025-05-20 - [Accessibility] Labeling Inputs in Dialogs
**Learning:** `Input` components in `PasswordDialog` were missing associated labels, relying only on placeholders. `Label` component from `@sqlpro/ui` works well as a wrapper or with `htmlFor`.
**Action:** When auditing dialogs, always check for hidden labels (`sr-only`) on inputs that rely on visual context/placeholders.
