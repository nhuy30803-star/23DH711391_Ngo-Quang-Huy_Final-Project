# Smart Dictionary Pro - v6.0 Changelog

## 🆕 What's New in v6.0

### 1. **Merriam-Webster Collegiate Dictionary API**
- ✅ Changed from Learner's API to **Collegiate Dictionary**
- ✅ New API URL: `https://www.dictionaryapi.com/api/v3/references/collegiate/json`
- ✅ New API Key: `c37d2b0f-51af-431d-a4de-b5cf85c88057`
- ✅ Extracts definitions from `shortdef` array (cleaner format)
- ✅ Better coverage of advanced vocabulary and academic terms

### 2. **Free Dictionary API for IPA**
- ✅ Dual-API strategy for dictionary lookups
- ✅ **Priority**: Free Dictionary API → IPA pronunciation
- ✅ **Fallback**: Collegiate Dictionary → MW pronunciation
- ✅ Parallel fetching with `Promise.allSettled()` for speed

### 3. **Improved Data Extraction**
```javascript
// Collegiate API structure
entry.hwi.hw      // Headword (remove *)
entry.shortdef    // Short definitions (clean array)
entry.fl          // Functional label (part of speech)
entry.hwi.prs     // Pronunciation (fallback)
```

### 4. **Clean Regex Processing**
```javascript
.replace(/\{.*?\}/g, '')  // {it}, {bc}, {sx}, etc.
.replace(/\[.*?\]/g, '')  // [tags]
.replace(/\*+/g, '')      // Remove all asterisks
.replace(/\s+/g, ' ')     // Normalize whitespace
```

## 🔧 Fixed Issues

### **Auto-Close Bug**
- ✅ `handleMouseDown` now calls `cleanup()` (not just `hideFloatingButton()`)
- ✅ Clicking outside → **both** button AND panel removed
- ✅ Clicking inside panel → panel stays open (can copy text)
- ✅ Deselecting text → panel closes automatically

### **UI Jumping Prevention**
- ✅ Both button and panel use `position: fixed`
- ✅ Button positioned with viewport coordinates (`pageX - scrollX`)
- ✅ Panel always at `top: 20px; right: 20px`
- ✅ No position conflicts, no jumping

## 📐 Architecture

### **API Flow for Single Word**
```
1. User clicks "Translate" button
2. ↓
3. Promise.allSettled([
     fetchCollegiateDictionary(word),  // Definitions
     fetchFreeDictionary(word)         // IPA
   ])
4. ↓
5. Extract IPA from Free Dictionary (priority)
6. Extract definitions from Collegiate (shortdef)
7. ↓
8. Render: Headword + IPA (Arial) + Definitions
```

### **API Flow for Phrase**
```
1. User clicks "Translate" button
2. ↓
3. fetchTranslation(text, 'en|vi')
4. ↓
5. Extract: data.responseData.translatedText
6. ↓
7. Render: Vietnamese translation only
```

## 🎯 Feature Checklist

- ✅ Collegiate Dictionary API with new key
- ✅ Free Dictionary API for IPA
- ✅ MyMemory Translation API (en|vi)
- ✅ Floating "Translate" button
- ✅ Fixed position panel (top-right)
- ✅ Auto-close on click outside
- ✅ No UI jumping
- ✅ IPA in Arial font
- ✅ Clean MW markup tags
- ✅ Suggestion buttons for misspelled words
- ✅ Error handling with Vietnamese messages
- ✅ Loading spinner
- ✅ Dark mode theme
- ✅ All CSS uses `!important`
- ✅ z-index: 2147483647
- ✅ manifest.json v3 with all permissions
- ✅ Firefox registration (browser_specific_settings)

## 📋 Manifest Permissions

```json
{
  "host_permissions": [
    "https://www.dictionaryapi.com/*",
    "https://api.dictionaryapi.dev/*",
    "https://api.mymemory.translated.net/*"
  ]
}
```

## 🚀 Testing

1. Load extension via `about:debugging`
2. Open Console to see debug logs
3. Select text on any webpage
4. Click "Translate" button
5. Verify:
   - Panel appears at top-right (fixed)
   - IPA shows in Arial font
   - Scroll page → panel stays visible
   - Click outside → panel closes
   - Single word → dictionary + IPA
   - Phrase → Vietnamese translation

---

**Version:** 6.0.0  
**API:** Merriam-Webster Collegiate + Free Dictionary + MyMemory  
**Date:** 2026-04-08
