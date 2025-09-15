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

// 간단한 유니코드 변환 함수
function unicodeToEmoji(unicodeString) {
    if (!unicodeString || typeof unicodeString !== 'string') {
        return '';
    }
    
    // 이미 이모지인 경우 그대로 반환
    if (!/U\+/.test(unicodeString)) {
        return unicodeString;
    }
    
    try {
        // U+로 시작하는 유니코드들을 찾아서 변환
        const matches = unicodeString.match(/U\+([0-9A-F]+)/gi);
        if (!matches) {
            return '';
        }
        
        const codePoints = matches.map(match => {
            const hex = match.substring(2); // U+ 제거
            return parseInt(hex, 16);
        });
        
        return String.fromCodePoint(...codePoints);
    } catch (error) {
        console.warn('유니코드 변환 실패:', unicodeString, error);
        return '';
    }
}

// 국가 코드를 깃발로 변환
function countryToFlag(countryCode) {
    if (!countryCode || countryCode.length !== 2) {
        return '';
    }
    
    try {
        const upper = countryCode.toUpperCase();
        return String.fromCodePoint(
            ...upper.split('').map(char => 127397 + char.charCodeAt(0))
        );
    } catch (error) {
        console.warn('깃발 변환 실패:', countryCode, error);
        return '';
    }
}

// CSV를 간단하게 파싱
function simpleCSVParse(csvText) {
    const lines = csvText.split('\n');
    const result = [];
    
    // 첫 번째 줄은 헤더로 스킵
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // 간단한 CSV 파싱 (따옴표 처리)
        const fields = [];
        let current = '';
        let inQuotes = false;
        
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                fields.push(current.trim().replace(/^"(.*)"$/, '$1'));
                current = '';
            } else {
                current += char;
            }
        }
        
        // 마지막 필드 추가
        fields.push(current.trim().replace(/^"(.*)"$/, '$1'));
        
        if (fields.length >= 3) {
            result.push(fields);
        }
    }
    
    return result;
}

// 데이터 로드 함수
async function loadEmojis() {
    const emojiGrid = document.getElementById('emojiGrid');
    
    try {
        console.log('이모지 데이터를 불러오는 중...');
        
        const response = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vTc7jzLftQBL-UUnwIHYR4yXHLp-fX3OKB0cE8l9tWKjCAr_Y_IpzO6P_aAbp6MZ_s2Qt26PC_71CVX/pub?gid=840637915&single=true&output=csv');
        
        if (!response.ok) {
            throw new Error(`네트워크 오류: ${response.status}`);
        }
        
        const csvText = await response.text();
        console.log('CSV 데이터 수신 완료');
        
        const rows = simpleCSVParse(csvText);
        console.log('파싱된 행 수:', rows.length);
        
        if (rows.length === 0) {
            throw new Error('파싱된 데이터가 없습니다');
        }
        
        // 이모지 변환
        allEmojis = [];
        let successCount = 0;
        
        for (const row of rows) {
            const [unicodeStr = '', name = '', category = '', code = ''] = row;
            
            let emoji = '';
            
            // 국가 코드 처리
            if (code && /^[A-Z]{2}$/i.test(code.trim())) {
                emoji = countryToFlag(code.trim());
            } else if (unicodeStr) {
                emoji = unicodeToEmoji(unicodeStr);
            }
            
            // 성공적으로 변환된 경우만 추가
            if (emoji && emoji.length > 0) {
                allEmojis.push({
                    emoji: emoji,
                    name_ko: name || '이모지',
                    category: category || '기타',
                    original: unicodeStr
                });
                successCount++;
            }
        }
        
        console.log(`총 ${successCount}개 이모지 변환 성공`);
        
        if (allEmojis.length === 0) {
            emojiGrid.innerHTML = '<div class="loading">이모지 변환에 실패했습니다. 새로고침해보세요.</div>';
            return;
        }
        
        // 샘플 출력
        console.log('변환된 이모지 샘플:', allEmojis.slice(0, 5).map(e => `${e.emoji} (${e.name_ko})`));
        
        createCategories();
        displayEmojis();
        
    } catch (error) {
        console.error('데이터 로드 오류:', error);
        emojiGrid.innerHTML = `<div class="loading">오류: ${error.message}<br>잠시 후 다시 시도해주세요.</div>`;
    }
}

// 카테고리 생성
function createCategories() {
    const categories = [...new Set(allEmojis.map(item => item.category))];
    const container = document.getElementById('categories');
    
    if (!container) {
        console.error('카테고리 컨테이너를 찾을 수 없습니다');
        return;
    }
    
    container.innerHTML = '';
    
    // 전체 버튼
    const allButton = document.createElement('button');
    allButton.className = 'category-btn active';
    allButton.textContent = '🌟 전체';
    allButton.addEventListener('click', () => filterCategory('all'));
    container.appendChild(allButton);
    
    // 카테고리별 버튼
    categories.forEach(category => {
        if (!category) return;
        
        const icon = categoryIcons[category] || '📁';
        const button = document.createElement('button');
        button.className = 'category-btn';
        button.textContent = `${icon} ${category}`;
        button.addEventListener('click', () => filterCategory(category));
        container.appendChild(button);
    });
    
    console.log('카테고리 생성:', categories.length, '개');
}

// 카테고리 필터링
function filterCategory(category) {
    currentCategory = category;
    
    // 버튼 활성화 상태 변경
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 클릭된 버튼 활성화
    event.target.classList.add('active');
    
    displayEmojis();
}

// 이모지 표시
function displayEmojis() {
    const grid = document.getElementById('emojiGrid');
    if (!grid) return;
    
    const filteredEmojis = currentCategory === 'all' 
        ? allEmojis 
        : allEmojis.filter(item => item.category === currentCategory);
    
    console.log(`${currentCategory}: ${filteredEmojis.length}개 이모지 표시`);
    
    if (filteredEmojis.length === 0) {
        grid.innerHTML = '<div class="loading">해당 카테고리에 이모지가 없습니다</div>';
        return;
    }
    
    // 그리드 내용 생성
    grid.innerHTML = filteredEmojis.map(item => `
        <div class="emoji-item" onclick="copyEmoji('${item.emoji}', '${item.name_ko}')" title="${item.name_ko}">
            <span class="emoji">${item.emoji}</span>
        </div>
    `).join('');
}

// 이모지 복사
function copyEmoji(emoji, name) {
    clipboardEmojis.push(emoji);
    updateClipboard();
    
    // 시스템 클립보드에 복사
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
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-999px';
    textarea.style.top = '-999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showToast(`${text} 복사됨!`);
        } else {
            showToast('복사 실패');
        }
    } catch (err) {
        console.error('복사 실패:', err);
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
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 1500);
}

// 전역 함수로 노출
window.filterCategory = filterCategory;
window.copyEmoji = copyEmoji;
window.clearClipboard = clearClipboard;

// DOM 로드 완료 후 실행
document.addEventListener('DOMContentLoaded', function() {
    console.log('페이지 로드 완료, 초기화 시작');
    updateClipboard();
    loadEmojis();
});

// 이미 로드된 경우를 위한 백업
if (document.readyState !== 'loading') {
    console.log('페이지 이미 로드됨, 즉시 초기화');
    updateClipboard();
    loadEmojis();
}
