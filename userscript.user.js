// ==UserScript==
// @name         Jira Issue Copier
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Adds a copy button to Jira issue cards on Agile boards
// @author       You
// @match        *://jira.*/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const PROCESSED_ATTR = 'data-copy-btn-added';

  // SVG icons
  const COPY_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>`;

  const TICK_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>`;

  function getIssueData(card) {
    const keyLink = card.querySelector('a.js-key-link, a.ghx-key-link');
    const summary = card.querySelector('.ghx-summary .ghx-inner');
    if (!keyLink || !summary) return null;

    const key = keyLink.textContent.trim();
    const href = keyLink.href;
    const summaryText = summary.textContent.trim();

    return { key, href, summary: summaryText };
  }

  function buildCopyText(data) {
    return `${data.key} ${data.summary}`;
  }

  function createCopyButton() {
    const btn = document.createElement('button');
    btn.className = 'jira-copy-btn';
    btn.title = 'Copy issue reference';
    btn.innerHTML = COPY_SVG;

    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const card = btn.closest('.ghx-issue, .js-issue, [data-issue-key]');
      if (!card) return;

      const data = getIssueData(card);
      if (!data) return;

      const plainText = `${data.key} ${data.summary}`;
      const htmlText = `<a href="${data.href}">${data.key}</a> ${data.summary}`;

      try {
        const htmlBlob = new Blob([htmlText], { type: 'text/html' });
        const textBlob = new Blob([plainText], { type: 'text/plain' });
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': htmlBlob,
            'text/plain': textBlob,
          }),
        ]);
      } catch {
        // Fallback for non-HTTPS or unsupported browsers
        const ta = document.createElement('textarea');
        ta.value = plainText;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }

      // Switch to tick icon
      btn.innerHTML = TICK_SVG;
      btn.classList.add('jira-copy-btn--copied');

      setTimeout(() => {
        btn.innerHTML = COPY_SVG;
        btn.classList.remove('jira-copy-btn--copied');
      }, 1500);
    });

    return btn;
  }

  function processCards() {
    const cards = document.querySelectorAll(
      '.ghx-issue:not([data-copy-btn-added]), .js-issue:not([data-copy-btn-added]), [data-issue-key]:not([data-copy-btn-added])'
    );

    cards.forEach((card) => {
      const keyContainer = card.querySelector('.ghx-key');
      if (!keyContainer) return;

      card.setAttribute(PROCESSED_ATTR, 'true');
      const btn = createCopyButton();
      keyContainer.appendChild(btn);
    });
  }

  // Inject styles
  const style = document.createElement('style');
  style.textContent = `
    .ghx-key {
      display: inline-flex !important;
      align-items: center;
    }

    .jira-copy-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 2px;
      margin-left: 4px;
      border: none;
      background: transparent;
      color: #6b778c;
      border-radius: 3px;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.15s ease, color 0.15s ease, background 0.15s ease;
      flex-shrink: 0;
    }

    .ghx-issue:hover .jira-copy-btn,
    .js-issue:hover .jira-copy-btn,
    [data-issue-key]:hover .jira-copy-btn {
      opacity: 1;
    }

    .jira-copy-btn:hover {
      color: #0052cc;
      background: rgba(0, 82, 204, 0.08);
    }

    .jira-copy-btn:active {
      background: rgba(0, 82, 204, 0.16);
    }

    .jira-copy-btn--copied {
      color: #00875a !important;
      opacity: 1 !important;
    }
  `;
  document.head.appendChild(style);

  // Initial run
  processCards();

  // Observe DOM for dynamically loaded cards (e.g. scrolling, board changes)
  const observer = new MutationObserver(() => {
    processCards();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  console.log('[Jira Issue Copier] Loaded');
})();
