## DNS Markdown API — документация эндпоинтов

### Базовый URL

- **Production / staging**: зависит от окружения деплоя (например, Vercel).
- **Базовый путь API**: все публичные маршруты начинаются с префикса `/api`, служебные — с `/service`, вебхуки Clerk — с `/clerk`.

### Аутентификация и заголовки

- **Общий доступ к `/api/*`**
  - Все маршруты под `/api` защищены двумя слоями:
    - **Clerk**: `clerkMiddleware()` ожидает, что запрос идёт от аутентифицированного пользователя Clerk (cookies / заголовки авторизации от Clerk).
    - **Секрет фронтенда**: middleware `authPublicMiddleware` требует заголовок:
      - `X-Internal-API-Secret: <API_SECRET_KEY>`
  - Значение `API_SECRET_KEY` задаётся в переменных окружения и валидируется в `env.ts`.

- **Служебные эндпоинты `/service/*`**
  - Защищены middleware `authServiceMiddleware`.
  - Требуемый заголовок:
    - `Authorization: Bearer <API_SERVICE_KEY>`
  - Значение `API_SERVICE_KEY` задаётся в переменных окружения и должно совпадать с токеном в запросе.

- **CORS**
  - Разрешённые origin’ы берутся из переменной окружения `CORS_ORIGIN` (список через запятую).
  - Разрешённые методы: `GET`, `POST`, `OPTIONS`.
  - Разрешённые заголовки: `Content-Type`, `Authorization`, `X-Internal-API-Secret`.

### Формат ошибок

- **500 Internal Server Error**
  - Тело ответа:
    - В продакшене: `{ "error": "Internal Server Error" }`
    - В дев-окружении: `{ "error": "Internal Server Error", "details": "<сообщение ошибки>" }`

---

## Эндпоинты

### GET /health

- **Назначение**: проверка доступности сервиса и состояния API.
- **Авторизация**: не требуется.
- **Запрос**
  - Метод: `GET`
  - URL: `/health`
  - Тело: отсутствует.
- **Успешный ответ (200)**:

```json
{
  "status": "OK",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "service": "DNS Markdown API"
}
```

- **Пример запроса (cURL)**:

```bash
curl -X GET "<BASE_URL>/health"
```

---

## Публичные маршруты под /api

Все эндпоинты ниже:

- находятся под префиксом `/api/...`;
- требуют аутентифицированного пользователя Clerk;
- требуют заголовок `X-Internal-API-Secret: <API_SECRET_KEY>`.

### Прайс-листы — /api/pricelist

#### GET /api/pricelist

- **Назначение**: получить последний прайс-лист по городу.
- **Авторизация**: Clerk + `X-Internal-API-Secret`.
- **Параметры query**:
  - `city` (string, required): город.
- **Ответы**:
  - `200` — JSON прайс-листа `PriceListType`. Каждый товар в `positions[].items[]` дополнительно содержит `dateAdded` (дата первого изменения из `AnalysisData` по данному `link`/`city`, либо `null`, если данных нет).
  - `400` — `"city is required"`.
  - `404` — `"Price list not found"`.

#### GET /api/pricelist/list

- **Назначение**: получить список всех дат доступных прайс-листов по городу.
- **Авторизация**: Clerk + `X-Internal-API-Secret`.
- **Параметры query**:
  - `city` (string, required): город.
- **Ответы**:
  - `200` — массив дат `PriceListDate[]`.
  - `400` — `"city is required"`.

#### GET /api/pricelist/id/:id

- **Назначение**: получить архивный прайс-лист по его `id`.
- **Авторизация**: Clerk + `X-Internal-API-API_SECRET`.
- **Параметры пути**:
  - `id` (string, required): идентификатор прайс-листа.
- **Ответы**:
  - `200` — JSON прайс-листа `PriceListType`.
  - `400` — `"id is required"`.
  - `404` — `"Archived price list not found"`.

---

### Продукты — /api/products

#### GET /api/products/link

