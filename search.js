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
    // Собираем все токены, соответствующие запросу
    const foundTokens = [];
    
    // 1. Находим все совпадающие токены
    text.tokens.forEach(token => {
      if (token.lemma.toLowerCase().includes(query)) {
        if (activeFilters.length === 0 || activeFilters.includes(token.pos)) {
          foundTokens.push(token);
        }
      }
    });

    // Если нашли совпадения
    if (foundTokens.length > 0) {
      // 2. Формируем полное предложение с подсветкой
      let fullSentence = text.full_text;
      
      // Создаем копию для безопасного изменения
      let highlightedSentence = fullSentence;
      
      // Подсвечиваем все найденные слова в обратном порядке
      // (чтобы позиции не смещались при вставке тегов)
      for (let i = foundTokens.length - 1; i >= 0; i--) {
        const token = foundTokens[i];
        
        // Создаем шаблон для поиска с учетом возможных вариаций
        const searchPattern = new RegExp(`\\b${escapeRegExp(token.form)}\\b`, 'gi');
        
        // Заменяем вхождения на подсвеченные версии
        highlightedSentence = highlightedSentence.replace(
          searchPattern,
          `<span class="highlight">${token.form}</span>`
        );
      }


      // 3. Добавляем результат с полным предложением
      results.push({
        textId: text.id,
        textTitle: text.title,
        foundTokens: foundTokens,
        sentence: highlightedSentence
      });
    }
  });
  
  // Отображаем результаты
  displayResults(results);
}

// Вспомогательная функция для экранирования спецсимволов в регулярках
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Функция отображения результатов
function displayResults(results) {
  statsDiv.textContent = `Найдено результатов: ${results.length}`;
  
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
        ${result.foundTokens.map(token => `
          <span>
            Слово: <b>${token.form}</b> | 
            Лемма: ${token.lemma} | 
            Часть речи: ${getPosName(token.pos)} | 
            Анализ: ${token.ana}
          </span>
        `).join('')}
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
    'gerund': 'деепричастие',
    'punct': 'знак препинания'
  };
  
  return posMap[abbr] || abbr;
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  
  // Обработчики событий
  searchInput.addEventListener('input', performSearch);
  filterNouns.addEventListener('change', performSearch);
  filterVerbs.addEventListener('change', performSearch);
  filterAdjectives.addEventListener('change', performSearch);
  
  // Инициализируем пустое состояние
  resultsDiv.innerHTML = '<div class="empty">Введите поисковый запрос в поле выше</div>';
});