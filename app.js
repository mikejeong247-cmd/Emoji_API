<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>이모지 모음집</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
        }

        .header h1 {
            color: white;
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 10px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }

        .chips {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 10px;
            margin-bottom: 20px;
        }

        .chip {
            display: flex;
            align-items: center;
            gap: 8px;
            background: rgba(255, 255, 255, 0.9);
            border: none;
            border-radius: 25px;
            padding: 8px 16px;
            font-size: 0.9rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            color: #333;
        }

        .chip:hover {
            background: white;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .chip.active {
            background: #4f46e5;
            color: white;
        }

        .chip-emoji {
            font-size: 1.1rem;
        }

        .chip-count {
            background: rgba(0,0,0,0.1);
            padding: 2px 6px;
            border-radius: 10px;
            font-size: 0.8rem;
            font-weight: 500;
        }

        .chip.active .chip-count {
            background: rgba(255,255,255,0.2);
        }

        .clipboard {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        }

        .clipboard-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 15px;
            font-size: 1.1rem;
            font-weight: 600;
            color: #333;
        }

        .clipboard-content {
            min-height: 60px;
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            align-items: flex-start;
        }

        .clipboard-empty {
            color: #666;
            font-style: italic;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 60px;
        }

        .clipboard-item {
            display: flex;
            align-items: center;
            gap: 8px;
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 8px 12px;
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 0.9rem;
        }

        .clipboard-item:hover {
            background: #e9ecef;
            transform: translateY(-1px);
        }

        .clipboard-item-emoji {
            font-size: 1.2rem;
        }

        .clipboard-item-time {
            font-size: 0.75rem;
            color: #666;
            margin-left: auto;
        }

        #grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
            gap: 12px;
            margin-bottom: 30px;
        }

        .emoji-card {
            background: white;
            border: none;
            border-radius: 12px;
            padding: 15px;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            aspect-ratio: 1;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .emoji-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            background: #f8f9ff;
        }

        .emoji-symbol {
            font-size: 2rem;
            line-height: 1;
        }

        #more {
            display: block;
            margin: 0 auto;
            padding: 12px 24px;
            background: #4f46e5;
            color: white;
            border: none;
            border-radius: 25px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3);
        }

        #more:hover {
            background: #4338ca;
            transform: translateY(-1px);
            box-shadow: 0 4px 16px rgba(79, 70, 229, 0.4);
        }

        #toast {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%) translateY(100px);
            background: #10b981;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
            opacity: 0;
            transition: all 0.3s ease;
            z-index: 1000;
        }

        #toast.show {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }

        .loading {
            text-align: center;
            padding: 2rem;
            color: white;
            font-size: 1.2rem;
            grid-column: 1 / -1;
        }

        @media (max-width: 768px) {
            #grid {
                grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
                gap: 8px;
            }
            
            .emoji-card {
                padding: 10px;
            }
            
            .emoji-symbol {
                font-size: 1.5rem;
            }

            .chips {
                gap: 5px;
            }

            .chip {
                font-size: 0.8rem;
                padding: 6px 12px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>이모지 모음집</h1>
        </div>
        
        <div id="chips" class="chips"></div>
        
        <div class="clipboard">
            <div class="clipboard-header">
                📋 클립보드
            </div>
            <div class="clipboard-content" id="clipboardContent">
                <div class="clipboard-empty">복사한 이모지가 표시됩니다.</div>
            </div>
        </div>
        
        <div id="grid">
            <div class="loading">이모지를 불러오는 중...</div>
        </div>
        <button id="more" hidden>더보기</button>
    </div>
    
    <div id="toast"></div>

    <script>
        // 이모지 피커 - Google Sheets 연동
        document.addEventListener('DOMContentLoaded', async () => {
          const grid = document.getElementById('grid');
          const moreButton = document.getElementById('more');
          const toast = document.getElementById('toast');
          const clipboardContent = document.getElementById('clipboardContent');
          
let emojis = [];
let filteredEmojis = [];
let displayedCount = 0;
const itemsPerPage = 100;
let copyHistory = [];
let currentCategory = 'all';
let categories = new Map();
// sidebar, sidebarToggle 변수 제거

          // Google Sheets에서 데이터 로드
          async function loadEmojis() {
            try {
              grid.innerHTML = '<div class="loading">이모지를 불러오는 중...</div>';
              
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
              grid.innerHTML = '<div class="loading" style="color: red;">Google Sheets 데이터를 불러올 수 없습니다.</div>';
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
  // 국가 코드를 깃발 이모지로 변환
  if (item.emoji && item.emoji.length === 2 && /^[A-Z]{2}$/.test(item.emoji)) {
    item.emoji = countryCodeToFlag(item.emoji);
  }
  data.push(item);
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
              
async function copyEmoji(emoji) {
  try {
    await navigator.clipboard.writeText(emoji.emoji);
    addToHistory(emoji);
    showToast(emoji.emoji + ' 복사됨!');
    // openSidebar() 제거
  } catch (error) {
    // 폴백 코드...
    addToHistory(emoji);
    showToast(emoji.emoji + ' 복사됨!');
    // openSidebar() 제거
  }
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
  
  updateClipboardDisplay(); // updateHistoryDisplay에서 변경
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

          await loadEmojis();
        });
    </script>
</body>
</html>
