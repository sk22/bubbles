const ASSETS = [
  'assets/1_loading/loading_bg.png',
  'assets/2_game/bubbles/animation/ani_blue_1.png',
  'assets/2_game/bubbles/animation/ani_blue_2.png',
  'assets/2_game/bubbles/animation/ani_blue_3.png',
  'assets/2_game/bubbles/animation/ani_blue_4.png',
  'assets/2_game/bubbles/animation/ani_green_1.png',
  'assets/2_game/bubbles/animation/ani_green_2.png',
  'assets/2_game/bubbles/animation/ani_green_3.png',
  'assets/2_game/bubbles/animation/ani_green_4.png',
  'assets/2_game/bubbles/animation/ani_lightblue_1.png',
  'assets/2_game/bubbles/animation/ani_lightblue_2.png',
  'assets/2_game/bubbles/animation/ani_lightblue_3.png',
  'assets/2_game/bubbles/animation/ani_lightblue_4.png',
  'assets/2_game/bubbles/animation/ani_purple_1.png',
  'assets/2_game/bubbles/animation/ani_purple_2.png',
  'assets/2_game/bubbles/animation/ani_purple_3.png',
  'assets/2_game/bubbles/animation/ani_purple_4.png',
  'assets/2_game/bubbles/animation/ani_red_1.png',
  'assets/2_game/bubbles/animation/ani_red_2.png',
  'assets/2_game/bubbles/animation/ani_red_3.png',
  'assets/2_game/bubbles/animation/ani_red_4.png',
  'assets/2_game/bubbles/animation/ani_yellow_1.png',
  'assets/2_game/bubbles/animation/ani_yellow_2.png',
  'assets/2_game/bubbles/animation/ani_yellow_3.png',
  'assets/2_game/bubbles/animation/ani_yellow_4.png',
  'assets/2_game/bubbles/bubble_blue.png',
  'assets/2_game/bubbles/bubble_green.png',
  'assets/2_game/bubbles/bubble_lightblue.png',
  'assets/2_game/bubbles/bubble_purple.png',
  'assets/2_game/bubbles/bubble_red.png',
  'assets/2_game/bubbles/bubble_yellow.png',
  'assets/2_game/canon.png',
  'assets/2_game/game_bg.png',
  'assets/2_game/levels_ball_empty.png',
  'assets/2_game/menu/btn_help.png',
  'assets/2_game/menu/btn_moregames.png',
  'assets/2_game/menu/btn_restart.png',
  'assets/2_game/menu/btn_sound.png',
  'assets/2_game/menu/btn_top10.png',
  'assets/2_game/menu/novice.png',
  'assets/2_game/menu/score_digit_0.png',
  'assets/2_game/menu/score_digit_1.png',
  'assets/2_game/menu/score_digit_2.png',
  'assets/2_game/menu/score_digit_3.png',
  'assets/2_game/menu/score_digit_4.png',
  'assets/2_game/menu/score_digit_5.png',
  'assets/2_game/menu/score_digit_6.png',
  'assets/2_game/menu/score_digit_7.png',
  'assets/2_game/menu/score_digit_8.png',
  'assets/2_game/menu/score_digit_9.png',
  'assets/2_game/prompts/prompt_button_cancel.png',
  'assets/2_game/prompts/prompt_button_ok.png',
  'assets/2_game/prompts/prompt_enter-name.png',
  'assets/2_game/prompts/prompt_game_over.png',
  'assets/2_game/prompts/prompt_help.png',
  'assets/2_game/prompts/prompt_top10.png',
  'assets/sound/1__sstart.mp3',
  'assets/sound/2__sconnect.mp3',
  'assets/sound/3__sbang.mp3',
  'assets/sound/3__sbang_3.mp3',
  'assets/sound/3__sbang_4.mp3',
  'assets/sound/3__sbang_5.mp3',
  'assets/sound/4__sdown.mp3',
  'assets/sound/5__sgo.mp3',
  'js/src/game.js',
  'js/phaser.min.js'
]

const CACHE = 'bubble-shooter'

self.addEventListener('install', event => {
	console.log('The service worker is being installed.')
	event.waitUntil(precache())
})

self.addEventListener('fetch', event => {
	console.log('The service worker is serving the asset.')
	event.respondWith(fromCache(event.request))
	evt.waitUntil(update(event.request))
})

async function precache() {
	const cache = await caches.open(CACHE)
  return await cache.addAll(ASSETS)
}

async function fromCache(request) {
  const cache = await caches.open(CACHE)
  const matching = await cache.match(request)
  return matching || Promise.reject('no-match')
}

async function update(request) {
  const cache = await caches.open(CACHE)
  const response = await fetch(request)
  return await cache.put(request, response)
}
