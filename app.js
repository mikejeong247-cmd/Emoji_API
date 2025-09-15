// 이모지 피커 - Google Sheets 연동
document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('grid');
  const moreButton = document.getElementById('more');
  const toast = document.getElementById('toast');
  
  let emojis = [];
  let filteredEmojis = [];
  let displayedCount = 0;
  const itemsPerPage = 100;
  let copyHistory = [];
  let currentCategory = 'all';
  let categories = new Map();

  // Google Sheets에서 데이터 로드
  async function loadEmojis() {
    try {
      grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 2rem;">이모지를 불러오는 중...</div>';
      
      // CORS 프록시 사용
      const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTc7jzLftQBL-UUnwIHYR4yXHLp-fX3OKB0cE8l9tWKjCAr_Y_IpzO6P_aAbp6MZ_s2Qt26PC_71CVX/pub?gid=840637915&single=true&output=csv';
      const proxyUrl = 'https://api.allorigins.win/get?url=' + encodeURIComponent(csvUrl);
      
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error('HTTP error! status: ' + response.status);
      }
      
      const data = await response.json();
      const csvText = data.contents;
      
      emojis = parseCSV(csvText);
      
      processCategories();
      console.log('Google Sheets 데이터 로드 완료:', emojis.length, '개');
      
      renderCategories();
      filterAndDisplayEmojis();
      
    } catch (error) {
      console.error('Google Sheets 로드 오류:', error);
      grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: red;">Google Sheets 데이터를 불러올 수 없습니다.</div>';
    }
  }

  // 나머지 함수들도 계속...
  
  await loadEmojis();
});
