console.log('app.js 로드됨');
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM 로드 완료');
  const grid = document.getElementById('grid');
  if (grid) {
    grid.innerHTML = '<div style="text-align: center; padding: 2rem;">테스트 성공</div>';
  }
});
