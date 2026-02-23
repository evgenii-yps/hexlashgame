# Hexlash — AI Battle Demo

Прототип боевой системы для демонстрации Nick Samarin (OWB).

## Механика
- **Автоматический бой** — аватар дерётся сам (one-finger control)
- **Кубик судьбы** — каждые 7 сек бросок, предмет появляется на 3 сек
- **Manual Override** — тап в ключевой момент для мощного удара
- **NFT модули** — превью системы слотов (Berserker, Fortress, Phantom)
- **ИИ-тренер** — превью аналитики Claude API после боя

## Деплой на Vercel (2 минуты)

### Вариант 1 — через GitHub:
1. Запушить этот проект в отдельный репо
2. Зайти на vercel.com → New Project → Import Git Repository
3. Vercel автоматически определит Vite и задеплоит
4. Подключить домен demo.hexlash.com

### Вариант 2 — через CLI:
```bash
npm i -g vercel
cd hexlash-demo
vercel
```

## Локальный запуск
```bash
npm install
npm run dev
```
