<template>
    <div class="min-h-screen bg-slate-900 text-slate-100 p-4 font-sans">
      <!-- Header -->
      <div class="max-w-4xl mx-auto flex flex-wrap justify-between items-center bg-slate-800 p-4 rounded-xl shadow-2xl mb-6">
        <div>
          <h1 class="text-2xl font-black text-amber-500 uppercase tracking-wider">Petteia Online</h1>
          <p class="text-xs text-slate-400">ID: {{ gameId }}</p>
        </div>
        
        <div class="flex gap-4 items-center">
          <div class="text-right">
            <p class="text-sm font-bold" :class="turn === 'white' ? 'text-white' : 'text-amber-600'">
              Ход: {{ turn === 'white' ? 'БЕЛЫЕ' : 'ЧЕРНЫЕ' }}
            </p>
            <p class="text-[10px] uppercase tracking-tighter text-slate-500">
              Вы: {{ playerColor === 'spectator' ? 'Наблюдатель' : playerColor }}
            </p>
          </div>
          <button @click="copyLink" class="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg text-sm transition-all active:scale-95">
            Пригласить друга
          </button>
        </div>
      </div>
  
      <div class="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Игровое поле -->
        <div class="lg:col-span-2 flex justify-center">
          <div class="grid grid-cols-8 grid-rows-8 bg-slate-700 border-[12px] border-slate-800 rounded shadow-inner ring-4 ring-slate-800/50">
            <div v-for="(cell, i) in board" :key="i"
                 @click="handleTileClick(i)"
                 class="w-10 h-10 sm:w-14 sm:h-14 border border-slate-600/30 flex items-center justify-center cursor-pointer relative"
                 :class="[(Math.floor(i/8) + i%8) % 2 === 0 ? 'bg-slate-700' : 'bg-slate-700/50']">
              
              <!-- Фигура -->
              <div v-if="cell" 
                   class="w-8 h-8 sm:w-11 sm:h-11 rounded-full shadow-2xl transition-all duration-300 transform"
                   :class="[
                     cell === 'white' ? 'bg-white shadow-white/20' : 'bg-zinc-900 border border-slate-700 shadow-black/50',
                     selectedTile === i ? 'scale-110 ring-4 ring-amber-400 rotate-12' : ''
                   ]">
              </div>
  
              <!-- Точки для хода -->
              <div v-if="selectedTile !== null && isValidMove(selectedTile, i)" 
                   class="absolute w-3 h-3 bg-amber-400/40 rounded-full"></div>
            </div>
          </div>
        </div>
  
        <!-- Боковая панель: Статистика и Чат -->
        <div class="space-y-6">
          <div class="bg-slate-800 p-4 rounded-xl">
            <h2 class="text-sm font-bold mb-3 text-slate-400 uppercase">Фигуры на доске</h2>
            <div class="flex justify-around text-2xl">
              <div class="flex items-center gap-2">⚪ {{ counts.white }}</div>
              <div class="flex items-center gap-2">⚫ {{ counts.black }}</div>
            </div>
          </div>
  
          <!-- Мини-чат -->
          <div class="bg-slate-800 rounded-xl flex flex-col h-64">
            <div class="p-3 border-b border-slate-700 text-xs font-bold text-slate-500 uppercase">Чат</div>
            <div class="flex-1 overflow-y-auto p-3 space-y-2 text-sm" id="chatbox">
              <div v-for="msg in messages" :key="msg.time" class="break-words">
                <span :class="msg.color === 'white' ? 'text-slate-100' : 'text-amber-500'" class="font-bold">
                  {{ msg.color }}:
                </span> {{ msg.text }}
              </div>
            </div>
            <input @keyup.enter="sendMessage" v-model="newMessage" placeholder="Сообщение..." 
                   class="bg-slate-900 border-none p-3 text-sm focus:ring-2 ring-amber-500 outline-none rounded-b-xl" />
          </div>
        </div>
      </div>
  
      <!-- Modal Победы -->
      <div v-if="gameOver" class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div class="bg-slate-800 p-10 rounded-2xl text-center border-2 border-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.3)]">
          <h2 class="text-4xl font-black mb-4">КОНЕЦ ИГРЫ</h2>
          <p class="text-xl mb-6">{{ gameOver }}</p>
          <button @click="resetGame" class="bg-amber-600 px-8 py-3 rounded-full font-bold hover:bg-amber-500 transition">Новая партия</button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, computed } from 'vue';
  import { useRoute } from 'vue-router';
  import { db } from '../firebase.js';
  import { ref as dbRef, onValue, set, update, push, get } from 'firebase/database';
  
  const route = useRoute();
  const gameId = route.params.id;
  
  // Состояние
  const board = ref(Array(64).fill(null));
  const turn = ref('white');
  const playerColor = ref('spectator');
  const selectedTile = ref(null);
  const gameOver = ref(null);
  const messages = ref([]);
  const newMessage = ref("");
  
  const gameRef = dbRef(db, `games/${gameId}`);
  
  onMounted(async () => {
    // 1. Определение роли (цвета)
    const playersRef = dbRef(db, `games/${gameId}/players`);
    const snap = await get(playersRef);
    const p = snap.val() || {};
  
    if (!p.white) {
      await update(playersRef, { white: true });
      playerColor.value = 'white';
    } else if (!p.black) {
      await update(playersRef, { black: true });
      playerColor.value = 'black';
    }
  
    // 2. Слушаем изменения базы
    onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        board.value = data.board || initBoard();
        turn.value = data.turn || 'white';
        messages.value = data.chat ? Object.values(data.chat) : [];
        checkWin();
      } else {
        resetGame();
      }
    });
  });
  
  const initBoard = () => {
    const b = Array(64).fill(null);
    for (let i = 0; i < 16; i++) b[i] = 'black';
    for (let i = 48; i < 64; i++) b[i] = 'white';
    return b;
  };
  
  // Проверка хода ладьи
  const isValidMove = (from, to) => {
    if (board.value[to]) return false;
    const r1 = Math.floor(from / 8), c1 = from % 8;
    const r2 = Math.floor(to / 8), c2 = to % 8;
    if (r1 !== r2 && c1 !== c2) return false;
  
    const step = r1 === r2 ? (to > from ? 1 : -1) : (to > from ? 8 : -8);
    for (let i = from + step; i !== to; i += step) {
      if (board.value[i]) return false;
    }
    return true;
  };
  
  // Захват
  const handleCaptures = (pos, color) => {
    const opponent = color === 'white' ? 'black' : 'white';
    const dirs = [1, -1, 8, -8];
    let captured = false;
  
    dirs.forEach(d => {
      const enemy = pos + d;
      const ally = pos + d * 2;
      // Проверка границ
      if (enemy < 0 || enemy >= 64 || ally < 0 || ally >= 64) return;
      if (Math.abs(d) === 1 && Math.floor(pos/8) !== Math.floor(enemy/8)) return;
  
      if (board.value[enemy] === opponent && board.value[ally] === color) {
        board.value[enemy] = null;
        captured = true;
      }
    });
    return captured;
  };
  
  const handleTileClick = async (i) => {
    if (turn.value !== playerColor.value) return;
  
    if (board.value[i] === playerColor.value) {
      selectedTile.value = i;
    } else if (selectedTile.value !== null && isValidMove(selectedTile.value, i)) {
      const b = [...board.value];
      b[i] = playerColor.value;
      b[selectedTile.value] = null;
      
      board.value = b;
      const hasCaptured = handleCaptures(i, playerColor.value);
      const nextTurn = hasCaptured ? playerColor.value : (playerColor.value === 'white' ? 'black' : 'white');
      
      await update(gameRef, { board: board.value, turn: nextTurn });
      selectedTile.value = null;
    }
  };
  
  const sendMessage = () => {
    if (!newMessage.value) return;
    push(dbRef(db, `games/${gameId}/chat`), {
      text: newMessage.value,
      color: playerColor.value,
      time: Date.now()
    });
    newMessage.value = "";
  };
  
  const counts = computed(() => {
    return board.value.reduce((a, c) => { if(c) a[c]++; return a; }, {white:0, black:0});
  });
  
  const checkWin = () => {
    if (counts.value.white === 0) gameOver.value = "ЧЕРНЫЕ ПОБЕДИЛИ!";
    if (counts.value.black === 0) gameOver.value = "БЕЛЫЕ ПОБЕДИЛИ!";
  };
  
  const resetGame = () => {
    set(gameRef, { board: initBoard(), turn: 'white', players: {white: true, black: !!(playerColor.value === 'black')} });
    gameOver.value = null;
  };
  
  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Ссылка скопирована!");
  };
  </script>
  