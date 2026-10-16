document.addEventListener("DOMContentLoaded", function () {
    const canvas = document.getElementById("bitcoin-chart");
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const ctx = canvas.getContext("2d");

    // Функция для загрузки данных с API
    function fetchDataFromAPI() {
        return fetch('http://127.0.0.1:8000/api/bitcoin-data/') // Запросить все данные из API
            .then(response => response.json());
    }

    // Загрузка данных с API и обработка их
    fetchDataFromAPI()
        .then(data => {
            // Создаем массивы для хранения данных
            const open = data.open;
            const high = data.high;
            const low = data.low;
            const close = data.close;
            const date = data.date;
            const ema = data.ema; // Загрузите данные EMA

            const apiData = [];

            // Обрабатываем данные из API в цикле и вносим в переменную apiData
            for (let i = 0; i < open.length; i++) {
                apiData.push({
                    open: open[i],
                    high: high[i],
                    low: low[i],
                    close: close[i],
                    date: date[i],
                    ema: ema[i] // Добавляем EMA в данные
                });
            }

            console.log(apiData); // Вывод содержимого массива в консоль

            let scale = 1; // Начальный масштаб
            let offsetX = 0; // Смещение по оси X
            let offsetY = 0; // Смещение по оси Y
            let isDragging = false;
            let mouseX, mouseY; // Переменные для хранения координат мыши
            let emaVisible = true; // Изначально EMA видима
            let emaTradesLong = true; // Сделки по EMA
            let emaTradesShort = true; // Сделки по EMA


            // Обновленная функция для отрисовки текста в серых прямоугольниках
            function drawTextInGrayRect(text, x, y, rectWidth, rectHeight) {
                const rectX = x - rectWidth / 2;
                const rectY = y - rectHeight / 2;

                // Рисуем обводку вокруг прямоугольника
                ctx.strokeStyle = "black"; // Цвет обводки
                ctx.lineWidth = 2; // Ширина обводки
                ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);

                // Заливаем прямоугольник серым цветом
                ctx.fillStyle = "gray"; // Цвет серых прямоугольников
                ctx.fillRect(rectX, rectY, rectWidth, rectHeight);

                // Задаем цвет текста
                ctx.fillStyle = "white"; // Цвет текста
                ctx.fillText(text, x, y);
            }

           // Функция для отрисовки свечей с учетом масштаба и смещения
           //  window.drawChart = function() {
            function drawChart() {
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);

            // Ширина свечи и расстояние между ними
            const candleWidth = 1.2 * scale;
            const spaceBetweenCandles = 0.3 * scale;

            // Вычисляем динамический масштаб высоты свечей
            const candleHeight = canvasHeight / apiData.length;

            // Находим максимальное и минимальное значение high и low
            const maxHigh = Math.max(...apiData.map(candle => candle.high));
            const minLow = Math.min(...apiData.map(candle => candle.low));
            const priceRange = maxHigh - minLow;

            apiData.forEach((candle, index) => {
                // Нормализация значений с учетом масштаба
                const normalizedHigh = (candle.high - minLow) / priceRange * canvasHeight * scale;
                const normalizedLow = (candle.low - minLow) / priceRange * canvasHeight * scale;
                const normalizedOpen = (candle.open - minLow) / priceRange * canvasHeight * scale;
                const normalizedClose = (candle.close - minLow) / priceRange * canvasHeight * scale;

                let x = index * (candleWidth + spaceBetweenCandles) + offsetX;
                ctx.fillStyle = normalizedOpen > normalizedClose ? "red" : "green";
                ctx.fillRect(x, canvasHeight - normalizedOpen + offsetY, candleWidth, normalizedOpen - normalizedClose);
                ctx.fillRect(x + candleWidth / 2 - 1, canvasHeight - normalizedHigh + offsetY, 1, normalizedHigh - normalizedLow);
            });

         // Отрисовка EMA кривой (если emaVisible равно true)
            if (emaVisible) {
                ctx.strokeStyle = "blue"; // Цвет EMA
                ctx.lineWidth = 2; // Толщина линии EMA
                ctx.beginPath();
                for (let i = 0; i < apiData.length; i++) {
                    const x = i * (candleWidth + spaceBetweenCandles) + candleWidth / 2 + offsetX;
                    const y = canvasHeight - (apiData[i].ema - minLow) / priceRange * canvasHeight * scale + offsetY;
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.stroke();
            }


            // Отображаем сделки на графике (зеленые точки)
            let lastCandleAboveEMA = false; // Флаг для отслеживания предыдущей свечи выше EMA
            let tradeCount = 0; // Счетчик сделок

            if (emaTradesLong) {
                for (let i = 0; i < apiData.length; i++) {
                    const candle = apiData[i];
                    const x = i * (candleWidth + spaceBetweenCandles) + offsetX;
                    const y = canvasHeight - (candle.close - minLow) / priceRange * canvasHeight * scale + offsetY;

                    if (candle.close > candle.ema) {
                        if (!lastCandleAboveEMA) {
                            // Рисуем ярко-салатовую точку с зелёной обводкой для сделки при пересечении
                            ctx.strokeStyle = "green"; // Зелёная обводка
                            ctx.fillStyle = "#49FF05"; // Зелёный цвет точки
                            ctx.beginPath();
                            ctx.arc(x, y, 5, 0, Math.PI * 2);
                            ctx.fill();
                            ctx.stroke();
                            tradeCount++; // Увеличиваем счетчик сделок
                        }
                        lastCandleAboveEMA = true;
                    } else {
                        lastCandleAboveEMA = false;
                    }
                }

                // Создаем элемент на первой вкладке для отображения количества сделок
                const tab1Content = document.getElementById("tab1");
                let tradeCountElement1 = tab1Content.querySelector("p");

                // Если элемент не существует, создаем его
                if (!tradeCountElement1) {
                    tradeCountElement1 = document.createElement("p");
                    tab1Content.appendChild(tradeCountElement1);
                }

                // Применяем стили напрямую в JavaScript
                tradeCountElement1.style.fontFamily = "Arial, sans-serif"; // Замените на ваш выбранный шрифт
                tradeCountElement1.style.fontSize = "12px"; // Замените на ваш выбранный размер шрифта
                tradeCountElement1.style.textAlign = "right"; // Измените расположение текста, если необходимо
                tradeCountElement1.style.color = "#B5B5B5"; // Серый шрифт

                // Сместим надпись вниз:
                tradeCountElement1.style.marginTop = "210px"; // Для большего отступа

                // Обновляем текст с количеством сделок на первой вкладке
                tradeCountElement1.textContent = `Количество сделок: ${tradeCount}`;
            }


            // Отображаем сделки на графике (красные точки)
            let lastCandleUnderEMA = false; // Флаг для отслеживания предыдущей свечи ниже EMA

              if (emaTradesShort) {
                  for (let i = 0; i < apiData.length; i++) {
                const candle = apiData[i];
                const x = i * (candleWidth + spaceBetweenCandles) + offsetX;
                const y = canvasHeight - (candle.close - minLow) / priceRange * canvasHeight * scale + offsetY;

              if (candle.close < apiData[i].ema) { // Используйте значение EMA из данных
                  if (!lastCandleUnderEMA) {
                      // Рисуем ярко-красную точку с тёмной обводкой для сделки при пересечении
                        ctx.strokeStyle = "#AE0411"; // Красная обводка
                        ctx.fillStyle = "#FF0505"; // Красный цвет точки
                        ctx.beginPath();
                        ctx.arc(x, y, 5, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.stroke();
                     }
                        lastCandleUnderEMA = true;
                    } else {
                        lastCandleUnderEMA = false;
                    }
                  }
              }




// ---------------------------------------------------------------

// // Создаем вспомогательный холст
//     const helperCanvas = document.createElement("canvas");
//     const helperCtx = helperCanvas.getContext("2d");
//     helperCanvas.width = canvas.width;
//     helperCanvas.height = canvas.height;
//
//     // Загружаем изображение (ваш график) на вспомогательный холст
//     helperCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height);
//
//     // Добавляем обработчик события для отслеживания движения мыши
//     canvas.addEventListener("mousemove", function (event) {
//         // Получаем координаты мыши относительно canvas
//         const rect = canvas.getBoundingClientRect();
//         mouseX = event.clientX - rect.left;
//         mouseY = event.clientY - rect.top;
//
//         // Получаем цвет пикселя под курсором
//         const pixelColor = getColorAtCursor(mouseX, mouseY);
//
//         // Проверяем, является ли цвет #AE0411 или lime
//         if (pixelColor === "#FF0505" || pixelColor === "#49FF05") {
//             // Рисуем жёлтый прямоугольник возле курсора
//             drawYellowRectangle(mouseX, mouseY);
//         }
//     });
//
//     // Функция для получения цвета пикселя по координатам
//     function getColorAtCursor(x, y) {
//         const pixel = helperCtx.getImageData(x, y, 1, 1).data;
//         const rgb = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
//         return rgbToHex(rgb);
//     }
//
//
//     // Функция для преобразования цвета из формата RGB в HEX
//     function rgbToHex(rgb) {
//         const hex = rgb
//             .match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/)
//             .slice(1, 4)
//             .map(value => parseInt(value).toString(16).padStart(2, '0'))
//             .join('');
//         return `#${hex.toUpperCase()}`;
//     }
//
// // Функция для рисования жёлтого прямоугольника с датой и ценой
// function drawYellowRectangle(x, y) {
//     const rectWidth = 110;
//     const rectHeight = 35;
//
//     // Найдем ближайшую свечу к положению мыши
//     const candleIndex = Math.floor((x - offsetX) / (candleWidth + spaceBetweenCandles));
//     if (candleIndex >= 0 && candleIndex < apiData.length) {
//         const closestCandle = apiData[candleIndex];
//         const closestCandleX = candleIndex * (candleWidth + spaceBetweenCandles) + offsetX;
//
//         // Определите координаты для отрисовки текста внутри прямоугольника
//         const dateTextX = closestCandleX + rectWidth / 2;
//         const dateTextY = y + rectHeight / 5 - 10; // Опустить текст на 5 пикселей
//
//         // Рисуем жёлтый прямоугольник возле курсора
//         ctx.fillStyle = "yellow";
//         ctx.fillRect(x, y, rectWidth, rectHeight);
//
//         // Рисуем текст внутри прямоугольника для даты
//         ctx.fillStyle = "black"; // Цвет текста
//         ctx.font = "12px Arial";
//         ctx.textAlign = "center";
//         ctx.fillText(closestCandle.date, dateTextX, dateTextY + 15);
//
//         // Рисуем текст внутри прямоугольника для цены
//         const priceAtMouseY = (canvasHeight - mouseY + offsetY) / (canvasHeight * scale) * priceRange + minLow;
//         ctx.fillText(`Price: ${priceAtMouseY.toFixed(2)}`, dateTextX, dateTextY + 30);
//     }
// }

// ---------------------------------------------------------------


            // Оси X и Y (Рисование фона панелей для осей X и Y)
            ctx.fillStyle = "gray"; // Серый цвет
            const panelWidthY = 40; // Ширина панели по оси Y
            const panelHeightX = 30; // Высота панели по оси X

            // Нижняя панель (ось X)
            ctx.fillRect(panelWidthY, canvasHeight - panelHeightX, canvasWidth - panelWidthY, panelHeightX);

            // Левая панель (ось Y)
            ctx.fillRect(0, 0, panelWidthY, canvasHeight - panelHeightX);

            // Рисуем границу для нижней панели
            ctx.strokeStyle = "#5C5C5C"; // Черный цвет
            ctx.lineWidth = 2;
            ctx.strokeRect(panelWidthY, canvasHeight - panelHeightX, canvasWidth - panelWidthY, panelHeightX);

            // Рисуем границу для левой панели
            ctx.strokeStyle = "#5C5C5C"; // Черный цвет
            ctx.lineWidth = 2;
            ctx.strokeRect(0, 0, panelWidthY, canvasHeight - panelHeightX);

            // Оси X и Y
            ctx.strokeStyle = "black";
            ctx.lineWidth = 0;

            // Ось X
            ctx.beginPath();
            ctx.moveTo(panelWidthY, canvasHeight - panelHeightX);
            ctx.lineTo(canvasWidth, canvasHeight - panelHeightX);

            // Ось Y
            ctx.beginPath();
            ctx.moveTo(panelWidthY, 0);
            ctx.lineTo(panelWidthY, canvasHeight - panelHeightX);

            // Определите, сколько дат вы хотите отобразить
            const datesToDisplay = 15; // Например, 15 дат

            // Вычислите шаг между датами
            const step = Math.ceil(apiData.length / datesToDisplay);

            // Подписи по оси X (даты)
            ctx.font = "12px Arial";
            ctx.fillStyle = "white";
            ctx.textAlign = "center";

            for (let i = 0; i < apiData.length; i += step) {
                const candle = apiData[i];
                const x = i * (candleWidth + spaceBetweenCandles) + offsetX;
                const date = candle.date;
                ctx.fillText(date, x, canvasHeight - 10);
            }

            // Подписи по оси Y (допустим, цены)
            for (let i = 0; i <= 20; i++) {
                const price = minLow + (priceRange / 20) * i;
                const roundedPrice = Math.floor(price);
                const y = canvasHeight - (roundedPrice - minLow) / priceRange * canvasHeight * scale + offsetY;
                ctx.fillText(roundedPrice.toFixed(0), 20, y);
            }

            // Отображаем перекрестие мыши
            if (mouseX !== undefined && mouseY !== undefined) {
                // Отрисовываем вертикальную линию
                ctx.strokeStyle = "lightgray";
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(mouseX, 0);
                ctx.lineTo(mouseX, canvasHeight - panelHeightX);
                ctx.stroke();

                // Отрисовываем горизонтальную линию
                ctx.beginPath();
                ctx.moveTo(panelWidthY, mouseY);
                ctx.lineTo(canvasWidth, mouseY);
                ctx.stroke();
            }

            // Найдем ближайшую свечу к положению мыши
            const candleIndex = Math.floor((mouseX - offsetX) / (candleWidth + spaceBetweenCandles));
            if (candleIndex >= 0 && candleIndex < apiData.length) {
                const closestCandle = apiData[candleIndex];
                const closestCandleX = candleIndex * (candleWidth + spaceBetweenCandles) + offsetX;

                // Определите размеры и положение прямоугольников для даты и цены
                const dateRectWidth = 80;
                const dateRectHeight = 40;
                const priceRectWidth = 40;
                const priceRectHeight = 25;

                // Определите положение прямоугольников
                const dateRectX = closestCandleX;
                const dateRectY = canvasHeight - 10;
                const priceRectX = panelWidthY - 40;
                const priceRectY = mouseY - 12; // Поднять панель на 3 пикселя

                // Определите координаты для отрисовки текста внутри прямоугольника
                const dateTextX = dateRectX;
                const dateTextY = dateRectY + dateRectHeight / 2 + 5; // Опустить текст на 5 пикселей

                // Рисуем серый прямоугольник для цены
                ctx.strokeStyle = "black"; // Цвет обводки
                ctx.lineWidth = 2; // Ширина обводки
                ctx.strokeRect(priceRectX, priceRectY, priceRectWidth, priceRectHeight);
                ctx.fillStyle = "gray"; // Цвет серого прямоугольника
                ctx.fillRect(priceRectX, priceRectY, priceRectWidth, priceRectHeight);

                // Вычислите цену по оси Y в масштабированном пространстве графика
                const priceAtMouseY = (canvasHeight - mouseY + offsetY) / (canvasHeight * scale) * priceRange + minLow;

                // Рисуем текст внутри прямоугольника для цены
                ctx.fillStyle = "white"; // Цвет текста
                ctx.fillText(priceAtMouseY.toFixed(0), priceRectX + priceRectWidth / 2, priceRectY + priceRectHeight / 2 + 5);

                // Отрисовываем серые прямоугольники и текст
            drawTextInGrayRect(closestCandle.date, dateRectX, dateRectY, dateRectWidth, dateRectHeight);

            // Отрисовка серой панели в нижнем левом углу
            const panelColor = "gray";
            const panelBorder = "#5C5C5C";
            const panelWidth = 39;
            const panelHeight = 29;

            ctx.fillStyle = panelColor;
            ctx.fillRect(0, canvasHeight - panelHeight, panelWidth, panelHeight);

            ctx.strokeStyle = panelBorder;
            ctx.lineWidth = 1;
            ctx.strokeRect(1, canvasHeight - panelHeight - 1, panelWidth, panelHeight);
            }
        }
            // Обработчик движения мыши
            canvas.addEventListener("mousemove", (e) => {
                mouseX = e.clientX - canvas.getBoundingClientRect().left;
                mouseY = e.clientY - canvas.getBoundingClientRect().top;
                drawChart();
            });

            // Обработчик выхода мыши за пределы canvas
            canvas.addEventListener("mouseout", () => {
                mouseX = undefined;
                mouseY = undefined;
                ctx.clearRect(0, 0, canvasWidth, canvasHeight);
                drawChart();
            });

            // Функция для обработки события масштабирования
            function handleScale(e) {
                e.preventDefault();
                const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
                const mouseX = e.clientX - canvas.getBoundingClientRect().left;
                const mouseY = e.clientY - canvas.getBoundingClientRect().top;
                scale = Math.min(Math.max(scale * zoomFactor, 0.1), 20);
                offsetX = (offsetX - mouseX) * zoomFactor + mouseX;
                offsetY = (offsetY - mouseY) * zoomFactor + mouseY;
                drawChart();
            }

            // Функция для обработки события смещения по X и Y
            function handlePan(e) {
                if (isDragging) {
                    offsetX += e.movementX;
                    offsetY += e.movementY;
                    drawChart();
                }
            }

            // Обработка начала перетаскивания
            canvas.addEventListener("mousedown", (e) => {
                isDragging = true;
            });

            // Обработка завершения перетаскивания
            canvas.addEventListener("mouseup", () => {
                isDragging = false;
            });

            // Обработка движения мыши для смещения
            canvas.addEventListener("mousemove", (e) => {
                if (isDragging) {
                    handlePan(e);
                }
            });

            // Добавляем слушателя события масштабирования колесика мыши
            canvas.addEventListener("wheel", handleScale);

            drawChart(); // Инициализация отрисовки графика


 // ---------------------------------------------------------------------------------------------------------


            // Функция для сброса состояния графика на начальное (привязано к кнопке "Сбросить график")
            function resetChart() {
                scale = 1;
                offsetX = 0;
                offsetY = 0;
                drawChart(); // Перерисовываем график
            }

            // Создаём боковую панель sidebar со всей логикой и кнопками
            const chart = document.getElementById("bitcoin-chart");
            const tabs = document.querySelectorAll(".tab");
            const tabContents = document.querySelectorAll(".tab-content");

            // Получить высоту графика
            const chartHeight = chart.clientHeight; // Используйте clientHeight, чтобы получить высоту без учета границы и отступа

            const sidebar = document.getElementById("sidebar"); // Объявляем переменную sidebar

            // Устанавливаем дополнительный отступ сверху (например, 20 пикселей)
            const additionalHeight = -1; // Измените это значение на необходимое вам
            const sidebarHeight = chartHeight + additionalHeight;

            // Установить высоту боковой панели с учетом дополнительного отступа
            sidebar.style.height = sidebarHeight + "px";

            // Устанавливаем белый цвет фона для боковой панели
            sidebar.style.backgroundColor = "#F5F5F5";
            // Здесь вы также можете добавить другие стили, если это необходимо

            // Создаем первую кнопку и добавляем ее в содержимое первой вкладки
            const tab1Button = document.createElement("button");
            tab1Button.textContent = "EMA (on/off)";
            tab1Button.classList.add("my-button");
            const tab1Content = document.getElementById("tab1");
            tab1Content.appendChild(tab1Button);

            // Создаем вторую кнопку и добавляем ее в содержимое первой вкладки ниже первой кнопки
            const tab2Button = document.createElement("button");
            tab2Button.textContent = "Сделки (long)";
            tab2Button.classList.add("my-button");
            tab2Button.style.marginTop = "150px"; // Добавляем верхний отступ для второй кнопки
            tab1Content.appendChild(tab2Button);

            // Создаем шестую кнопку и добавляем ее в содержимое первой вкладки ниже первой кнопки
            const tab6Button = document.createElement("button");
            tab6Button.textContent = "Сделки (short)";
            tab6Button.classList.add("my-button");
            tab6Button.style.marginTop = "195px"; // Добавляем верхний отступ для второй кнопки
            tab1Content.appendChild(tab6Button);

            // Создаем третью кнопку и добавляем ее в содержимое первой вкладки ниже первой кнопки
            const tab3Button = document.createElement("button");
            tab3Button.textContent = "Таймфрейм 1D";
            tab3Button.classList.add("my-button");
            tab3Button.style.marginTop = "60px"; // Добавляем верхний отступ для второй кнопки
            tab1Content.appendChild(tab3Button);

            // Создаем чктвертую кнопку и добавляем ее в содержимое первой вкладки ниже первой кнопки
            const tab4Button = document.createElement("button");
            tab4Button.textContent = "Таймфрейм 1H";
            tab4Button.classList.add("my-button");
            tab4Button.style.marginTop = "105px"; // Добавляем верхний отступ для второй кнопки
            tab1Content.appendChild(tab4Button);

            // Создаем пятую кнопку и добавляем ее в содержимое первой вкладки ниже первой кнопки
            const tab5Button = document.createElement("button");
            tab5Button.textContent = "Сбросить график";
            tab5Button.classList.add("my-button");
            tab5Button.style.marginTop = "790px"; // Добавляем верхний отступ для второй кнопки
            tab1Content.appendChild(tab5Button);

                // Добавляем обработчики событий для обеих кнопок
            tab1Button.addEventListener("click", function () {
                // Переключаем значение emaVisible между true и false
                emaVisible = !emaVisible;
                // Вызываем функцию drawChart для перерисовки графика с учетом видимости EMA
                drawChart();

                // Обновляем текст кнопки в зависимости от значения emaVisible
                // tab1Button.innerText = emaVisible ? "EMA 120 (выкл)" : "EMA 120 (вкл)";
            });

                tab2Button.addEventListener("click", function () {
                // Переключаем значение emaTradesLong между true и false (включить и выключить трейды в лонг (зеленые точки))
                emaTradesLong = !emaTradesLong;
                // Вызываем функцию drawChart для перерисовки графика с учетом видимости трейдов
                drawChart();
                });

                tab6Button.addEventListener("click", function () {
                // Переключаем значение emaTradesShort между true и false (включить и выключить трейды в шорт (красные точки))
                emaTradesShort = !emaTradesShort;
                // Вызываем функцию drawChart для перерисовки графика с учетом видимости трейдов
                drawChart();
                });

                tab3Button.addEventListener("click", function () {
                    alert("Третья кнопка была нажата");
                    // Ваши действия для второй кнопки
                });

                tab4Button.addEventListener("click", function () {
                    alert("Четвертая кнопка была нажата");
                    // Ваши действия для второй кнопки
                });

                tab5Button.addEventListener("click", function () {
                    resetChart();
                    // Ваши действия для второй кнопки
                });

                // Создаем вторую вкладку (ваша вторая кнопка)
                const tab2Content = document.getElementById("tab2");


                // Создаем поле для ввода EMA
                const numberInput = document.createElement("input");{
                numberInput.type = "number";
                numberInput.placeholder = "Введите EMA"; // Текстовая подсказка

                // Устанавливаем отступ для поля
                numberInput.style.marginTop = "-25px"; // Измените это значение по вашему усмотрению

                // Устанавливаем стили для поля ввода
                numberInput.style.position = "absolute";
                numberInput.style.left = "75px"; // Установите смещение вправо в пикселях

                // Устанавливаем ширину и высоту поля для ввода
                numberInput.style.width = "110px"; // Измените значение на необходимое вам
                numberInput.style.height = "25px"; // Измените значение на необходимое вам

                // Добавляем поле для ввода в содержимое первой вкладки
                tab2Content.appendChild(numberInput);

                // Флаг для отслеживания состояния поля ввода
                let isInputDisabled = false;

                // Обработчик события для поля ввода
                numberInput.addEventListener("keyup", function(event) {
                  if (event.key === "Enter" && !isInputDisabled) {
                    // Пользователь нажал клавишу "Enter" и поле ввода не заблокировано
                    const inputValue = numberInput.value; // Получаем введенное значение


                    // Устанавливаем стили для поля ввода
                    numberInput.style.backgroundColor = "#E0E0E0"; // Задаем серый цвет фона
                    numberInput.style.color = "#7A7A7A"; // Задаем темно-серый цвет текста
                    numberInput.setAttribute("readonly", "true"); // Устанавливаем атрибут readonly

                    console.log("Введенное значение:", inputValue); // Выводим значение в консоль
                    // Далее, вы можете сохранить значение в переменной или выполнить другие действия с ним

                    // Устанавливаем флаг блокировки поля ввода
                    isInputDisabled = true;
                  }
                });

                // Обработчик события для сброса состояния поля ввода
                numberInput.addEventListener("click", function() {
                  if (isInputDisabled) {
                    // Поле ввода было заблокировано, сбрасываем состояние
                    numberInput.style.backgroundColor = ""; // Сбрасываем цвет фона
                    numberInput.style.cursor = "auto"; // Восстанавливаем обычный курсор
                    numberInput.removeAttribute("readonly"); // Удаляем атрибут readonly
                    numberInput.value = ""; // Очищаем значение поля ввода

                    // Устанавливаем флаг разблокировки поля ввода
                    isInputDisabled = false;
                  }
                });
                }


                // Создаем кнопку для отправки значения EMA
                const sendButton = document.createElement("button");
                sendButton.textContent = "Отправить EMA";
                sendButton.classList.add("my-button");
                sendButton.style.marginTop = "45px"; // Отступ от поля ввода
                tab2Content.appendChild(sendButton);

                // Обработчик события для кнопки отправки
                sendButton.addEventListener("click", function () {
                  const inputValue = numberInput.value;
                  if (inputValue) {
                    // Отправляем значение EMA на сервер с использованием Fetch API
                fetch('/calculate_ema/', {
                  method: 'POST',
                      body: JSON.stringify({ period: inputValue }),  // Используем "period" вместо "emaValue", чтобы соответствовать вашему представлению
                  headers: {
                    'Content-Type': 'application/json'
                  }
                })
                  .then(response => response.json())
                  .then(data => {
                    console.log("Ответ от сервера:", data);
                    if (data['Trade Count'] !== undefined) {

                        // Теперь добавим код для обновления второй вкладки с количеством сделок
                        const tab2Content = document.getElementById("tab2"); // Получаем содержимое второй вкладки

                        // Проверяем, существует ли элемент с надписью и удаляем его, если он есть
                        const existingTradeCountElement = tab2Content.querySelector("p");
                        if (existingTradeCountElement) {
                            tab2Content.removeChild(existingTradeCountElement);
                        }

                        // Создаем элемент для отображения количества сделок
                        const tradeCountElement = document.createElement("p");
                        tradeCountElement.textContent = `Количество сделок: ${data['Trade Count']}`;

                        // Применяем стили напрямую в JavaScript
                        tradeCountElement.style.fontFamily = "Arial, sans-serif"; // Замените на ваш выбранный шрифт
                        tradeCountElement.style.fontSize = "12px"; // Замените на ваш выбранный размер шрифта
                        tradeCountElement.style.textAlign = "right"; // Измените расположение текста, если необходимо
                        tradeCountElement.style.color = "black"; // Цвет шрифта

                        // Сместим надпись вниз:
                        tradeCountElement.style.marginTop = "-250px"; // Измените значение на необходимое

                        // Добавить новый элемент с количеством сделок
                        tab2Content.appendChild(tradeCountElement);
                    } else {
                        console.error("Ошибка при обработке ответа от сервера");

                    }

                   })

                     }
                    });






                 // Создаем поле для ввода тестового EMA
                const numberInput2 = document.createElement("input");{
                numberInput2.type = "number";
                numberInput2.placeholder = "Ввод EMA (test)"; // Текстовая подсказка

                // Устанавливаем отступ для поля
                numberInput2.style.marginTop = "105px"; // Измените это значение по вашему усмотрению

                // Устанавливаем стили для поля ввода
                numberInput2.style.position = "absolute";
                numberInput2.style.left = "75px"; // Установите смещение вправо в пикселях

                // Устанавливаем ширину и высоту поля для ввода
                numberInput2.style.width = "120px"; // Измените значение на необходимое вам
                numberInput2.style.height = "25px"; // Измените значение на необходимое вам

                // Добавляем поле для ввода в содержимое второй вкладки
                tab2Content.appendChild(numberInput2);

                // Флаг для отслеживания состояния поля ввода
                let isInputDisabled2 = false;

                // Обработчик события для поля ввода
                numberInput2.addEventListener("keyup", function(event) {
                  if (event.key === "Enter" && !isInputDisabled2) {
                    // Пользователь нажал клавишу "Enter" и поле ввода не заблокировано
                    const inputValue = numberInput2.value; // Получаем введенное значение

                    // Устанавливаем стили для поля ввода
                    numberInput2.style.backgroundColor = "#E0E0E0"; // Задаем серый цвет фона
                    numberInput2.style.color = "#7A7A7A"; // Задаем темно-серый цвет текста
                    numberInput2.setAttribute("readonly", "true"); // Устанавливаем атрибут readonly

                    console.log("Введенное значение:", inputValue); // Выводим значение в консоль
                    // Далее, вы можете сохранить значение в переменной или выполнить другие действия с ним

                    // Устанавливаем флаг блокировки поля ввода
                    isInputDisabled2 = true;
                  }
                });

                // Обработчик события для сброса состояния поля ввода
                numberInput2.addEventListener("click", function() {
                  if (isInputDisabled2) {
                    // Поле ввода было заблокировано, сбрасываем состояние
                    numberInput2.style.backgroundColor = ""; // Сбрасываем цвет фона
                    numberInput2.style.cursor = "auto"; // Восстанавливаем обычный курсор
                    numberInput2.removeAttribute("readonly"); // Удаляем атрибут readonly
                    numberInput2.value = ""; // Очищаем значение поля ввода

                    // Устанавливаем флаг разблокировки поля ввода
                    isInputDisabled2 = false;
                  }
                });
                }


                // Создаем поле для ввода депозита
                const numberInput3 = document.createElement("input");{
                numberInput3.type = "number";
                numberInput3.placeholder = "Ввод депозита"; // Текстовая подсказка

                // Устанавливаем отступ для поля
                numberInput3.style.marginTop = "145px"; // Измените это значение по вашему усмотрению

                // Устанавливаем стили для поля ввода
                numberInput3.style.position = "absolute";
                numberInput3.style.left = "75px"; // Установите смещение вправо в пикселях

                // Устанавливаем ширину и высоту поля для ввода
                numberInput3.style.width = "120px"; // Измените значение на необходимое вам
                numberInput3.style.height = "25px"; // Измените значение на необходимое вам

                // Добавляем поле для ввода в содержимое второй вкладки
                tab2Content.appendChild(numberInput3);

                // Флаг для отслеживания состояния поля ввода
                let isInputDisabled3 = false;

                // Обработчик события для поля ввода
                numberInput3.addEventListener("keyup", function(event) {
                  if (event.key === "Enter" && !isInputDisabled3) {
                    // Пользователь нажал клавишу "Enter" и поле ввода не заблокировано
                    const inputValue = numberInput3.value; // Получаем введенное значение

                    // Устанавливаем стили для поля ввода
                    numberInput3.style.backgroundColor = "#E0E0E0"; // Задаем серый цвет фона
                    numberInput3.style.color = "#7A7A7A"; // Задаем темно-серый цвет текста
                    numberInput3.setAttribute("readonly", "true"); // Устанавливаем атрибут readonly

                    console.log("Введенное значение:", inputValue); // Выводим значение в консоль
                    // Далее, вы можете сохранить значение в переменной или выполнить другие действия с ним

                    // Устанавливаем флаг блокировки поля ввода
                    isInputDisabled3 = true;
                  }
                });

                // Обработчик события для сброса состояния поля ввода
                numberInput3.addEventListener("click", function() {
                  if (isInputDisabled3) {
                    // Поле ввода было заблокировано, сбрасываем состояние
                    numberInput3.style.backgroundColor = ""; // Сбрасываем цвет фона
                    numberInput3.style.cursor = "auto"; // Восстанавливаем обычный курсор
                    numberInput3.removeAttribute("readonly"); // Удаляем атрибут readonly
                    numberInput3.value = ""; // Очищаем значение поля ввода

                    // Устанавливаем флаг разблокировки поля ввода
                    isInputDisabled3 = false;
                  }
                });
                }


                // Создаем кнопку для отправки значения тестового EMA и депозита
                const sendButton2 = document.createElement("button");
                sendButton2.textContent = "Расчёт доходности";
                sendButton2.classList.add("my-button");
                sendButton2.style.marginTop = "210px"; // Отступ от поля ввода
                tab2Content.appendChild(sendButton2);

                // Обработчик событий для кнопки "Расчёт доходности"
                sendButton2.addEventListener("click", function () {
                const inputValue2 = numberInput2.value;
                const inputValue3 = numberInput3.value;

                if (inputValue2 && inputValue3) {
                    // Отправляем значение EMA на сервер с использованием Fetch API
                    fetch('/calculate_profit/', {
                        method: 'POST',
                        body: JSON.stringify({
                            ema_period: inputValue2,
                            close_data: data.close,
                            initial_balance: inputValue3
                        }),
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    })
                    .then(response => response.json())
                    .then(data => {
                        console.log("Ответ от сервера:", data);
                        console.log("Ответ от сервера:", JSON.stringify(data, null, 2));

                if (data['data'] !== undefined) {
                    // Теперь у вас есть данные, которые можно использовать для обновления интерфейса
                    // Возможно, вам нужно будет добавить код обновления интерфейса здесь
                    // Создаем HTML-разметку для таблицы
                    const tableHTML = generateTableHTML(data.data, data.final_profit, data.final_balance, inputValue3, inputValue2,
                        data.trade_count, data.percent_profit, data.max_percent_loss, data.max_percent_profit, data.balance_hodl, data.balance_hodl_max_fixation);

                    // Открываем всплывающее окно с таблицей
                    const popup = window.open("", "_blank", "width=860");
                    popup.document.write(`
                        <html>
                            <head>
                                <style>
                                    .profit-table {
                                        font-family: 'Arial', sans-serif;
                                        font-size: 14px;
                                        border-collapse: collapse;
                                        width: 100%;
                                    }
                                    .profit-table th, .profit-table td {
                                        border: 1px solid #ddd;
                                        padding: 2px; /* Уменьшаем высоту строк */
                                        text-align: center;
                                    }
                                    .profit-table th {
                                        border-width: 2px; /* Толщина верхней границы заголовков */
                                        border-color: #B5B6B4; /* Цвет верхней границы заголовков */
                                    }
                                    .additional-info td {
                                        text-align: left; /* Выравнивание по левому краю для строк с доп. информацией */
                                        border: none; /* Убираем границу для строк с доп. информацией */
                                        font-weight: normal; /* Сбрасываем жирность шрифта */
                                        font-size: 13px;
                                    }
                                </style>
                            </head>
                            <body>
                                ${tableHTML}
                            </body>
                        </html>
                    `);

                    // Устанавливаем высоту окна в зависимости от высоты таблицы
                    const tableHeight = popup.document.querySelector(".profit-table").offsetHeight;
                    popup.resizeTo(860, tableHeight + 50); // Добавляем небольшой отступ
                } else {
                    console.error("Ошибка при обработке ответа от сервера");
                }
                console.log("Отправляемые данные:", JSON.stringify({
                    ema_period: inputValue2,
                    close_data: data.close,
                    initial_balance: inputValue3
                }));
            });
        }
    });

                // Генерация HTML-разметки для таблицы
                function generateTableHTML(data, finalProfit, finalBalance, initialBalance, emaPeriod, tradeCount, percent_profit, max_percent_loss, max_percent_profit, balance_hodl, balance_hodl_max_fixation) {
                    // Создаем таблицу
                    let tableHTML = '<table class="profit-table">';

                    // Добавляем строки с дополнительной информацией
                    tableHTML += `<tr class="additional-info"><td colspan="${Object.keys(data[0]).length}">Длина EMA: ${Math.round(emaPeriod)}</td></tr>`;
                    tableHTML += `<tr class="additional-info"><td colspan="${Object.keys(data[0]).length}">Количество сделок: ${Math.round(tradeCount)}</td></tr>`;
                     tableHTML += `<tr class="additional-info"><td colspan="${Object.keys(data[0]).length}">Начальный баланс: ${Math.round(initialBalance)} $</td></tr>`;
                     tableHTML += `<tr class="additional-info"><td colspan="${Object.keys(data[0]).length}">Конечный баланс: ${Math.round(finalBalance)} $</td></tr>`;
                     tableHTML += `<tr class="additional-info"><td colspan="${Object.keys(data[0]).length}">Общий профит: ${Math.round(finalProfit)} $</td></tr>`;
                    tableHTML += `<tr class="additional-info"><td colspan="${Object.keys(data[0]).length}">Общий профит в процентах: ${Math.round(percent_profit)} %</td></tr>`;
                    tableHTML += `<tr class="additional-info"><td colspan="${Object.keys(data[0]).length}">Максимальный убыток в процентах: ${max_percent_loss.toFixed(1)} %</td></tr>`;
                    tableHTML += `<tr class="additional-info"><td colspan="${Object.keys(data[0]).length}">Максимальная прибыль в процентах: ${max_percent_profit.toFixed(1)} %</td></tr>`;
                    tableHTML += '<tr><td style="height: 15px; border: none;"></td></tr>'; // Добавляем пустую строку для отступа
                    tableHTML += `<tr class="additional-info"><td colspan="${Object.keys(data[0]).length}">Доходность в HODL: ${Math.round(balance_hodl)} $</td></tr>`;
                    tableHTML += `<tr class="additional-info"><td colspan="${Object.keys(data[0]).length}">Доходность в HODL (фиксация прибыли на максимуме): ${Math.round(balance_hodl_max_fixation)} $</td></tr>`;

                    // Добавляем пустую строку для отступа
                    tableHTML += '<tr><td style="height: 15px; border: none;"></td></tr>';

                    // Создаем заголовок таблицы
                    tableHTML += '<tr>';
                    for (const key in data[0]) {
                        tableHTML += `<th>${key}</th>`;
                    }
                    tableHTML += '</tr>';

                 // Добавляем данные
                    data.forEach(entry => {
                        tableHTML += '<tr>';
                        for (const key in entry) {
                            // Округляем значения столбцов "цена покупки", "цена продажи" и "прибыль/убыток" до целого
                            if (['цена покупки', 'цена продажи', 'прибыль/убыток'].includes(key)) {
                                tableHTML += `<td>${Math.round(entry[key])}</td>`;
                            } else {
                                tableHTML += `<td>${entry[key]}</td>`;
                            }
                        }
                        tableHTML += '</tr>';
                    });

                    // Закрываем таблицу
                    tableHTML += '</table>';

                    return tableHTML;
                }



            // Создаем кнопку для отрисовки новой EMA (на основе введённых данных)
                const sendButton3 = document.createElement("button");
                sendButton3.textContent = "Вывести на график";
                sendButton3.classList.add("my-button");
                sendButton3.style.marginTop = "250px"; // Отступ от поля ввода
                tab2Content.appendChild(sendButton3);

                sendButton3.addEventListener("click", function () {
                // Вызываем функцию для повторной загрузки данных и обновления графика
                fetchDataFromAPI()
                    .then(newData => {
                        // Обновляем данные EMA
                        const newEma = newData.ema;

                        // Обновляем массив данных с новыми значениями EMA
                        for (let i = 0; i < apiData.length; i++) {
                            apiData[i].ema = newEma[i];
                        }

                        // Перерисовываем график с обновленными данными
                        drawChart();
                    })
                    .catch(error => console.error('Error fetching new data:', error));
            });




            // Создаем кнопку для загрузки данных и тестирования (оптимизации) стратегии
            const loadDataButton = document.createElement("button");
            loadDataButton.textContent = "Оптимизация";
            loadDataButton.classList.add("my-button");
            loadDataButton.style.marginTop = "290px"; // Отступ от поля ввода
            tab2Content.appendChild(loadDataButton);

            // Создаем progress-bar
            const progressBar = document.createElement("progress");
            progressBar.value = 0;
            progressBar.max = 100;
            // progressBar.style.display = "none"; // Начинаем с скрытого progress-bar
            progressBar.style.width = "154px"; // Замените "200px" на нужное вам значение длины в пикселях
            progressBar.style.marginTop = "300px"; // Регулировка отступа в пикселях
            progressBar.style.marginLeft = "25px"; // Замените "10px" на нужное вам значение отступа в пикселях
            tab2Content.appendChild(progressBar);

            // Глобальная переменная для хранения данных
            let savedData;

            // Функция для обработки данных и сохранения их в глобальной переменной
            function handleData(data) {
                savedData = data;
            }

            // Функция для получения сохраненных данных
            function getData() {
                return savedData;
            }

            // Обработчик для кнопки "Оптимизация"
            loadDataButton.addEventListener("click", async function () {
                try {
                    // Сброс прогресса перед новым запросом
                    progressBar.value = 0;

                    // Показываем progress-bar перед отправкой запроса
                    progressBar.style.display = "block";

                    // Время выполнения задачи в миллисекундах (7 секунд)
                    const taskDuration = 7000;

                    // Время начала выполнения задачи
                    const startTime = performance.now();

                    // Функция обновления progress-bar
                    const updateProgressBar = function (currentTime) {
                        const elapsedTime = currentTime - startTime;
                        const progressValue = (elapsedTime / taskDuration) * progressBar.max;

                        if (progressValue >= progressBar.max) {
                            // Достигнут конец прогресса
                            // Скрываем progress-bar после выполнения задачи
                            // progressBar.style.display = "none";
                        } else {
                            // Обновляем значение progress-bar
                            progressBar.value = progressValue;
                            // Продолжаем анимацию
                            requestAnimationFrame(updateProgressBar);
                        }
                    };

                    // Запускаем анимацию
                    requestAnimationFrame(updateProgressBar);

                    // Отправляем POST-запрос на /strategy_optimization/
                    const response = await fetch('/strategy_optimization/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({}),  // Передаем пустой объект, если данные не нужны
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }

                    // Обрабатываем ответ от сервера
                    const data = await response.json();
                    console.log(data);
                    console.log("Ответ от сервера:", JSON.stringify(data, null, 2));

                    // Сохраняем данные в переменной
                    savedData = data;

                } catch (error) {
                    console.error('Error during strategy optimization:', error);
                }
            });



            // Создаем кнопку для отображения таблицы с результатами оптимизации
            const showTableButton = document.createElement("button");
            showTableButton.textContent = "Отобразить таблицу";
            showTableButton.classList.add("my-button");
            showTableButton.style.marginTop = "347px"; // Отступ от поля ввода
            tab2Content.appendChild(showTableButton);


            // Обработчик для кнопки "Отобразить таблицу"
            showTableButton.addEventListener("click", function () {
                // Получаем сохраненные данные (предполагается, что данные сохранены после загрузки)
                const data = getData(); // Замените эту функцию на ваш метод получения данных

                // Проверяем наличие данных
                if (data) {
                    // Создаем HTML-разметку для таблицы
                    const tableHTML2 = generateTableHTML2(data.optimization_results, data.optimal_ema, data.initial_balance);

                    if (tableHTML2) {
                        // Открываем всплывающее окно с таблицей
                        const popup = window.open("", "_blank", "width=860,height=500,scrollbars=1");
                        if (popup) {
                            const popupDocument = popup.document;

                            // Создаем стили
                            const styleElement = popupDocument.createElement("style");
                            styleElement.textContent = `
                                .optimization-table {
                                    font-family: 'Arial', sans-serif;
                                    font-size: 14px;
                                    border-collapse: collapse;
                                    width: 100%;
                                }
                                .optimization-table th, .optimization-table td {
                                    border: 1px solid #ddd;
                                    padding: 2px; /* Уменьшаем высоту строк */
                                    text-align: center;
                                }
                                .optimization-table th {
                                    border-width: 2px; /* Толщина верхней границы заголовков */
                                    border-color: #B5B6B4; /* Цвет верхней границы заголовков */
                                }
                                .additional-info td {
                                    text-align: left; /* Выравнивание по левому краю для строк с доп. информацией */
                                    border: none; /* Убираем границу для строк с доп. информацией */
                                    font-weight: normal; /* Сбрасываем жирность шрифта */
                                    font-size: 13px;
                                }
                            `;
                            popupDocument.head.appendChild(styleElement);

                            // Создаем HTML-разметку для таблицы
                            const tableContainer = popupDocument.createElement("div");
                            tableContainer.innerHTML = tableHTML2;
                            popupDocument.body.appendChild(tableContainer);

                            // Устанавливаем высоту окна в зависимости от высоты таблицы
                            popup.resizeTo(860, tableContainer.offsetHeight + 50);
                        } else {
                            console.error('Error during strategy optimization: Unable to open popup');
                        }
                    } else {
                        console.error('Error during strategy optimization: Invalid tableHTML2');
                    }
                } else {
                    console.error('Error during strategy optimization: No data available');
                }
            });

            // Генерация HTML-разметки для таблицы
            function generateTableHTML2(optimization_results, optimal_ema, initial_balance) {
                // Создаем таблицу
                let tableHTML2 = '<table class="optimization-table">';

                // Добавляем строки с дополнительной информацией
                tableHTML2 += `<tr class="additional-info"><td colspan="${Object.keys(optimization_results[0]).length}">Оптимальная длина EMA: ${Math.round(optimal_ema)}</td></tr>`;

                // Добавляем строки с дополнительной информацией по ключу optimal_ema
                optimization_results.forEach(entry => {
                    if (entry['Длина EMA'] === optimal_ema) {
                        // Добавляем строки с дополнительной информацией, например, "Конечный баланс" для optimal_ema
                        tableHTML2 += `<tr class="additional-info"><td colspan="${Object.keys(optimization_results[0]).length}">Количество сделок: ${entry['Количество сделок']}</td></tr>`;
                        tableHTML2 += `<tr class="additional-info"><td colspan="${Object.keys(optimization_results[0]).length}">Максимальная прибыль за сделку в процентах: ${entry['Максимальная прибыль (%)']} %</td></tr>`;
                        tableHTML2 += `<tr class="additional-info"><td colspan="${Object.keys(optimization_results[0]).length}">Максимальный убыток за сделку в процентах: ${entry['Максимальный убыток (%)']} %</td></tr>`;
                    }
                });

                // Добавляем строки с дополнительной информацией
                tableHTML2 += `<tr class="additional-info"><td colspan="${Object.keys(optimization_results[0]).length}">Начальный баланс: ${Math.round(initial_balance)} $</td></tr>`;

                    // Добавляем дополнительные строки с дополнительной информацией по ключу optimal_ema
                optimization_results.forEach(entry => {
                    if (entry['Длина EMA'] === optimal_ema) {
                        // Добавляем строки с дополнительной информацией, например, "Конечный баланс" для optimal_ema
                        tableHTML2 += `<tr class="additional-info"><td colspan="${Object.keys(optimization_results[0]).length}">Конечный баланс: ${entry['Конечный баланс']} $</td></tr>`;
                        tableHTML2 += `<tr class="additional-info"><td colspan="${Object.keys(optimization_results[0]).length}">Общий профит: ${entry['Общий профит'].toFixed(1)} $</td></tr>`;
                        tableHTML2 += `<tr class="additional-info"><td colspan="${Object.keys(optimization_results[0]).length}">Общий профит в процентах: ${entry['Общий профит (%)']} %</td></tr>`;
                    }
                });

                // Добавляем пустую строку для отступа
                tableHTML2 += '<tr><td style="height: 15px; border: none;"></td></tr>';

                // Создаем заголовок таблицы
                tableHTML2 += '<tr>';
                for (const key in optimization_results[0]) {
                    tableHTML2 += `<th>${key}</th>`;
                }
                tableHTML2 += '</tr>';

                // Добавляем данные
                optimization_results.forEach(entry => {
                    tableHTML2 += '<tr>';
                    for (const key in entry) {
                        // Округляем значения столбцов "цена покупки", "цена продажи" и "прибыль/убыток" до целого
                        if (['Общий профит'].includes(key)) {
                            tableHTML2 += `<td>${Math.round(entry[key])}</td>`;
                        } else {
                            tableHTML2 += `<td>${entry[key]}</td>`;
                        }
                    }
                    tableHTML2 += '</tr>';
                });

                // Закрываем таблицу
                tableHTML2 += '</table>';

                return tableHTML2;
            }




                // Функция для отображения выбранной вкладки
                function showTab(tabIndex) {
                    // Скрыть все вкладки
                    tabContents.forEach((content) => content.style.display = "none");
                    tabs.forEach((tab) => tab.classList.remove("active"));

                    // Отобразить выбранную вкладку
                    tabContents[tabIndex].style.display = "block";
                    tabs[tabIndex].classList.add("active");
                }

                // Обработчик события для переключения между вкладками
                tabs.forEach((tab, index) => {
                    tab.addEventListener("click", () => {
                        // Вызов функции для отображения выбранной вкладки
                        showTab(index);
                    });
                });

                // По умолчанию показать первую вкладку
                showTab(0);
            });

       });