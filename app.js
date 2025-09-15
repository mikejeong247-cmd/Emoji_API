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
      // 실제 데이터 파일이 없는 경우를 위한 샘플 데이터
      let data;
      try {
        const response = await fetch('./data/emojis.json');
        if (!response.ok) throw new Error('데이터 파일 없음');
        data = await response.json();
      } catch {
        // 샘플 데이터로 대체
        data = this.getSampleData();
      }

      this.emojis = data;
      this.processCategories();
      this.hideLoading();
    } catch (error) {
      this.hideLoading();
      throw error;
    }
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

  async copyEmoji(emoji, cardElement) {
    try {
      await navigator.clipboard.writeText(emoji.emoji);
      
      // 시각적 피드백
      cardElement.classList.add('copied');
      setTimeout(() => {
        cardElement.classList.remove('copied');
      }, 1500);

      // 토스트 메시지
      this.showToast(`${emoji.emoji} 복사됨!`);
      
      // 접근성 알림
      this.announceToScreenReader(`${emoji.name_ko} 이모지가 클립보드에 복사되었습니다`);
      
    } catch (error) {
      console.error('클립보드 복사 실패:', error);
      this.showToast('복사에 실패했습니다');
    }
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
