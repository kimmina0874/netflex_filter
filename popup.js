// Helper for localization
function localizeHtmlPage() {
  const objects = document.querySelectorAll('[data-i18n]');
  for (let j = 0; j < objects.length; j++) {
    const obj = objects[j];
    const messageId = obj.getAttribute('data-i18n');
    const msg = chrome.i18n.getMessage(messageId);
    if (msg) {
      obj.innerText = msg;
    }
  }
  // Also set placeholder for textarea
  const textarea = document.getElementById('titles');
  if (textarea) {
    textarea.placeholder = chrome.i18n.getMessage('textareaPlaceholder');
  }
}

const textarea = document.getElementById('titles');
const saveButton = document.getElementById('save');
const statusEl = document.getElementById('status');
const netflixToolCheckbox = document.getElementById('tool-netflix-hider');
const matchModeSelect = document.getElementById('match-mode');

function setStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = 'status ' + (type || '');
}

function parseLines(text) {
  return text
    .split('\n')
    .map(function (line) {
      return line.trim();
    })
    .filter(function (line) {
      return line.length > 0;
    });
}

function loadSettingsAndTitles() {
  chrome.storage.sync.get(
    {
      blockedTitles: [],
      settings: {
        netflixTitleHiderEnabled: true,
        netflixMatchMode: 'contains'
      }
    },
    function (result) {
      const list = result.blockedTitles || [];
      textarea.value = list.join('\n');

      const settings = result.settings || {};
      const enabled =
        settings.netflixTitleHiderEnabled !== false;
      netflixToolCheckbox.checked = enabled;

      const matchMode =
        settings.netflixMatchMode || 'contains';
      matchModeSelect.value = matchMode;
    }
  );
}

function saveTitles() {
  saveButton.disabled = true;
  setStatus(chrome.i18n.getMessage('statusSaving'), '');

  const list = parseLines(textarea.value);

  chrome.storage.sync.get(
    {
      settings: {
        netflixTitleHiderEnabled: true,
        netflixMatchMode: 'contains'
      }
    },
    function (result) {
      const settings = result.settings || {};
      settings.netflixMatchMode = matchModeSelect.value;

      chrome.storage.sync.set(
        {
          blockedTitles: list,
          settings: settings
        },
        function () {
          const error = chrome.runtime.lastError;
          saveButton.disabled = false;
          if (error) {
            setStatus(
              chrome.i18n.getMessage('statusError'),
              'error'
            );
            return;
          }
          setStatus(
            chrome.i18n.getMessage('statusSaved'),
            'ok'
          );
        }
      );
    }
  );
}

function onToggleNetflixTool() {
  const enabled = netflixToolCheckbox.checked;

  chrome.storage.sync.get(
    {
      settings: {
        netflixTitleHiderEnabled: true,
        netflixMatchMode: 'contains'
      }
    },
    function (result) {
      const settings = result.settings || {};
      settings.netflixTitleHiderEnabled = enabled;

      chrome.storage.sync.set(
        {
          settings: settings
        },
        function () {
          const error = chrome.runtime.lastError;
          if (error) {
            setStatus(
              chrome.i18n.getMessage('statusError'),
              'error'
            );
            return;
          }
          setStatus(
            enabled
              ? chrome.i18n.getMessage('statusToggleOn')
              : chrome.i18n.getMessage('statusToggleOff'),
            ''
          );
        }
      );
    }
  );
}

document.addEventListener('DOMContentLoaded', function () {
  localizeHtmlPage();
  loadSettingsAndTitles();
  saveButton.addEventListener('click', saveTitles);
  netflixToolCheckbox.addEventListener('change', onToggleNetflixTool);
});