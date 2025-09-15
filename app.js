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
function convertToEmoji(unicodeStr) {
    if (!unicodeStr) return '';
    
    try {
        // U+ 패턴이 있는지 확인
        const unicodePattern = /U\+([0-9A-F]+)/gi;
        const matches = unicodeStr.match(unicodePattern);
        
        if (!matches) {
            // 이미 이모지인 경우 그대로 반환
            return unicodeStr;
        }
        
        // 모든 유니코드를 코드포인트로 변환
        const codePoints = matches.map(match => {
            const hex = match.replace('U+', '');
            return parseInt(hex, 16);
        });
        
        // 이모지로 변환
        return String.fromCodePoint(...codePoints);
        
    } catch (error) {
        console.warn('변환 실패:', unicodeStr);
        return '';
    }
}

// 국가 코드를 깃발로 변환
function countryToFlag(code) {
    if (!code || code.length !== 2) return '';
    
    try {
        return String.fromCodePoint(
            ...code.toUpperCase().split('').map(c => 0x1F1E6 + c.charCodeAt(0) - 65)
        );
    } catch (error) {
        return '';
    }
}

// 데이터 로드
async function loadEmojis() {
    try {
        console.log('데이터 로딩 시작...');
        
        const response = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vTc7jzLftQBL-UUnwIHYR4yXHLp-fX3OKB0cE8l9tWKjCAr_Y_IpzO6P_aAbp6MZ_s2Qt26PC_71CVX/pub?gid=840637915&single=true&output=csv');
        const csvText = await response.text();
        
        console.log('CSV 데이터 받음');
        
        // CSV 파싱
        const lines = csvText.trim().split('\n');
        const dataLines = lines.slice(1); // 헤더 제거
        
        console.log('데이터 행 수:', dataLines.length);
        
        allEmojis = [];
        let convertedCount = 0;
        
        for (const line of dataLines) {
            if (!line.trim()) continue;
            
            // CSV 파싱 (간단한 방식)
            const parts = line.split(',');
            if (parts.length < 3) continue;
            
            const unicodeStr = parts[0]?.replace(/"/g, '').trim();
            const nameKo = parts[1]?.replace(/"/g, '').trim();
            const category = parts[2]?.replace(/"/g, '').trim();
            const countryCode = parts[3]?.replace(/"/g, '').trim();
            
            let emoji = '';
            
            // 국가 코드가 있으면 깃발로 변환
            if (countryCode && /^[A-Z]{2}$/i.test(countryCode)) {
                emoji = countryToFlag(countryCode);
            } else {
                // 유니코드를 이모지로 변환
                emoji = convertToEmoji(unicodeStr);
            }
            
            // 변환 성공한 경우만 추가
            if (emoji && emoji.length > 0) {
                allEmojis.push({
                    emoji: emoji,
                    name_ko: nameKo || '이모지',
                    category: category || '기타'
                });
                convertedCount++;
            }
        }
        
        console.log(`${convertedCount}개 이모지 변환 완료`);
        console.log('샘플:', allEmojis.slice(0, 3).map(e => e.emoji));
        
        if (allEmojis.length > 0) {
            createCategories();
            displayEmojis();
        } else {
            document.getElementById('emojiGrid').innerHTML = '<div class="loading">이모지 변환에 실패했습니다</div>';
        }
        
    } catch (error) {
        console.error('로드 오류:', error);
        document.getElementById('emojiGrid').innerHTML = `<div class="loading">오류 발생: ${error.message}</div>`;
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
    
    console.log('카테고리 생성:', categories.length);
}

// 카테고리 필터
function filterCategory(category) {
    currentCategory = category;
    
    // 버튼 상태 변경
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    displayEmojis();
}

// 이모지 표시 - 핵심 수정 부분
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
    
    console.log(`${currentCategory}: ${filtered.length}개 표시`);
    
    // 직접 DOM 요소 생성 (innerHTML 사용 안 함)
    grid.innerHTML = '';
    
    filtered.forEach(item => {
        const emojiDiv = document.createElement('div');
        emojiDiv.className = 'emoji-item';
        emojiDiv.title = item.name_ko;
        
        const emojiSpan = document.createElement('span');
        emojiSpan.className = 'emoji';
        emojiSpan.appendChild(document.createTextNode(item.emoji)); // 텍스트 노드로 이모지 추가
        
        emojiDiv.appendChild(emojiSpan);
        emojiDiv.onclick = () => copyEmoji(item.emoji, item.name_ko);
        
        grid.appendChild(emojiDiv);
    });
}

// 이모지 복사
function copyEmoji(emoji, name) {
    clipboardEmojis.push(emoji);
    updateClipboard();
    
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
