# Smart Dictionary Pro - v5.0 Documentation

## ✅ Features Implemented

### 1. **Fixed Position Panel (Sticky UI)**
- ✅ `position: fixed !important;`
- ✅ Panel stays at `top: 20px; right: 20px`
- ✅ **Remains visible when scrolling** - perfect for comparing translation with original text
- ✅ `z-index: 2147483647` - never hidden by webpage elements

### 2. **Auto-Close on Click Outside**
- ✅ `mousedown` event listener on entire document
- ✅ Clicking **anywhere outside** the panel/button triggers `cleanup()`
- ✅ Deselecting text (clicking empty area) → panel disappears
- ✅ Clicking on panel or button → stays open

### 3. **Floating "Translate" Button**
- ✅ Appears at cursor position when text is selected
- ✅ Blue gradient background with icon
- ✅ `position: fixed` - follows viewport coordinates
- ✅ Only shows for text ≥ 2 characters

### 4. **Smart Display Logic**

**Single Word (≤ 1 word):**
```
┌─────────────────────────┐
│   account               │ ← Headword (bold, large)
│   /əˈkount/             │ ← IPA (Arial font)
│   noun                  │ ← Part of speech (italic, green)
├─────────────────────────┤
│ 1. [type] definition    │
│ 2. [type] definition    │
└─────────────────────────┘
```

**Phrase/Sentence (> 1 word):**
```
┌─────────────────────────┐
│ Bản dịch tiếng Việt:    │
│                         │
│ [Vietnamese text here]  │ ← Green gradient box
└─────────────────────────┘
```

### 5. **Complete DOM Cleanup**

```javascript
function cleanup() {
  // Remove button
  // Remove panel
  // Reset ALL state flags
  selectedText = null;
  isProcessing = false;
  buttonWasClicked = false;
  lastSelection = null;
}
```

## 🔄 User Flow

### **Scenario 1: Translate a paragraph**
1. Select paragraph → Blue "Translate" button appears
2. Click button → Button disappears
3. Result panel appears at top-right (fixed position)
4. **Scroll page** → Panel stays visible ✓
5. **Click outside** → Panel closes automatically ✓

### **Scenario 2: Look up single word**
1. Select "account" → Button appears
2. Click button → Panel shows:
   - Headword: "account"
   - IPA: `/əˈkaʊnt/` (Arial font)
   - Part of speech: "noun"
   - Definitions with examples

### **Scenario 3: Click outside**
1. Panel is showing
2. Click anywhere on page (outside panel)
3. **Panel closes immediately** ✓
4. No leftover UI elements

## 📐 Technical Details

### **CSS Positioning**

```css
/* Floating Button */
.floating-translate-btn {
  position: fixed !important;
  z-index: 2147483647 !important;
  /* Positioned at (pageX, pageY) via JavaScript */
}

/* Result Panel */
#sd-result-box {
  position: fixed !important;
  top: 20px !important;
  right: 20px !important;
  z-index: 2147483647 !important;
  /* NEVER moves when scrolling */
}
```

### **Event Handlers**

```javascript
// Detect text selection → Show button
document.addEventListener('mouseup', handleMouseUp, true);

// Click outside → Close panel
document.addEventListener('mousedown', handleMouseDown, true);
```

### **Auto-Close Logic**

```javascript
function handleMouseDown(e) {
  const btn = document.getElementById(BUTTON_ID);
  const panel = document.getElementById(PANEL_ID);
  
  // If clicking OUTSIDE button AND panel
  if (btn && !btn.contains(e.target)) {
    if (!panel || !panel.contains(e.target)) {
      cleanup(); // Close everything
    }
  }
}
```

## 🎨 Styling Highlights

- **All styles use `!important`** - Immune to website CSS
- **Dark mode** - Easy on the eyes
- **IPA font**: Arial (mandatory requirement)
- **Smooth animations** - Fade-in effects
- **Responsive** - Adapts to mobile screens

## 🚀 APIs Used

1. **Merriam-Webster Learner's Dictionary**
   - URL: `https://www.dictionaryapi.com/api/v3/references/learners/json`
   - Key: `e2c13113-989e-4b85-aa7e-8cb28e4b7198`
   - Used for: Single word lookups

2. **MyMemory Translation**
   - URL: `https://api.mymemory.translated.net/get`
   - Free, no key needed
   - Used for: English → Vietnamese translation

## 📋 Checklist

- ✅ Fixed position panel (top-right)
- ✅ Auto-close on click outside
- ✅ Floating button at selection
- ✅ IPA in Arial font
- ✅ Translation-only display for phrases
- ✅ Dictionary + IPA for single words
- ✅ Complete DOM cleanup
- ✅ No UI jumping
- ✅ z-index: 2147483647
- ✅ Smooth async/await
- ✅ No lag when scrolling
- ✅ All CSS uses `!important`

---

**Version:** 5.0  
**Last Updated:** 2026-04-08
