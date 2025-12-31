# QEP AISolve — Design Direction: Modern SaaS

> Clean, bright, trustworthy. Professional but approachable. Premium without being intimidating.

---

## Brand Essence

**Positioning**: "Strategic consulting made accessible"
**Feel**: Confident, clear, competent — like a trusted advisor who speaks plainly
**Avoid**: Stuffy corporate, generic startup, overly playful

---

## Color Palette

```css
:root {
  /* Primary - Deep Blue (Trust, Authority) */
  --primary-50: #EEF4FF;
  --primary-100: #E0EAFF;
  --primary-200: #C7D7FE;
  --primary-500: #4F6EF7;
  --primary-600: #3B5BDB;
  --primary-700: #2F4AC7;
  --primary-900: #1E2A5E;

  /* Neutral - Warm Gray (Approachable, Not Cold) */
  --gray-50: #FAFAFA;
  --gray-100: #F4F4F5;
  --gray-200: #E4E4E7;
  --gray-300: #D1D5DB;
  --gray-500: #71717A;
  --gray-700: #3F3F46;
  --gray-900: #18181B;

  /* Accent - Teal (Fresh, Modern) */
  --accent-400: #2DD4BF;
  --accent-500: #14B8A6;
  --accent-600: #0D9488;

  /* Semantic */
  --success: #10B981;
  --warning: #F59E0B;
  --error: #EF4444;

  /* Alchemy Section - Warm Highlight */
  --alchemy-bg: #FFFBEB;
  --alchemy-border: #F59E0B;
  --alchemy-text: #92400E;

  /* Backgrounds */
  --bg-primary: #FFFFFF;
  --bg-secondary: #FAFAFA;
  --bg-tertiary: #F4F4F5;
}
```

### Tailwind Config Addition

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EEF4FF',
          100: '#E0EAFF',
          200: '#C7D7FE',
          500: '#4F6EF7',
          600: '#3B5BDB',
          700: '#2F4AC7',
          900: '#1E2A5E',
        },
        accent: {
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
        },
        alchemy: {
          bg: '#FFFBEB',
          border: '#F59E0B',
          text: '#92400E',
        }
      }
    }
  }
}
```

---

## Typography

### Font Stack

```css
/* Primary: Plus Jakarta Sans (Modern, Friendly, Professional) */
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

/* Mono: JetBrains Mono (Code, Technical) */
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

### Tailwind Config Addition

```javascript
// tailwind.config.js
fontFamily: {
  sans: ['Plus Jakarta Sans', ...defaultTheme.fontFamily.sans],
  mono: ['JetBrains Mono', ...defaultTheme.fontFamily.mono],
}
```

### Type Scale

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| H1 (Page Title) | 36px / text-4xl | 700 | 1.2 |
| H2 (Section) | 24px / text-2xl | 600 | 1.3 |
| H3 (Subsection) | 20px / text-xl | 600 | 1.4 |
| Body | 16px / text-base | 400 | 1.6 |
| Body Small | 14px / text-sm | 400 | 1.5 |
| Label | 12px / text-xs | 500 | 1.4 |

---

## Component Styling

### Buttons

```jsx
// Primary Button
<button className="
  bg-primary-600 hover:bg-primary-700 
  text-white font-medium
  px-5 py-2.5 rounded-lg
  transition-all duration-200
  shadow-sm hover:shadow-md
  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
">
  Get Started
</button>

// Secondary Button
<button className="
  bg-white hover:bg-gray-50
  text-gray-700 font-medium
  px-5 py-2.5 rounded-lg
  border border-gray-300 hover:border-gray-400
  transition-all duration-200
  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
">
  Learn More
</button>

// Ghost Button
<button className="
  text-primary-600 hover:text-primary-700
  font-medium px-4 py-2
  hover:bg-primary-50 rounded-lg
  transition-all duration-200
">
  Cancel
</button>
```

### Cards

```jsx
// Standard Card
<div className="
  bg-white rounded-xl
  border border-gray-200
  shadow-sm hover:shadow-md
  transition-shadow duration-200
  p-6
">
  {/* Card content */}
</div>

// Elevated Card (for important content)
<div className="
  bg-white rounded-xl
  shadow-lg
  p-6
">
  {/* Card content */}
</div>

// Alchemy Section Card
<div className="
  bg-alchemy-bg rounded-xl
  border border-alchemy-border
  p-6
">
  <div className="flex items-center gap-2 mb-4">
    <span className="text-alchemy-border">✦</span>
    <h3 className="font-semibold text-alchemy-text">Counterintuitive Options</h3>
  </div>
  {/* Alchemy content */}
</div>
```

### Input Fields

```jsx
<input 
  type="text"
  className="
    w-full px-4 py-3
    bg-white border border-gray-300
    rounded-lg
    text-gray-900 placeholder-gray-400
    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
    transition-all duration-200
  "
  placeholder="Describe your business challenge..."
/>
```

### Chat Interface

```jsx
// User Message
<div className="flex justify-end">
  <div className="
    bg-primary-600 text-white
    rounded-2xl rounded-br-md
    px-4 py-3 max-w-[80%]
  ">
    {message}
  </div>
</div>

// Assistant Message
<div className="flex justify-start">
  <div className="
    bg-gray-100 text-gray-900
    rounded-2xl rounded-bl-md
    px-4 py-3 max-w-[80%]
  ">
    {message}
  </div>
</div>

// Chat Input Area
<div className="
  border-t border-gray-200 bg-white
  p-4
">
  <div className="
    flex items-end gap-3
    bg-gray-50 rounded-xl
    border border-gray-200
    p-2
  ">
    <textarea className="
      flex-1 resize-none
      bg-transparent border-none
      focus:outline-none
      px-3 py-2
      max-h-32
    " />
    <button className="
      bg-primary-600 hover:bg-primary-700
      text-white p-2.5 rounded-lg
      transition-colors
    ">
      <SendIcon className="w-5 h-5" />
    </button>
  </div>
</div>
```

