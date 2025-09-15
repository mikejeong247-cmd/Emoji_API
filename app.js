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

// CSV 파싱 함수 (따옴표와 쉼표 처리)
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

// 유니코드를 이모지로 변환
function unicodeToEmoji(unicode) {
    if (!unicode) return '';
    
    // 이미 이모지인 경우 (유니코드가 아닌 실제 이모지)
    if (!/^U\+/.test(unicode)) {
        return unicode;
    }
    
    try {
        // 단일 유니코드 처리 (U+1F600)
        if (unicode.match(/^U\+[0-9A-F]+$/i)) {
            const hex = unicode.substring(2);
            const codePoint = parseInt(hex, 16);
            return String.fromCodePoint(codePoint);
        }
        
        // 복합 유니코드 처리 (U+1F468 U+200D U+1F4BB 등)
        if (unicode.includes(' U+')) {
            const codes = unicode.split(/\s+/).map(code => {
                if (code.startsWith('U+')) {
                    return parseInt(code.substring(2), 16);
                }
                return null;
            }).filter(code => code !== null);
            
            if (codes.length > 0) {
                return String.fromCodePoint(...codes);
            }
        }
        
        return '❓'; // 변환 실패시 물음표 이모지
    } catch (error) {
        console.error('유니코드 변환 오류:', unicode, error);
        return '❓';
    }
}

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
        
        const lines = csvText.split('\n').filter(line => line.trim());
        
        // 헤더 제거
        const dataLines = lines.slice(1);
        
        allEmojis = dataLines.map((line, index) => {
            const values = parseCSVLine(line);
            
            if (values.length < 3) {
                return null;
            }
            
            const emojiUnicode = values[0]?.replace(/"/g, '').trim() || '';
            const name_ko = values[1]?.replace(/"/g, '').trim() || '';
            const category = values[2]?.replace(/"/g, '').trim() || '';
            const code = values[3]?.replace(/"/g, '').trim() || '';
            
            // 유니코드를 실제 이모지로 변환
            let displayEmoji = unicodeToEmoji(emojiUnicode);
            
            // 국가 코드가 있으면 깃발 이모지로 변환 (우선순위)
            if (code && code.length === 2 && /^[A-Z]{2}$/.test(code)) {
                displayEmoji = countryCodeToFlag(code);
            }
            
            return {
                emoji: displayEmoji,
                name_ko,
                category,
                code,
                original: emojiUnicode
            };
        }).filter(item => item !== null && item.emoji && item.emoji !== '❓');

        console.log(`총 ${allEmojis.length}개의 이모지를 로드했습니다.`);
        
        if (allEmojis.length === 0) {
            console.error('변환된 이모지가 없습니다.');
            document.getElementById('emojiGrid').innerHTML = '<div class="loading">이모지 변환에 실패했습니다.</div>';
            return;
        }
        
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

// 이모지 표시 (HTML 이스케이핑 방지)
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
    
    // DOM 요소를 직접 생성하여 innerHTML 이스케이핑 문제 방지
    grid.innerHTML = '';
    
    filteredEmojis.forEach(emojiData => {
        const emojiItem = document.createElement('div');
        emojiItem.className = 'emoji-item';
        emojiItem.title = emojiData.name_ko;
        emojiItem.onclick = () => copyEmoji(emojiData.emoji, emojiData.name_ko);
        
        const emojiSpan = document.createElement('span');
        emojiSpan.className = 'emoji';
        emojiSpan.textContent = emojiData.emoji; // innerHTML 대신 textContent 사용
        
        emojiItem.appendChild(emojiSpan);
        grid.appendChild(emojiItem);
    });
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
        clipboard.textContent = clipboardEmojis.join(' '); // innerHTML 대신 textContent 사용
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