- **Назначение**: получить детальную информацию по продукту, его историю изменений и статус избранного по ссылке.
- **Авторизация**: Clerk + `X-Internal-API-Secret`.
- **Параметры query**:
  - `link` (string, required): ссылка на товар.
- **Ответы**:
  - `200` — объект `ProductPayload`:
    - `item` — последняя версия товара;
    - `history` — история изменения цены/прибыли;
    - `status` — информация об актуальности и городе.
  - `400` — `"link is required"`.
  - `404` — `"Product not found"`.

#### GET /api/products/most-cheap-products

- **Назначение**: получить список самых дешёвых товаров по городу.
- **Авторизация**: Clerk + `X-Internal-API-Secret`.
- **Параметры query**:
  - `city` (string, required): город.
- **Ответы**:
  - `200` — массив `Goods[]`, отсортированный по цене по возрастанию.
  - `400` — `"city is required"`.

#### GET /api/products/most-discounted-products

- **Назначение**: получить товары с максимальной скидкой.
- **Авторизация**: Clerk + `X-Internal-API-Secret`.
- **Параметры query**:
  - `city` (string, required): город.
- **Логика**:
  - Товары с валидной `priceOld` сортируются по проценту скидки.
- **Ответы**:
  - `200` — массив `Goods[]`, отсортированный по величине скидки.
  - `400` — `"city is required"`.

#### GET /api/products/most-profitable-products

- **Назначение**: получить самые выгодные по прибыли товары.
- **Авторизация**: Clerk + `X-Internal-API-Secret`.
- **Параметры query**:
  - `city` (string, required): город.
- **Ответы**:
  - `200` — массив `Goods[]`, отсортированный по полю `profit` по убыванию.
  - `400` — `"city is required"`.

---

### Аналитика — /api/analysis

#### GET /api/analysis/last-diff

- **Назначение**: получить последний дифф изменений ассортимента по городу.
- **Авторизация**: Clerk + `X-Internal-API-Secret`.
- **Параметры query**:
  - `city` (string, required): город.
- **Ответы**:
  - `200` — объект `AnalysisDiffType`.
  - `400` — `"city is required"`.
  - `404` — `"Analysis diff not found"`.

#### GET /api/analysis/price-drop-prediction

- **Назначение**: получить прогноз даты следующего изменения цены для каждого товара в текущем прайс-листе города, на основе среднего интервала между историческими изменениями цены/прибыли (`AnalysisData`).
- **Авторизация**: Clerk + `X-Internal-API-Secret`.
- **Параметры query**:
  - `city` (string, required): город.
- **Логика**:
  - Для каждого товара из текущего прайс-листа города считается средний интервал между зафиксированными изменениями (`AnalysisData` по `link`/`city`), и `predictionDate` = дата последнего изменения + средний интервал.
  - Товары, у которых зафиксировано менее 2 изменений в истории (недостаточно данных для расчёта интервала), из ответа исключаются.
  - `predictionDate` может быть в прошлом (если товар давно не менялся, а исторический интервал короткий) — это осознанно не ограничивается текущей датой, чтобы такие товары оказывались в начале списка.
- **Ответы**:
  - `200` — массив объектов `{ item: Goods, predictionDate: string }`, отсортированный по возрастанию `predictionDate` (сначала товары с ближайшим прогнозом).
  - `400` — `"city is required"`.

#### GET /api/analysis/all-diffs

- **Назначение**: получить до 30 последних диффов в агрегированном виде.
- **Авторизация**: Clerk + `X-Internal-API-Secret`.
- **Параметры query**:
  - `city` (string, required): город.
- **Ответы**:
  - `200` — массив `AnalysisDiffReport[]` с агрегированными данными (кол-во новых/удалённых/изменённых по цене/прибыли позиций).
  - `400` — `"city is required"`.

#### GET /api/analysis/all-analysis-goods-by-date-added

- **Назначение**: получить список товаров по городу и дате добавления.
- **Авторизация**: Clerk + `X-Internal-API-Secret`.
- **Параметры query**:
  - `city` (string, required);
  - `dateAdded` (string, required, валидная дата).
