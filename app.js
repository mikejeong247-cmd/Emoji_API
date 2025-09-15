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

// 국가 코드를 깃발 이모지로 변환
function countryCodeToFlag(countryCode) {
    if (!countryCode || countryCode.length !== 2) return '';
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
}

// 데이터 로드
async function loadEmojis() {
    try {
        const response = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vTc7jzLftQBL-UUnwIHYR4yXHLp-fX3OKB0cE8l9tWKjCAr_Y_IpzO6P_aAbp6MZ_s2Qt26PC_71CVX/pub?gid=840637915&single=true&output=csv');
        const csvText = await response.text();
        
        const lines = csvText.split('\n');
        const headers = lines[0].split(',');
        
        allEmojis = lines.slice(1)
            .filter(line => line.trim())
            .map(line => {
                const values = line.split(',');
                const emoji = values[0]?.trim() || '';
                const name_ko = values[1]?.trim() || '';
                const category = values[2]?.trim() || '';
                const code = values[3]?.trim() || '';
                
                // 국가 코드가 있으면 깃발 이모지로 변환
                let displayEmoji = emoji;
                if (code && code.length === 2 && /^[A-Z]{2}$/.test(code)) {
                    displayEmoji = countryCodeToFlag(code);
                }
                
                return {
                    emoji: displayEmoji,
                    name_ko,
                    category,
                    code
                };
            })
            .filter(item => item.emoji);

        console.log(`총 ${allEmojis.length}개의 이모지를 로드했습니다.`);
        createCategories();
        displayEmojis();
    } catch (error) {
        console.error('이모지 데이터 로드 실패:', error);
        const emojiGrid = document.getElementById('emojiGrid');
        if (emojiGrid) {
            emojiGrid.innerHTML = '<div class="loading">이모지 로드에 실패했습니다.</div>';
        }
    }
}

// 카테고리 생성
function createCategories() {
    const categories = [...new Set(allEmojis.map(emoji => emoji.category))].filter(Boolean);
    const categoriesContainer = document.getElementById('categories');
    
    if (!categoriesContainer) {
        console.error('categories 요소를 찾을 수 없습니다.');
        return;
    }
    
    // 전체 버튼
    categoriesContainer.innerHTML = '<button class="category-btn active" onclick="filterCategory(\'all\')">🌟 전체</button>';
    
    categories.forEach(category => {
        const icon = categoryIcons[category] || '📁';
        const button = document.createElement('button');
        button.className = 'category-btn';
        button.onclick = () => filterCategory(category);
        button.textContent = `${icon} ${category}`;
        categoriesContainer.appendChild(button);
    });
}

// 카테고리 필터
function filterCategory(category) {
    currentCategory = category;
    
    // 활성 버튼 스타일 업데이트
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // event 객체가 있을 때만 target 사용
    if (window.event && window.event.target) {
        window.event.target.classList.add('active');
    } else {
        // 직접 호출된 경우, 해당 카테고리 버튼 찾아서 활성화
        const buttons = document.querySelectorAll('.category-btn');
        buttons.forEach(btn => {
            if ((category === 'all' && btn.textContent.includes('전체')) || 
                btn.textContent.includes(category)) {
                btn.classList.add('active');
            }
        });
    }
    
    displayEmojis();
}

// 이모지 표시
function displayEmojis() {
    const grid = document.getElementById('emojiGrid');
    if (!grid) {
        console.error('emojiGrid 요소를 찾을 수 없습니다.');
        return;
    }
    
    let filteredEmojis = currentCategory === 'all' 
        ? allEmojis 
        : allEmojis.filter(emoji => emoji.category === currentCategory);
    
    if (filteredEmojis.length === 0) {
        grid.innerHTML = '<div class="loading">이모지가 없습니다.</div>';
        return;
    }
    
    grid.innerHTML = filteredEmojis.map(emoji => 
        `<div class="emoji-item" onclick="copyEmoji('${emoji.emoji}', '${emoji.name_ko}')">
            <span class="emoji">${emoji.emoji}</span>
        </div>`
    ).join('');
}

// 이모지 복사 (이모지만 복사)
function copyEmoji(emoji, name) {
    // 클립보드에 이모지만 추가
    clipboardEmojis.push(emoji);
    updateClipboard();
    
    // 클립보드에 이모지만 복사
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(emoji).then(() => {
            showToast(`${emoji} 복사됨!`);
        }).catch(() => {
            fallbackCopy(emoji);
        });
    } else {
        fallbackCopy(emoji);
    }
}

// 폴백 복사 방법
function fallbackCopy(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showToast(`${text} 복사됨!`);
    } catch (err) {
        console.error('복사 실패:', err);
        showToast('복사에 실패했습니다.');
    }
    
    document.body.removeChild(textArea);
}

// 클립보드 업데이트
function updateClipboard() {
    const clipboard = document.getElementById('clipboard');
    if (!clipboard) {
        console.error('clipboard 요소를 찾을 수 없습니다.');
        return;
    }
    
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
    showToast('클립보드가 지워졌습니다');
}

// 토스트 메시지
function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) {
        console.error('toast 요소를 찾을 수 없습니다.');
        return;
    }
    
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 1500);
}

// DOM이 완전히 로드된 후 실행
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM 로드 완료');
    updateClipboard();
    loadEmojis();
});

// 브라우저 호환성을 위한 추가 이벤트 리스너
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        updateClipboard();
        loadEmojis();
    });
} else {
    // 이미 로드된 경우
    updateClipboard();
    loadEmojis();
}

// 전역 함수로 노출 (HTML onclick에서 사용)
window.filterCategory = filterCategory;
window.copyEmoji = copyEmoji;
window.clearClipboard = clearClipboard;
