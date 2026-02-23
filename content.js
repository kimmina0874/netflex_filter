let blockedTitles = [];
let netflixTitleHiderEnabled = true;
let netflixMatchMode = 'contains';

function normalizeTitle(title) {
  return title.toLowerCase().trim();
}

function updateBlockedTitles(list) {
  blockedTitles = list.map(normalizeTitle).filter(Boolean);
}

function shouldBlock(title) {
  if (!title) return false;
  const normalized = normalizeTitle(title);
  return blockedTitles.some(function (blocked) {
    if (netflixMatchMode === 'exact') {
      return normalized === blocked;
    }
    return normalized.includes(blocked);
  });
}

function hideByAriaLabel(root) {
  const selector = 'a[aria-label], div[role="link"][aria-label]';
  const elements = (root || document).querySelectorAll(selector);
  elements.forEach(function (el) {
    const title = el.getAttribute('aria-label');
    if (!shouldBlock(title)) return;
    const card =
      el.closest('[data-uia="title-card"]') ||
      el.closest('li') ||
      el.closest('div');
    if (!card) return;
    card.style.display = 'none';
  });
}

function hideByTextContent(root) {
  const textSelectors = [
    'span',
    'div',
    'a'
  ];
  const elements = (root || document).querySelectorAll(textSelectors.join(','));
  elements.forEach(function (el) {
    const text = el.textContent;
    if (!shouldBlock(text)) return;
    const card =
      el.closest('[data-uia="title-card"]') ||
      el.closest('a') ||
      el.closest('li') ||
      el.closest('div');
    if (!card) return;
    card.style.display = 'none';
  });
}

function hideBlockedTitles(root) {
  if (!netflixTitleHiderEnabled) return;
  if (!blockedTitles.length) return;
  hideByAriaLabel(root);
  hideByTextContent(root);
}

function setupObserver() {
  const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      mutation.addedNodes.forEach(function (node) {
        if (!(node instanceof HTMLElement)) return;
        hideBlockedTitles(node);
      });
    });
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
}

function init() {
  chrome.storage.sync.get(
    {
      blockedTitles: [],
      settings: {
        netflixTitleHiderEnabled: true,
        netflixMatchMode: 'contains'
      }
    },
    function (result) {
      updateBlockedTitles(result.blockedTitles || []);

      const settings = result.settings || {};
      netflixTitleHiderEnabled =
        settings.netflixTitleHiderEnabled !== false;
      netflixMatchMode =
        settings.netflixMatchMode || 'contains';

      hideBlockedTitles(document);
      setupObserver();
    }
  );

  chrome.storage.onChanged.addListener(function (changes, areaName) {
    if (areaName !== 'sync') return;

    if (changes.settings) {
      const settings = changes.settings.newValue || {};
      netflixTitleHiderEnabled =
        settings.netflixTitleHiderEnabled !== false;
      netflixMatchMode =
        settings.netflixMatchMode || 'contains';
    }

    if (changes.blockedTitles) {
      updateBlockedTitles(changes.blockedTitles.newValue || []);
      hideBlockedTitles(document);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