- **Ответы**:
  - `200` — массив `AnalysisDataType[]`.
  - `400` — `"city and dateAdded must be non-empty strings"` или `"dateAdded must be a valid date string"`.

#### GET /api/analysis/products-count

- **Назначение**: получить историю количества товаров по последним 30 прайс-листам.
- **Авторизация**: Clerk + `X-Internal-API-Secret`.
- **Параметры query**:
  - `city` (string, required).
- **Ответы**:
  - `200` — массив `PriceListsArchiveCount[]` с полями `date` и `count`.
  - `400` — `"city is required"`.

#### GET /api/analysis/total-uniq-products-count

- **Назначение**: получить общее количество уникальных товаров по городу.
- **Авторизация**: Clerk + `X-Internal-API-Secret`.
- **Параметры query**:
  - `city` (string, required).
- **Ответы**:
  - `200` — число (кол-во уникальных ссылок).
  - `400` — `"city is required"`.

#### GET /api/analysis/reports

- **Назначение**: получить до 30 последних отчётов анализа по городу.
- **Авторизация**: Clerk + `X-Internal-API-Secret`.
- **Параметры query**:
  - `city` (string, required).
- **Ответы**:
  - `200` — массив отчётов `ReportsResponse`.
  - `400` — `"city is required"`.

---

### LLM — /api/llm

#### GET /api/llm/compare-products

- **Назначение**: получить текстовый отчёт сравнения нескольких товаров при помощи LLM.
- **Авторизация**: Clerk + `X-Internal-API-Secret`.
- **Параметры query**:
  - `links` (string, required): URL-encoded JSON-массив строк (ссылок).
- **Валидация**:
  - Должен быть корректный `decodeURIComponent`.
  - Должен парситься как JSON-массив строк.
  - Длина массива от 2 до 5.
- **Ответы**:
  - `200` — `{ message: string, report: string }`, может быть из кэша (`message` меняется).
  - `400` — одна из ошибок:
    - `"Missing or invalid 'links' query parameter"`;
    - `"Malformed 'links' query parameter"`;
    - `"Input must be a JSON array of strings"`;
    - `"At least two product links are required for comparison (max five)"`.

#### GET /api/llm/describe-product

- **Назначение**: получить текстовое описание одного товара при помощи LLM.
- **Авторизация**: Clerk + `X-Internal-API-Secret`.
- **Параметры query**:
  - `link` (string, required): URL-encoded ссылка товара.
- **Ответы**:
  - `200` — `{ message: string, report: string }`, может быть из кэша.
  - `400` — `"Missing or invalid 'link' query parameter"`.
  - `404` — `"Product not found for the provided link"`.

---

### Пользователь — /api/user

Все эндпоинты ниже:

- используют `getAuth(req)` из Clerk;
- дополнительно требуют `X-Internal-API-Secret`.

#### POST /api/user

- **Назначение**: получить данные пользователя по его Clerk `userId`.
- **Тело запроса**: отсутствует.
- **Ответы**:
  - `200` — JSON-пользователь.
  - `401` — `"Authentication required. User identity not found."`.
  - `404` — `"User not found"`.

#### POST /api/user/notifications-update

- **Назначение**: обновить настройки уведомлений пользователя.
- **Тело запроса (JSON)**:

```json
{
  "notifications": {
    "updates": {
      "enabled": true
    }
  }
}
```

- **Ответы**:
  - `200` — `{ message: "Notifications updated", notifications: ... }`.
  - `400` — `{ errors: ... }` (валидация `zod`).
  - `401` — `"Authentication required. User identity not found."`.
  - `404` — `"User not found"`.

#### POST /api/user/toggle-shown-bought-favorites

- **Назначение**: включить/выключить отображение купленных избранных товаров.
- **Тело запроса**:

```json
{ "status": true }
```

- **Ответы**:
  - `200` — `{ message, shownBoughtFavorites }`.
  - `400` — `{ errors: ... }`.
  - `401`, `404` как выше.

