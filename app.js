<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Emoji Picker</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header class="header">
    <input id="search" class="search" placeholder="검색: 이름(name_) 또는 키워드" autocomplete="off">
    <div id="chips" class="chips"></div>
  </header>

  <main>
    <div id="grid" class="grid" aria-live="polite"></div>
    <div class="actions">
      <button id="more" class="more" hidden>더보기</button>
    </div>
  </main>

  <div id="toast" class="toast" role="status" aria-live="polite"></div>
  <div id="live" class="sr-only" aria-live="polite"></div>

  <script src="app.js"></script>
</body>
</html>
