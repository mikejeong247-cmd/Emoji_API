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

// 유니코드를 이모지로 변환하는 함수
function convertUnicodeToEmoji(unicodeStr) {
    if (!unicodeStr) return '';
    
    try {
        // "U+1F600" 형태의 유니코드를 처리
        if (unicodeStr.includes('U+')) {
            // 여러 유니코드가 공백으로 구분된 경우를 처리
            const unicodeParts = unicodeStr.split(/\s+/);
            const codePoints = [];
            
            for (const part of unicodeParts) {
                if (part.startsWith('U+')) {
                    const hex = part.slice(2);
                    const codePoint = parseInt(hex, 16);
                    if (!isNaN(codePoint)) {
                        codePoints.push(codePoint);
                    }
                }
            }
            
            if (codePoints.length > 0) {
                return String.fromCodePoint(...codePoints);
            }
        }
        
        // 이미 이모지인 경우 그대로 반환
        return unicodeStr;
    } catch (error) {
        console.error('유니코드 변환 오류:', error);
        return '';
    }
}

// 국가 코드를 깃발 이모지로 변환
function convertCountryCodeToFlag(countryCode) {
    if (!countryCode || countryCode.length !== 2) return '';
    
    try {
        const codePoints = countryCode
            .toUpperCase()
            .split('')
            .map(char => 127397 + char.charCodeAt(0));
        return String.fromCodePoint(...codePoints);
    } catch (error) {
        console.error('깃발 변환 오류:', error);
        return '';
    }
}

// CSV 파싱
function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const result = [];
    
    for (let i = 1; i < lines.length; i++) { // 헤더 스킵
        const line = lines[i].trim();
        if (!line) continue;
        
        const columns = [];
        let current = '';
        let inQuotes = false;
        
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                columns.push(current.trim().replace(/^"|"$/g, ''));
                current = '';
            } else {
                current += char;
            }
        }
        columns.push(current.trim().replace(/^"|"$/g, ''));
        
        if (columns.length >= 3) {
            result.push(columns);
        }
    }
    
    return result;
}

// 데이터 로드
async function loadEmojis() {
    try {
        console.log('이모지 데이터 로딩 시작...');
        
        const response = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vTc7jzLftQBL-UUnwIHYR4yXHLp-fX3OKB0cE8l9tWKjCAr_Y_IpzO6P_aAbp6MZ_s2Qt26PC_71CVX/pub?gid=840637915&single=true&output=csv');
        
        if (!response.ok) {
            throw new Error(`HTTP 오류: ${response.status}`);
        }
        
        const csvText = await response.text();
        console.log('CSV 데이터 받아옴');
        
        const parsedData = parseCSV(csvText);
        console.log('파싱된 데이터 행 수:', parsedData.length);
        
        allEmojis = [];
        
        for (let i = 0; i < parsedData.length; i++) {
            const row = parsedData[i];
            const unicodeStr = row[0] || '';
            const name_ko = row[1] || '';
            const category = row[2] || '';
            const countryCode = row[3] || '';
            
            let emoji = '';
            
            // 국가 코드가 있으면 깃발 이모지로 변환
            if (countryCode && countryCode.length === 2 && /^[A-Z]{2}$/i.test(countryCode)) {
                emoji = convertCountryCodeToFlag(countryCode);
            } else {
                // 유니코드를 이모지로 변환
                emoji = convertUnicodeToEmoji(unicodeStr);
            }
            
            // 변환이 성공하고 실제 이모지가 있는 경우만 추가
            if (emoji && emoji !== unicodeStr && emoji.length > 0) {
                allEmojis.push({
                    emoji: emoji,
                    name_ko: name_ko || '이모지',
                    category: category || '기타',
                    original: unicodeStr
                });
            }
        }
        
        console.log(`총 ${allEmojis.length}개의 이모지 변환 완료`);
        
        if (allEmojis.length === 0) {
            throw new Error('변환된 이모지가 없습니다');
        }
        
        // 처음 몇 개 이모지 확인
        console.log('처음 5개 이모지:', allEmojis.slice(0, 5).map(e => e.emoji));
        
        createCategories();
        displayEmojis();
        
    } catch (error) {
        console.error('데이터 로드 실패:', error);
        document.getElementById('emojiGrid').innerHTML = 
            '<div class="loading">데이터 로드에 실패했습니다: ' + error.message + '</div>';
    }
}

// 카테고리 생성
function createCategories() {
    const categories = [...new Set(allEmojis.map(emoji => emoji.category))].filter(Boolean);
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
        const icon = categoryIcons[category] || '📁';
        const btn = document.createElement('button');
        btn.className = 'category-btn';
        btn.textContent = `${icon} ${category}`;
        btn.onclick = () => filterCategory(category);
        container.appendChild(btn);
    });
    
    console.log('카테고리 생성 완료:', categories.length);
}

// 카테고리 필터
function filterCategory(category) {
    currentCategory = category;
    
    // 버튼 활성 상태 변경
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    displayEmojis();
}

// 이모지 표시
function displayEmojis() {
    const grid = document.getElementById('emojiGrid');
    if (!grid) return;
    
    let emojisToShow = currentCategory === 'all' 
        ? allEmojis 
        : allEmojis.filter(emoji => emoji.category === currentCategory);
    
    console.log(`${currentCategory} 카테고리: ${emojisToShow.length}개 이모지`);
    
    if (emojisToShow.length === 0) {
        grid.innerHTML = '<div class="loading">이모지가 없습니다</div>';
        return;
    }
    
    grid.innerHTML = '';
    
    emojisToShow.forEach(emojiData => {
        const item = document.createElement('div');
        item.className = 'emoji-item';
        item.title = emojiData.name_ko;
        
        const span = document.createElement('span');
        span.className = 'emoji';
        span.innerHTML = emojiData.emoji; // innerHTML 사용으로 이모지 직접 삽입
        
        item.appendChild(span);
        item.onclick = () => copyEmoji(emojiData.emoji, emojiData.name_ko);
        
        grid.appendChild(item);
    });
    
    console.log('이모지 표시 완료');
}

// 이모지 복사
function copyEmoji(emoji, name) {
    clipboardEmojis.push(emoji);
    updateClipboard();
    
    // 클립보드에 복사
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

// 폴백 복사
function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
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
        clipboard.innerHTML = clipboardEmojis.join(' ');
    }
}

// 클립보드 지우기
function clearClipboard() {
    clipboardEmojis = [];
    updateClipboard();
    showToast('클립보드 지워짐');
}

// 토스트 메시지
function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 1500);
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
