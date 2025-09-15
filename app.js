// 이모지 피커 - Google Sheets 연동
document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('grid');
  const moreButton = document.getElementById('more');
  const toast = document.getElementById('toast');
  
  let emojis = [];
  let filteredEmojis = [];
  let displayedCount = 0;
  const itemsPerPage = 100;
  let copyHistory = [];
  let currentCategory = 'all';
  let categories = new Map();
  let sidebar, sidebarToggle;

  // Google Sheets에서 데이터 로드
  async function loadEmojis() {
    try {
      grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 2rem;">이모지를 불러오는 중...</div>';
      
      const response = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vTc7jzLftQBL-UUnwIHYR4yXHLp-fX3OKB0cE8l9tWKjCAr_Y_IpzO6P_aAbp6MZ_s2Qt26PC_71CVX/pub?gid=840637915&single=true&output=csv');
      
      if (!response.ok) {
        throw new Error('HTTP error! status: ' + response.status);
      }
      
      const csvText = await response.text();
      emojis = parseCSV(csvText);
      
      processCategories();
      console.log('Google Sheets 데이터 로드 완료:', emojis.length, '개');
      
      renderCategories();
      filterAndDisplayEmojis();
      
    } catch (error) {
      console.error('Google Sheets 로드 오류:', error);
      grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: red;">Google Sheets 데이터를 불러올 수 없습니다.</div>';
    }
  }

  // CSV 파싱
  function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = parseCSVLine(line);
      if (values.length !== headers.length) continue;

      const item = {};
      headers.forEach((header, index) => {
        item[header] = values[index] || '';
      });

      if (item.emoji && item.name_ko) {
        if (item.code && (!item.emoji || item.emoji === '□')) {
          item.emoji = unicodeToEmoji(item.code);
        }
        data.push(item);
      }
    }

    return data;
  }

  function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  function unicodeToEmoji(code) {
    try {
      const cleanCode = code.replace(/^(U\+|0x)/i, '');
      if (cleanCode.includes('-')) {
        const codePoints = cleanCode.split('-');
        return String.fromCodePoint(...codePoints.map(cp => parseInt(cp, 16)));
      } else {
        const codePoint = parseInt(cleanCode, 16);
        return isNaN(codePoint) ? '' : String.fromCodePoint(codePoint);
      }
    } catch (error) {
      return '';
    }
  }

  // 카테고리 처리
  function processCategories() {
    categories.clear();
    
    categories.set('all', {
      name: '전체',
      emoji: '🎯',
      count: emojis.length
    });

    const categoryMap = new Map();
    
    emojis.forEach(emoji => {
      const category = emoji.category || 'others';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          name: getCategoryName(category),
          emoji: getCategoryEmoji(category),
          count: 0
        });
      }
      categoryMap.get(category).count++;
    });

    [...categoryMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([key, value]) => {
        categories.set(key, value);
      });
  }

  function getCategoryName(category) {
    const categoryNames = {
      'smileys': '스마일리',
      'people': '사람',
      'animals': '동물',
      'food': '음식',
      'travel': '여행',
      'activities': '활동',
      'objects': '사물',
      'symbols': '기호',
      'flags': '깃발',
      'nature': '자연'
    };
    return categoryNames[category] || category;
  }

  function getCategoryEmoji(category) {
    const categoryEmojis = {
      'smileys': '😀',
      'people': '👤',
      'animals': '🐶',
      'food': '🍎',
      'travel': '🚗',
      'activities': '⚽',
      'objects': '💡',
      'symbols': '💯',
      'flags': '🏳️',
      'nature': '🌿'
    };
    return categoryEmojis[category] || '📁';
  }

  function renderCategories() {
    let chipsContainer = document.getElementById('chips');
    if (!chipsContainer) {
      chipsContainer = document.createElement('div');
      chipsContainer.id = 'chips';
      chipsContainer.className = 'chips';
      
      const header = document.querySelector('.header');
      header.insertAdjacentElement('afterend', chipsContainer);
    }

    chipsContainer.innerHTML = '';
    
    categories.forEach((category, key) => {
      const chip = document.createElement('button');
      chip.className = 'chip';
      chip.dataset.category = key;
      
      if (key === currentCategory) {
        chip.classList.add('active');
      }

      chip.innerHTML = '<span class="chip-emoji">' + category.emoji + '</span><span>' + category.name + '</span><span class="chip-count">' + category.count + '</span>';

      chip.addEventListener('click', () => {
        selectCategory(key);
      });

      chipsContainer.appendChild(chip);
    });
  }

  function selectCategory(category) {
    const prevActive = document.querySelector('.chip.active');
    if (prevActive) {
      prevActive.classList.remove('active');
    }

    const newActive = document.querySelector('[data-category="' + category + '"]');
    if (newActive) {
      newActive.classList.add('active');
    }

    currentCategory = category;
    filterAndDisplayEmojis();
  }

  function filterAndDisplayEmojis() {
    if (currentCategory === 'all') {
      filteredEmojis = emojis;
    } else {
      filteredEmojis = emojis.filter(emoji => emoji.category === currentCategory);
    }

    displayedCount = 0;
    grid.innerHTML = '';
    displayEmojis();
  }

  function displayEmojis() {
    if (displayedCount === 0) {
      grid.innerHTML = '';
    }

    const start = displayedCount;
    const end = Math.min(start + itemsPerPage, filteredEmojis.length);

    for (let i = start; i < end; i++) {
      const emoji = filteredEmojis[i];
      const card = createEmojiCard(emoji);
      grid.appendChild(card);
    }

    displayedCount = end;
    updateMoreButton();
  }

  function createEmojiCard(emoji) {
    const card = document.createElement('button');
    card.className = 'emoji-card';
    
    card.innerHTML = '<div class="emoji-symbol">' + emoji.emoji + '</div>';

    card.addEventListener('click', () => copyEmoji(emoji));
    return card;
  }

  async function copyEmoji(emoji) {
    try {
      await navigator.clipboard.writeText(emoji.emoji);
      addToHistory(emoji);
      showToast(emoji.emoji + ' 복사됨!');
      openSidebar();
      
    } catch (error) {
      const textArea = document.createElement('textarea');
      textArea.value = emoji.emoji;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      addToHistory(emoji);
      showToast(emoji.emoji + ' 복사됨!');
      openSidebar();
    }
  }

  function addToHistory(emoji) {
    copyHistory = copyHistory.filter(item => item.emoji.emoji !== emoji.emoji);
    copyHistory.unshift({
      emoji: emoji,
      timestamp: new Date()
    });
    
    if (copyHistory.length > 50) {
      copyHistory = copyHistory.slice(0, 50);
    }
    
    updateHistoryDisplay();
  }

  function updateHistoryDisplay() {
    const historyContainer = document.querySelector('.copy-history');
    if (!historyContainer) return;

    if (copyHistory.length === 0) {
      historyContainer.innerHTML = '<div class="copy-empty"><span class="copy-empty-emoji">📋</span><div>아직 복사한 이모지가 없습니다</div><small>이모지를 클릭해서 복사해보세요!</small></div>';
      return;
    }

    historyContainer.innerHTML = copyHistory.map((item, index) => {
      const timeAgo = getTimeAgo(item.timestamp);
      const isLatest = index === 0;
      
      return '<div class="copy-item ' + (isLatest ? 'latest' : '') + '" onclick="copyFromHistory(\'' + item.emoji.emoji + '\')"><div class="copy-item-header"><span class="copy-item-emoji">' + item.emoji.emoji + '</span><div class="copy-item-names"><div class="copy-item-name-ko">' + item.emoji.name_ko + '</div></div><div class="copy-item-time">' + timeAgo + '</div></div><div class="copy-item-actions"><button class="copy-item-btn" onclick="event.stopPropagation(); copyFromHistory(\'' + item.emoji.emoji + '\')">이모지 복사</button><button class="copy-item-btn" onclick="event.stopPropagation(); copyFromHistory(\'' + item.emoji.name_ko + '\')">이름 복사</button></div></div>';
    }).join('');
  }

  function getTimeAgo(timestamp) {
    const now = new Date();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return days + '일 전';
    if (hours > 0) return hours + '시간 전';
    if (minutes > 0) return minutes + '분 전';
    return '방금 전';
  }

  window.copyFromHistory = async function(text) {
    try {
      await navigator.clipboard.writeText(text);
      showToast(text + ' 복사됨!');
    } catch (error) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showToast(text + ' 복사됨!');
    }
  };

  function openSidebar() {
    if (sidebar) {
      sidebar.classList.add('open');
      sidebarToggle.classList.add('active');
      
      const main = document.querySelector('main');
      if (main) main.classList.add('sidebar-open');
    }
  }

  function closeSidebar() {
    if (sidebar) {
      sidebar.classList.remove('open');
      sidebarToggle.classList.remove('active');
      
      const main = document.querySelector('main');
      if (main) main.classList.remove('sidebar-open');
    }
  }

  function createSidebar() {
    sidebarToggle = document.createElement('button');
    sidebarToggle.className = 'sidebar-toggle';
    sidebarToggle.innerHTML = '📋';
    sidebarToggle.title = '복사 히스토리';
    
    sidebar = document.createElement('div');
    sidebar.className = 'copy-sidebar';
    sidebar.innerHTML = '<div class="copy-sidebar-header"><h3 class="copy-sidebar-title">복사 히스토리</h3><button class="copy-sidebar-toggle">✕</button></div><div class="copy-sidebar-content"><div class="copy-history"><div class="copy-empty"><span class="copy-empty-emoji">📋</span><div>아직 복사한 이모지가 없습니다</div><small>이모지를 클릭해서 복사해보세요!</small></div></div></div>';

    document.body.appendChild(sidebarToggle);
    document.body.appendChild(sidebar);

    sidebarToggle.addEventListener('click', () => {
      if (sidebar.classList.contains('open')) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });

    sidebar.querySelector('.copy-sidebar-toggle').addEventListener('click', () => {
      closeSidebar();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && sidebar.classList.contains('open')) {
        closeSidebar();
      }
    });
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2000);
  }

  function updateMoreButton() {
    const hasMore = displayedCount < filteredEmojis.length;
    moreButton.hidden = !hasMore;
    
    if (hasMore) {
      const remaining = filteredEmojis.length - displayedCount;
      moreButton.textContent = '더보기 (' + remaining + '개 남음)';
    }
  }

  if (moreButton) {
    moreButton.addEventListener('click', displayEmojis);
  }

  createSidebar();
  await loadEmojis();
});
