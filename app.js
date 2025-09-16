let allEmojis = [];
// 유니코드 변환 함수 추가
function unicodeToEmoji(unicodeStr) {
    if (!unicodeStr || !unicodeStr.includes('U+')) {
        return unicodeStr;
    }
    
    try {
        const codePoints = unicodeStr
            .split(' ')
            .map(code => code.replace('U+', ''))
            .filter(code => code.length > 0)
            .map(code => parseInt(code, 16));
            
        if (codePoints.length === 0) {
            return unicodeStr;
        }
        
        return String.fromCodePoint(...codePoints);
    } catch (error) {
        console.warn('유니코드 변환 실패:', unicodeStr, error);
        return unicodeStr;
    }
}
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

// 브라우저 감지
function getBrowserInfo() {
    const ua = navigator.userAgent;
    return {
        isSamsung: ua.indexOf('SamsungBrowser') > -1,
        isSafari: ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1,
        isFirefox: ua.indexOf('Firefox') > -1,
        isChrome: ua.indexOf('Chrome') > -1,
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua),
        isInApp: ua.indexOf('NAVER') > -1 || ua.indexOf('KAKAOTALK') > -1 || ua.indexOf('FB') > -1
    };
}

// 브라우저별 이벤트 처리
function addCompatibleEventListener(element, eventType, handler) {
    if (element.addEventListener) {
        element.addEventListener(eventType, handler, false);
    } else if (element.attachEvent) {
        element.attachEvent('on' + eventType, handler);
    } else {
        element['on' + eventType] = handler;
    }
}

// 데이터 로드 - 호환성 개선
function loadEmojis() {
    console.log('브라우저 호환성 모드로 데이터 로드...');
    console.log('브라우저 정보:', getBrowserInfo());
    
    // fetch 폴백 처리
    if (typeof fetch === 'undefined') {
        console.error('이 브라우저는 fetch를 지원하지 않습니다.');
        document.getElementById('emojiGrid').innerHTML = '<div class="loading">브라우저가 지원되지 않습니다.</div>';
        return;
    }
    
    fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vTc7jzLftQBL-UUnwIHYR4yXHLp-fX3OKB0cE8l9tWKjCAr_Y_IpzO6P_aAbp6MZ_s2Qt26PC_71CVX/pub?gid=840637915&single=true&output=csv')
    .then(function(response) {
        if (!response.ok) {
            throw new Error('네트워크 응답이 좋지 않습니다');
        }
        return response.text();
    })
    .then(function(csvText) {
        console.log('CSV 데이터 로드 완료');
        
        const lines = csvText.split('\n');
        allEmojis = [];
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const cleanLine = line.replace(/"/g, '');
            const fields = cleanLine.split(',');
            
            if (fields.length < 5) continue;
            
            const category = fields[1] ? fields[1].trim() : '';
            const emoji = fields[3] ? fields[3].trim() : '';
            const nameKo = fields[5] ? fields[5].trim() : '';
            
            if (emoji && category) {
                allEmojis.push({
                    emoji: emoji,
                    name_ko: nameKo || '이모지',
                    category: category
                });
            }
        }
        
        console.log('총 ' + allEmojis.length + '개 이모지 로드');
        
        if (allEmojis.length === 0) {
            document.getElementById('emojiGrid').innerHTML = '<div class="loading">데이터가 없습니다</div>';
            return;
        }
        
        createCategories();
        displayEmojis();
    })
    .catch(function(error) {
        console.error('로드 오류:', error);
        document.getElementById('emojiGrid').innerHTML = '<div class="loading">로드 실패: ' + error.message + '</div>';
    });
}

// 카테고리 생성 - 호환성 개선
function createCategories() {
    const categories = [];
    const categorySet = {};
    
    // 중복 제거 (Set 대신 객체 사용)
    for (let i = 0; i < allEmojis.length; i++) {
        const category = allEmojis[i].category;
        if (category && !categorySet[category]) {
            categorySet[category] = true;
            categories.push(category);
        }
    }
    
    const container = document.getElementById('categories');
    if (!container) return;
    
    container.innerHTML = '';
    
    // 전체 버튼
    const allBtn = document.createElement('button');
    allBtn.className = 'category-btn active';
    allBtn.appendChild(document.createTextNode('🌟 전체'));
    addCompatibleEventListener(allBtn, 'click', function() {
        filterCategory('all');
    });
    container.appendChild(allBtn);
    
    // 카테고리별 버튼
    for (let i = 0; i < categories.length; i++) {
        const category = categories[i];
        const icon = categoryIcons[category] || '📁';
        const btn = document.createElement('button');
        btn.className = 'category-btn';
        btn.appendChild(document.createTextNode(icon + ' ' + category));
        
        // 클로저를 사용하여 카테고리 값 보존
        (function(cat) {
            addCompatibleEventListener(btn, 'click', function() {
                filterCategory(cat);
            });
        })(category);
        
        container.appendChild(btn);
    }
    
    console.log('카테고리 생성:', categories);
}

