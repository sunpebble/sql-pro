## 2024-05-22 - [Missing Aria-Expanded in Custom Collapsibles]
**Learning:** The application implements custom collapsible sections (Schema, Tables, Views) using standard buttons but consistently omits the 'aria-expanded' attribute, making state invisible to screen readers.
**Action:** When encountering custom 'toggle' patterns in this codebase, explicitly check for and add 'aria-expanded' state attributes.
