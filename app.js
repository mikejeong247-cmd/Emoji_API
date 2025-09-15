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

// 강력한 CSV 파싱 함수
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    let i = 0;
    
    while (i < line.length) {
        const char = line[i];
        
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                // 이스케이프된 따옴표
                current += '"';
                i += 2;
            } else {
                // 따옴표 시작/끝
                inQuotes = !inQuotes;
                i++;
            }
        } else if (char === ',' && !inQuotes) {
            // 구분자
            result.push(current.trim());
            current = '';
            i++;
        } else {
            current += char;
            i++;
        }
    }
    
    // 마지막 필드
    result.push(current.trim());
    return result;
}

// 유니코드를 이모지로 변환
function convertUnicodeToEmoji(unicode) {
    if (!unicode || typeof unicode !== 'string') return '';
    
    // 이미 이모지인 경우
    if (!/U\+/.test(unicode)) return unicode;
    
    try {
        // U+1F600 U+1F601 형태 처리
        const matches = unicode.match(/U\+([0-9A-F]+)/gi);
        if (!matches) return '';
        
        const codePoints = matches.map(match => {
            const hex = match.substring(2);
            return parseInt(hex, 16);
        });
        
        return String.fromCodePoint(...codePoints);
    } catch (error) {
        console.warn('변환 실패:', unicode);
        return '';
    }
}

// 국가 코드를 깃발로 변환
function countryCodeToFlag(code) {
    if (!code || code.length !== 2) return '';
    
    try {
        const upper = code.toUpperCase();
        return String.fromCodePoint(
            ...[...upper].map(c => 0x1F1E6 + c.charCodeAt(0) - 65)
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
        
        console.log('CSV 길이:', csvText.length);
        
        const lines = csvText.split('\n');
        console.log('총 라인:', lines.length);
        
        // 헤더 확인
        if (lines.length > 0) {
            console.log('헤더:', lines[0]);
        }
        
        const dataLines = lines.slice(1).filter(line => line.trim());
        console.log('데이터 라인:', dataLines.length);
        
        const emojiSet = new Set(); // 중복 방지
        allEmojis = [];
        
        for (let i = 0; i < dataLines.length; i++) {
            const line = dataLines[i];
            const fields = parseCSVLine(line);
            
            // 디버깅용 - 처음 몇 개만 출력
            if (i < 3) {
                console.log(`라인 ${i + 2}:`, fields);
            }
            
            if (fields.length < 3) continue;
            
            const unicodeStr = fields[0] || '';
            const nameKo = fields[1] || '';
            const category = fields[2] || '';
            const countryCode = fields[3] || '';
            
            let emoji = '';
            
            // 국가 코드 처리
            if (countryCode && /^[A-Z]{2}$/i.test(countryCode)) {
                emoji = countryCodeToFlag(countryCode);
            } else {
                emoji = convertUnicodeToEmoji(unicodeStr);
            }
            
            // 성공적으로 변환되고 중복이 아닌 경우
            if (emoji && emoji.length > 0 && emoji !== unicodeStr && !emojiSet.has(emoji)) {
                emojiSet.add(emoji);
                allEmojis.push({
                    emoji: emoji,
                    name_ko: nameKo || '이모지',
                    category: category || '기타'
                });
                
                // 처음 몇 개 변환 결과 출력
                if (allEmojis.length <= 5) {
                    console.log(`변환 ${allEmojis.length}:`, emoji, nameKo);
                }
            }
        }
        
        console.log(`최종 결과: ${allEmojis.length}개 이모지`);
        
        if (allEmojis.length === 0) {
            document.getElementById('emojiGrid').innerHTML = '<div class="loading">변환된 이모지가 없습니다.<br>데이터 형식을 확인 중...</div>';
            return;
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
