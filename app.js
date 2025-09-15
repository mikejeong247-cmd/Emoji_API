// 단순화된 이모지 피커
document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('grid');
  const moreButton = document.getElementById('more');
  const toast = document.getElementById('toast');
  
  let emojis = [];
  let displayedCount = 0;
  const itemsPerPage = 100;
  let copyHistory = [];

  // Google Sheets에서 데이터 로드
  async function loadEmojis() {
    try {
      grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 2rem;">이모지를 불러오는 중...</div>';
      
      const response = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vTc7jzLftQBL-UUnwIHYR4yXHLp-fX3OKB0cE8l9tWKjCAr_Y_IpzO6P_aAbp6MZ_s2Qt26PC_71CVX/pub?gid=840637915&single=true&output=csv');
      
      if (!response.ok) {
        throw new Error('데이터 로드 실패');
      }
      
      const csvText = await response.text();
      emojis = parseCSV(csvText);
      
      console.log('이모지 데이터 로드 완료:', emojis.length, '개');
      displayEmojis();
      
    } catch (error) {
      console.error('데이터 로드 오류:', error);
      grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: red;">데이터를 불러올 수 없습니다.</div>';
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
        // 유니코드 코드가 있으면 이모지 생성
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

  // 이모지 표시
  function displayEmojis() {
    if (displayedCount === 0) {
      grid.innerHTML = '';
    }

    const start = displayedCount;
    const end = Math.min(start + itemsPerPage, emojis.length);

    for (let i = start; i < end; i++) {
      const emoji = emojis[i];
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
    
    card.innerHTML = `
      <div class="emoji-symbol">${emoji.emoji}</div>
      <div class="emoji-name">${emoji.name_ko}</div>
    `;

    card.addEventListener('click', () => copyEmoji(emoji));
    return card;
  }

  async function copyEmoji(emoji) {
    try {
      await navigator.clipboard.writeText(emoji.emoji);
      addToHistory(emoji);
      showToast(`${emoji.emoji} 복사됨!`);
    } catch (error) {
      // 폴백 복사
      const textArea = document.createElement('textarea');
      textArea.value = emoji.emoji;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      addToHistory(emoji);
      showToast(`${emoji.emoji} 복사됨!`);
    }
  }

  function addToHistory(emoji) {
    copyHistory = copyHistory.filter(item => item.emoji !== emoji.emoji);
    copyHistory.unshift({
      emoji: emoji,
      timestamp: new Date()
    });
    
    if (copyHistory.length > 50) {
      copyHistory = copyHistory.slice(0, 50);
    }
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2000);
  }

  function updateMoreButton() {
    const hasMore = displayedCount < emojis.length;
    moreButton.hidden = !hasMore;
    
    if (hasMore) {
      const remaining = emojis.length - displayedCount;
      moreButton.textContent = `더보기 (${remaining}개 남음)`;
    }
  }

  // 더보기 버튼 이벤트
  if (moreButton) {
    moreButton.addEventListener('click', displayEmojis);
  }

  // 복사 히스토리 사이드바 생성
  function createSidebar() {
    const sidebarToggle = document.createElement('button');
    sidebarToggle.className = 'sidebar-toggle';
    sidebarToggle.innerHTML = '📋';
    sidebarToggle.title = '복사 히스토리';
    
    const sidebar = document.createElement('div');
    sidebar.className = 'copy-sidebar';
    sidebar.innerHTML = `
      <div class="copy-sidebar-header">
        <h3 class="copy-sidebar-title">복사 히스토리</h3>
        <button class="copy-sidebar-toggle">✕</button>
      </div>
      <div class="copy-sidebar-content">
        <div class="copy-history">
          <div class="copy-empty">
            <span class="copy-empty-emoji">📋</span>
            <div>아직 복사한 이모지가 없습니다</div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(sidebarToggle);
    document.body.appendChild(sidebar);

    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      sidebarToggle.classList.toggle('active');
    });

    sidebar.querySelector('.copy-sidebar-toggle').addEventListener('click', () => {
      sidebar.classList.remove('open');
      sidebarToggle.classList.remove('active');
    });
  }

  // 초기화
  createSidebar();
  await loadEmojis();
});
