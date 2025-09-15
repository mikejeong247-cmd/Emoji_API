class EmojiPicker {
  constructor() {
    // DOM 요소들
    this.searchInput = document.getElementById('search');
    this.chipsContainer = document.getElementById('chips');
    this.grid = document.getElementById('grid');
    this.moreButton = document.getElementById('more');
    this.toast = document.getElementById('toast');
    this.liveRegion = document.getElementById('live');

    // 상태 관리
    this.emojis = [];
    this.filteredEmojis = [];
    this.categories = new Map();
    this.currentCategory = 'all';
    this.currentQuery = '';
    this.displayedCount = 0;
    this.itemsPerPage = 100;
    this.isLoading = false;

    // 초기화
    this.init();
  }

  async init() {
    try {
      await this.loadEmojis();
      this.setupEventListeners();
      this.renderCategories();
      this.filterEmojis();
    } catch (error) {
      console.error('이모지 데이터 로드 실패:', error);
      this.showError('이모지 데이터를 불러올 수 없습니다.');
    }
  }

  async loadEmojis() {
    this.showLoading();
    
    try {
      const data = await this.fetchFromGoogleSheets();
      this.emojis = data;
      this.processCategories();
      this.hideLoading();
    } catch (error) {
      this.hideLoading();
      throw error;
    }
  }

  async fetchFromGoogleSheets() {
    const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTc7jzLftQBL-UUnwIHYR4yXHLp-fX3OKB0cE8l9tWKjCAr_Y_IpzO6P_aAbp6MZ_s2Qt26PC_71CVX/pub?gid=840637915&single=true&output=csv';
    
    try {
      const response = await fetch(SHEET_URL, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'text/csv,text/plain,*/*'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const csvText = await response.text();
      console.log('CSV 데이터 로드 성공:', csvText.substring(0, 200));
      return this.parseCSVToJSON(csvText);
    } catch (error) {
      console.error('Google Sheets 데이터 로드 오류:', error);
      throw error;
    }
  }

  parseCSVToJSON(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV 데이터가 비어있습니다');
    }

    // 헤더 파싱 (공백 제거)
    const headers = lines[0].split(',').map(header => 
      header.replace(/"/g, '').trim()
    );
    
    console.log('CSV 헤더:', headers);

    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // CSV 파싱 (쉼표로 분할하되 따옴표 내부는 제외)
      const values = this.parseCSVLine(line);
      
      if (values.length !== headers.length) {
        console.warn(`라인 ${i + 1}: 컬럼 수가 맞지 않음`, values);
        continue;
      }

      const item = {};
      headers.forEach((header, index) => {
        let value = values[index] || '';
        
        // 숫자 변환 (id 필드)
        if (header === 'id' && value) {
          value = parseInt(value, 10);
        }
        
        item[header] = value;
      });

      // 이모지가 비어있거나 네모로 표시되는 경우 유니코드에서 생성
      if (item.code && (!item.emoji || this.isSquareEmoji(item.emoji))) {
        item.emoji = this.unicodeToEmoji(item.code);
        console.log(`유니코드 ${item.code}를 이모지로 변환: ${item.emoji}`);
      }

      // 필수 필드 검증
      if (item.emoji && item.name_ko) {
        data.push(item);
      }
    }

    console.log(`총 ${data.length}개의 이모지 데이터 로드됨`);
    return data;
  }

  // 네모 이모지 감지 (□, ▢, 등)
  isSquareEmoji(emoji) {
    const squares = ['□', '▢', '◻', '▫', '⬜', '⬛', '◼', '◽', '◾', '▪', '▫'];
    return squares.includes(emoji) || emoji === '' || /^\s*$/.test(emoji);
  }

  // 유니코드 코드를 실제 이모지로 변환
  unicodeToEmoji(code) {
    if (!code) return '';
    
    try {
      // 여러 형식 지원: 1F600, U+1F600, 0x1F600
      let cleanCode = code.replace(/^(U\+|0x)/i, '');
      
      // 멀티 코드포인트 지원 (예: 1F468-200D-1F4BC)
      if (cleanCode.includes('-')) {
        const codePoints = cleanCode.split('-');
        return String.fromCodePoint(...codePoints.map(cp => parseInt(cp, 16)));
      } else {
        // 단일 코드포인트
        const codePoint = parseInt(cleanCode, 16);
        if (isNaN(codePoint)) return '';
        return String.fromCodePoint(codePoint);
      }
    } catch (error) {
      console.warn(`유니코드 변환 실패: ${code}`, error);
      return '';
    }
  }

  parseCSVLine(line) {
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

  getSampleData() {
    return [
      { id: 1, category: 'smileys', code: '1F600', emoji: '😀', name_en: 'grinning face', name_ko: '활짝 웃는 얼굴' },
      { id: 2, category: 'smileys', code: '1F601', emoji: '😁', name_en: 'beaming face with smiling eyes', name_ko: '눈웃음 짓는 얼굴' },
      { id: 3, category: 'smileys', code: '1F602', emoji: '😂', name_en: 'face with tears of joy', name_ko: '기쁨의 눈물을 흘리는 얼굴' },
      { id: 4, category: 'smileys', code: '1F603', emoji: '😃', name_en: 'grinning face with big eyes', name_ko: '큰 눈으로 웃는 얼굴' },
      { id: 5, category: 'smileys', code: '1F604', emoji: '😄', name_en: 'grinning face with smiling eyes', name_ko: '눈웃음과 함께 웃는 얼굴' },
      { id: 6, category: 'animals', code: '1F436', emoji: '🐶', name_en: 'dog face', name_ko: '강아지 얼굴' },
      { id: 7, category: 'animals', code: '1F431', emoji: '🐱', name_en: 'cat face', name_ko: '고양이 얼굴' },
      { id: 8, category: 'animals', code: '1F42D', emoji: '🐭', name_en: 'mouse face', name_ko: '쥐 얼굴' },
      { id: 9, category: 'animals', code: '1F439', emoji: '🐹', name_en: 'hamster', name_ko: '햄스터' },
      { id: 10, category: 'animals', code: '1F430', emoji: '🐰', name_en: 'rabbit face', name_ko: '토끼 얼굴' },
      { id: 11, category: 'food', code: '1F34E', emoji: '🍎', name_en: 'red apple', name_ko: '빨간 사과' },
      { id: 12, category: 'food', code: '1F34A', emoji: '🍊', name_en: 'tangerine', name_ko: '귤' },
      { id: 13, category: 'food', code: '1F34C', emoji: '🍌', name_en: 'banana', name_ko: '바나나' },
      { id: 14, category: 'food', code: '1F347', emoji: '🍇', name_en: 'grapes', name_ko: '포도' },
      { id: 15, category: 'food', code: '1F353', emoji: '🍓', name_en: 'strawberry', name_ko: '딸기' },
      { id: 16, category: 'activities', code: '26BD', emoji: '⚽', name_en: 'soccer ball', name_ko: '축구공' },
      { id: 17, category: 'activities', code: '1F3C0', emoji: '🏀', name_en: 'basketball', name_ko: '농구공' },
      { id: 18, category: 'activities', code: '1F3C8', emoji: '🏈', name_en: 'american football', name_ko: '미식축구공' },
      { id: 19, category: 'travel', code: '1F697', emoji: '🚗', name_en: 'automobile', name_ko: '자동차' },
      { id: 20, category: 'travel', code: '1F695', emoji: '🚕', name_en: 'taxi', name_ko: '택시' }
    ];
  }

  processCategories() {
    this.categories.clear();
    
    // 전체 카테고리 추가
    this.categories.set('all', {
      name: '전체',
      emoji: '🎯',
      count: this.emojis.length
    });

    // 각 카테고리별 카운트
    const categoryMap = new Map();
    
    this.emojis.forEach(emoji => {
      const category = emoji.category;
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          name: this.getCategoryName(category),
          emoji: this.getCategoryEmoji(category),
          count: 0
        });
      }
      categoryMap.get(category).count++;
    });

    // 카테고리를 알파벳 순으로 정렬하여 추가
    [...categoryMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([key, value]) => {
        this.categories.set(key, value);
      });
  }

  getCategoryName(category) {
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

  getCategoryEmoji(category) {
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

  setupEventListeners() {
    // 검색 입력
    this.searchInput.addEventListener('input', this.debounce((e) => {
      this.currentQuery = e.target.value.trim();
      this.filterEmojis();
    }, 300));

    // 검색 키보드 단축키
    this.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.clearSearch();
      }
    });

    // 더보기 버튼
    this.moreButton.addEventListener('click', () => {
      this.loadMoreEmojis();
    });

    // 전역 키보드 단축키
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + K로 검색 포커스
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.searchInput.focus();
      }
      
      // ESC로 검색 클리어
      if (e.key === 'Escape' && document.activeElement === this.searchInput) {
        this.clearSearch();
      }
    });

    // 검색창에 포커스 시 전체 선택
    this.searchInput.addEventListener('focus', () => {
      this.searchInput.select();
    });
  }

  renderCategories() {
    const fragment = document.createDocumentFragment();
    
    this.categories.forEach((category, key) => {
      const chip = document.createElement('button');
      chip.className = 'chip';
      chip.dataset.category = key;
      chip.setAttribute('aria-pressed', key === this.currentCategory);
      
      if (key === this.currentCategory) {
        chip.classList.add('active');
      }

      chip.innerHTML = `
        <span class="chip-emoji">${category.emoji}</span>
        <span>${category.name}</span>
        <span class="chip-count">${category.count}</span>
      `;

      chip.addEventListener('click', () => {
        this.selectCategory(key);
      });

      fragment.appendChild(chip);
    });

    this.chipsContainer.appendChild(fragment);
  }

  selectCategory(category) {
    // 이전 선택 해제
    const prevActive = this.chipsContainer.querySelector('.chip.active');
    if (prevActive) {
      prevActive.classList.remove('active');
      prevActive.setAttribute('aria-pressed', 'false');
    }

    // 새 선택
    const newActive = this.chipsContainer.querySelector(`[data-category="${category}"]`);
    if (newActive) {
      newActive.classList.add('active');
      newActive.setAttribute('aria-pressed', 'true');
    }

    this.currentCategory = category;
    this.filterEmojis();
    
    // 접근성 알림
    this.announceToScreenReader(`${this.categories.get(category).name} 카테고리 선택됨`);
  }

  filterEmojis() {
    let filtered = this.emojis;

    // 카테고리 필터
    if (this.currentCategory !== 'all') {
      filtered = filtered.filter(emoji => emoji.category === this.currentCategory);
    }

    // 검색어 필터
    if (this.currentQuery) {
      const query = this.currentQuery.toLowerCase();
      filtered = filtered.filter(emoji => 
        emoji.name_en.toLowerCase().includes(query) ||
        emoji.name_ko.toLowerCase().includes(query) ||
        emoji.emoji.includes(query) ||
        emoji.code.toLowerCase().includes(query)
      );
    }

    this.filteredEmojis = filtered;
    this.displayedCount = 0;
    this.grid.innerHTML = '';
    
    if (filtered.length === 0) {
      this.showEmptyState();
    } else {
      this.loadMoreEmojis();
      // 접근성 알림
      this.announceToScreenReader(`${filtered.length}개의 이모지를 찾았습니다`);
    }

    this.updateMoreButton();
  }

  loadMoreEmojis() {
    const start = this.displayedCount;
    const end = Math.min(start + this.itemsPerPage, this.filteredEmojis.length);
    
    if (start >= this.filteredEmojis.length) return;

    const fragment = document.createDocumentFragment();
    
    for (let i = start; i < end; i++) {
      const emoji = this.filteredEmojis[i];
      const card = this.createEmojiCard(emoji);
      fragment.appendChild(card);
    }

    this.grid.appendChild(fragment);
    this.displayedCount = end;
    this.updateMoreButton();
  }

  createEmojiCard(emoji) {
    const card = document.createElement('button');
    card.className = 'emoji-card';
    card.title = `${emoji.name_ko} (${emoji.name_en})`;
    card.setAttribute('aria-label', `${emoji.emoji} ${emoji.name_ko} 복사`);
    
    card.innerHTML = `
      <div class="emoji-symbol">${emoji.emoji}</div>
      <div class="emoji-name">${emoji.name_ko}</div>
    `;

    card.addEventListener('click', () => {
      this.copyEmoji(emoji, card);
    });

    // 키보드 접근성
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.copyEmoji(emoji, card);
      }
    });

    return card;
  }

  // 이모지 직접 복사 (클릭 시)
  async copyEmojiDirect(emoji) {
    try {
      await this.copyToClipboardDirect(emoji.emoji);
      
      // 복사 히스토리에 추가
      this.addToCopyHistory(emoji);
      
      // 토스트 메시지
      this.showToast(`${emoji.emoji} 복사됨!`);
      
      // 접근성 알림
      this.announceToScreenReader(`${emoji.name_ko} 이모지가 클립보드에 복사되었습니다`);
      
    } catch (error) {
      console.error('클립보드 복사 실패:', error);
      this.showToast('복사에 실패했습니다');
    }
  }

  async copyToClipboardDirect(text) {
    // 방법 1: 최신 Clipboard API 시도
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    
    // 방법 2: 구형 브라우저 폴백
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    if (!successful) {
      throw new Error('복사 실패');
    }
  }

  createCopySidebar() {
    // 메인 콘텐츠에 클래스 추가
    const main = document.querySelector('main');
    if (main) {
      main.classList.add('main-content');
    }

    // 사이드바 토글 버튼
    this.sidebarToggle = document.createElement('button');
    this.sidebarToggle.className = 'sidebar-toggle';
    this.sidebarToggle.innerHTML = '📋';
    this.sidebarToggle.title = '복사 히스토리';
    this.sidebarToggle.setAttribute('aria-label', '복사 히스토리 열기');
    
    // 사이드바
    this.copySidebar = document.createElement('div');
    this.copySidebar.className = 'copy-sidebar';
    this.copySidebar.setAttribute('role', 'complementary');
    this.copySidebar.setAttribute('aria-label', '복사 히스토리');

    this.copySidebar.innerHTML = `
      <div class="copy-sidebar-header">
        <h3 class="copy-sidebar-title">복사 히스토리</h3>
        <button class="copy-sidebar-toggle" aria-label="사이드바 닫기">✕</button>
      </div>
      <div class="copy-sidebar-content">
        <div class="copy-history">
          <div class="copy-empty">
            <span class="copy-empty-emoji">📋</span>
            <div>아직 복사한 이모지가 없습니다</div>
            <small>이모지를 클릭해서 복사해보세요!</small>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.sidebarToggle);
    document.body.appendChild(this.copySidebar);

    // 이벤트 리스너
    this.sidebarToggle.addEventListener('click', () => {
      this.toggleSidebar();
    });

    this.copySidebar.querySelector('.copy-sidebar-toggle').addEventListener('click', () => {
      this.closeSidebar();
    });

    // ESC 키로 사이드바 닫기
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.copySidebar.classList.contains('open')) {
        this.closeSidebar();
      }
    });
  }

  toggleSidebar() {
    if (this.copySidebar.classList.contains('open')) {
      this.closeSidebar();
    } else {
      this.openSidebar();
    }
  }

  openSidebar() {
    this.copySidebar.classList.add('open');
    this.sidebarToggle.classList.add('active');
    document.querySelector('.main-content')?.classList.add('sidebar-open');
    
    // 접근성 알림
    this.announceToScreenReader('복사 히스토리가 열렸습니다');
  }

  closeSidebar() {
    this.copySidebar.classList.remove('open');
    this.sidebarToggle.classList.remove('active');
    document.querySelector('.main-content')?.classList.remove('sidebar-open');
  }

  addToCopyHistory(emoji) {
    // 중복 제거 (같은 이모지가 있으면 제거)
    this.copyHistory = this.copyHistory.filter(item => item.emoji.emoji !== emoji.emoji);
    
    // 새 항목을 맨 앞에 추가
    this.copyHistory.unshift({
      emoji: emoji,
      timestamp: new Date(),
      id: Date.now()
    });

    // 최대 개수 제한
    if (this.copyHistory.length > this.maxHistoryItems) {
      this.copyHistory = this.copyHistory.slice(0, this.maxHistoryItems);
    }

    // UI 업데이트
    this.renderCopyHistory();
  }

  renderCopyHistory() {
    const historyContainer = this.copySidebar.querySelector('.copy-history');
    
    if (this.copyHistory.length === 0) {
      historyContainer.innerHTML = `
        <div class="copy-empty">
          <span class="copy-empty-emoji">📋</span>
          <div>아직 복사한 이모지가 없습니다</div>
          <small>이모지를 클릭해서 복사해보세요!</small>
        </div>
      `;
      return;
    }

    historyContainer.innerHTML = this.copyHistory.map((item, index) => {
      const timeAgo = this.getTimeAgo(item.timestamp);
      const isLatest = index === 0;
      
      return `
        <div class="copy-item ${isLatest ? 'latest' : ''}" data-id="${item.id}">
          <div class="copy-item-header">
            <span class="copy-item-emoji">${item.emoji.emoji}</span>
            <div class="copy-item-names">
              <div class="copy-item-name-ko">${item.emoji.name_ko}</div>
              <div class="copy-item-name-en">${item.emoji.name_en}</div>
            </div>
            <div class="copy-item-time">${timeAgo}</div>
          </div>
          <div class="copy-item-actions">
            <button class="copy-item-btn copy-emoji-btn" data-emoji="${item.emoji.emoji}">
              이모지 복사
            </button>
            <button class="copy-item-btn copy-name-btn" data-name="${item.emoji.name_ko}">
              이름 복사
            </button>
          </div>
        </div>
      `;
    }).join('');

    // 이벤트 리스너 추가
    historyContainer.querySelectorAll('.copy-emoji-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const emoji = btn.dataset.emoji;
        this.copyToClipboardDirect(emoji);
        this.showToast(`${emoji} 복사됨!`);
      });
    });

    historyContainer.querySelectorAll('.copy-name-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const name = btn.dataset.name;
        this.copyToClipboardDirect(name);
        this.showToast(`"${name}" 복사됨!`);
      });
    });

    // 아이템 클릭으로도 복사
    historyContainer.querySelectorAll('.copy-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('copy-item-btn')) return;
        
        const emoji = item.querySelector('.copy-item-emoji').textContent;
        this.copyToClipboardDirect(emoji);
        this.showToast(`${emoji} 복사됨!`);
      });
    });
  }

  getTimeAgo(timestamp) {
    const now = new Date();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}일 전`;
    if (hours > 0) return `${hours}시간 전`;
    if (minutes > 0) return `${minutes}분 전`;
    return '방금 전';
  }

  updateMoreButton() {
    const hasMore = this.displayedCount < this.filteredEmojis.length;
    this.moreButton.hidden = !hasMore;
    
    if (hasMore) {
      const remaining = this.filteredEmojis.length - this.displayedCount;
      this.moreButton.textContent = `더보기 (${remaining}개 남음)`;
    }
  }

  showEmptyState() {
    this.grid.innerHTML = `
      <div class="empty" style="grid-column: 1 / -1;">
        <div class="empty-emoji">🔍</div>
        <div class="empty-text">이모지를 찾을 수 없습니다</div>
        <div class="empty-subtext">다른 검색어나 카테고리를 시도해보세요</div>
      </div>
    `;
  }

  showLoading() {
    this.isLoading = true;
    this.grid.innerHTML = `
      <div class="loading" style="grid-column: 1 / -1;">
        이모지를 불러오는 중...
      </div>
    `;
  }

  hideLoading() {
    this.isLoading = false;
  }

  showError(message) {
    this.grid.innerHTML = `
      <div class="empty" style="grid-column: 1 / -1;">
        <div class="empty-emoji">⚠️</div>
        <div class="empty-text">오류가 발생했습니다</div>
        <div class="empty-subtext">${message}</div>
      </div>
    `;
  }

  showToast(message) {
    this.toast.textContent = message;
    this.toast.classList.add('show');
    
    setTimeout(() => {
      this.toast.classList.remove('show');
    }, 2000);
  }

  announceToScreenReader(message) {
    this.liveRegion.textContent = message;
    // 메시지 클리어
    setTimeout(() => {
      this.liveRegion.textContent = '';
    }, 1000);
  }

  clearSearch() {
    this.searchInput.value = '';
    this.currentQuery = '';
    this.filterEmojis();
    this.announceToScreenReader('검색어가 지워졌습니다');
  }

  // 디바운스 유틸리티
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
  new EmojiPicker();
});

// PWA 지원을 위한 서비스 워커 등록 (선택사항)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
