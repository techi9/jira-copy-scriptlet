// ==UserScript==
// @name         Jira Issue Copier
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Adds a copy button to Jira issue cards on Agile boards
// @author       techi9
// @include      *://jira.**/**
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
    // Agile board cards
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

    // Version/project page issue keys
    const issueKeys = document.querySelectorAll(
      'a.issue-key:not([data-copy-btn-added])'
    );

    issueKeys.forEach((keyLink) => {
      keyLink.setAttribute(PROCESSED_ATTR, 'true');

      const row = keyLink.closest('tr');
      const summaryLink = row?.querySelector('a.issue-summary');
      if (!summaryLink) return;

      const issueKey = keyLink.textContent.trim();
      const summary = summaryLink.textContent.trim();
      const href = keyLink.href;

      const btn = document.createElement('button');
      btn.className = 'jira-copy-btn';
      btn.title = 'Copy issue reference';
      btn.innerHTML = COPY_SVG;

      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const plainText = `${issueKey} ${summary}`;
        const htmlText = `<a href="${href}">${issueKey}</a> ${summary}`;
        try {
          const htmlBlob = new Blob([htmlText], { type: 'text/html' });
          const textBlob = new Blob([plainText], { type: 'text/plain' });
          await navigator.clipboard.write([
            new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob }),
          ]);
        } catch {
          const ta = document.createElement('textarea');
          ta.value = plainText;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        }
        btn.innerHTML = TICK_SVG;
        btn.classList.add('jira-copy-btn--copied');
        setTimeout(() => {
          btn.innerHTML = COPY_SVG;
          btn.classList.remove('jira-copy-btn--copied');
        }, 1500);
      });

      keyLink.style.display = 'inline-flex';
      keyLink.style.alignItems = 'center';
      keyLink.appendChild(btn);
    });
  }

  function processSingleIssuePage() {
    const keyEl = document.querySelector('#key-val:not([data-copy-btn-added])');
    if (!keyEl) return;

    keyEl.setAttribute(PROCESSED_ATTR, 'true');
    const summaryEl = document.querySelector('#summary-val');
    const issueKey = keyEl.textContent.trim();
    const summary = summaryEl ? summaryEl.textContent.trim() : '';
    const href = keyEl.href;

    const btn = document.createElement('button');
    btn.className = 'jira-copy-btn jira-copy-btn--single-issue';
    btn.title = 'Copy issue reference';
    btn.innerHTML = COPY_SVG;

    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const plainText = `${issueKey} ${summary}`;
      const htmlText = `<a href="${href}">${issueKey}</a> ${summary}`;
      try {
        const htmlBlob = new Blob([htmlText], { type: 'text/html' });
        const textBlob = new Blob([plainText], { type: 'text/plain' });
        await navigator.clipboard.write([
          new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob }),
        ]);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = plainText;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      btn.innerHTML = TICK_SVG;
      btn.classList.add('jira-copy-btn--copied');
      setTimeout(() => {
        btn.innerHTML = COPY_SVG;
        btn.classList.remove('jira-copy-btn--copied');
      }, 1500);
    });

    keyEl.parentElement.style.display = 'inline-flex';
    keyEl.parentElement.style.alignItems = 'center';
    keyEl.parentElement.style.gap = '4px';
    keyEl.insertAdjacentElement('afterend', btn);
  }

  function processDetailPanel() {
    const detailIssue = document.querySelector('#ghx-detail-issue');
    if (!detailIssue || detailIssue.getAttribute(PROCESSED_ATTR)) return;

    const keyLink = detailIssue.querySelector('.ghx-issue-details-link a');
    if (!keyLink) return;

    detailIssue.setAttribute(PROCESSED_ATTR, 'true');

    const btn = document.createElement('button');
    btn.className = 'jira-copy-btn jira-copy-btn--detail';
    btn.title = 'Copy issue reference';
    btn.innerHTML = COPY_SVG;

    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const issueKey = keyLink.textContent.trim();
      const epicName = document.querySelector('#ghx-epic-name');
      const summary = epicName ? epicName.textContent.trim() : '';
      const href = keyLink.href;

      const plainText = `${issueKey} ${summary}`;
      const htmlText = `<a href="${href}">${issueKey}</a> ${summary}`;

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
        const ta = document.createElement('textarea');
        ta.value = plainText;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }

      btn.innerHTML = TICK_SVG;
      btn.classList.add('jira-copy-btn--copied');
      setTimeout(() => {
        btn.innerHTML = COPY_SVG;
        btn.classList.remove('jira-copy-btn--copied');
      }, 1500);
    });

    const heading = keyLink.closest('h3');
    if (heading) {
      heading.parentElement.style.display = 'inline-flex';
      heading.parentElement.style.alignItems = 'center';
      heading.parentElement.appendChild(btn);
    }
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
    [data-issue-key]:hover .jira-copy-btn,
    a.issue-key:hover .jira-copy-btn,
    tr:hover .jira-copy-btn,
    #key-val:hover ~ .jira-copy-btn--single-issue,
    .jira-copy-btn--single-issue:hover {
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

    .jira-copy-btn--detail {
      opacity: 0;
      margin-left: 8px;
    }

    .ghx-key-group:hover .jira-copy-btn--detail,
    #issuekey-val:hover .jira-copy-btn--detail {
      opacity: 1;
    }
  `;
  document.head.appendChild(style);

  // Initial run
  processCards();
  processSingleIssuePage();
  processDetailPanel();

  // Observe DOM for dynamically loaded cards (e.g. scrolling, board changes)
  const observer = new MutationObserver(() => {
    processCards();
    processSingleIssuePage();
    processDetailPanel();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  console.log('[Jira Issue Copier] Loaded');
})();
