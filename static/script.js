// Глобальные переменные
let currentData = null;
let currentOffset = 0;
let currentFilename = null;
let charts = [];

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM загружен, инициализируем приложение');
    initializeFileUpload();
    initializeDragAndDrop();
    console.log('Инициализация завершена');
    checkAIStatus();
});

// Инициализация загрузки файлов
function initializeFileUpload() {
    console.log('Инициализация загрузки файлов');
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        console.log('fileInput найден, добавляем обработчик');
        fileInput.addEventListener('change', handleFileSelect);
    } else {
        console.error('fileInput не найден!');
    }
}

// Инициализация drag and drop
function initializeDragAndDrop() {
    const uploadArea = document.getElementById('uploadArea');
    
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });
    
    // Клик по области загрузки
    uploadArea.addEventListener('click', function() {
        document.getElementById('fileInput').click();
    });
}

// Обработка выбора файла
function handleFileSelect(event) {
    console.log('handleFileSelect вызвана');
    const file = event.target.files[0];
    if (file) {
        console.log('Выбран файл:', file.name);
        handleFile(file);
    } else {
        console.log('Файл не выбран');
    }
}

// Обработка файла
function handleFile(file) {
    console.log('handleFile вызвана с файлом:', file.name);
    
    // Проверка типа файла
    const allowedTypes = ['.xlsx', '.xls', '.csv', '.pdf'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    console.log('Расширение файла:', fileExtension);
    
    if (!allowedTypes.includes(fileExtension)) {
        alert('Please select Excel, CSV or PDF file (.xlsx, .xls, .csv, .pdf)');
        return;
    }
    
    // Показываем индикатор загрузки
    showLoading();
    console.log('Индикатор загрузки показан');
    
    // Создаем FormData для отправки файла
    const formData = new FormData();
    formData.append('file', file);
    
    console.log('Отправляем запрос на сервер...');
    
    // Отправляем файл на сервер
    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        console.log('Получен ответ от сервера, статус:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('Данные от сервера:', data);
        hideLoading();
        
        if (data.success) {
            console.log('Файл успешно обработан, отображаем результаты');
            currentData = data;
            currentFilename = data.filename;
            currentOffset = data.data.length;
            
            displayResults(data);
        } else {
            console.error('Error:', data.error);
            alert('Error: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        hideLoading();
        alert('An error occurred while uploading file: ' + error.message);
    });
}

// Показать индикатор загрузки
function showLoading() {
    document.getElementById('uploadSection').style.display = 'none';
    document.getElementById('loading').style.display = 'block';
    document.getElementById('results').style.display = 'none';
}

// Скрыть индикатор загрузки
function hideLoading() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('uploadSection').style.display = 'block';
}

// Отображение результатов
function displayResults(data) {
    // Показываем секцию результатов
    document.getElementById('results').style.display = 'block';
    
    // Заполняем информацию о файле
    document.getElementById('fileName').textContent = data.filename;
    document.getElementById('totalRows').textContent = data.total_rows.toLocaleString();
    document.getElementById('totalColumns').textContent = data.columns.length;
    
    // Отображаем статистику
    displayStats(data.stats);
    
    // Заполняем селектор категорий
    populateCategorySelect(data.data_types);
    
    // Отображаем диаграммы
    displayCharts(data.charts);
    
    // Отображаем таблицу
    displayTable(data.columns, data.data);
    
    // Обновляем информацию о строках
    updateRowsInfo();
    
    // Показываем кнопку экспорта в PDF
    showExportButton();
}

// Заполнение селектора категорий
function populateCategorySelect(dataTypes) {
    const categorySelect = document.getElementById('categorySelect');
    categorySelect.innerHTML = '<option value="">Auto selection</option>';
    
    // Добавляем категориальные столбцы
    Object.entries(dataTypes).forEach(([column, type]) => {
        if (type === 'categorical') {
            const option = document.createElement('option');
            option.value = column;
            option.textContent = column;
            categorySelect.appendChild(option);
        }
    });
}

// Отображение статистики
function displayStats(stats) {
    const statsGrid = document.getElementById('statsGrid');
    statsGrid.innerHTML = '';
    
    Object.entries(stats).forEach(([column, stat]) => {
        const statCard = document.createElement('div');
        statCard.className = 'stat-card';
        
        let statContent = `<h4>${column}</h4>`;
        
        if (stat.type === 'numeric') {
            statContent += `
                <div class="stat-item">
                    <span class="stat-label">Sum:</span>
                    <span class="stat-value">${stat.sum.toLocaleString()}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Mean:</span>
                    <span class="stat-value">${stat.mean.toFixed(2)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Min/Max:</span>
                    <span class="stat-value">${stat.min} / ${stat.max}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Count:</span>
                    <span class="stat-value">${stat.count}</span>
                </div>
            `;
        } else if (stat.type === 'datetime') {
            statContent += `
                <div class="stat-item">
                    <span class="stat-label">Period:</span>
                    <span class="stat-value">${stat.min_date} - ${stat.max_date}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Count:</span>
                    <span class="stat-value">${stat.count}</span>
                </div>
            `;
        } else {
            statContent += `
                <div class="stat-item">
                    <span class="stat-label">Unique:</span>
                    <span class="stat-value">${stat.unique_count}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Total:</span>
                    <span class="stat-value">${stat.total_count}</span>
                </div>
                ${stat.most_common ? `
                <div class="stat-item">
                    <span class="stat-label">Most common:</span>
                    <span class="stat-value">${stat.most_common}</span>
                </div>
                ` : ''}
            `;
        }
        
        statCard.innerHTML = statContent;
        statsGrid.appendChild(statCard);
    });
}

// Отображение диаграмм
function displayCharts(chartsData) {
    const chartsGrid = document.getElementById('chartsGrid');
    chartsGrid.innerHTML = '';
    
    // Очищаем предыдущие диаграммы
    charts.forEach(chart => chart.destroy());
    charts = [];
    
    if (chartsData.length === 0) {
        chartsGrid.innerHTML = '<p class="text-center">Not enough data to build charts</p>';
        return;
    }
    
    chartsData.forEach((chartData, index) => {
        const chartContainer = document.createElement('div');
        chartContainer.className = 'chart-container';
        
        const chartTitle = document.createElement('div');
        chartTitle.className = 'chart-title';
        chartTitle.textContent = chartData.title;
        
        const canvas = document.createElement('canvas');
        canvas.id = `chart-${index}`;
        
        chartContainer.appendChild(chartTitle);
        chartContainer.appendChild(canvas);
        chartsGrid.appendChild(chartContainer);
        
        // Создаем диаграмму
        const ctx = canvas.getContext('2d');
        const chart = new Chart(ctx, {
            type: chartData.type,
            data: {
                labels: chartData.data.labels,
                datasets: [{
                    label: chartData.title,
                    data: chartData.data.values,
                    backgroundColor: chartData.type === 'bar' ? 
                        'rgba(37, 99, 235, 0.8)' : 'rgba(37, 99, 235, 0.2)',
                    borderColor: 'rgba(37, 99, 235, 1)',
                    borderWidth: 2,
                    fill: chartData.type === 'line'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            font: {
                                size: 10
                            }
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            font: {
                                size: 10
                            },
                            maxRotation: 45,
                            minRotation: 0
                        }
                    }
                },
                elements: {
                    point: {
                        radius: 3
                    },
                    bar: {
                        borderWidth: 1
                    }
                }
            }
        });
        
        charts.push(chart);
    });
}

