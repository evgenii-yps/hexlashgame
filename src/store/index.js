import { createStore } from 'vuex'

export default createStore({
  state: {
    playerName: 'Fighter',
    score: 0,
    health: 100,
    round: 1,
    gameStarted: false,
  },
  mutations: {
    SET_PLAYER_NAME(state, name) {
      state.playerName = name
    },
    ADD_SCORE(state, points) {
      state.score += points
    },
    SET_HEALTH(state, health) {
      state.health = Math.max(0, Math.min(100, health))
    },
    SET_ROUND(state, round) {
      state.round = round
    },
    SET_GAME_STARTED(state, started) {
      state.gameStarted = started
    },
    RESET_GAME(state) {
      state.score = 0
      state.health = 100
      state.round = 1
      state.gameStarted = false
    },
  },
  actions: {
    startGame({ commit }) {
      commit('RESET_GAME')
      commit('SET_GAME_STARTED', true)
    },
    hit({ commit, state }, damage) {
      commit('ADD_SCORE', damage * 10)
      commit('SET_HEALTH', state.health - damage)
    },
  },
  getters: {
    isGameOver: (state) => state.health <= 0,
  },
})
