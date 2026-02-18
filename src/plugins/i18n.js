import { createI18n } from 'vue-i18n'

const messages = {
  en: {
    menu: {
      title: 'HEXLASH',
      subtitle: 'Enter the arena',
      play: 'FIGHT',
      settings: 'Settings',
    },
    game: {
      score: 'Score',
      health: 'Health',
      round: 'Round',
      hit: 'HIT!',
      ko: 'K.O.!',
      restart: 'Fight Again',
      back: 'Back to Menu',
    },
  },
  ru: {
    menu: {
      title: 'HEXLASH',
      subtitle: 'Выйди на арену',
      play: 'В БОЙ',
      settings: 'Настройки',
    },
    game: {
      score: 'Счёт',
      health: 'Здоровье',
      round: 'Раунд',
      hit: 'УДАР!',
      ko: 'Нокаут!',
      restart: 'Ещё раз',
      back: 'В меню',
    },
  },
}

export default createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages,
})
