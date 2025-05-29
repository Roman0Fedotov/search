// Объект для хранения данных
let textsData = [];

// DOM элементы
const searchInput = document.getElementById('searchInput');
const resultsDiv = document.getElementById('results');
const loadingStatus = document.getElementById('loadingStatus');
const statsDiv = document.getElementById('stats');
const filterNouns = document.getElementById('filterNouns');
const filterVerbs = document.getElementById('filterVerbs');
const filterAdjectives = document.getElementById('filterAdjectives');

// Функция загрузки данных
function loadData() {
  loadingStatus.textContent = "Загружаем данные...";
  
  fetch('data/texts.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('Ошибка загрузки данных: ' + response.status);
      }
      return response.json();
    })
    .then(data => {
      textsData = data;
      loadingStatus.textContent = `Данные загружены! Загружено ${data.length} текстов.`;
      setTimeout(() => {
        loadingStatus.style.display = 'none';
      }, 2000);
    })
    .catch(error => {
      console.error('Ошибка загрузки данных:', error);
      loadingStatus.innerHTML = `<div class="error">Ошибка загрузки данных!<br>${error.message}</div>`;
    });
}

// Функция для экранирования спецсимволов
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Функция для подсветки слова (исправленная)
function highlightWord(sentence, word) {
  // Создаем регулярное выражение для точного слова
  const regex = new RegExp(`(^|[\\s\\p{P}](${escapeRegExp(word)})($|[\\s\\p{P}])`, 'giu');
  
  return sentence.replace(regex, (match, prefix, wordMatch, suffix) => {
    return `${prefix}<span class="highlight">${wordMatch}</span>${suffix}`;
  });
}

// Функция поиска
function performSearch() {
  const query = searchInput.value.trim().toLowerCase();
  
  if (query === '') {
    resultsDiv.innerHTML = '<div class="empty">Введите поисковый запрос</div>';
    statsDiv.textContent = '';
    return;
  }
  
  const results = [];
  const activeFilters = [];
  
  if (filterNouns.checked) activeFilters.push('noun');
  if (filterVerbs.checked) activeFilters.push('verb');
  if (filterAdjectives.checked) activeFilters.push('adjective');
  
  // Перебираем все тексты
  textsData.forEach(text => {
    // Перебираем все токены в тексте
    text.tokens.forEach(token => {
      // Проверяем совпадение по лемме
      if (token.lemma.toLowerCase().includes(query)) {
        // Проверяем фильтры
        if (activeFilters.length === 0 || activeFilters.includes(token.pos)) {
          // Добавляем результат
          results.push({
            textId: text.id,
            textTitle: text.title,
            form: token.form,
            lemma: token.lemma,
            pos: token.pos,
            ana: token.ana,
            sentence: text.sentence
          });
        }
      }
    });
  });
  
  // Отображаем результаты
  displayResults(results);
}

// Функция отображения результатов
function displayResults(results) {
  statsDiv.textContent = `Найдено результатов: ${results.length}`;
  
  if (results.length === 0) {
    resultsDiv.innerHTML = '<div class="empty">По вашему запросу ничего не найдено</div>';
    return;
  }
  
  // Формируем HTML для результатов
  resultsDiv.innerHTML = results.map(result => {
    // Подсвечиваем слово в предложении
    const highlightedSentence = highlightWord(result.sentence, result.form);
    
    return `
      <div class="result-item">
        <h3>${result.textTitle} (ID: ${result.textId})</h3>
        
        <div class="sentence">${highlightedSentence}</div>
        
        <div class="details">
          <span>Слово: <b>${result.form}</b></span>
          <span>Лемма: ${result.lemma}</span>
          <span>Часть речи: ${getPosName(result.pos)}</span>
          <span>Анализ: ${result.ana}</span>
        </div>
      </div>
    `;
  }).join('');
}

// Функция для преобразования сокращений частей речи
function getPosName(abbr) {
  const posMap = {
    'noun': 'существительное',
    'verb': 'глагол',
    'adjective': 'прилагательное',
    'adverb': 'наречие',
    'preposition': 'предлог',
    'conjunction': 'союз',
    'pronoun': 'местоимение',
    'gerund': 'деепричастие'
  };
  
  return posMap[abbr] || abbr;
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  searchInput.addEventListener('input', performSearch);
  filterNouns.addEventListener('change', performSearch);
  filterVerbs.addEventListener('change', performSearch);
  filterAdjectives.addEventListener('change', performSearch);
});