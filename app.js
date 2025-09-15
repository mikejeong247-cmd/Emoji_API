// ← Apps Script 배포 후 받은 URL로 교체하세요.
const API_URL = 'YOUR_WEB_APP_URL_HERE'; // 예: https://script.google.com/macros/s/AKfycbx.../exec

const state = {
  q: '',
  category: 'ALL',
  offset: 0,
  limit: pageSize(),
  total: 0,
  loading: false,
  categoriesLoaded: false
};

document.addEventListener('DOMContentLoaded', () => {
  setupSearch();
  setupMore();
  // 초기 로드
  fetchAndRender(true);
  // 화면 크기 변화에 따라 페이지 크기 자동 조정
  window.addEventListener('resize', onResizeReflow);
});

function pageSize(){
  return window.matchMedia('(max-width: 768px)').matches ? 24 : 32;
}
function onResizeReflow(){
  const newLimit = pageSize();
  if (state.limit !== newLimit){
    state.limit = newLimit;
    state.offset = 0;
    fetchAndRender(true);
  }
}

function setupSearch(){
  const input = document.getElementById('search');
  const debounced = debounce(() => {
    state.q = (input.value || '').trim();
    state.offset = 0;
    fetchAndRender(true);
  }, 200);
  input.addEventListener('input', debounced);
}

function setupMore(){
  document.getElementById('more').addEventListener('click', () => {
    if (state.loading) return;
    fetchAndRender(false);
  });
}

function fetchAndRender(reset){
  state.loading = true;
  toggleMore(false);

  const params = new URLSearchParams({
    q: state.q,
    category: state.category,
    limit: state.limit,
    offset: state.offset,
    nocache: '1'
  });

  jsonp(`${API_URL}?${params.toString()}`).then(data => {
    if (reset) clearGrid();

    if (!state.categoriesLoaded && data.categories && data.categories.length){
      renderChips(data.categories);
      state.categoriesLoaded = true;
    }

    renderItems(data.items || []);
    state.total = data.total || 0;

    if (data.nextOffset != null){
      state.offset = data.nextOffset;
      toggleMore(true);
    } else {
      toggleMore(false);
    }
  }).catch(() => {
    showToast('데이터를 불러오지 못했어요');
  }).finally(() => {
    state.loading = false;
  });
}

function renderChips(categories){
  const wrap = document.getElementById('chips');
  wrap.innerHTML = '';
  categories.forEach(cat => {
    const el = document.createElement('button');
    el.className = 'chip' + (cat === state.category ? ' active' : '');
    el.textContent = cat;
    el.dataset.cat = cat;
    el.addEventListener('click', () => {
      if (state.category === cat) return;
      state.category = cat;
      state.offset = 0;
      // active 토글
      [...wrap.children].forEach(c => c.classList.remove('active'));
      el.classList.add('active');
      fetchAndRender(true);
    });
    wrap.appendChild(el);
  });
}

function renderItems(items){
  const grid = document.getElementById('grid');
  const frag = document.createDocumentFragment();

  items.forEach(it => {
    const btn = document.createElement('button');
    btn.className = 'emoji';
    btn.textContent = it.emoji;              // 이모지 아이콘만 표시
    btn.title = it.emoji;                    // 시각적으로는 name_ 숨김
    btn.setAttribute('aria-label', `이모지 복사 ${it.emoji}`);
    btn.dataset.emoji = it.emoji;
    btn.addEventListener('click', onEmojiClick);
    frag.appendChild(btn);
  });

  grid.appendChild(frag);
}

async function onEmojiClick(e){
  const emoji = e.currentTarget.dataset.emoji;
  try {
    await navigator.clipboard.writeText(emoji);
  } catch {
    // fallback
    const ta = document.createElement('textarea');
    ta.value = emoji; document.body.appendChild(ta);
    ta.select(); document.execCommand('copy');
    ta.remove();
  }
  showToast(`복사됨 ${emoji}`);
  document.getElementById('live').textContent = `${emoji} 복사됨`;
}

function clearGrid(){
  document.getElementById('grid').innerHTML = '';
}

function toggleMore(show){
  const more = document.getElementById('more');
  more.hidden = !show;
}

function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 1200);
}

function debounce(fn, ms){
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

// JSONP 유틸
function jsonp(url){
  return new Promise((resolve, reject) => {
    const cb = `jsonp_cb_${Date.now()}_${Math.floor(Math.random()*10000)}`;
    const s = document.createElement('script');
    window[cb] = (data) => {
      delete window[cb]; s.remove(); resolve(data);
    };
    s.onerror = reject;
    s.src = url + (url.includes('?') ? '&' : '?') + 'callback=' + cb;
    document.body.appendChild(s);
  });
}
