// CSV 파싱
function parseCSV(csvText) {
  console.log('CSV 원본 데이터 (첫 500자):', csvText.substring(0, 500));
  
  const lines = csvText.trim().split('\n');
  console.log('총 라인 수:', lines.length);
  
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  console.log('헤더:', headers);
  
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    if (values.length !== headers.length) {
      console.log('길이 불일치 - 라인', i, ':', values.length, 'vs', headers.length);
      continue;
    }

    const item = {};
    headers.forEach((header, index) => {
      item[header] = values[index] || '';
    });

    console.log('파싱된 아이템 (라인', i, '):', item);

    if (item.emoji && item.name_ko) {
      if (item.code && (!item.emoji || item.emoji === '□')) {
        item.emoji = unicodeToEmoji(item.code);
      }
      if (item.emoji && item.emoji.length === 2 && /^[A-Z]{2}$/.test(item.emoji)) {
        item.emoji = countryCodeToFlag(item.emoji);
      }
      data.push(item);
    } else {
      console.log('조건 불충족 - emoji:', item.emoji, 'name_ko:', item.name_ko);
    }
  }

  console.log('최종 파싱된 데이터 개수:', data.length);
  return data;
}