// Обновление диаграмм при выборе категории
function updateCharts() {
    const categorySelect = document.getElementById('categorySelect');
    const selectedCategory = categorySelect.value;
    
    if (!currentFilename) return;
    
    fetch('/update_charts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            filename: currentFilename,
            selected_category: selectedCategory
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            displayCharts(data.charts);
        } else {
            console.error('Error updating charts:', data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// Отображение таблицы
function displayTable(columns, data) {
    const tableHeader = document.getElementById('tableHeader');
    const tableBody = document.getElementById('tableBody');
    
    // Заголовок таблицы
    tableHeader.innerHTML = '';
    columns.forEach(column => {
        const th = document.createElement('th');
        th.textContent = column;
        tableHeader.appendChild(th);
    });
    
    // Данные таблицы
    tableBody.innerHTML = '';
    data.forEach(row => {
        const tr = document.createElement('tr');
        columns.forEach(column => {
            const td = document.createElement('td');
            td.textContent = row[column] || '';
            tr.appendChild(td);
        });
        tableBody.appendChild(tr);
    });
}

// Загрузка дополнительных данных
function loadMoreData() {
    if (!currentFilename) return;
    
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    loadMoreBtn.disabled = true;
    loadMoreBtn.textContent = 'Loading...';
    
    fetch('/load_more', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            filename: currentFilename,
            offset: currentOffset,
            limit: 100
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert('Error: ' + data.error);
            return;
        }
        
        // Добавляем новые данные в таблицу
        const tableBody = document.getElementById('tableBody');
        data.data.forEach(row => {
            const tr = document.createElement('tr');
            currentData.columns.forEach(column => {
                const td = document.createElement('td');
                td.textContent = row[column] || '';
                tr.appendChild(td);
            });
            tableBody.appendChild(tr);
        });
        
        // Обновляем счетчики
        currentOffset = data.offset;
        updateRowsInfo();
        
        // Обновляем кнопку
        if (!data.has_more) {
            loadMoreBtn.style.display = 'none';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while loading data');
    })
    .finally(() => {
        loadMoreBtn.disabled = false;
        loadMoreBtn.textContent = 'Show 100 more rows';
    });
}

// Обновление информации о строках
function updateRowsInfo() {
    const rowsInfo = document.getElementById('rowsInfo');
    const displayedRows = Math.min(currentOffset, currentData.total_rows);
    rowsInfo.textContent = `Showing ${displayedRows.toLocaleString()} of ${currentData.total_rows.toLocaleString()} rows`;
}

// Проверка статуса AI при загрузке страницы
async function checkAIStatus() {
    try {
        const response = await fetch('/ai_status');
        const status = await response.json();
        
        const aiPlaceholder = document.getElementById('aiPlaceholder');
        if (aiPlaceholder) {
            if (status.available) {
                aiPlaceholder.innerHTML = `
                    <div class="placeholder-content">
                        <div class="placeholder-icon">🤖</div>
                        <p>AI анализатор готов к работе</p>
                        <p class="ai-model">Модель: ${status.model}</p>
                        <button class="btn btn-primary" onclick="requestAIAnalysis()">
                            Запросить анализ
                        </button>
                    </div>
                `;
            } else {
                aiPlaceholder.innerHTML = `
                    <div class="placeholder-content">
                        <div class="placeholder-icon">⚠️</div>
                        <p>AI анализатор недоступен</p>
                        <p class="ai-status">${status.status}</p>
                        <button class="btn btn-secondary" onclick="checkAIStatus()">
                            Проверить статус
                        </button>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Ошибка проверки статуса AI:', error);
    }
}

function requestAIAnalysis() {
    if (!currentFilename) {
        alert('Сначала загрузите файл для анализа');
        return;
    }
    
    const aiPlaceholder = document.getElementById('aiPlaceholder');
    const aiResult = document.getElementById('aiResult');
    
    // Показываем индикатор загрузки
    aiPlaceholder.innerHTML = `
        <div class="placeholder-content">
            <div class="spinner"></div>
            <p>Анализирую данные через OpenAI...</p>
        </div>
    `;
    
    fetch('/ai_analysis', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            filename: currentFilename
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Показываем результат
            aiPlaceholder.style.display = 'none';
            aiResult.style.display = 'block';
            aiResult.innerHTML = `
                <div class="ai-analysis-result">
                    <div class="ai-header">
                        <h4>🤖 Анализ от нейросети</h4>
                        <span class="ai-model-badge">${data.model}</span>
                    </div>
                    <div class="ai-content">
                        ${data.analysis.replace(/\n/g, '<br>')}
                    </div>
                    <div class="ai-actions">
                        <button class="btn btn-secondary" onclick="resetAIAnalysis()">
                            Новый анализ
                        </button>
                    </div>
                </div>
            `;
        } else {
            // Показываем ошибку
            aiPlaceholder.innerHTML = `
                <div class="placeholder-content">
                    <div class="placeholder-icon">❌</div>
                    <p>Ошибка анализа данных</p>
                    <p class="error-message">${data.error}</p>
                    <button class="btn btn-primary" onclick="requestAIAnalysis()">
                        Попробовать снова
                    </button>
                </div>
            `;
        }
    })
    .catch(error => {
        console.error('Error:', error);
        aiPlaceholder.innerHTML = `
            <div class="placeholder-content">
                <div class="placeholder-icon">❌</div>
                <p>Ошибка соединения</p>
                <p class="error-message">Не удалось подключиться к серверу</p>
                <button class="btn btn-primary" onclick="requestAIAnalysis()">
                    Попробовать снова
                </button>
            </div>
        `;
    });
}

function resetAIAnalysis() {
    const aiPlaceholder = document.getElementById('aiPlaceholder');
    const aiResult = document.getElementById('aiResult');
    
    aiResult.style.display = 'none';
    aiPlaceholder.style.display = 'block';
    checkAIStatus();
}

// Показываем кнопку экспорта в PDF
function showExportButton() {
    document.getElementById('exportSection').style.display = 'block';
}

// Генерация PDF отчёта
async function generatePDF() {
    try {
        console.log('Начинаю генерацию PDF...');
        
        // Показываем индикатор загрузки
        document.getElementById('pdfLoading').style.display = 'flex';
        
        // Ждем загрузки библиотек
        await waitForLibraries();
        
        console.log('jsPDF доступна, создаю PDF...');
        
        // Создаем временный контейнер для PDF
        const pdfContainer = createPDFContainer();
        document.body.appendChild(pdfContainer);
        
        console.log('Временный контейнер создан');
        
        // Ждем немного для рендеринга
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Генерируем PDF
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        console.log('PDF объект создан');
        
        // Функция для установки шрифта
        function setFontWithFallback(pdf, fontName, style = 'normal') {
            // Используем стандартный шрифт helvetica
            pdf.setFont('helvetica', style);
            console.log('Используется шрифт helvetica');
        }
        
        // Функция для добавления текста
        function addText(pdf, text, x, y, options = {}) {
            // Просто добавляем текст как есть
            pdf.text(text, x, y, options);
        }
        
        // Устанавливаем шрифт
        setFontWithFallback(pdf, 'helvetica');
        console.log('Установлен шрифт с поддержкой кириллицы');
        
        // Получаем размеры страницы
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 20;
        const contentWidth = pageWidth - 2 * margin;
        
        let yPosition = margin;
        
        // Добавляем заголовок
        pdf.setFontSize(24);
        setFontWithFallback(pdf, 'helvetica', 'bold');
        pdf.setTextColor(30, 58, 138);
        addText(pdf, 'Analytical Report', pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 15;
        
        // Добавляем дату
        pdf.setFontSize(12);
        setFontWithFallback(pdf, 'helvetica', 'normal');
        pdf.setTextColor(107, 114, 128);
        const currentDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        addText(pdf, `Date created: ${currentDate}`, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 20;
        
        console.log('Заголовок и дата добавлены');
        
        // Добавляем информацию о файле
        pdf.setFontSize(16);
        setFontWithFallback(pdf, 'helvetica', 'bold');
        pdf.setTextColor(30, 58, 138);
        addText(pdf, 'File Information', margin, yPosition);
        yPosition += 10;
        
        pdf.setFontSize(11);
        setFontWithFallback(pdf, 'helvetica', 'normal');
        pdf.setTextColor(55, 65, 81);
        
        // Проверяем наличие элементов
        const fileNameElement = document.getElementById('fileName');
        const totalRowsElement = document.getElementById('totalRows');
        const totalColumnsElement = document.getElementById('totalColumns');
        
        if (!fileNameElement || !totalRowsElement || !totalColumnsElement) {
            throw new Error('File information elements not found');
        }
        
        const fileName = fileNameElement.textContent;
        const totalRows = totalRowsElement.textContent;
        const totalColumns = totalColumnsElement.textContent;
        
        addText(pdf, `File: ${fileName}`, margin, yPosition);
        yPosition += 6;
        addText(pdf, `Rows: ${totalRows}`, margin, yPosition);
        yPosition += 6;
        addText(pdf, `Columns: ${totalColumns}`, margin, yPosition);
        yPosition += 15;
        
        console.log('Информация о файле добавлена');
        
        // Добавляем статистику
        pdf.setFontSize(16);
        setFontWithFallback(pdf, 'helvetica', 'bold');
        pdf.setTextColor(30, 58, 138);
        addText(pdf, 'Basic Statistics', margin, yPosition);
        yPosition += 10;
        
        // Получаем статистику
        const statsCards = document.querySelectorAll('.stat-card');
        console.log(`Найдено карточек статистики: ${statsCards.length}`);
        
        let statsText = '';
        statsCards.forEach(card => {
            const title = card.querySelector('h4').textContent;
            const statItems = card.querySelectorAll('.stat-item');
            statsText += `${title}:\n`;
            statItems.forEach(item => {
                const label = item.querySelector('.stat-label').textContent;
                const value = item.querySelector('.stat-value').textContent;
                statsText += `  ${label} ${value}\n`;
            });
            statsText += '\n';
        });
        
        pdf.setFontSize(10);
        setFontWithFallback(pdf, 'helvetica', 'normal');
        pdf.setTextColor(55, 65, 81);
        
        // Разбиваем статистику на строки
        const statsLines = statsText.split('\n');
        for (const line of statsLines) {
            if (yPosition > pageHeight - margin) {
                pdf.addPage();
                yPosition = margin;
            }
            if (line.trim()) {
                pdf.text(line, margin, yPosition);
                yPosition += 5;
            }
        }
        yPosition += 10;
        
        console.log('Статистика добавлена');
        
        // Добавляем диаграммы
        const charts = document.querySelectorAll('.chart-container');
        console.log(`Найдено диаграмм: ${charts.length}`);
        
        if (charts.length > 0) {
            pdf.setFontSize(16);
            setFontWithFallback(pdf, 'helvetica', 'bold');
            pdf.setTextColor(30, 58, 138);
            addText(pdf, 'Charts', margin, yPosition);
            yPosition += 10;
            
            for (let i = 0; i < charts.length; i++) {
                const chart = charts[i];
                const canvas = chart.querySelector('canvas');
                
                if (canvas && yPosition < pageHeight - 100) {
                    try {
                        console.log(`Обрабатываю диаграмму ${i + 1}...`);
                        
                        // Конвертируем canvas в изображение
                        const imgData = canvas.toDataURL('image/png');
                        
                        // Вычисляем размеры изображения
                        const imgWidth = contentWidth;
                        const imgHeight = (canvas.height * imgWidth) / canvas.width;
                        
                        // Проверяем, поместится ли изображение на странице
                        if (yPosition + imgHeight > pageHeight - margin) {
                            pdf.addPage();
                            yPosition = margin;
                        }
                        
                        // Добавляем заголовок диаграммы
                        const title = chart.querySelector('.chart-title').textContent;
                        pdf.setFontSize(12);
                        setFontWithFallback(pdf, 'helvetica', 'bold');
                        pdf.setTextColor(30, 58, 138);
                        addText(pdf, title, margin, yPosition);
                        yPosition += 8;
                        
                        // Добавляем изображение диаграммы
                        pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
                        yPosition += imgHeight + 15;
                        
                        console.log(`Диаграмма ${i + 1} добавлена`);
                        
                    } catch (error) {
                        console.error('Ошибка при добавлении диаграммы:', error);
                        yPosition += 20;
                    }
                }
            }
        }
        
        // Добавляем таблицу данных
        const dataTable = document.getElementById('dataTable');
        if (dataTable && yPosition < pageHeight - 100) {
            console.log('Добавляю таблицу данных...');
            
            pdf.setFontSize(16);
            setFontWithFallback(pdf, 'helvetica', 'bold');
            pdf.setTextColor(30, 58, 138);
            addText(pdf, 'Data', margin, yPosition);
            yPosition += 10;
            
            // Получаем заголовки таблицы
            const headers = [];
            const headerCells = dataTable.querySelectorAll('thead th');
            headerCells.forEach(cell => {
                headers.push(cell.textContent.trim());
            });
            
            // Получаем данные таблицы
            const tableData = [];
            const dataRows = dataTable.querySelectorAll('tbody tr');
            dataRows.forEach(row => {
                const rowData = [];
                const cells = row.querySelectorAll('td');
                cells.forEach(cell => {
                    rowData.push(cell.textContent.trim());
                });
                tableData.push(rowData);
            });
            
            console.log(`Заголовков: ${headers.length}, строк данных: ${tableData.length}`);
            
            // Добавляем таблицу в PDF
            if (headers.length > 0 && tableData.length > 0) {
                console.log('Добавляю таблицу данных...');
                
                // Ограничиваем количество строк для PDF
                const maxRows = Math.min(tableData.length, 20);
                const limitedData = tableData.slice(0, maxRows);
                
                // Создаем таблицу с autoTable
                pdf.autoTable({
                    head: [headers],
                    body: limitedData,
                    startY: yPosition,
                    margin: { left: margin, right: margin },
                    styles: {
                        fontSize: 8,
                        cellPadding: 2,
                        font: 'helvetica'
                    },
                    headStyles: {
                        fillColor: [30, 58, 138],
                        textColor: 255,
                        fontStyle: 'bold',
                        font: 'helvetica'
                    }
                });
                
                yPosition = pdf.lastAutoTable.finalY + 10;
                
                if (tableData.length > maxRows) {
                    pdf.setFontSize(10);
                    pdf.setTextColor(107, 114, 128);
                    addText(pdf, `Showing ${maxRows} of ${tableData.length} rows`, margin, yPosition);
                    yPosition += 10;
                }
                
                console.log('Таблица данных добавлена');
            }
        }
        
        // Добавляем анализ от нейросети
        const aiResult = document.getElementById('aiResult');
        if (aiResult && aiResult.style.display !== 'none') {
            pdf.setFontSize(16);
            setFontWithFallback(pdf, 'helvetica', 'bold');
            pdf.setTextColor(30, 58, 138);
            addText(pdf, 'AI Analysis', margin, yPosition);
            yPosition += 10;
            
            // Получаем содержимое AI анализа
            const aiContent = aiResult.querySelector('.ai-content');
            if (aiContent) {
                const aiText = aiContent.textContent || aiContent.innerText;
                
                // Разбиваем текст на секции по заголовкам ###
                const sections = aiText.split(/(### \d+\.)/);
                
                for (let i = 0; i < sections.length; i++) {
                    const section = sections[i].trim();
                    if (!section) continue;
                    
                    // Если это заголовок секции
                    if (section.match(/^### \d+\./)) {
                        // Проверяем, нужна ли новая страница
                        if (yPosition > pageHeight - margin) {
                            pdf.addPage();
                            yPosition = margin;
                        }
                        
                        // Добавляем заголовок
                        pdf.setFontSize(12);
                        setFontWithFallback(pdf, 'helvetica', 'bold');
                        pdf.setTextColor(30, 58, 138);
                        addText(pdf, section, margin, yPosition);
                        yPosition += 8;
                        
                        // Добавляем следующий блок текста
                        if (i + 1 < sections.length) {
                            const nextSection = sections[i + 1].trim();
                            if (nextSection) {
                                pdf.setFontSize(10);
                                setFontWithFallback(pdf, 'helvetica', 'normal');
                                pdf.setTextColor(55, 65, 81);
                                
                                // Обрабатываем текст секции
                                const lines = nextSection.split('\n').filter(line => line.trim());
                                
                                for (const line of lines) {
                                    // Проверяем, нужна ли новая страница
                                    if (yPosition > pageHeight - margin) {
                                        pdf.addPage();
                                        yPosition = margin;
                                    }
                                    
                                    // Проверяем, является ли строка маркированным списком
                                    const isBulletPoint = line.trim().startsWith('-');
                                    const indent = isBulletPoint ? margin + 10 : margin;
                                    
                                    // Обрабатываем длинные строки
                                    const words = line.split(' ');
                                    let currentLine = '';
                                    let isFirstLine = true;
                                    
                                    for (const word of words) {
                                        const testLine = currentLine + (currentLine ? ' ' : '') + word;
                                        const testWidth = pdf.getTextWidth(testLine);
                                        
                                        if (testWidth > contentWidth - (isBulletPoint ? 10 : 0)) {
                                            // Добавляем текущую строку
                                            if (currentLine.trim()) {
                                                const displayText = isFirstLine && isBulletPoint ? 
                                                    '• ' + currentLine.trim() : currentLine.trim();
                                                pdf.text(displayText, indent, yPosition);
                                                yPosition += 5;
                                                
                                                // Проверяем, нужна ли новая страница
                                                if (yPosition > pageHeight - margin) {
                                                    pdf.addPage();
                                                    yPosition = margin;
                                                }
                                            }
                                            currentLine = word;
                                            isFirstLine = false;
                                        } else {
                                            currentLine = testLine;
                                        }
                                    }
                                    
                                    // Добавляем оставшуюся строку
                                    if (currentLine.trim()) {
                                        const displayText = isFirstLine && isBulletPoint ? 
                                            '• ' + currentLine.trim() : currentLine.trim();
                                        pdf.text(displayText, indent, yPosition);
                                        yPosition += 5;
                                    }
                                }
                                
                                yPosition += 8; // Дополнительный отступ между секциями
                            }
                        }
                    }
                }
                
                console.log('AI анализ добавлен в PDF с форматированием');
            } else {
                // Если AI анализ недоступен, добавляем информацию об этом
                pdf.setFontSize(10);
                setFontWithFallback(pdf, 'helvetica', 'italic');
                pdf.setTextColor(107, 114, 128);
                addText(pdf, 'AI analysis not available. Please request analysis in the web interface.', margin, yPosition);
                yPosition += 10;
                console.log('AI анализ недоступен, добавлена информация');
            }
        } else {
            // Если AI анализ не был выполнен, добавляем информацию об этом
            pdf.setFontSize(16);
            setFontWithFallback(pdf, 'helvetica', 'bold');
            pdf.setTextColor(30, 58, 138);
            addText(pdf, 'AI Analysis', margin, yPosition);
            yPosition += 10;
            
            pdf.setFontSize(10);
            setFontWithFallback(pdf, 'helvetica', 'italic');
            pdf.setTextColor(107, 114, 128);
            addText(pdf, 'AI analysis was not performed. Use the "Request Analysis" button in the web interface to get AI insights.', margin, yPosition);
            yPosition += 10;
            console.log('AI анализ не был выполнен, добавлена информация');
        }
        
        console.log('Сохраняю PDF...');
        
        // Сохраняем PDF
        const pdfFileName = document.getElementById('fileName').textContent.replace('File: ', '');
        const baseFileName = pdfFileName.split('.')[0];
        const timestamp = new Date().toISOString().split('T')[0];
        const finalPdfFileName = `${baseFileName}_report_${timestamp}.pdf`;
        
        pdf.save(finalPdfFileName);
        console.log('PDF сохранен:', finalPdfFileName);
        
        // Удаляем временный контейнер
        document.body.removeChild(pdfContainer);
        
        // Скрываем индикатор загрузки
        document.getElementById('pdfLoading').style.display = 'none';
        
        // Показываем уведомление об успехе
        showNotification('PDF report successfully created!', 'success');
        
    } catch (error) {
        console.error('Ошибка при генерации PDF:', error);
        console.error('Стек ошибки:', error.stack);
        document.getElementById('pdfLoading').style.display = 'none';
        showNotification(`Error creating PDF report: ${error.message}`, 'error');
    }
}

// Создание временного контейнера для PDF
function createPDFContainer() {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = '800px';
    container.style.backgroundColor = 'white';
    container.style.padding = '20px';
    container.style.fontFamily = 'Georgia, Times New Roman, serif';
    
    // Копируем содержимое результатов
    const resultsSection = document.getElementById('results');
    container.innerHTML = resultsSection.innerHTML;
    
    return container;
}

// Показ уведомлений
function showNotification(message, type = 'info') {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.padding = '15px 20px';
    notification.style.borderRadius = '8px';
    notification.style.color = 'white';
    notification.style.fontWeight = 'bold';
    notification.style.zIndex = '1001';
    notification.style.transition = 'all 0.3s ease';
    notification.textContent = message;
    
    // Настраиваем стиль в зависимости от типа
    if (type === 'success') {
        notification.style.backgroundColor = '#059669';
    } else if (type === 'error') {
        notification.style.backgroundColor = '#dc2626';
    } else {
        notification.style.backgroundColor = '#2563eb';
    }
    
    document.body.appendChild(notification);
    
    // Удаляем уведомление через 3 секунды
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Проверка загрузки библиотек
function checkLibraries() {
    console.log('Проверяю библиотеки...');
    console.log('window.jspdf:', window.jspdf);
    console.log('window.html2canvas:', window.html2canvas);
    
    const libraries = {
        'jsPDF': window.jspdf,
        'html2canvas': window.html2canvas
    };
    
    // Проверяем autoTable отдельно
    if (window.jspdf && window.jspdf.jsPDF) {
        const pdf = new window.jspdf.jsPDF();
        libraries['autoTable'] = typeof pdf.autoTable === 'function';
        console.log('autoTable доступен:', libraries['autoTable']);
    } else {
        libraries['autoTable'] = false;
    }
    
    const missing = [];
    for (const [name, lib] of Object.entries(libraries)) {
        if (!lib) {
            missing.push(name);
        }
    }
    
    if (missing.length > 0) {
        console.error('Отсутствующие библиотеки:', missing);
        throw new Error(`Не загружены библиотеки: ${missing.join(', ')}`);
    }
    
    console.log('Все библиотеки загружены успешно');
    return true;
}

// Ожидание загрузки библиотек
async function waitForLibraries(timeout = 15000) {
    console.log('Начинаю ожидание загрузки библиотек...');
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
        try {
            checkLibraries();
            console.log('Все библиотеки загружены!');
            return true;
        } catch (error) {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            console.log(`Ожидаю загрузки библиотек... (${elapsed}с)`);
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    
    console.error('Таймаут ожидания загрузки библиотек');
    throw new Error('Таймаут ожидания загрузки библиотек');
} 