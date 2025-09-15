document.addEventListener('DOMContentLoaded', () => {
  console.log('JavaScript 파일 로드 성공');
  
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

  // Google Sheets에서 데이터 로드 (수정됨)
  function loadEmojis() {
    grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 2rem;">이모지를 불러오는 중...</div>';
    
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTc7jzLftQBL-UUnwIHYR4yXHLp-fX3OKB0cE8l9tWKjCAr_Y_IpzO6P_aAbp6MZ_s2Qt26PC_71CVX/pub?gid=840637915&single=true&output=csv';
    
    console.log('CSV URL로 직접 요청 시도:', csvUrl);
    
    fetch(csvUrl)
    .then(response => {
      console.log('응답 상태:', response.status, response.statusText);
      if (!response.ok) {
        throw new Error('HTTP error! status: ' + response.status);
      }
      return response.text();
    })
    .then(csvText => {
      console.log('받은 CSV 데이터 길이:', csvText.length);
      console.log('CSV 첫 100자:', csvText.substring(0, 100));
      
      emojis = parseCSV(csvText);
      
      if (emojis.length === 0) {
        throw new Error('파싱된 데이터가 없습니다.');
      }
      
      processCategories();
      console.log('Google Sheets 데이터 로드 완료:', emojis.length, '개');
      
      renderCategories();
      filterAndDisplayEmojis();
    })
    .catch(error => {
      console.error('Google Sheets 로드 오류:', error);
      grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: red;">Google Sheets 데이터를 불러올 수 없습니다.<br>' + error.message + '</div>';
    });
  }

  // CSV 파싱 (디버깅 코드 추가)
  function parseCSV(csvText) {
    console.log('CSV 원본 데이터 (첫 500자):', csvText.substring(0, 500));
    
    const lines = csvText.trim().split('\n');
    console.log('총 라인 수:', lines.length);
    
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    console.log('헤더:', headers);
    
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = parseCSVLine(line);
      if (values.length !== headers.length) {
        console.log('길이 불일치 - 라인', i, ':', values.length, 'vs', headers.length);
        continue;
      }

      const item = {};
      headers.forEach((header, index) => {
        item[header] = values[index] || '';
      });

      console.log('파싱된 아이템 (라인', i, '):', item);

      if (item.emoji && item.name_ko) {
        if (item.code && (!item.emoji || item.emoji === '□')) {
          item.emoji = unicodeToEmoji(item.code);
        }
        if (item.emoji && item.emoji.length === 2 && /^[A-Z]{2}$/.test(item.emoji)) {
          item.emoji = countryCodeToFlag(item.emoji);
        }
        data.push(item);
      } else {
        console.log('조건 불충족 - emoji:', item.emoji, 'name_ko:', item.name_ko);
      }
    }

    console.log('최종 파싱된 데이터 개수:', data.length);
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

  function countryCodeToFlag(countryCode) {
    if (countryCode.length !== 2) return countryCode;
    
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 0x1F1E6 + char.charCodeAt(0) - 'A'.charCodeAt(0));
      
    return String.fromCodePoint(...codePoints);
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
    const lang = navigator.language.toLowerCase().split('-')[0];
    
    const categoryNames = {
      'all': { 'ko': '전체', 'default': 'All' },
      'smileys': { 'ko': '스마일리', 'default': 'Smileys' },
      'people': { 'ko': '사람', 'default': 'People' },
      'animals': { 'ko': '동물', 'default': 'Animals' },
      'food': { 'ko': '음식', 'default': 'Food' },
      'travel': { 'ko': '여행', 'default': 'Travel' },
      'activities': { 'ko': '활동', 'default': 'Activities' },
      'objects': { 'ko': '사물', 'default': 'Objects' },
      'symbols': { 'ko': '기호', 'default': 'Symbols' },
      'flags': { 'ko': '깃발', 'default': 'Flags' },
      'nature': { 'ko': '자연', 'default': 'Nature' }
    };

    const categoryData = categoryNames[category];
    if (!categoryData) return category;
    
    return categoryData[lang] || categoryData['default'];
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
    const chipsContainer = document.getElementById('chips');
    if (!chipsContainer) return;
    
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
    card.title = emoji.name_ko;
    
    card.innerHTML = '<div class="emoji-symbol">' + emoji.emoji + '</div>';

    card.addEventListener('click', () => copyEmoji(emoji));
    return card;
  }

  function copyEmoji(emoji) {
    navigator.clipboard.writeText(emoji.emoji).then(() => {
      addToHistory(emoji);
      showToast(emoji.emoji + ' 복사됨!');
    }).catch(error => {
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
    });
  }

  function addToHistory(emoji) {
    copyHistory = copyHistory.filter(item => item.emoji.emoji !== emoji.emoji);
    copyHistory.unshift({
      emoji: emoji,
      timestamp: new Date()
    });
    
    if (copyHistory.length > 10) {
      copyHistory = copyHistory.slice(0, 10);
    }
    
    updateClipboardDisplay();
  }

  function updateClipboardDisplay() {
    const clipboardContent = document.getElementById('clipboardContent');
    if (!clipboardContent) return;

    if (copyHistory.length === 0) {
      clipboardContent.innerHTML = '<div class="clipboard-empty">복사한 이모지가 표시됩니다.</div>';
      return;
    }

    clipboardContent.innerHTML = copyHistory.map((item, index) => {
      const timeAgo = getTimeAgo(item.timestamp);
      
      return '<div class="clipboard-item" onclick="copyFromHistory(\'' + item.emoji.emoji + '\')" title="' + item.emoji.name_ko + '"><span class="clipboard-item-emoji">' + item.emoji.emoji + '</span><span>' + item.emoji.name_ko + '</span><span class="clipboard-item-time">' + timeAgo + '</span></div>';
    }).join('');
  }

  function getTimeAgo(timestamp) {
    const now = new Date();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return hours + '시간 전';
    if (minutes > 0) return minutes + '분 전';
    return '방금 전';
  }

  window.copyFromHistory = function(text) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(text + ' 복사됨!');
    }).catch(error => {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showToast(text + ' 복사됨!');
    });
  };

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

  loadEmojis();
});
