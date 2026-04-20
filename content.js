/**
 * Smart Dictionary Pro - Content Script v8.0
 * 
 * STRICT SELECTION LOGIC:
 * - 1 word ONLY → Instant dictionary (no button)
 * - 2+ words → "Translate" button ONLY (no dictionary box)
 * 
 * APIs:
 * - Merriam-Webster Collegiate Dictionary
 * - Free Dictionary API (for IPA)
 * - MyMemory Translation API (for phrases)
 */

(function () {
  'use strict';

  // ============================================================
  // CONFIGURATION
  // ============================================================
  const CONFIG = {
    API_KEYS: {
      MERRIAM_WEBSTER: 'c37d2b0f-51af-431d-a4de-b5cf85c88057'
    },
    API_URLS: {
      MERRIAM_WEBSTER: 'https://www.dictionaryapi.com/api/v3/references/collegiate/json',
      FREE_DICTIONARY: 'https://api.dictionaryapi.dev/api/v2/entries',
      MYMEMORY_TRANSLATE: 'https://api.mymemory.translated.net/get'
    },
    UI: {
      PANEL_ID: 'sd-result-box',
      BUTTON_ID: 'sd-floating-translate-btn'
    }
  };

  // State
  let selectedText = null;
  let isProcessing = false;

  // ============================================================
  // CLEANUP - Remove ALL UI elements definitively
  // ============================================================

  function cleanup() {
    // Remove floating button
    const button = document.getElementById(CONFIG.UI.BUTTON_ID);
    if (button) {
      button.parentNode.removeChild(button);
      console.log('[SD] ✓ Button removed');
    }

    // Remove result panel - force removal from DOM
    const panel = document.getElementById(CONFIG.UI.PANEL_ID);
    if (panel) {
      panel.classList.remove('sd-show');
      // Use requestAnimationFrame to ensure transition completes before removal
      requestAnimationFrame(() => {
        if (panel.parentNode) {
          panel.parentNode.removeChild(panel);
        }
      });
      console.log('[SD] ✓ Panel removed');
    }

    // Reset state
    selectedText = null;
    isProcessing = false;
  }

  // ============================================================
  // TEXT UTILITIES
  // ============================================================

  /**
   * Clean Merriam-Webster markup tags
   */
  function cleanText(text) {
    if (!text || typeof text !== 'string') return '';
    return text
      .replace(/\{.*?\}/g, '')  // Remove {it}, {bc}, {sx}, etc.
      .replace(/\[.*?\]/g, '')  // Remove [tags]
      .replace(/\*+/g, '')      // Remove asterisks
      .replace(/\s+/g, ' ')     // Normalize whitespace
      .trim();
  }

  /**
   * Count words in text
   */
  function countWords(text) {
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    return words.length;
  }

  // ============================================================
  // FLOATING BUTTON - Only for multi-word translation
  // ============================================================

  function showFloatingButton(pageX, pageY, text) {
    // Clean up old UI first
    cleanup();

    selectedText = text;

    // Create button element
    const btn = document.createElement('div');
    btn.id = CONFIG.UI.BUTTON_ID;
    btn.className = 'floating-translate-btn';
    btn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"/>
      </svg>
      <span>Translate</span>
    `;

    // Convert page coordinates to viewport coordinates
    const viewportX = pageX - window.scrollX;
    const viewportY = pageY - window.scrollY;

    // Button dimensions
    const btnWidth = 110;
    const btnHeight = 36;

    // Position with bounds checking
    const finalX = Math.min(viewportX + 15, window.innerWidth - btnWidth - 10);
    const finalY = Math.max(10, Math.min(viewportY + 15, window.innerHeight - btnHeight - 10));

    // Apply fixed positioning
    btn.style.position = 'fixed';
    btn.style.left = finalX + 'px';
    btn.style.top = finalY + 'px';
    btn.style.zIndex = '2147483647';

    // Click handler - translate the phrase
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      e.preventDefault();
      e.stopImmediatePropagation();

      console.log('[SD] 🖱️ Translate button clicked');
      translatePhrase(selectedText);
    });

    // Prevent mousedown from bubbling
    btn.addEventListener('mousedown', function(e) {
      e.stopPropagation();
    });

    document.body.appendChild(btn);
    console.log('[SD] ✓ Button shown at:', finalX, finalY);
  }

  // ============================================================
  // API FUNCTIONS
  // ============================================================

  async function fetchCollegiateDictionary(word) {
    const url = `${CONFIG.API_URLS.MERRIAM_WEBSTER}/${encodeURIComponent(word)}?key=${CONFIG.API_KEYS.MERRIAM_WEBSTER}`;
    console.log('[SD] 📖 Dictionary URL:', url);

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      console.log('[SD] 📖 Dictionary Response:', JSON.stringify(data, null, 2));
      return { success: true, data };

    } catch (error) {
      console.error('[SD] ❌ Dictionary Error:', error);
      return { success: false, error: error.message };
    }
  }

  async function fetchFreeDictionary(word) {
    const url = `${CONFIG.API_URLS.FREE_DICTIONARY}/${encodeURIComponent(word)}`;
    console.log('[SD] 📚 Free Dictionary URL:', url);

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      console.log('[SD] 📚 Free Dictionary Response:', JSON.stringify(data, null, 2));
      return { success: true, data };

    } catch (error) {
      console.error('[SD] ❌ Free Dictionary Error:', error);
      return { success: false, error: error.message };
    }
  }

  async function fetchTranslation(text) {
    const url = `${CONFIG.API_URLS.MYMEMORY_TRANSLATE}?q=${encodeURIComponent(text)}&langpair=en|vi`;
    console.log('[SD] 🌐 Translation URL:', url);

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      console.log('[SD] 🌐 Translation Response:', JSON.stringify(data, null, 2));
      return { success: true, data };

    } catch (error) {
      console.error('[SD] ❌ Translation Error:', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================================
  // DATA PARSING
  // ============================================================

  function extractIPAFromFreeDictionary(freeDictData) {
    if (!freeDictData || !Array.isArray(freeDictData) || freeDictData.length === 0) {
      return null;
    }

    const entry = freeDictData[0];
    if (!entry || !entry.phonetics) return null;

    // Find IPA pronunciation (starts with /)
    for (const phonetic of entry.phonetics) {
      if (phonetic.text && phonetic.text.startsWith('/')) {
        console.log('[SD] 🔊 Found IPA:', phonetic.text);
        return phonetic.text;
      }
    }

    return null;
  }

  function parseCollegiateResponse(data) {
    console.log('[SD] 🔍 Parsing Collegiate data...');

    if (!data || !Array.isArray(data) || data.length === 0) {
      return { type: 'error', message: 'No data returned' };
    }

    // Handle suggestions (word not found)
    if (typeof data[0] === 'string') {
      return {
        type: 'suggestions',
        suggestions: data.slice(0, 5).filter(s => typeof s === 'string')
      };
    }

    try {
      const entry = data[0];

      // Extract headword (clean asterisks)
      let headword = 'Unknown';
      if (entry.hwi && entry.hwi.hw) {
        headword = cleanText(entry.hwi.hw);
      } else if (entry.meta && entry.meta.id) {
        headword = cleanText(entry.meta.id.split(':')[0]);
      }
      console.log('[SD] 📝 Headword:', headword);

      // Extract definitions from shortdef
      const definitions = [];
      if (entry.shortdef && Array.isArray(entry.shortdef)) {
        entry.shortdef.forEach((def, idx) => {
          if (idx >= 5) return;
          const cleanDef = cleanText(def);
          if (cleanDef) {
            definitions.push(cleanDef);
          }
        });
      }

      // Fallback: try dt array
      if (definitions.length === 0 && entry.def && Array.isArray(entry.def)) {
        entry.def.forEach((defItem, idx) => {
          if (idx >= 5 || definitions.length >= 5) return;
          if (defItem && defItem.dt && Array.isArray(defItem.dt)) {
            defItem.dt.forEach(dt => {
              if (dt && typeof dt === 'object') {
                const text = cleanText(dt.text || dt.$t || '');
                if (text && definitions.length < 5) {
                  definitions.push(text);
                }
              } else if (typeof dt === 'string') {
                const text = cleanText(dt);
                if (text && definitions.length < 5) {
                  definitions.push(text);
                }
              }
            });
          }
        });
      }

      // Extract part of speech
      const partOfSpeech = cleanText(entry.fl || '');

      // Extract pronunciation from MW (fallback)
      let mwPronunciation = null;
      if (entry.hwi && entry.hwi.prs && entry.hwi.prs.length > 0) {
        const pr = entry.hwi.prs[0];
        if (pr && pr.mw) {
          mwPronunciation = `/${pr.mw}/`;
        }
      }

      console.log('[SD] ✅ Extracted:', definitions.length, 'definitions');

      if (definitions.length === 0) {
        return { type: 'error', message: 'No definitions found' };
      }

      return {
        type: 'definition',
        headword,
        ipa: mwPronunciation,
        partOfSpeech,
        definitions
      };

    } catch (error) {
      console.error('[SD] ❌ Parse error:', error);
      return { type: 'error', message: 'Error parsing data: ' + error.message };
    }
  }

  // ============================================================
  // RESULT PANEL - Fixed at top-right corner WITH SMOOTH TRANSITIONS
  // ============================================================

  function createPanel() {
    cleanup();

    const panel = document.createElement('div');
    panel.id = CONFIG.UI.PANEL_ID;

    // Fixed positioning - always at top-right
    panel.style.position = 'fixed';
    panel.style.top = '20px';
    panel.style.right = '20px';
    panel.style.zIndex = '2147483647';

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'sd-close-btn';
    closeBtn.innerHTML = '✕';
    closeBtn.title = 'Đóng';
    closeBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      cleanup();
    });

    // Content
    const content = document.createElement('div');
    content.className = 'sd-panel-content';

    panel.appendChild(closeBtn);
    panel.appendChild(content);
    document.body.appendChild(panel);

    // Trigger smooth appearance with requestAnimationFrame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        panel.classList.add('sd-show');
      });
    });

    console.log('[SD] ✓ Panel created (smooth transition)');
    return content;
  }

  function renderLoading() {
    const content = createPanel();
    content.innerHTML = '<div class="sd-loading">Đang xử lý...</div>';
  }

  function renderDictionary(headword, ipa, partOfSpeech, definitions) {
    const content = createPanel();

    // Build complete HTML string BEFORE setting innerHTML (single render)
    let html = '';

    // Headword
    html += `<div class="sd-headword">${headword}</div>`;

    // IPA (Arial font)
    if (ipa) {
      html += `<div class="sd-ipa">${ipa}</div>`;
    }

    // Part of speech
    if (partOfSpeech) {
      html += `<div class="sd-pos">${partOfSpeech}</div>`;
    }

    // Definitions
    if (definitions && definitions.length > 0) {
      html += '<div class="sd-divider"></div>';
      html += '<div class="sd-definitions">';
      definitions.forEach((def, idx) => {
        html += '<div class="sd-def">';
        html += `<span class="sd-def-num">${idx + 1}.</span>`;
        html += `<div class="sd-def-text">${def}</div>`;
        html += '</div>';
      });
      html += '</div>';
    }

    // Set innerHTML ONCE after all data is prepared
    content.innerHTML = html;
    console.log('[SD] ✓ Dictionary rendered (single render pass)');
  }

  function renderTranslation(translatedText) {
    const content = createPanel();

    // Build complete HTML string BEFORE setting innerHTML (single render)
    let html = '';

    // Label
    html += '<div class="sd-trans-label">Bản dịch tiếng Việt:</div>';

    // Translation result
    html += `<div class="sd-trans-text">${translatedText}</div>`;

    // Set innerHTML ONCE after all data is prepared
    content.innerHTML = html;
    console.log('[SD] ✓ Translation rendered (single render pass)');
  }

  function renderSuggestions(suggestions) {
    const content = createPanel();

    let html = '';
    html += '<div class="sd-not-found">';
    html += '<div class="sd-not-found-title">Không tìm thấy từ</div>';
    html += '<div class="sd-not-found-text">Có thể bạn muốn:</div>';
    html += '<div class="sd-suggestions">';

    suggestions.forEach(word => {
      html += `<button class="sd-suggest-btn" data-word="${word}">${word}</button>`;
    });

    html += '</div></div>';
    content.innerHTML = html;

    // Re-bind suggestion buttons
    content.querySelectorAll('.sd-suggest-btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const word = this.getAttribute('data-word');
        if (word) {
          cleanup();
          lookupWord(word);
        }
      });
    });
  }

  function renderError(message) {
    const content = createPanel();
    content.innerHTML = `
      <div class="sd-error">
        <div class="sd-error-icon">⚠️</div>
        <div class="sd-error-title">Lỗi kết nối</div>
        <div class="sd-error-text">${message}</div>
        <div class="sd-error-hint">Vui lòng thử lại</div>
      </div>
    `;
    console.error('[SD] ❌ Error shown:', message);
  }

  // ============================================================
  // CASE 1: DICTIONARY LOOKUP (Single word ONLY)
  // ============================================================

  async function lookupWord(word) {
    if (!word || !word.trim() || isProcessing) return;

    isProcessing = true;
    const cleanWord = word.trim().toLowerCase();

    console.log('[SD] 🔍 Dictionary lookup (1 word):', cleanWord);

    // Show loading panel (creates panel once)
    renderLoading();

    try {
      // Fetch both APIs in parallel
      const [collegiateResult, freeDictResult] = await Promise.allSettled([
        fetchCollegiateDictionary(cleanWord),
        fetchFreeDictionary(cleanWord)
      ]);

      console.log('[SD] 📊 Both API calls completed');

      // Extract IPA from Free Dictionary (priority)
      let ipa = null;
      if (freeDictResult.status === 'fulfilled' && freeDictResult.value.success) {
        ipa = extractIPAFromFreeDictionary(freeDictResult.value.data);
      }

      // Process Collegiate Dictionary
      if (collegiateResult.status === 'fulfilled' && collegiateResult.value.success) {
        const parsed = parseCollegiateResponse(collegiateResult.value.data);

        if (parsed.type === 'error') {
          renderError(parsed.message || 'Không tìm thấy dữ liệu');
        } else if (parsed.type === 'suggestions') {
          renderSuggestions(parsed.suggestions);
        } else if (parsed.type === 'definition') {
          // Use Free Dictionary IPA if available, otherwise use MW IPA
          const finalIPA = ipa || parsed.ipa;
          renderDictionary(parsed.headword, finalIPA, parsed.partOfSpeech, parsed.definitions);
        } else {
          renderError('Định dạng không hợp lệ');
        }
      } else {
        renderError('Lỗi kết nối, vui lòng thử lại');
      }

    } catch (error) {
      console.error('[SD] ❌ Error:', error);
      renderError('Lỗi kết nối, vui lòng thử lại');
    } finally {
      isProcessing = false;
    }
  }

  // ============================================================
  // CASE 2: TRANSLATE PHRASE (Multiple words ONLY)
  // ============================================================

  async function translatePhrase(text) {
    if (!text || !text.trim() || isProcessing) return;

    isProcessing = true;
    const cleanText_val = text.trim();

    console.log('[SD] 🌐 Translation (>1 word):', cleanText_val);

    // Hide button
    const btn = document.getElementById(CONFIG.UI.BUTTON_ID);
    if (btn) btn.remove();

    // Show loading
    renderLoading();

    try {
      const result = await fetchTranslation(cleanText_val);

      if (!result.success) {
        renderError('Lỗi kết nối, vui lòng thử lại');
        return;
      }

      const data = result.data;

      if (data && data.responseData && data.responseData.translatedText) {
        renderTranslation(data.responseData.translatedText);
      } else {
        renderError('Không có bản dịch');
      }

    } catch (error) {
      console.error('[SD] ❌ Error:', error);
      renderError('Lỗi kết nối, vui lòng thử lại');
    } finally {
      isProcessing = false;
    }
  }

  // ============================================================
  // MAIN SELECTION HANDLER - STRICT LOGIC SPLIT
  // ============================================================

  function handleSelection(text, pageX, pageY) {
    if (!text || !text.trim()) return;

    const cleanText_val = text.trim();

    // WORD COUNT LOGIC - STRICT SPLIT
    const words = cleanText_val.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;

    console.log('[SD] 📝 Selected:', cleanText_val);
    console.log('[SD] 🔢 Word count:', wordCount, 'words');

    // CASE 1: Single word → Instant dictionary (NO button)
    if (wordCount === 1) {
      console.log('[SD] ✅ CASE 1: Single word - Instant dictionary');
      lookupWord(cleanText_val);
    }
    // CASE 2: Multiple words → Show "Translate" button ONLY
    else if (wordCount > 1) {
      console.log('[SD] ✅ CASE 2: Multiple words - Show translate button');
      showFloatingButton(pageX, pageY, cleanText_val);
    }
  }

  // ============================================================
  // EVENT HANDLERS
  // ============================================================

  function handleMouseUp(e) {
    // Small delay to ensure selection is complete
    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection?.toString()?.trim();

      // No text selected → cleanup
      if (!text || text.length === 0) {
        cleanup();
        return;
      }

      const cleanSel = text.replace(/\s+/g, ' ').trim();

      // Too short → cleanup
      if (cleanSel.length < 2) {
        cleanup();
        return;
      }

      // Handle selection (dictionary or translation)
      handleSelection(cleanSel, e.pageX, e.pageY);
    }, 50);
  }

  function handleMouseDown(e) {
    const btn = document.getElementById(CONFIG.UI.BUTTON_ID);
    const panel = document.getElementById(CONFIG.UI.PANEL_ID);

    console.log('[SD] 🖱️ Mousedown detected');

    // Check what was clicked
    const clickedOnButton = btn && btn.contains(e.target);
    const clickedOnPanel = panel && panel.contains(e.target);

    // Clicked OUTSIDE both → cleanup EVERYTHING
    if (!clickedOnButton && !clickedOnPanel) {
      console.log('[SD] ✓ Clicked outside - cleaning up');
      cleanup();
    } else if (clickedOnPanel) {
      console.log('[SD] ⏭️ Clicked inside panel - keeping open');
    } else if (clickedOnButton) {
      console.log('[SD] ⏭️ Clicked button - keeping open');
    }
  }

  // ============================================================
  // INITIALIZATION
  // ============================================================

  function init() {
    console.log('[SD] 🚀 Smart Dictionary Pro v8.0');
    console.log('[SD] ✅ CASE 1: 1 word → Instant dictionary');
    console.log('[SD] ✅ CASE 2: 2+ words → Translate button only');
    console.log('[SD] ✅ Auto-close on click outside');
    console.log('[SD] ✅ Fixed position panel (top-right)');

    // Mouse events
    document.addEventListener('mouseup', handleMouseUp, true);
    document.addEventListener('mousedown', handleMouseDown, true);

    // Optional: message from background
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'translate') {
          const words = request.word.trim().split(/\s+/).filter(w => w.length > 0);
          if (words.length === 1) {
            lookupWord(request.word);
          } else {
            handleSelection(request.word, 0, 0);
          }
          sendResponse({ status: 'ok' });
        }
        return true;
      });
    }

    console.log('[SD] ✅ Initialized');
  }

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
