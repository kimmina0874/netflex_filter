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
  setStatus('저장 중...', '');

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
              '저장 중 오류가 발생했습니다.',
              'error'
            );
            return;
          }
          setStatus(
            '저장되었습니다. 넷플릭스를 새로고침 해주세요.',
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
              '설정 저장 중 오류가 발생했습니다.',
              'error'
            );
            return;
          }
          setStatus(
            enabled
              ? '넷플릭스 작품 숨기기 기능이 켜졌습니다.'
              : '넷플릭스 작품 숨기기 기능이 꺼졌습니다. 넷플릭스를 새로고침 해주세요.',
            ''
          );
        }
      );
    }
  );
}

document.addEventListener('DOMContentLoaded', function () {
  loadSettingsAndTitles();
  saveButton.addEventListener('click', saveTitles);
  netflixToolCheckbox.addEventListener(
    'change',
    onToggleNetflixTool
  );
});

