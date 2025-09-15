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

  // Google Sheets에서 데이터 로드
  function loadEmojis() {
    grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 2rem;">이모지를 불러오는 중...</div>';
    
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTc7jzLftQBL-UUnwIHYR4yXHLp-fX3OKB0cE8l9tWKjCAr_Y_IpzO6P_aAbp6MZ_s2Qt26PC_71CVX/pub?gid=840637915&single=true&output=csv';
    
    fetch(csvUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error('HTTP error! status: ' + response.status);
      }
      return response.text();
    })
    .then(csvText => {
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
      if (values.length < headers.length) continue;

      const item = {};
      headers.forEach((header, index) => {
        item[header] = values[index] || '';
      });

      if (item.emoji && item.name_ko) {
        if (item.code && (!item.emoji || item.emoji === '□')) {
          item.emoji = unicodeToEmoji(item.code);
        }
        if (item.emoji && item.emoji.length === 2 && /^[A-Z]{2}$/.test(item.emoji)) {
          item.emoji = countryCodeToFlag(item.emoji);
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
        // 카테고리별 대표 이모지 선택
        const representativeEmoji = getRepresentativeEmoji(category, emoji.emoji);
        categoryMap.set(category, {
          name: getCategoryName(category),
          emoji: representativeEmoji,
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
    const lang = navigator.language.toLowerCase();
    const isKorean = lang.startsWith('ko');
    
    const categoryNames = {
      'Activities': isKorean ? '활동' : 'Activities',
      'Animals & Nature': isKorean ? '동물' : 'Animals & Nature',
      'Component': isKorean ? '구성요소' : 'Component',
      'Flags': isKorean ? '깃발' : 'Flags',
      'Food & Drink': isKorean ? '음식' : 'Food & Drink',
      'Objects': isKorean ? '사물' : 'Objects',
      'People & Body': isKorean ? '사람' : 'People & Body',
      'Smileys & Emotion': isKorean ? '스마일리' : 'Smileys & Emotion',
      'Symbols': isKorean ? '기호' : 'Symbols',
      'Travel & Places': isKorean ? '여행' : 'Travel & Places'
    };

    return categoryNames[category] || category;
  }

  function getRepresentativeEmoji(category, firstEmoji) {
    const representatives = {
      'Activities': '⚽',
      'Animals & Nature': '🐶',
      'Component': '🔧',
      'Flags': '🏳️',
      'Food & Drink': '🍎',
      'Objects': '💡',
      'People & Body': '👤',
      'Smileys & Emotion': '😀',
      'Symbols': '💯',
      'Travel & Places': '🚗'
    };
    
    return representatives[category] || firstEmoji || '📁';
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
    try {
      navigator.clipboard.writeText(emoji.emoji).then(() => {
        addToHistory(emoji);
        showToast(emoji.emoji + ' 복사됨!');
      }).catch(() => {
        fallbackCopy(emoji);
      });
    } catch (error) {
      fallbackCopy(emoji);
    }
  }

  function fallbackCopy(emoji) {
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
    try {
      navigator.clipboard.writeText(text).then(() => {
        showToast(text + ' 복사됨!');
      }).catch(() => {
        fallbackCopyText(text);
      });
    } catch (error) {
      fallbackCopyText(text);
    }
  };

  function fallbackCopyText(text) {
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
