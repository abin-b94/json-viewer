/**
 * app.js
 * Main application controller for Online JSON Viewer & Formatter.
 */
import { validateJson, formatJson, minifyJson, formatBytes } from './parser.js';
import { JsonTreeViewer } from './json-tree.js';
import { SAMPLE_JSON_STRING } from './sample-data.js';

class JsonViewerApp {
  constructor() {
    this.elements = {};
    this.treeViewer = null;
    this.activeMode = 'text'; // 'text' | 'file'
    this.currentTheme = localStorage.getItem('json_viewer_theme') || 'system';
    this.currentData = null;
    this.lastValidJsonString = '';

    this.initElements();
    this.initTheme();
    this.initTree();
    this.bindEvents();
    this.bindKeyboardShortcuts();
    this.registerServiceWorker();

    // Check if there is existing content or initialize with sample or empty state
    const savedContent = localStorage.getItem('json_viewer_draft');
    if (savedContent && savedContent.trim()) {
      this.elements.jsonInput.value = savedContent;
      this.handleProcessInput({ format: true, silent: true });
    } else {
      // Load sample by default so the user immediately experiences the interactive tree!
      this.loadSampleData(true);
    }

    this.updateStats();
  }

  initElements() {
    this.elements = {
      // Main UI
      appContainer: document.getElementById('app-container'),
      themeToggleBtn: document.getElementById('theme-toggle-btn'),
      themeIcon: document.getElementById('theme-icon'),
      
      // Mode tabs
      tabText: document.getElementById('tab-mode-text'),
      tabFile: document.getElementById('tab-mode-file'),
      textInputSection: document.getElementById('text-input-section'),
      fileInputSection: document.getElementById('file-input-section'),
      
      // Text Editor
      jsonInput: document.getElementById('json-input'),
      lineNumbers: document.getElementById('editor-line-numbers'),
      
      // File upload
      fileDropZone: document.getElementById('file-drop-zone'),
      fileInput: document.getElementById('file-input'),
      fileInfoBar: document.getElementById('file-info-bar'),
      fileNameDisplay: document.getElementById('file-name-display'),
      fileSizeDisplay: document.getElementById('file-size-display'),
      fileRemoveBtn: document.getElementById('file-remove-btn'),

      // Top Toolbar Buttons
      btnFormat: document.getElementById('btn-format'),
      btnMinify: document.getElementById('btn-minify'),
      btnValidate: document.getElementById('btn-validate'),
      btnCopy: document.getElementById('btn-copy'),
      btnClear: document.getElementById('btn-clear'),
      btnLoadFile: document.getElementById('btn-load-file'),
      btnSample: document.getElementById('btn-sample'),
      btnShortcuts: document.getElementById('btn-shortcuts'),

      // Tree Toolbar & Search
      treeContainer: document.getElementById('tree-render-target'),
      btnExpandAll: document.getElementById('btn-expand-all'),
      btnCollapseAll: document.getElementById('btn-collapse-all'),
      searchInput: document.getElementById('tree-search-input'),
      searchClearBtn: document.getElementById('tree-search-clear'),
      searchMatchCount: document.getElementById('tree-search-matches'),

      // Status Bar & Validation banner
      statusValidation: document.getElementById('status-validation'),
      statusStats: document.getElementById('status-stats'),
      statusLineCol: document.getElementById('status-line-col'),
      errorBanner: document.getElementById('error-banner'),
      errorTitle: document.getElementById('error-title'),
      errorMessage: document.getElementById('error-message'),
      errorSnippet: document.getElementById('error-snippet'),
      btnJumpError: document.getElementById('btn-jump-error'),
      errorDismiss: document.getElementById('error-dismiss'),

      // View Layout Switcher (Split, Editor, Tree)
      viewSplitBtn: document.getElementById('view-split-btn'),
      viewEditorBtn: document.getElementById('view-editor-btn'),
      viewTreeBtn: document.getElementById('view-tree-btn'),
      workspacePanels: document.getElementById('workspace-panels'),

      // Toast & Modals
      toastContainer: document.getElementById('toast-container'),
      shortcutsModal: document.getElementById('shortcuts-modal'),
      shortcutsModalClose: document.getElementById('shortcuts-modal-close'),
    };
  }

