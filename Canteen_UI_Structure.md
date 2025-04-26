
# Canteen Based Group Money Management - UI Structure

## Core Idea:
Create a **canteen-based group money management system** where users can log in, create groups, add members, manage balances, and purchase items.  
**Focus**: Build a **beautiful, professional-looking UI** with hover effects, smooth transitions, rounded corners, and the following color scheme:  
- Dark Red: `#D84040`
- Deep Red: `#A31D1D`
- Light Beige: `#ECDCBF`
- Very Light Beige: `#F8F2DE`  
Use **professional fonts** throughout the design.

---

## Pages and UI Structure:

### 1. Login Page
- Centered login form.
- Inputs for:
  - Username
  - Password
- Rounded input boxes.
- Smooth hover effects on inputs and buttons.
- Button: **Login** (transitions into Dashboard).
- Background: Light (`#F8F2DE`) with deep red accents (`#D84040`).

---

### 2. Dashboard Page
- Display:
  - Username (top corner or header).
  - Current Balance (centered or header area).
- **Create Group** Button:
  - Prominent, rounded, deep red button.
  - Hover enlarges slightly with a color darken effect.
- White Card Box:
  - Rounded corners.
  - Soft shadow.
  - Inside:
    - **Add Member** Section:
      - Inputs:
        - Member Username
        - Member Password
      - Add Multiple Members functionality.
    - **Proceed** Button:
      - On click, transition effect.
      - Transfers member balances to the creator's balance.

---

### 3. Buy Items Page
- Display 10 random canteen items.
- Item Cards:
  - Light backgrounds (`#ECDCBF`), slight shadow.
  - Hover effect: Card lifts with soft shadow increase.
  - Rounded corners.
  - Smooth transitions between hover states.
- Each Card:
  - Item Name (bold).
  - Item Price.
  - Add to Cart button (deep red, rounded).
- Layout:
  - Grid (3x3 or 4x3).
  - Soft spacing between cards.
- Header and navbar styled consistently with theme colors.

---

## UI Requirements:
- **Color Scheme**: `#D84040`, `#A31D1D`, `#ECDCBF`, `#F8F2DE`
- **Fonts**: Professional, clean fonts (e.g., Poppins, Roboto, Open Sans).
- **Hover Effects**: Buttons, Cards, Inputs.
- **Smooth Transitions**: Everywhere (use CSS transitions).
- **Rounded Corners**: Inputs, buttons, cards, boxes.
- **SvelteKiit , Node ,Postgres ,Express , Only basic CSS , JS (No TS) ,.
- **Consistent Layouts**: Padding, margin, shadows to create a clean professional UI.

---

> **Note**: This file focuses ONLY on the UI creation part. Backend logic (Node.js, Express, PostgreSQL) will be connected later separately.
