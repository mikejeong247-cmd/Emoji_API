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

// 유니코드를 이모지로 변환 (개선된 버전)
function unicodeToEmoji(unicode) {
    if (!unicode || typeof unicode !== 'string') return '';
    
    // 이미 이모지인 경우 바로 반환
    if (!/U\+/.test(unicode)) {
        return unicode;
    }
    
    try {
        // 여러 유니코드가 공백으로 구분된 경우 처리
        const unicodeParts = unicode.split(/\s+/).filter(part => part.startsWith('U+'));
        
        if (unicodeParts.length === 0) {
            return '';
        }
        
        const codePoints = unicodeParts.map(part => {
            const hex = part.substring(2);
            return parseInt(hex, 16);
        }).filter(code => !isNaN(code) && code > 0);
        
        if (codePoints.length === 0) {
            return '';
        }
        
        return String.fromCodePoint(...codePoints);
    } catch (error) {
        console.error('유니코드 변환 실패:', unicode, error);
        return '';
    }
}

// 국가 코드를 깃발 이모지로 변환
function countryCodeToFlag(countryCode) {
    if (!countryCode || countryCode.length !== 2) return '';
    try {
        const codePoints = countryCode
            .toUpperCase()
            .split('')
            .map(char => 127397 + char.charCodeAt());
        return String.fromCodePoint(...codePoints);
    } catch (error) {
        console.error('깃발 변환 실패:', countryCode, error);
        return '';
    }
}

// CSV 라인 파싱 (개선된 버전)
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                // 따옴표 이스케이프 처리
                current += '"';
                i++; // 다음 따옴표 건너뛰기
            } else {
                inQuotes = !inQuotes;
            }
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

