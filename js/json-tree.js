/**
 * json-tree.js
 * High-performance, accessible, interactive collapsible JSON tree renderer
 * with syntax highlighting, path navigation, expand/collapse, and search highlighting.
 */

export class JsonTreeViewer {
  /**
   * @param {HTMLElement} containerElement 
   * @param {Object} [options]
   */
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.options = {
      defaultExpandedDepth: 3,
      onCopyNotice: options.onCopyNotice || (() => {}),
      ...options
    };
    this.data = null;
    this.searchQuery = '';
    this.matchCount = 0;
  }

  /**
   * Render JSON data into the container
   * @param {any} data 
   */
  render(data) {
    this.data = data;
    this.container.innerHTML = '';

    if (data === undefined) {
      this.container.innerHTML = '<div class="tree-empty">No JSON to display</div>';
      return;
    }

    const rootElement = document.createElement('div');
    rootElement.className = 'json-tree-root';

    // Render tree recursively
    const treeNode = this.buildNode(data, null, null, 1);
    rootElement.appendChild(treeNode);

    this.container.appendChild(rootElement);

    if (this.searchQuery) {
      this.applySearch(this.searchQuery);
    }
  }

  /**
   * Recursive node builder
   * @param {any} value 
   * @param {string|number|null} key 
   * @param {string} parentType 'object' | 'array' | null
   * @param {number} depth 
   * @returns {HTMLElement}
   */
  buildNode(value, key, parentType, depth) {
    const isObject = value !== null && typeof value === 'object';
    const isArray = Array.isArray(value);

    const nodeEl = document.createElement('div');
    nodeEl.className = 'tree-node';
    nodeEl.dataset.depth = depth;

    if (isObject) {
      return this.buildCollapsibleNode(value, key, parentType, depth, isArray);
    } else {
      return this.buildPrimitiveNode(value, key, parentType);
    }
  }

  /**
   * Build collapsible node (Object or Array)
   */
  buildCollapsibleNode(value, key, parentType, depth, isArray) {
    const nodeEl = document.createElement('div');
    nodeEl.className = 'tree-node tree-branch';
    nodeEl.dataset.depth = depth;

    const keys = Object.keys(value);
    const isEmpty = keys.length === 0;
    const isCollapsed = depth > this.options.defaultExpandedDepth;

    if (isCollapsed && !isEmpty) {
      nodeEl.classList.add('is-collapsed');
    }

    // Header row
    const headerEl = document.createElement('div');
    headerEl.className = 'tree-row tree-branch-header';
    headerEl.setAttribute('role', 'button');
    headerEl.setAttribute('tabindex', '0');
    headerEl.setAttribute('aria-expanded', !isCollapsed);

    // Toggle button / icon
    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'tree-toggle-btn';
    toggleBtn.setAttribute('aria-label', isCollapsed ? 'Expand node' : 'Collapse node');
    toggleBtn.tabIndex = -1; // Header handles keyboard
    if (isEmpty) {
      toggleBtn.classList.add('is-empty');
      toggleBtn.innerHTML = '<span class="tree-toggle-spacer"></span>';
    } else {
      toggleBtn.innerHTML = `
        <svg class="tree-chevron" viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
          <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
        </svg>
      `;
    }
    headerEl.appendChild(toggleBtn);

    // Key / Index label
    if (key !== null) {
      const keyEl = this.createKeyElement(key, parentType);
      headerEl.appendChild(keyEl);
    }

    // Opening token and preview badge
    const badgeEl = document.createElement('span');
    badgeEl.className = 'tree-preview-badge';

    const openBracket = isArray ? '[' : '{';
    const closeBracket = isArray ? ']' : '}';

    if (isEmpty) {
      badgeEl.innerHTML = `<span class="tree-bracket">${openBracket}${closeBracket}</span>`;
      headerEl.appendChild(badgeEl);
    } else {
      const countLabel = isArray 
        ? `${keys.length} ${keys.length === 1 ? 'item' : 'items'}`
        : `${keys.length} ${keys.length === 1 ? 'key' : 'keys'}`;
      
      badgeEl.innerHTML = `
        <span class="tree-bracket">${openBracket}</span>
        <span class="tree-count-pill">${countLabel}</span>
        <span class="tree-collapsed-bracket">${closeBracket}</span>
      `;
      headerEl.appendChild(badgeEl);
    }

    // Copy node value button
    const actionsEl = this.createCopyAction(() => JSON.stringify(value, null, 2));
    headerEl.appendChild(actionsEl);

    nodeEl.appendChild(headerEl);

    // Children container
    if (!isEmpty) {
      const childrenEl = document.createElement('div');
      childrenEl.className = 'tree-children';
      childrenEl.setAttribute('role', 'group');

      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        const childVal = value[k];
        const childNode = this.buildNode(childVal, isArray ? i : k, isArray ? 'array' : 'object', depth + 1);
        childrenEl.appendChild(childNode);
      }

      // Closing bracket row
      const footerEl = document.createElement('div');
      footerEl.className = 'tree-row tree-branch-footer';
      footerEl.innerHTML = `<span class="tree-toggle-spacer"></span><span class="tree-bracket">${closeBracket}</span>`;
      childrenEl.appendChild(footerEl);

      nodeEl.appendChild(childrenEl);

      // Click to toggle
      const toggleNode = () => {
        const collapsed = nodeEl.classList.toggle('is-collapsed');
        headerEl.setAttribute('aria-expanded', !collapsed);
        toggleBtn.setAttribute('aria-label', collapsed ? 'Expand node' : 'Collapse node');
      };

      headerEl.addEventListener('click', (e) => {
        // Prevent toggle if copy button was clicked
        if (e.target.closest('.tree-action-copy')) return;
        toggleNode();
      });

      headerEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleNode();
        }
      });
    }

    return nodeEl;
  }

  /**
   * Build primitive value row
   */
  buildPrimitiveNode(value, key, parentType) {
    const rowEl = document.createElement('div');
    rowEl.className = 'tree-row tree-leaf';

    // Spacer to align with branch icons
    const spacer = document.createElement('span');
    spacer.className = 'tree-toggle-spacer';
    rowEl.appendChild(spacer);

    // Key / Index label
    if (key !== null) {
      const keyEl = this.createKeyElement(key, parentType);
      rowEl.appendChild(keyEl);
    }

    // Value element with color styling
    const valEl = document.createElement('span');
    valEl.className = 'tree-value-container';

    let typeClass = 'type-string';
    let displayContent = '';
    let copyString = String(value);

    if (value === null) {
      typeClass = 'type-null';
      displayContent = 'null';
      copyString = 'null';
    } else if (typeof value === 'boolean') {
      typeClass = 'type-boolean';
      displayContent = String(value);
      copyString = String(value);
    } else if (typeof value === 'number') {
      typeClass = 'type-number';
      displayContent = String(value);
      copyString = String(value);
    } else if (typeof value === 'string') {
      typeClass = 'type-string';
      const escaped = JSON.stringify(value);
      displayContent = escaped;
      copyString = value;
    }

    valEl.innerHTML = `<span class="tree-val ${typeClass}" data-raw-val="${this.escapeHtml(copyString)}">${this.escapeHtml(displayContent)}</span>`;
    rowEl.appendChild(valEl);

    // Copy action
    const actionsEl = this.createCopyAction(() => copyString);
    rowEl.appendChild(actionsEl);

    return rowEl;
  }

  /**
   * Create key/index element
   */
  createKeyElement(key, parentType) {
    const keyContainer = document.createElement('span');
    keyContainer.className = 'tree-key-wrapper';

    if (parentType === 'array') {
      keyContainer.innerHTML = `<span class="tree-index" data-index="${key}">${key}</span><span class="tree-colon">: </span>`;
    } else {
      keyContainer.innerHTML = `<span class="tree-key" data-key="${this.escapeHtml(String(key))}">"${this.escapeHtml(String(key))}"</span><span class="tree-colon">: </span>`;
    }

    return keyContainer;
  }

  /**
   * Create copy button for a row
   */
  createCopyAction(getValueFn) {
    const actionWrapper = document.createElement('span');
    actionWrapper.className = 'tree-actions';

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'tree-action-copy';
    copyBtn.title = 'Copy value';
    copyBtn.innerHTML = `
      <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13">
        <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12a1.5 1.5 0 01.439 1.061V16.5A1.5 1.5 0 0115.5 18h-7A1.5 1.5 0 017 16.5v-13z" />
        <path d="M4.5 6A1.5 1.5 0 003 7.5v11A1.5 1.5 0 004.5 20h7a1.5 1.5 0 001.5-1.5v-1H8.5A2.5 2.5 0 016 15V6h-1.5z" />
      </svg>
    `;

    copyBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        const val = getValueFn();
        await navigator.clipboard.writeText(val);
        copyBtn.classList.add('is-copied');
        copyBtn.title = 'Copied!';
        this.options.onCopyNotice('Copied node to clipboard!');
        setTimeout(() => {
          copyBtn.classList.remove('is-copied');
          copyBtn.title = 'Copy value';
        }, 1500);
      } catch (err) {
        console.error('Failed to copy', err);
      }
    });

    actionWrapper.appendChild(copyBtn);
    return actionWrapper;
  }

  /**
   * Expand all collapsible nodes
   */
  expandAll() {
    const branches = this.container.querySelectorAll('.tree-branch');
    branches.forEach(b => {
      b.classList.remove('is-collapsed');
      const header = b.querySelector('.tree-branch-header');
      if (header) header.setAttribute('aria-expanded', 'true');
    });
  }

  /**
   * Collapse all collapsible nodes
   */
  collapseAll() {
    const branches = this.container.querySelectorAll('.tree-branch');
    branches.forEach(b => {
      b.classList.add('is-collapsed');
      const header = b.querySelector('.tree-branch-header');
      if (header) header.setAttribute('aria-expanded', 'false');
    });
  }

  /**
   * Expand nodes up to a certain depth
   * @param {number} targetDepth 
   */
  expandToDepth(targetDepth) {
    const branches = this.container.querySelectorAll('.tree-branch');
    branches.forEach(b => {
      const d = parseInt(b.dataset.depth, 10);
      const shouldExpand = d <= targetDepth;
      if (shouldExpand) {
        b.classList.remove('is-collapsed');
      } else {
        b.classList.add('is-collapsed');
      }
      const header = b.querySelector('.tree-branch-header');
      if (header) header.setAttribute('aria-expanded', String(shouldExpand));
    });
  }

  /**
   * Search and highlight matching keys/values
   * Automatically unfolds ancestor branches containing matches.
   * @param {string} query 
   * @returns {number} matchCount
   */
  applySearch(query) {
    this.searchQuery = (query || '').trim();
    this.clearSearchHighlights();

    if (!this.searchQuery) {
      return 0;
    }

    const queryLower = this.searchQuery.toLowerCase();
    let matches = 0;

    // Search targets: .tree-key, .tree-val
    const targetElements = this.container.querySelectorAll('.tree-key, .tree-val');

    targetElements.forEach(el => {
      const text = el.textContent || '';
      const idx = text.toLowerCase().indexOf(queryLower);

      if (idx !== -1) {
        matches++;
        this.highlightMatchesInElement(el, queryLower);

        // Expand all parents of this element
        let parent = el.closest('.tree-branch');
        while (parent) {
          parent.classList.remove('is-collapsed');
          const header = parent.querySelector('.tree-branch-header');
          if (header) header.setAttribute('aria-expanded', 'true');
          parent = parent.parentElement.closest('.tree-branch');
        }
      }
    });

    this.matchCount = matches;
    return matches;
  }

  /**
   * Highlight substring matches safely inside an element
   */
  highlightMatchesInElement(element, queryLower) {
    const originalText = element.textContent;
    const lower = originalText.toLowerCase();
    let resultHtml = '';
    let lastIndex = 0;

    let index = lower.indexOf(queryLower, lastIndex);
    while (index !== -1) {
      const before = originalText.substring(lastIndex, index);
      const match = originalText.substring(index, index + queryLower.length);
      resultHtml += this.escapeHtml(before) + `<mark class="tree-search-match">${this.escapeHtml(match)}</mark>`;
      lastIndex = index + queryLower.length;
      index = lower.indexOf(queryLower, lastIndex);
    }
    resultHtml += this.escapeHtml(originalText.substring(lastIndex));

    element.innerHTML = resultHtml;
  }

  /**
   * Clear all search marks
   */
  clearSearchHighlights() {
    const marks = this.container.querySelectorAll('mark.tree-search-match');
    marks.forEach(mark => {
      const parent = mark.parentNode;
      parent.replaceChild(document.createTextNode(mark.textContent), mark);
      parent.normalize();
    });
    this.matchCount = 0;
  }

  /**
   * Escape HTML utility
   */
  escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
