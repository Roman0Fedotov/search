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
  // Показываем статус загрузки
  loadingStatus.textContent = "Загружаем данные...";
  
  // Загружаем данные из JSON-файла
  fetch('data/texts.json')
    .then(response => {
      // Проверяем успешность запроса
      if (!response.ok) {
        throw new Error('Ошибка загрузки данных: ' + response.status);
      }
      return response.json();
    })
    .then(data => {
      // Сохраняем данные
      textsData = data;
      
      // Обновляем статус
      loadingStatus.textContent = `Данные загружены! Загружено ${data.length} текстов.`;
      
      // Скрываем статус через 2 секунды
      setTimeout(() => {
        loadingStatus.style.display = 'none';
      }, 2000);
    })
    .catch(error => {
      // Обработка ошибок
      console.error('Ошибка загрузки данных:', error);
      loadingStatus.innerHTML = `<div class="error">Ошибка загрузки данных!<br>${error.message}</div>`;
    });
}

// Функция поиска
function performSearch() {
  // Получаем поисковый запрос и приводим к нижнему регистру
  const query = searchInput.value.trim().toLowerCase();
  
  // Если запрос пустой - очищаем результаты
  if (query === '') {
    resultsDiv.innerHTML = '<div class="empty">Введите поисковый запрос</div>';
    statsDiv.textContent = '';
    return;
  }
  
  // Создаем пустой массив для результатов
  const results = [];
  
  // Получаем активные фильтры
  const activeFilters = [];
  if (filterNouns.checked) activeFilters.push('noun');
  if (filterVerbs.checked) activeFilters.push('verb');
  if (filterAdjectives.checked) activeFilters.push('adjective');
  
  // Перебираем все тексты
  textsData.forEach(text => {
    // Перебираем все токены в тексте
    text.tokens.forEach((token, tokenIndex) => {
      // Проверяем совпадение по лемме
      if (token.lemma.toLowerCase().includes(query)) {
        // Проверяем фильтры
        if (activeFilters.length === 0 || activeFilters.includes(token.pos)) {
          // Собираем контекст предложения
          const start = Math.max(0, tokenIndex - 3);
          const end = Math.min(text.tokens.length, tokenIndex + 4);
          let sentence = '';
          
          // Формируем предложение с подсветкой
          for (let i = start; i < end; i++) {
            if (i === tokenIndex) {
              sentence += `<span class="highlight">${text.tokens[i].form}</span> `;
            } else {
              sentence += text.tokens[i].form + ' ';
            }
          }
          
          // Добавляем результат
          results.push({
            textId: text.id,
            textTitle: text.title,
            form: token.form,
            lemma: token.lemma,
            pos: token.pos,
            ana: token.ana,
            sentence: sentence.trim()
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
  // Обновляем статистику
  statsDiv.textContent = `Найдено результатов: ${results.length}`;
  
  // Если результатов нет
  if (results.length === 0) {
    resultsDiv.innerHTML = '<div class="empty">По вашему запросу ничего не найдено</div>';
    return;
  }
  
  // Формируем HTML для результатов
  resultsDiv.innerHTML = results.map(result => `
    <div class="result-item">
      <h3>${result.textTitle} (ID: ${result.textId})</h3>
      
      <div class="sentence">${result.sentence}</div>
      
      <div class="details">
        <span>Слово: <b>${result.form}</b></span>
        <span>Лемма: ${result.lemma}</span>
        <span>Часть речи: ${getPosName(result.pos)}</span>
        <span>Анализ: ${result.ana}</span>
      </div>
    </div>
  `).join('');
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
  // Загружаем данные
  loadData();
  
  // Обработчики событий
  searchInput.addEventListener('input', performSearch);
  filterNouns.addEventListener('change', performSearch);
  filterVerbs.addEventListener('change', performSearch);
  filterAdjectives.addEventListener('change', performSearch);
  
  // Инициализируем пустое состояние
  resultsDiv.innerHTML = '<div class="empty">Введите поисковый запрос в поле выше</div>';
});