// 데이터 로드
async function loadEmojis() {
    try {
        console.log('이모지 데이터 로딩 시작...');
        
        const response = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vTc7jzLftQBL-UUnwIHYR4yXHLp-fX3OKB0cE8l9tWKjCAr_Y_IpzO6P_aAbp6MZ_s2Qt26PC_71CVX/pub?gid=840637915&single=true&output=csv');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const csvText = await response.text();
        console.log('CSV 데이터 로드 완료, 길이:', csvText.length);
        
        const lines = csvText.split('\n').filter(line => line.trim());
        console.log('총 라인 수:', lines.length);
        
        if (lines.length < 2) {
            throw new Error('CSV 데이터가 충분하지 않습니다.');
        }
        
        // 헤더 확인
        const header = lines[0];
        console.log('헤더:', header);
        
        // 데이터 라인 처리
        const dataLines = lines.slice(1);
        let successCount = 0;
        let failCount = 0;
        
        allEmojis = dataLines.map((line, index) => {
            try {
                const values = parseCSVLine(line);
                
                if (values.length < 3) {
                    console.log(`라인 ${index + 2} 스킵 (컬럼 부족):`, values.length);
                    failCount++;
                    return null;
                }
                
                let emojiUnicode = values[0]?.replace(/"/g, '').trim() || '';
                const name_ko = values[1]?.replace(/"/g, '').trim() || '';
                const category = values[2]?.replace(/"/g, '').trim() || '';
                const code = values[3]?.replace(/"/g, '').trim() || '';
                
                // 디버깅: 처음 몇 개 데이터 출력
                if (index < 3) {
                    console.log(`데이터 ${index + 1}:`, {
                        raw: emojiUnicode,
                        name: name_ko,
                        category: category,
                        code: code
                    });
                }
                
                // 이모지 변환
                let displayEmoji = '';
                
                // 국가 코드가 있으면 깃발 이모지로 변환 (우선순위)
                if (code && code.length === 2 && /^[A-Z]{2}$/.test(code)) {
                    displayEmoji = countryCodeToFlag(code);
                } else {
                    // 유니코드를 이모지로 변환
                    displayEmoji = unicodeToEmoji(emojiUnicode);
                }
                
                // 변환 결과 확인
                if (!displayEmoji) {
                    console.log(`변환 실패 ${index + 2}:`, emojiUnicode);
                    failCount++;
                    return null;
                }
                
                successCount++;
                
                return {
                    emoji: displayEmoji,
                    name_ko: name_ko || `이모지 ${index + 1}`,
                    category: category || '기타',
                    code: code,
                    original: emojiUnicode
                };
                
            } catch (error) {
                console.error(`라인 ${index + 2} 처리 오류:`, error, line);
                failCount++;
                return null;
            }
        }).filter(item => item !== null);

        console.log(`로딩 완료: 성공 ${successCount}개, 실패 ${failCount}개`);
        console.log(`총 ${allEmojis.length}개의 이모지를 로드했습니다.`);
        
        // 카테고리 확인
        const categories = [...new Set(allEmojis.map(emoji => emoji.category))];
        console.log('발견된 카테고리:', categories);
        
        if (allEmojis.length === 0) {
            throw new Error('변환된 이모지가 없습니다.');
        }
        
        createCategories();
        displayEmojis();
        
    } catch (error) {
        console.error('이모지 데이터 로드 실패:', error);
        const emojiGrid = document.getElementById('emojiGrid');
        if (emojiGrid) {
            emojiGrid.innerHTML = `<div class="loading">데이터 로드 실패: ${error.message}</div>`;
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
    
    console.log('카테고리 생성:', categories);
    
    // 카테고리 컨테이너 초기화
    categoriesContainer.innerHTML = '';
    
    // 전체 버튼 생성
    const allButton = document.createElement('button');
    allButton.className = 'category-btn active';
    allButton.textContent = '🌟 전체';
    allButton.onclick = () => filterCategory('all');
    categoriesContainer.appendChild(allButton);
    
    // 각 카테고리 버튼 생성
    categories.forEach(category => {
        const icon = categoryIcons[category] || '📁';
        const button = document.createElement('button');
        button.className = 'category-btn';
        button.textContent = `${icon} ${category}`;
        button.onclick = () => filterCategory(category);
        categoriesContainer.appendChild(button);
    });
    
    console.log('카테고리 버튼 생성 완료:', categoriesContainer.children.length);
}

// 카테고리 필터
function filterCategory(category) {
    console.log('카테고리 필터:', category);
    currentCategory = category;
    
    // 모든 버튼의 활성 상태 제거
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 클릭된 버튼 활성화
    if (window.event && window.event.target) {
        window.event.target.classList.add('active');
    } else {
        // 직접 호출된 경우 해당 버튼 찾기
        const buttons = document.querySelectorAll('.category-btn');
        buttons.forEach(btn => {
            const text = btn.textContent || '';
            if ((category === 'all' && text.includes('전체')) || 
                text.includes(category)) {
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
    
    console.log(`${currentCategory} 카테고리: ${filteredEmojis.length}개 이모지`);
    
    if (filteredEmojis.length === 0) {
        grid.innerHTML = '<div class="loading">이모지가 없습니다.</div>';
        return;
    }
    
    // 그리드 초기화
    grid.innerHTML = '';
    
    // 이모지 아이템 생성
    filteredEmojis.forEach((emojiData, index) => {
        const emojiItem = document.createElement('div');
        emojiItem.className = 'emoji-item';
        emojiItem.title = emojiData.name_ko;
        
        const emojiSpan = document.createElement('span');
        emojiSpan.className = 'emoji';
        emojiSpan.textContent = emojiData.emoji;
        
        emojiItem.appendChild(emojiSpan);
        
        // 클릭 이벤트 추가
        emojiItem.addEventListener('click', () => {
            copyEmoji(emojiData.emoji, emojiData.name_ko);
        });
        
        grid.appendChild(emojiItem);
        
        // 처음 몇 개 디버깅
        if (index < 3) {
            console.log(`표시된 이모지 ${index + 1}:`, emojiData.emoji, emojiData.name_ko);
        }
    });
    
    console.log('이모지 표시 완료:', filteredEmojis.length);
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

// 전역 함수 노출
window.filterCategory = filterCategory;
window.copyEmoji = copyEmoji;
window.clearClipboard = clearClipboard;

// DOM 로드 완료 후 실행
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM 로드 완료, 초기화 시작');
    updateClipboard();
    loadEmojis();
});

// 이미 로드된 경우를 위한 백업
if (document.readyState !== 'loading') {
    console.log('문서 이미 로드됨, 즉시 초기화');
    updateClipboard();
    loadEmojis();
}