#### POST /api/user/hidden-section-add
#### POST /api/user/hidden-section-remove

- **Назначение**: добавить/удалить секцию в скрытых.
- **Тело запроса**:

```json
{ "title": "some section name" }
```

- **Ответы**:
  - `200` — `{ message, sections }`.
  - `400` — ошибки валидации.
  - `401`, `404` как выше.

#### POST /api/user/favorite-section-add
#### POST /api/user/favorite-section-remove

- **Назначение**: добавить/удалить секцию в списке избранных секций.
- **Тело запроса**:

```json
{ "title": "some section name" }
```

- **Ответы**:
  - `200` — `{ message, sections }`.
  - `400` — ошибки валидации.
  - `401`, `404` как выше.

#### POST /api/user/favorite-add

- **Назначение**: добавить товар в избранное.
- **Тело запроса**: объект `product` с полями товара (title, link, description, reasons[], price, priceOld, profit, code, image, available, city и т.п.).
- **Ответы**:
  - `200` — `{ message: "Item added to favorites", favorites: [...] }`.
  - `400` — `{ errors: ... }`.
  - `401`, `404` как выше.
  - `409` — `{ message: "Item already in favorites", favorites: [...] }`.

#### POST /api/user/favorite-remove

- **Назначение**: удалить товар из избранного по `link`.
- **Тело запроса**:

```json
{ "link": "https://..." }
```

- **Ответы**:
  - `200` — `{ message: "Item removed from favorites", favorites: [...] }`.
  - `400` — ошибки валидации.
  - `401`, `404` как выше.

#### POST /api/user/change-city

- **Назначение**: сменить город пользователя.
- **Тело запроса**:

```json
{ "city": "samara" }
```

- **Ответы**:
  - `200` — `{ message: "City updated", city: "..." }`.
  - `400` — ошибки валидации.
  - `401`, `404` как выше.

---

## Вебхуки Clerk — /clerk/*

- **Базовый путь**: `/clerk`
- **Назначение**: приём вебхуков от Clerk (создание пользователя, обновление профиля и т.п.).
- **Особенность**:
  - Путь `/clerk/create-user` использует `express.raw({ type: "application/json" })` для корректной валидации подписи вебхука Clerk по необработанному телу.
- **Безопасность**:
  - Проверка подписи вебхука с помощью `CLERK_WEBHOOK_SIGNING_SECRET` (через `svix`), ожидаются заголовки:
    - `svix-id`
    - `svix-timestamp`
    - `svix-signature`
  - При событии `user.created` создаётся запись в коллекции `User`.

---

## Служебные маршруты /service/*

- **Базовый путь**: `/service`
- **Назначение**: внутренние сервисные операции (например, фоновые задачи, служебные триггеры, интеграции и т.п.).
- **Авторизация**:
  - Требуется заголовок `Authorization: Bearer <API_SERVICE_KEY>`.
  - При отсутствии или несоответствии токена возвращается `401 Unauthorized` c телом:
    - `{ "error": "Missing or invalid Authorization header" }` или `{ "error": "Unauthorized Service" }`.

### Прайс-листы и анализ (внутренние)

#### GET /service/all-price-lists

- **Назначение**: получить все прайс-листы по городу (для служебных операций).
- **Параметры query**:
  - `city` (string, required);
  - `limit` (number, optional): ограничение по количеству записей.
- **Ответы**:
  - `200` — список документов `Pricelist[]`.
  - `400` — `"city is required"`.

#### POST /service/delete-last-price-list

- **Назначение**: удалить последний прайс-лист по городу.
- **Тело запроса**:

```json
{ "city": "samara" }
```

- **Ответы**:
  - `200` — без тела.
  - `400` — `"city is required"`.

#### POST /service/add-new-price-list

- **Назначение**: добавить новый прайс-лист.
- **Тело запроса**:
  - `city` (string, required);
  - `positions` (Position[], required).
- **Ответы**:
  - `201` — JSON созданного `Pricelist`.
  - `400` — `"city and positions are required"`.