  initTree() {
    this.treeViewer = new JsonTreeViewer(this.elements.treeContainer, {
      defaultExpandedDepth: 3,
      onCopyNotice: (msg) => this.showToast(msg, 'success')
    });
  }

  initTheme() {
    this.applyTheme(this.currentTheme);

    // Watch OS theme changes if in system mode
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (this.currentTheme === 'system') {
        this.applyTheme('system');
      }
    });
  }

  applyTheme(theme) {
    this.currentTheme = theme;
    localStorage.setItem('json_viewer_theme', theme);

    let isDark = false;
    if (theme === 'dark') {
      isDark = true;
    } else if (theme === 'light') {
      isDark = false;
    } else {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      if (this.elements.themeIcon) {
        this.elements.themeIcon.innerHTML = `
          <!-- Sun icon for dark mode -->
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
        `;
      }
      if (this.elements.themeToggleBtn) this.elements.themeToggleBtn.setAttribute('title', 'Switch to light mode');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      if (this.elements.themeIcon) {
        this.elements.themeIcon.innerHTML = `
          <!-- Moon icon for light mode -->
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        `;
      }
      if (this.elements.themeToggleBtn) this.elements.themeToggleBtn.setAttribute('title', 'Switch to dark mode');
    }
  }

  toggleTheme() {
    const isCurrentlyDark = document.documentElement.getAttribute('data-theme') === 'dark';
    this.applyTheme(isCurrentlyDark ? 'light' : 'dark');
    this.showToast(`Switched to ${isCurrentlyDark ? 'light' : 'dark'} mode`, 'info');
  }

  bindEvents() {
    // Theme toggle
    this.elements.themeToggleBtn?.addEventListener('click', () => this.toggleTheme());

    // Input mode tabs
    this.elements.tabText?.addEventListener('click', () => this.switchMode('text'));
    this.elements.tabFile?.addEventListener('click', () => this.switchMode('file'));

    // Text editor changes
    let debounceTimer = null;
    this.elements.jsonInput?.addEventListener('input', () => {
      this.updateLineNumbers();
      this.updateCursorStats();
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.handleAutoParse();
        localStorage.setItem('json_viewer_draft', this.elements.jsonInput.value);
      }, 350);
    });

    // Synchronize scroll between textarea and line numbers
    this.elements.jsonInput?.addEventListener('scroll', () => {
      if (this.elements.lineNumbers) {
        this.elements.lineNumbers.scrollTop = this.elements.jsonInput.scrollTop;
      }
    });

    // Cursor position stats
    this.elements.jsonInput?.addEventListener('keyup', () => this.updateCursorStats());
    this.elements.jsonInput?.addEventListener('click', () => this.updateCursorStats());

    // Toolbar buttons
    this.elements.btnFormat?.addEventListener('click', () => this.handleFormat());
    this.elements.btnMinify?.addEventListener('click', () => this.handleMinify());
    this.elements.btnValidate?.addEventListener('click', () => this.handleValidate(true));
    this.elements.btnCopy?.addEventListener('click', () => this.handleCopy());
    this.elements.btnClear?.addEventListener('click', () => this.handleClear());
    this.elements.btnSample?.addEventListener('click', () => this.loadSampleData(false));
    this.elements.btnLoadFile?.addEventListener('click', () => {
      this.switchMode('file');
      this.elements.fileInput?.click();
    });

    // File input & Drag/Drop
    this.elements.fileInput?.addEventListener('change', (e) => this.handleFileSelection(e.target.files));
    this.elements.fileDropZone?.addEventListener('click', () => this.elements.fileInput?.click());

    ['dragenter', 'dragover'].forEach(name => {
      this.elements.fileDropZone?.addEventListener(name, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.elements.fileDropZone.classList.add('is-dragover');
      });
    });

    ['dragleave', 'drop'].forEach(name => {
      this.elements.fileDropZone?.addEventListener(name, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.elements.fileDropZone.classList.remove('is-dragover');
      });
    });

    this.elements.fileDropZone?.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      if (dt && dt.files && dt.files.length > 0) {
        this.handleFileSelection(dt.files);
      }
    });

    this.elements.fileRemoveBtn?.addEventListener('click', () => {
      this.elements.fileInfoBar.hidden = true;
      this.elements.fileInput.value = '';
    });

    // Tree actions
    this.elements.btnExpandAll?.addEventListener('click', () => {
      this.treeViewer.expandAll();
      this.showToast('Expanded all nodes', 'info');
    });

    this.elements.btnCollapseAll?.addEventListener('click', () => {
      this.treeViewer.collapseAll();
      this.showToast('Collapsed all nodes', 'info');
    });

    // Tree search filter
    let searchDebounce = null;
    this.elements.searchInput?.addEventListener('input', (e) => {
      const q = e.target.value;
      if (this.elements.searchClearBtn) {
        this.elements.searchClearBtn.hidden = !q;
      }
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        const matches = this.treeViewer.applySearch(q);
        this.updateSearchMatchBadge(matches, q);
      }, 200);
    });

    this.elements.searchClearBtn?.addEventListener('click', () => {
      this.elements.searchInput.value = '';
      this.elements.searchClearBtn.hidden = true;
      this.treeViewer.applySearch('');
      this.updateSearchMatchBadge(0, '');
      this.elements.searchInput.focus();
    });

    // Error banner actions
    this.elements.errorDismiss?.addEventListener('click', () => {
      this.hideErrorBanner();
    });

    this.elements.btnJumpError?.addEventListener('click', () => {
      const line = parseInt(this.elements.btnJumpError.dataset.line || '1', 10);
      const col = parseInt(this.elements.btnJumpError.dataset.column || '1', 10);
      this.jumpToLine(line, col);
    });

    // View switcher layout
    this.elements.viewSplitBtn?.addEventListener('click', () => this.setLayoutView('split'));
    this.elements.viewEditorBtn?.addEventListener('click', () => this.setLayoutView('editor'));
    this.elements.viewTreeBtn?.addEventListener('click', () => this.setLayoutView('tree'));

    // Shortcuts modal
    this.elements.btnShortcuts?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleShortcutsModal(true);
    });
    this.elements.shortcutsModalClose?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleShortcutsModal(false);
    });
    this.elements.shortcutsModal?.addEventListener('click', (e) => {
      if (e.target === this.elements.shortcutsModal) {
        e.preventDefault();
        this.toggleShortcutsModal(false);
      }
    });
  }

  bindKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl/Cmd + Enter : Format
      if (cmdKey && e.key === 'Enter') {
        e.preventDefault();
        this.handleFormat();
        return;
      }

      // Ctrl/Cmd + Shift + C : Copy output
      if (cmdKey && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
        this.handleCopy();
        return;
      }

      // Ctrl/Cmd + Shift + M : Minify
      if (cmdKey && e.shiftKey && (e.key === 'M' || e.key === 'm')) {
        e.preventDefault();
        this.handleMinify();
        return;
      }

      // Ctrl/Cmd + K : Focus search
      if (cmdKey && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        this.elements.searchInput?.focus();
        this.elements.searchInput?.select();
        return;
      }

      // Escape key: dismiss modal, clear search
      if (e.key === 'Escape') {
        const modal = this.elements.shortcutsModal;
        const isModalOpen = modal && (!modal.hidden || modal.classList.contains('is-open'));
        if (isModalOpen) {
          e.preventDefault();
          e.stopPropagation();
          this.toggleShortcutsModal(false);
          return;
        } else if (document.activeElement === this.elements.searchInput && this.elements.searchInput.value) {
          e.preventDefault();
          this.elements.searchClearBtn?.click();
        }
      }
    });
  }

  switchMode(mode) {
    this.activeMode = mode;
    if (mode === 'text') {
      this.elements.tabText?.classList.add('is-active');
      this.elements.tabFile?.classList.remove('is-active');
      this.elements.textInputSection.hidden = false;
      this.elements.fileInputSection.hidden = true;
      this.elements.jsonInput?.focus();
    } else {
      this.elements.tabText?.classList.remove('is-active');
      this.elements.tabFile?.classList.add('is-active');
      this.elements.textInputSection.hidden = true;
      this.elements.fileInputSection.hidden = false;
    }
  }

  setLayoutView(view) {
    const panels = this.elements.workspacePanels;
    [this.elements.viewSplitBtn, this.elements.viewEditorBtn, this.elements.viewTreeBtn].forEach(btn => btn?.classList.remove('is-active'));

    panels.classList.remove('view-mode-split', 'view-mode-editor', 'view-mode-tree');

    if (view === 'editor') {
      panels.classList.add('view-mode-editor');
      this.elements.viewEditorBtn?.classList.add('is-active');
    } else if (view === 'tree') {
      panels.classList.add('view-mode-tree');
      this.elements.viewTreeBtn?.classList.add('is-active');
    } else {
      panels.classList.add('view-mode-split');
      this.elements.viewSplitBtn?.classList.add('is-active');
    }
  }

  handleFileSelection(files) {
    if (!files || files.length === 0) return;
    const file = files[0];

    // Check extension
    const ext = file.name.slice(((file.name.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase();
    if (ext !== 'json' && ext !== 'txt') {
      this.showToast('Please upload a valid .json or .txt file', 'warning');
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      this.elements.jsonInput.value = content;
      this.elements.fileNameDisplay.textContent = file.name;
      this.elements.fileSizeDisplay.textContent = formatBytes(file.size);
      this.elements.fileInfoBar.hidden = false;

      // Switch to text editor to inspect and auto format
      this.switchMode('text');
      this.handleProcessInput({ format: true, silent: false, source: `file "${file.name}"` });
      this.showToast(`Loaded ${file.name} successfully`, 'success');
    };

    reader.onerror = () => {
      this.showToast('Failed to read file', 'error');
    };

    reader.readAsText(file);
  }

  handleAutoParse() {
    const raw = this.elements.jsonInput.value;
    if (!raw.trim()) {
      this.treeViewer.render(undefined);
      this.hideErrorBanner();
      this.updateStatusBadge('empty');
      this.updateStats();
      return;
    }

    const result = validateJson(raw);
    if (result.valid) {
      this.currentData = result.data;
      this.lastValidJsonString = raw;
      this.treeViewer.render(result.data);
      this.hideErrorBanner();
      this.updateStatusBadge('valid', result.stats);
      this.updateStats(result.stats);
    } else {
      this.updateStatusBadge('invalid');
      // In auto-parse mode, we show error status without being overly aggressive
    }
  }

  handleFormat() {
    const raw = this.elements.jsonInput.value;
    if (!raw.trim()) {
      this.showToast('Editor is empty. Paste JSON or click "Sample JSON".', 'warning');
      return;
    }

    const res = formatJson(raw, 2);
    if (res.success) {
      this.elements.jsonInput.value = res.formatted;
      this.currentData = res.data;
      this.lastValidJsonString = res.formatted;
      this.treeViewer.render(res.data);
      this.hideErrorBanner();
      this.updateLineNumbers();
      this.updateStatusBadge('valid', res.stats);
      this.updateStats(res.stats);
      this.showToast('JSON beautified with 2-space indentation', 'success');
      localStorage.setItem('json_viewer_draft', res.formatted);
    } else {
      this.showErrorBanner(res);
      this.updateStatusBadge('invalid');
      this.showToast('Failed to format: syntax error in JSON', 'error');
    }
  }

  handleMinify() {
    const raw = this.elements.jsonInput.value;
    if (!raw.trim()) {
      this.showToast('Editor is empty. Paste JSON first.', 'warning');
      return;
    }

    const res = minifyJson(raw);
    if (res.success) {
      this.elements.jsonInput.value = res.minified;
      this.currentData = res.data;
      this.lastValidJsonString = res.minified;
      this.treeViewer.render(res.data);
      this.hideErrorBanner();
      this.updateLineNumbers();
      this.updateStatusBadge('valid', res.stats);
      this.updateStats(res.stats);
      this.showToast('JSON minified into single line', 'success');
      localStorage.setItem('json_viewer_draft', res.minified);
    } else {
      this.showErrorBanner(res);
      this.updateStatusBadge('invalid');
      this.showToast('Failed to minify: syntax error in JSON', 'error');
    }
  }

  handleValidate(userInitiated = false) {
    const raw = this.elements.jsonInput.value;
    if (!raw.trim()) {
      this.showToast('Editor is empty. Please enter JSON to validate.', 'warning');
      return;
    }

    const res = validateJson(raw);
    if (res.valid) {
      this.currentData = res.data;
      this.treeViewer.render(res.data);
      this.hideErrorBanner();
      this.updateStatusBadge('valid', res.stats);
      this.updateStats(res.stats);
      if (userInitiated) {
        this.showToast(`Valid JSON! (${res.stats.keysCount} keys, depth ${res.stats.depth})`, 'success');
      }
    } else {
      this.showErrorBanner(res);
      this.updateStatusBadge('invalid');
      if (userInitiated) {
        this.showToast(`Invalid JSON: Line ${res.line}, Col ${res.column}`, 'error');
      }
    }
  }

  async handleCopy() {
    const raw = this.elements.jsonInput.value;
    if (!raw.trim()) {
      this.showToast('Nothing to copy. Editor is empty.', 'warning');
      return;
    }

    try {
      await navigator.clipboard.writeText(raw);
      this.showToast('JSON copied to clipboard!', 'success');
    } catch (err) {
      // Fallback
      this.elements.jsonInput.select();
      document.execCommand('copy');
      this.showToast('JSON copied to clipboard!', 'success');
    }
  }

  handleClear() {
    if (!this.elements.jsonInput.value.trim() && !this.elements.fileNameDisplay.textContent) {
      return;
    }

    this.elements.jsonInput.value = '';
    this.elements.fileNameDisplay.textContent = '';
    this.elements.fileInfoBar.hidden = true;
    this.elements.fileInput.value = '';
    this.currentData = null;
    this.lastValidJsonString = '';
    this.treeViewer.render(undefined);
    this.hideErrorBanner();
    this.updateLineNumbers();
    this.updateStatusBadge('empty');
    this.updateStats();
    this.elements.searchInput.value = '';
    this.elements.searchClearBtn.hidden = true;
    this.updateSearchMatchBadge(0, '');
    localStorage.removeItem('json_viewer_draft');
    this.showToast('Cleared input and viewer', 'info');
  }

  loadSampleData(silent = false) {
    this.elements.jsonInput.value = SAMPLE_JSON_STRING;
    this.switchMode('text');
    this.handleProcessInput({ format: false, silent });
    if (!silent) {
      this.showToast('Sample JSON loaded!', 'success');
    }
  }

  handleProcessInput({ format = false, silent = false } = {}) {
    const raw = this.elements.jsonInput.value;
    if (format) {
      const res = formatJson(raw, 2);
      if (res.success) {
        this.elements.jsonInput.value = res.formatted;
        this.currentData = res.data;
        this.treeViewer.render(res.data);
        this.hideErrorBanner();
        this.updateLineNumbers();
        this.updateStatusBadge('valid', res.stats);
        this.updateStats(res.stats);
        return;
      }
    }

    const val = validateJson(raw);
    if (val.valid) {
      this.currentData = val.data;
      this.treeViewer.render(val.data);
      this.hideErrorBanner();
      this.updateLineNumbers();
      this.updateStatusBadge('valid', val.stats);
      this.updateStats(val.stats);
    } else {
      this.showErrorBanner(val);
      this.updateStatusBadge('invalid');
      this.updateLineNumbers();
      if (!silent) {
        this.showToast('Invalid JSON syntax', 'error');
      }
    }
  }

  updateLineNumbers() {
    if (!this.elements.lineNumbers || !this.elements.jsonInput) return;
    const lines = this.elements.jsonInput.value.split('\n');
    const count = Math.max(1, lines.length);

    let html = '';
    for (let i = 1; i <= count; i++) {
      html += `<div>${i}</div>`;
    }
    this.elements.lineNumbers.innerHTML = html;
  }

  updateCursorStats() {
    if (!this.elements.statusLineCol || !this.elements.jsonInput) return;
    const selStart = this.elements.jsonInput.selectionStart;
    const textBefore = this.elements.jsonInput.value.substring(0, selStart);
    const lines = textBefore.split('\n');
    const currentLine = lines.length;
    const currentCol = lines[lines.length - 1].length + 1;

    this.elements.statusLineCol.textContent = `Ln ${currentLine}, Col ${currentCol}`;
  }

  updateStatusBadge(status, stats = null) {
    const badge = this.elements.statusValidation;
    if (!badge) return;

    badge.className = 'status-pill';

    if (status === 'valid') {
      badge.classList.add('pill-valid');
      badge.innerHTML = `
        <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
          <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
        </svg>
        Valid JSON
      `;
    } else if (status === 'invalid') {
      badge.classList.add('pill-invalid');
      badge.innerHTML = `
        <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
        </svg>
        Invalid JSON
      `;
    } else {
      badge.classList.add('pill-neutral');
      badge.innerHTML = `<span>Ready</span>`;
    }
  }

  updateStats(stats) {
    if (!this.elements.statusStats) return;
    if (!stats) {
      this.elements.statusStats.textContent = '0 B • 0 keys';
      return;
    }

    const parts = [
      stats.formattedSize,
      `${stats.keysCount} ${stats.keysCount === 1 ? 'key' : 'keys'}`,
      `Depth: ${stats.depth}`
    ];
    this.elements.statusStats.textContent = parts.join(' • ');
  }

  showErrorBanner(err) {
    if (!this.elements.errorBanner) return;
    this.elements.errorTitle.textContent = `Syntax Error at Line ${err.line}, Column ${err.column}`;
    this.elements.errorMessage.textContent = err.message;
    this.elements.errorSnippet.textContent = err.snippet || '';
    
    if (this.elements.btnJumpError) {
      this.elements.btnJumpError.dataset.line = err.line;
      this.elements.btnJumpError.dataset.column = err.column;
    }

    this.elements.errorBanner.hidden = false;
  }

  hideErrorBanner() {
    if (this.elements.errorBanner) {
      this.elements.errorBanner.hidden = true;
    }
  }

  jumpToLine(line, column) {
    this.switchMode('text');
    const textarea = this.elements.jsonInput;
    if (!textarea) return;

    const lines = textarea.value.split('\n');
    let charOffset = 0;
    for (let i = 0; i < line - 1 && i < lines.length; i++) {
      charOffset += lines[i].length + 1; // +1 for '\n'
    }
    charOffset += Math.max(0, column - 1);

    textarea.focus();
    textarea.setSelectionRange(charOffset, charOffset + 1);

    // Scroll line into view
    const lineHeight = 20; // approximate line height in px
    textarea.scrollTop = Math.max(0, (line - 3) * lineHeight);
    this.updateCursorStats();
  }

  updateSearchMatchBadge(count, query) {
    const badge = this.elements.searchMatchCount;
    if (!badge) return;

    if (!query) {
      badge.textContent = '';
      badge.hidden = true;
      return;
    }

    badge.hidden = false;
    badge.textContent = `${count} ${count === 1 ? 'match' : 'matches'}`;
  }

  showToast(message, type = 'info') {
    const container = this.elements.toastContainer;
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast-msg toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('is-fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  toggleShortcutsModal(open) {
    const modal = this.elements.shortcutsModal;
    if (!modal) return;
    
    if (open) {
      modal.hidden = false;
      modal.classList.add('is-open');
      this.elements.shortcutsModalClose?.focus();
    } else {
      modal.hidden = true;
      modal.classList.remove('is-open');
      this.elements.btnShortcuts?.focus();
    }
  }

  registerServiceWorker() {
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then(reg => {
            console.log('ServiceWorker registered with scope:', reg.scope);
          })
          .catch(err => {
            console.log('ServiceWorker registration skipped/failed:', err);
          });
      });
    }
  }
}

// Instantiate app once DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.__jsonViewerApp = new JsonViewerApp();
});

