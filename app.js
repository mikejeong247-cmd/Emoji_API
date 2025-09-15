
document.addEventListener('DOMContentLoaded', () => {
  console.log('JavaScript 파일 로드 성공');
  
  const grid = document.getElementById('grid');
  if (grid) {
    grid.innerHTML = '<div style="text-align: center; padding: 2rem; color: green;">앱이 정상적으로 로드되었습니다</div>';
  }
});
