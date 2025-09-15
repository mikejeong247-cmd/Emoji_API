let allEmojis = [];
let clipboardEmojis = [];
let currentCategory = 'all';

// 카테고리별 대표 이모지
const categoryIcons = {
    '스마일리 및 감정': '😀',
    '사람 및 신체': '👤', 
    '동물 및 자연': '🐶',
    '음식 및 음료': '🍎',
    '여행 및 장소': '🌍',
    '활동': '⚽',
    '사물': '📱',
    '기호': '❤️',
    '깃발': '🏳️',
    'Smileys & Emotion': '😀',
    'People & Body': '👤',
    'Animals & Nature': '🐶', 
    'Food & Drink': '🍎',
    'Travel & Places': '🌍',
    'Activities': '⚽',
    'Objects': '📱',
    'Symbols': '❤️',
    'Flags': '🏳️'
};

// 유니코드를 이모지로 변환
function unicodeToEmoji(unicode) {
    if (!unicode || typeof unicode !== 'string') return '';
    
    try {
        const matches = unicode.match(/U\+([0-9A-F]+)/gi);
        if (!matches) return unicode;
        
        const codePoints = matches.map(match => parseInt(match.slice(2), 16));
        return String.fromCodePoint(...codePoints);
    } catch (error) {
        return '';
    }
}

// 국가 코드를 깃발로 변환
function countryToFlag(code) {
    if (!code || code.length !== 2) return '';
    try {
        return String.fromCodePoint(...code.toUpperCase().split('').map(c => 127397 + c.charCodeAt()));
    } catch (error) {
        return '';
    }
}

// 데이터 로드
async function loadEmojis() {
    try {
        const response = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vTc7jzLftQBL-UUnwIHYR4yXHLp-fX3OKB0cE8l9tWKjCAr_Y_IpzO6P_aAbp6MZ_s2Qt26PC_71CVX/pub?gid=840637915&single=true&output=csv');
        const csvText = await response.text();
        
        const lines = csvText.split('\n').slice(1); // 헤더 제거
        const emojiMap = new Map(); // 중복 제거용
        
        for (const line of lines) {
            if (!line.trim()) continue;
            
            const parts = line.split(',').map(p => p.replace(/"/g, '').trim());
            if (parts.length < 3) continue;
            
            const [unicodeStr, nameKo, category, countryCode] = parts;
            
            let emoji = '';
            if (countryCode && /^[A-Z]{2}$/i.test(countryCode)) {
                emoji = countryToFlag(countryCode);
            } else {
                emoji = unicodeToEmoji(unicodeStr);
            }
            
            if (!emoji || emoji === unicodeStr) continue;
            
            // 중복 제거: 같은 이모지가 있으면 한국어 이름 우선
            const key = emoji;
            if (!emojiMap.has(key) || nameKo) {
                emojiMap.set(key, {
                    emoji: emoji,
                    name_ko: nameKo || '이모지',
                    category: category || '기타'
                });
            }
        }
        
        allEmojis = Array.from(emojiMap.values());
        console.log(`중복 제거 후: ${allEmojis.length}개 이모지`);
        
        if (allEmojis.length > 0) {
            createCategories();
            displayEmojis();
        } else {
            document.getElementById('emojiGrid').innerHTML = '<div class="loading">이모지 로드 실패</div>';
        }
        
    } catch (error) {
        console.error('로드 오류:', error);
        document.getElementById('emojiGrid').innerHTML = '<div class="loading">오류 발생</div>';
    }
}

// 카테고리 생성
function createCategories() {
    const categories = [...new Set(allEmojis.map(item => item.category))];
    const container = document.getElementById('categories');
    if (!container) return;
    
    container.innerHTML = '';
    
    // 전체 버튼
    const allBtn = document.createElement('button');
    allBtn.className = 'category-btn active';
    allBtn.textContent = '🌟 전체';
    allBtn.onclick = () => filterCategory('all');
    container.appendChild(allBtn);
    
    // 카테고리별 버튼
    categories.forEach(category => {
        if (!category) return;
        const btn = document.createElement('button');
        btn.className = 'category-btn';
        btn.textContent = `${categoryIcons[category] || '📁'} ${category}`;
        btn.onclick = () => filterCategory(category);
        container.appendChild(btn);
    });
}

// 카테고리 필터
function filterCategory(category) {
    currentCategory = category;
    
    document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');
    
    displayEmojis();
}

// 이모지 표시
function displayEmojis() {
    const grid = document.getElementById('emojiGrid');
    if (!grid) return;
    
    const filtered = currentCategory === 'all' 
        ? allEmojis 
        : allEmojis.filter(item => item.category === currentCategory);
    
    if (filtered.length === 0) {
        grid.innerHTML = '<div class="loading">이모지가 없습니다</div>';
        return;
    }
    
    grid.innerHTML = '';
    
    filtered.forEach(item => {
        const div = document.createElement('div');
        div.className = 'emoji-item';
        div.title = item.name_ko;
        div.innerHTML = `<span class="emoji">${item.emoji}</span>`;
        div.onclick = () => copyEmoji(item.emoji, item.name_ko);
        grid.appendChild(div);
    });
}

// 이모지 복사
function copyEmoji(emoji, name) {
    clipboardEmojis.push(emoji);
    updateClipboard();
    
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(emoji).then(() => {
            showToast(`${emoji} 복사됨!`);
        }).catch(() => fallbackCopy(emoji));
    } else {
        fallbackCopy(emoji);
    }
}

// 폴백 복사
function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        document.execCommand('copy');
        showToast(`${text} 복사됨!`);
    } catch (err) {
        showToast('복사 실패');
    }
    
    document.body.removeChild(textarea);
}

// 클립보드 업데이트
function updateClipboard() {
    const clipboard = document.getElementById('clipboard');
    if (!clipboard) return;
    
    if (clipboardEmojis.length === 0) {
        clipboard.innerHTML = '<span style="color: #999;">복사한 이모지가 여기에 표시됩니다</span>';
    } else {
        clipboard.textContent = clipboardEmojis.join(' ');
    }
}

// 클립보드 지우기
function clearClipboard() {
    clipboardEmojis = [];
    updateClipboard();
    showToast('클립보드 초기화');
}

// 토스트 메시지
function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1500);
}

// 전역 함수
window.filterCategory = filterCategory;
window.copyEmoji = copyEmoji;
window.clearClipboard = clearClipboard;

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    updateClipboard();
    loadEmojis();
});

if (document.readyState !== 'loading') {
    updateClipboard();
    loadEmojis();
}