// 카테고리 필터 - 호환성 개선
function filterCategory(category) {
    currentCategory = category;
    
    const buttons = document.querySelectorAll('.category-btn');
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].classList.remove('active');
    }
    
    // 이벤트 타겟 처리 개선
    const target = window.event ? window.event.target || window.event.srcElement : null;
    if (target) {
        target.classList.add('active');
    } else {
        // 폴백: 텍스트로 찾기
        for (let i = 0; i < buttons.length; i++) {
            const btnText = buttons[i].textContent || buttons[i].innerText || '';
            if ((category === 'all' && btnText.indexOf('전체') > -1) || 
                btnText.indexOf(category) > -1) {
                buttons[i].classList.add('active');
                break;
            }
        }
    }
    
    displayEmojis();
}

// 이모지 표시 - 호환성 개선
function displayEmojis() {
    const grid = document.getElementById('emojiGrid');
    if (!grid) return;
    
    const filtered = [];
    for (let i = 0; i < allEmojis.length; i++) {
        if (currentCategory === 'all' || allEmojis[i].category === currentCategory) {
            filtered.push(allEmojis[i]);
        }
    }
    
    if (filtered.length === 0) {
        grid.innerHTML = '<div class="loading">이모지가 없습니다</div>';
        return;
    }
    
    console.log('표시할 이모지:', filtered.length + '개');
    
    grid.innerHTML = '';
    
    for (let i = 0; i < filtered.length; i++) {
        const item = filtered[i];
        const div = document.createElement('div');
        div.className = 'emoji-item';
        div.title = item.name_ko;
        
        const span = document.createElement('span');
        span.className = 'emoji';
        span.appendChild(document.createTextNode(item.emoji));
        
        div.appendChild(span);
        
        // 클로저로 값 보존
        (function(emoji, name) {
            addCompatibleEventListener(div, 'click', function() {
                copyEmoji(emoji, name);
            });
            // 터치 이벤트도 추가 (모바일 호환성)
            addCompatibleEventListener(div, 'touchend', function(e) {
                if (e.preventDefault) e.preventDefault();
                copyEmoji(emoji, name);
            });
        })(item.emoji, item.name_ko);
        
        grid.appendChild(div);
    }
}

// 복사 기능 - 강화된 호환성
function copyEmoji(emoji, name) {
    clipboardEmojis.push(emoji);
    updateClipboard();
    
    const browserInfo = getBrowserInfo();
    
    // 1단계: 모던 클립보드 API 시도
    if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
        navigator.clipboard.writeText(emoji).then(function() {
            showToast(emoji + ' 복사됨!');
        }).catch(function() {
            fallbackCopy(emoji);
        });
    }
    // 2단계: execCommand 시도
    else if (document.execCommand) {
        fallbackCopy(emoji);
    }
    // 3단계: 인앱 브라우저나 제한된 환경
    else {
        if (browserInfo.isInApp) {
            showToast('앱 내 브라우저에서는 자동 복사가 제한됩니다. ' + emoji + ' 을(를) 길게 눌러 복사하세요.');
        } else {
            showToast('이 브라우저에서는 자동 복사가 지원되지 않습니다.');
        }
    }
}

// 폴백 복사 - 개선된 버전
function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    textarea.style.opacity = '0';
    
    document.body.appendChild(textarea);
    
    // 포커스 및 선택
    textarea.focus();
    textarea.select();
    
    // iOS Safari 호환성
    if (navigator.userAgent.match(/ipad|iphone/i)) {
        const range = document.createRange();
        range.selectNodeContents(textarea);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        textarea.setSelectionRange(0, 999999);
    }
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showToast(text + ' 복사됨!');
        } else {
            showToast('복사 실패 - 수동으로 복사해주세요');
        }
    } catch (err) {
        console.error('복사 실패:', err);
        showToast('복사 실패 - 수동으로 복사해주세요');
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
        clipboard.innerHTML = '';
        clipboard.appendChild(document.createTextNode(clipboardEmojis.join(' ')));
    }
}

// 클립보드 지우기
function clearClipboard() {
    clipboardEmojis = [];
    updateClipboard();
    showToast('클립보드 초기화');
}

// 토스트 메시지 - 호환성 개선
function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.innerHTML = '';
    toast.appendChild(document.createTextNode(message));
    toast.classList.add('show');
    
    setTimeout(function() {
        toast.classList.remove('show');
    }, 1500);
}

// 전역 함수로 노출 (HTML onclick 호환성)
window.filterCategory = filterCategory;
window.copyEmoji = copyEmoji;
window.clearClipboard = clearClipboard;

// 초기화 - 호환성 개선
function initializeApp() {
    console.log('앱 초기화 시작');
    updateClipboard();
    loadEmojis();
}

// DOM 로드 이벤트 - 다중 호환성
if (document.readyState === 'loading') {
    if (document.addEventListener) {
        document.addEventListener('DOMContentLoaded', initializeApp);
    } else if (document.attachEvent) {
        document.attachEvent('onreadystatechange', function() {
            if (document.readyState === 'complete') {
                initializeApp();
            }
        });
    }
} else {
    initializeApp();
}

// 윈도우 로드 이벤트도 추가 (보험)
if (window.addEventListener) {
    window.addEventListener('load', initializeApp);
} else if (window.attachEvent) {
    window.attachEvent('onload', initializeApp);
}