#### POST /service/insert-analysis-data

- **Назначение**: массовая вставка записей `AnalysisData`.
- **Тело запроса**:

```json
{ "analysisData": [ /* AnalysisDataType */ ] }
```

- **Ответы**:
  - `201` — без тела.
  - `400` — `"analysisData must be a non-empty array"`.

#### POST /service/delete-analysis-data

- **Назначение**: удалить все данные анализа по городу.
- **Тело запроса**:

```json
{ "city": "samara" }
```

- **Ответы**:
  - `200` — без тела.
  - `400` — `"city is required"`.

#### POST /service/delete-analysis-data-by-date

- **Назначение**: удалить данные анализа по городу и дате.
- **Тело запроса**:

```json
{ "city": "samara", "dateAdded": "2024-01-01T00:00:00.000Z" }
```

- **Ответы**:
  - `200` — без тела.
  - `400` — `"city and dateAdded must be non-empty strings"` или `"dateAdded must be a valid date string"`.

#### POST /service/insert-analysis-diff

- **Назначение**: массовая вставка диффов `AnalysisDiff`.
- **Тело запроса**:

```json
{ "diff": [ /* AnalysisDiffType */ ] }
```

- **Ответы**:
  - `201` — без тела.
  - `400` — `"diff must be a non-empty array"`.

#### POST /service/delete-analysis-diff

- **Назначение**: удалить все диффы по городу.
- **Тело запроса**:

```json
{ "city": "samara" }
```

- **Ответы**:
  - `200` — без тела.
  - `400` — `"city is required"`.

#### POST /service/delete-analysis-diff-by-date

- **Назначение**: удалить диффы по городу и дате.
- **Тело запроса**:

```json
{ "city": "samara", "dateAdded": "2024-01-01T00:00:00.000Z" }
```

- **Ответы**:
  - `200` — без тела.
  - `400` — `"city and dateAdded must be non-empty strings"` или `"dateAdded must be a valid date string"`.

#### POST /service/add-analysis-report

- **Назначение**: добавить отчёт анализа.
- **Тело запроса**:

```json
{ "city": "samara", "report": "...", "dateAdded": "2024-01-01T00:00:00.000Z" }
```

- **Ответы**:
  - `200` — без тела.
  - `400` — `"city/report/dateAdded are required"`.

#### POST /service/delete-analysis-report-by-city-date

- **Назначение**: удалить отчёты по городу и дате.
- **Тело запроса**:

```json
{ "city": "samara", "dateAdded": "2024-01-01T00:00:00.000Z" }
```

- **Ответы**:
  - `200` — без тела.
  - `400` — `"city and dateAdded must be non-empty strings"` или `"dateAdded must be a valid date string"`.

### Пользователи (внутреннее) и кэш

#### GET /service/all-notification-users

- **Назначение**: получить пользователей, у которых включены обновления и есть избранное.
- **Параметры query**:
  - `city` (string, required).
- **Ответы**:
  - `200` — массив пользователей с полями `favorites`, `email`, `userId`.
  - `400` — `"city is required"`.

#### POST /service/update-users-favorites

- **Назначение**: массово обновить избранное у списка пользователей.
- **Тело запроса**:

```json
{
  "users": [
    { "userId": "clerk_...", "favorites": [ /* Favorite[] */ ] }
  ]
}
```

- **Ответы**:
  - `200` — без тела.
  - `400` — `"users are required"`.

#### POST /service/clear-cache-by-key

- **Назначение**: удалить ключи кэша по шаблону.
- **Тело запроса**:

```json
{ "keys": "daily:pricelist:*" }
```

- **Ответы**:
  - `200` — без тела.
  - `400` — `"keys is required"`.

---

## Как расширять документацию

1. При добавлении новых эндпоинтов следовать принятой структуре:
   - HTTP-метод и путь.
   - Требуемые заголовки и параметры.
   - Формат тела запроса.
   - Формат успешного ответа и возможные коды ошибок.
2. При изменениях в моделях/типах обновлять описания полей в соответствующих разделах.

