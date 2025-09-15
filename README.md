# 🎯 Emoji Picker

한국어 이모지 검색 및 복사 사이트

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen)](https://your-username.github.io/emoji-picker)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ 주요 기능

### 🔍 스마트 검색
- **한글 검색**: "웃는", "하트", "음식" 등으로 검색
- **영문 검색**: "smile", "heart", "food" 등으로 검색  
- **이모지 검색**: 이모지를 직접 입력해서 검색
- **유니코드 검색**: "1F600" 등 코드로 검색

### 📂 카테고리 필터
- 스마일리, 동물, 음식, 여행, 활동, 사물, 기호 등
- 각 카테고리별 이모지 개수 표시
- 원클릭으로 카테고리 전환

### 📋 원클릭 복사
- **즉시 복사**: 이모지 클릭 시 바로 클립보드에 복사
- **복사 확인**: 토스트 메시지로 복사 완료 알림
- **브라우저 호환**: 모든 브라우저에서 작동하는 폴백 시스템

### 📚 복사 히스토리
- **지속적인 히스토리**: 복사한 이모지들을 계속 보관
- **재복사 기능**: 히스토리에서 클릭으로 재복사
- **시간 표시**: "방금 전", "5분 전" 등 복사 시간 표시
- **중복 제거**: 같은 이모지는 자동으로 최신 순으로 정렬

### ♿ 접근성 지원
- **키보드 네비게이션**: Tab, Enter, Space 키 지원
- **스크린 리더**: ARIA 속성 및 라이브 영역 지원
- **고대비 모드**: 시각 장애인을 위한 고대비 스타일

## 🚀 사용법

### 기본 사용
1. **검색**: 상단 검색창에 원하는 이모지 키워드 입력
2. **필터링**: 카테고리 칩을 클릭해서 특정 분류 확인
3. **복사**: 원하는 이모지를 클릭하면 자동으로 클립보드에 복사
4. **붙여넣기**: 어디든 `Ctrl+V` (또는 `Cmd+V`)로 붙여넣기

### 고급 기능
- **복사 히스토리**: 우측 📋 버튼을 클릭해서 복사 기록 확인
- **키보드 단축키**: `Ctrl+K` (또는 `Cmd+K`)로 검색창 포커스
- **검색 초기화**: `ESC` 키로 검색어 지우기
- **더 보기**: 하단 "더보기" 버튼으로 추가 이모지 로드

## 💻 기술 스택

- **Frontend**: Vanilla JavaScript, CSS3, HTML5
- **데이터**: Google Sheets (CSV) 연동
- **배포**: GitHub Pages
- **스타일링**: CSS Grid, Flexbox, CSS Variables
- **접근성**: ARIA, 시맨틱 HTML

## 📱 브라우저 지원

| 브라우저 | 지원 버전 | 복사 기능 |
|---------|----------|----------|
| Chrome | 66+ | ✅ Clipboard API |
| Firefox | 63+ | ✅ execCommand |
| Safari | 13.1+ | ✅ Clipboard API |
| Edge | 79+ | ✅ Clipboard API |
| Mobile | iOS 13.4+, Android 6+ | ✅ 터치 지원 |

## 🎨 주요 특징

### 반응형 디자인
- **데스크톱**: 그리드 레이아웃, 사이드바 히스토리
- **태블릿**: 적응형 그리드, 터치 최적화
- **모바일**: 세로 레이아웃, 전체화면 히스토리

### 다크모드 자동 지원
- 시스템 설정에 따라 자동으로 다크/라이트 모드 전환
- CSS `prefers-color-scheme` 미디어 쿼리 사용

### 성능 최적화
- **무한 스크롤**: 100개씩 점진적 로딩
- **디바운스 검색**: 300ms 지연으로 불필요한 검색 방지
- **메모리 관리**: 최대 50개 히스토리 항목 제한

## 🔧 설치 및 실행

### 로컬 개발
```bash
# 저장소 클론
git clone https://github.com/your-username/emoji-picker.git

# 디렉토리 이동
cd emoji-picker

# 로컬 서버 실행 (Python 3)
python -m http.server 8000

# 또는 Node.js
npx serve .

# 브라우저에서 http://localhost:8000 접속
```

### GitHub Pages 배포
1. GitHub에 저장소 생성
2. 파일들을 main 브랜치에 푸시
3. Settings → Pages → Source를 "Deploy from a branch" 선택
4. Branch를 "main" 선택 후 Save
5. 몇 분 후 `https://your-username.github.io/repo-name`에서 접속 가능

## 📊 데이터 구조

### Google Sheets 연동
프로젝트는 Google Sheets CSV를 실시간으로 가져와서 이모지 데이터를 표시합니다.

**스프레드시트 형식**:
| id | category | code | emoji | name_en | name_ko |
|----|----------|------|-------|---------|---------|
| 1 | smileys | 1F600 | 😀 | grinning face | 활짝 웃는 얼굴 |
| 2 | animals | 1F436 | 🐶 | dog face | 강아지 얼굴 |

### 지원하는 카테고리
- `smileys` - 스마일리 & 감정
- `people` - 사람 & 신체
- `animals` - 동물 & 자연
- `food` - 음식 & 음료
- `travel` - 여행 & 장소
- `activities` - 활동 & 스포츠
- `objects` - 사물
- `symbols` - 기호
- `flags` - 깃발

## 🤝 기여하기

### 이슈 리포트
버그 발견이나 기능 제안은 [Issues](https://github.com/your-username/emoji-picker/issues)에서 등록해주세요.

### 개발 참여
1. Fork 프로젝트
2. 기능 브랜치 생성 (`git checkout -b feature/AmazingFeature`)
3. 변경사항 커밋 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 푸시 (`git push origin feature/AmazingFeature`)
5. Pull Request 생성

### 데이터 개선
이모지 데이터 추가나 번역 개선은 연동된 Google Sheets를 통해 실시간으로 반영됩니다.

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 🙏 감사의 말

- [Unicode Consortium](https://unicode.org/) - 이모지 표준 제공
- [Google Sheets API](https://developers.google.com/sheets/api) - 실시간 데이터 연동
- [GitHub Pages](https://pages.github.com/) - 무료 호스팅 서비스

## 📞 연락처

프로젝트 관련 문의: [GitHub Issues](https://github.com/your-username/emoji-picker/issues)

---

**⭐ 이 프로젝트가 유용하다면 Star를 눌러주세요!**
