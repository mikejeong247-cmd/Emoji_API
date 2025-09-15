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
function convertUnicodeToEmoji(unicode) {
    if (!unicode || typeof unicode !== 'string') return '';
    
    console.log('변환 시도:', unicode);
    
    // 이미 이모지인 경우
    if (!/U\+/.test(unicode)) return unicode;
    
    try {
        // U+1F600 형태 처리
        const matches = unicode.match(/U\+([0-9A-F]+)/gi);
        if (!matches) return '';
        
        console.log('매치된 유니코드:', matches);
        
        const codePoints = matches.map(match => {
            const hex = match.substring(2);
            const code = parseInt(hex, 16);
            console.log(`${match} -> ${hex} -> ${code}`);
            return code;
        });
        
        const emoji = String.fromCodePoint(...codePoints);
        console.log('변환된 이모지:', emoji);
        return emoji;
    } catch (error) {
        console.warn('변환 실패:', unicode, error);
        return '';
    }
}

// 데이터 로드 - 가장 간단한 방식
async function loadEmojis() {
    try {
        console.log('간단한 split 방식으로 시작...');
        
        const response = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vTc7jzLftQBL-UUnwIHYR4yXHLp-fX3OKB0cE8l9tWKjCAr_Y_IpzO6P_aAbp6MZ_s2Qt26PC_71CVX/pub?gid=840637915&single=true&output=csv');
        const csvText = await response.text();
        
        console.log('CSV 길이:', csvText.length);
        
        const lines = csvText.split('\n');
        console.log('총 라인:', lines.length);
        
        // 헤더 출력
        console.log('헤더:', lines[0]);
        
        // 첫 몇 개 데이터 라인 출력
        for (let i = 1; i <= 3 && i < lines.length; i++) {
            console.log(`라인 ${i}:`, lines[i]);
        }
        
        allEmojis = [];
        
        // 간단한 split 방식으로 파싱
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            // 따옴표 제거 후 쉼표로 분할
            const cleanLine = line.replace(/"/g, '');
            const fields = cleanLine.split(',');
            
            if (i <= 3) {
                console.log(`파싱 ${i}:`, fields);
            }
            
            if (fields.length < 3) continue;
            
            const unicodeStr = fields[0]?.trim() || '';
            const nameKo = fields[1]?.trim() || '';
            const category = fields[2]?.trim() || '';
            
            if (!unicodeStr) continue;
            
            // 변환 시도
            const emoji = convertUnicodeToEmoji(unicodeStr);
            
            if (emoji && emoji !== unicodeStr) {
                allEmojis.push({
                    emoji: emoji,
                    name_ko: nameKo || '이모지',
                    category: category || '기타'
                });
                
                if (allEmojis.length <= 5) {
                    console.log(`성공 ${allEmojis.length}:`, emoji, nameKo);
                }
            }
        }
        
        console.log(`최종 결과: ${allEmojis.length}개 이모지`);
        
        if (allEmojis.length === 0) {
            // 테스트용으로 하드코딩된 이모지 추가
            console.log('변환 실패, 테스트 이모지 추가');
            allEmojis = [
                { emoji: '😀', name_ko: '웃는 얼굴', category: '스마일리 및 감정' },
                { emoji: '😂', name_ko: '눈물 흘리며 웃는 얼굴', category: '스마일리 및 감정' },
                { emoji: '❤️', name_ko: '하트', category: '기호' },
                { emoji: '👍', name_ko: '좋아요', category: '사람 및 신체' },
                { emoji: '🎉', name_ko: '축하', category: '사물' }
            ];
        }
        
        createCategories();
        displayEmojis();
        
    } catch (error) {
        console.error('로드 오류:', error);
        document.getElementById('emojiGrid').innerHTML = `<div class="loading">로드 실패: ${error.message}</div>`;
    }
}

// 카테고리 생성
function createCategories() {
    const categories = [...new Set(allEmojis.map(item => item.category))].filter(Boolean);
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
        const btn = document.createElement('button');
        btn.className = 'category-btn';
        btn.textContent = `${categoryIcons[category] || '📁'} ${category}`;
        btn.onclick = () => filterCategory(category);
        container.appendChild(btn);
    });
    
    console.log('카테고리:', categories);
}

// 카테고리 필터
function filterCategory(category) {
    currentCategory = category;
    
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
    
    const filtered = currentCategory === 'all' 
        ? allEmojis 
        : allEmojis.filter(item => item.category === currentCategory);
    
    if (filtered.length === 0) {
        grid.innerHTML = '<div class="loading">이모지가 없습니다</div>';
        return;
    }
    
    console.log(`표시할 이모지: ${filtered.length}개`);
    
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
