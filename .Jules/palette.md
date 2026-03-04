## 2026-03-04 - Cart Item and Drawer Icon Buttons Accessibility
**Learning:** Icon-only buttons in cart components (CartItem and CartDrawer) lacked ARIA labels, presenting a common accessibility pattern in this app's UI components where descriptive labels are often omitted in favor of icons.
**Action:** When adding or modifying icon-only buttons in this codebase, explicitly check for and add appropriate Turkish `aria-label` attributes to ensure screen reader compatibility.