### Navigation

```jsx
// Top Navigation
<nav className="
  bg-white border-b border-gray-200
  px-6 py-4
  sticky top-0 z-50
">
  <div className="flex items-center justify-between max-w-7xl mx-auto">
    {/* Logo */}
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
        <span className="text-white font-bold text-sm">Q</span>
      </div>
      <span className="font-semibold text-gray-900">QEP AISolve</span>
    </div>
    
    {/* Nav Links */}
    <div className="flex items-center gap-6">
      <a href="#" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
        Dashboard
      </a>
      <a href="#" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
        History
      </a>
      <button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
        New Decision
      </button>
    </div>
  </div>
</nav>
```

---

## Spacing System

Use Tailwind's default spacing scale consistently:

| Use Case | Value |
|----------|-------|
| Component padding | p-4 (16px) or p-6 (24px) |
| Section margin | my-8 (32px) or my-12 (48px) |
| Element gaps | gap-2 (8px), gap-4 (16px), gap-6 (24px) |
| Card padding | p-6 (24px) |
| Button padding | px-5 py-2.5 |

---

## Shadows

```javascript
// tailwind.config.js
boxShadow: {
  'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
}
```

---

## Micro-Interactions

### Hover States
- Buttons: Darken background, lift with shadow
- Cards: Subtle shadow increase
- Links: Color shift, no underline

### Transitions
```css
/* Default transition for interactive elements */
transition-all duration-200 ease-in-out
```

### Loading States
```jsx
// Skeleton Loader
<div className="animate-pulse">
  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
</div>

// Spinner
<div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-600 border-t-transparent"></div>
```

---

## Page Layouts

### Landing Page Structure
```jsx
<div className="min-h-screen bg-white">
  {/* Hero */}
  <section className="bg-gradient-to-b from-primary-50 to-white py-20 px-6">
    <div className="max-w-4xl mx-auto text-center">
      <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
        Move fast without getting exposed.
      </h1>
      <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
        From messy business question to board-ready strategic plan — 
        with the rationale, risks, and unconventional options already mapped out.
      </p>
      <button className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all">
        Start Your First Decision — Free
      </button>
    </div>
  </section>
  
  {/* Features */}
  <section className="py-20 px-6">
    <div className="max-w-6xl mx-auto">
      {/* Feature grid */}
    </div>
  </section>
</div>
```

### App Shell (Dashboard/Chat)
```jsx
<div className="min-h-screen bg-gray-50">
  {/* Fixed Nav */}
  <nav className="fixed top-0 w-full bg-white border-b border-gray-200 z-50">
    {/* Nav content */}
  </nav>
  
  {/* Main Content */}
  <main className="pt-16"> {/* Offset for fixed nav */}
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Page content */}
    </div>
  </main>
</div>
```

---

## Document View Styling

```jsx
// Strategic Document Container
<article className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
  {/* Header */}
  <header className="bg-primary-900 text-white px-8 py-6">
    <p className="text-primary-200 text-sm font-medium mb-2">Strategic Decision</p>
    <h1 className="text-2xl font-bold">{documentTitle}</h1>
    <p className="text-primary-200 mt-2">{date}</p>
  </header>
  
  {/* SCQA Summary */}
  <section className="px-8 py-6 bg-primary-50 border-b border-primary-100">
    <h2 className="text-lg font-semibold text-primary-900 mb-4">Executive Summary</h2>
    {/* SCQA content */}
  </section>
  
  {/* Main Sections */}
  <section className="px-8 py-6 border-b border-gray-100">
    <h2 className="text-xl font-semibold text-gray-900 mb-4">Situation Analysis</h2>
    {/* Content */}
  </section>
  
  {/* Alchemy Section */}
  <section className="px-8 py-6 bg-alchemy-bg">
    <div className="flex items-center gap-2 mb-4">
      <span className="text-2xl">✦</span>
      <h2 className="text-xl font-semibold text-alchemy-text">Counterintuitive Options</h2>
    </div>
    {/* Alchemy content */}
  </section>
</article>
```

---

## Icons

Use **Lucide React** (already likely installed):

```jsx
import { 
  Send, 
  FileText, 
  BarChart3, 
  Settings, 
  Plus,
  ChevronRight,
  Sparkles, // For Alchemy
  CheckCircle,
  AlertCircle
} from 'lucide-react';

// Usage
<Send className="w-5 h-5" />
```

---

## Implementation Checklist

When applying this design:

- [ ] Update `tailwind.config.js` with colors and fonts
- [ ] Add Google Fonts import to `globals.css` or `layout.tsx`
- [ ] Update button components
- [ ] Update card components
- [ ] Update navigation
- [ ] Update chat interface
- [ ] Update document view
- [ ] Update form inputs
- [ ] Add loading states
- [ ] Test responsive behavior

---

## Responsive Breakpoints

```css
/* Mobile first */
sm: 640px   /* Small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
```

Key adjustments:
- Stack navigation on mobile
- Full-width cards on mobile
- Reduce heading sizes on mobile
- Collapsible sidebar on tablet/mobile

---

## Summary

| Element | Choice |
|---------|--------|
| **Primary Color** | Deep Blue (#3B5BDB) |
| **Accent** | Teal (#14B8A6) |
| **Font** | Plus Jakarta Sans |
| **Corners** | Rounded (lg/xl) |
| **Shadows** | Subtle, layered |
| **Feel** | Clean, trustworthy, premium |
