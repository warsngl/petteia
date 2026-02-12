<template>
  <div class="min-h-screen bg-slate-900 text-slate-100 p-4 font-sans flex flex-col items-center justify-center">

    <!-- Заголовок и Инфо-панель -->
    <div
      class="max-w-4xl w-full flex flex-wrap justify-between items-center bg-slate-800 p-6 rounded-2xl shadow-2xl mb-6 border border-slate-700">
      <div>
        <h1 class="text-3xl font-black text-amber-500 uppercase tracking-tighter">Petteia Online</h1>
        <p class="text-[10px] text-slate-500 font-mono mt-1">ROOM ID: {{ gameId }}</p>
      </div>

      <div class="flex gap-6 items-center">
        <!-- Статус ходов -->
        <div class="flex gap-4">
          <div class="flex flex-col items-center">
            <div class="w-2 h-2 rounded-full mb-1"
              :class="gameState.turn === 'white' ? 'bg-white animate-pulse shadow-[0_0_8px_white]' : 'bg-slate-700'">
            </div>
            <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Белые</span>
          </div>
          <div class="flex flex-col items-center">
            <div class="w-2 h-2 rounded-full mb-1"
              :class="gameState.turn === 'black' ? 'bg-amber-500 animate-pulse shadow-[0_0_8px_orange]' : 'bg-slate-700'">
            </div>
            <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Черные</span>
          </div>
        </div>

        <div class="h-10 w-[1px] bg-slate-700"></div>

        <!-- Кнопка приглашения -->
        <div v-if="!gameState.playerBlack && playerRole === 'white'"
          class="flex gap-2 bg-slate-900 p-1 rounded-xl border border-slate-700">
          <input readonly :value="shareLink"
            class="bg-transparent text-[10px] px-3 py-2 w-32 outline-none text-slate-400 font-mono" />
          <button @click="copyLink"
            class="bg-amber-600 hover:bg-amber-500 text-white px-3 py-1 rounded-lg text-xs transition-all active:scale-95">
            {{ copied ? 'ГОТОВО' : 'ССЫЛКА' }}
          </button>
        </div>
        <div v-else class="text-right">
          <p class="text-xs font-bold text-amber-500 uppercase tracking-widest">
            ВЫ: {{ playerRole === 'Spectator' ? 'ЗРИТЕЛЬ' : (playerRole === 'white' ? 'БЕЛЫЕ' : 'ЧЕРНЫЕ') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Игровое пространство -->
    <div class="relative group"
      :class="{ 'opacity-50 pointer-events-none': gameState.turn !== playerRole && !gameState.winner }">
      <!-- Сетка (Фон) -->
      <div
        class="grid grid-cols-8 grid-rows-8 bg-slate-800 border-[12px] border-slate-800 rounded shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
        <div v-for="i in 64" :key="'cell-' + i" @click="handleTileClick(i - 1)"
          class="w-10 h-10 sm:w-14 sm:h-14 border border-slate-700/30 flex items-center justify-center cursor-pointer transition-colors"
          :class="[(Math.floor((i - 1) / 8) + (i - 1) % 8) % 2 === 0 ? 'bg-slate-700' : 'bg-slate-700/60',
          selectedTile === (i - 1) ? 'bg-amber-500/10' : '']">

          <!-- Точки-подсказки для хода -->
          <div v-if="selectedTile !== null && isValidMove(selectedTile, i - 1)"
            class="w-3 h-3 bg-amber-500/20 rounded-full border border-amber-500/40"></div>
        </div>

        <!-- Слой фигур (Анимированный) -->
        <TransitionGroup name="piece">
          <div v-for="piece in activePieces" :key="piece.id" @click.stop="handleTileClick(piece.index)"
            class="absolute w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center transition-all duration-500 ease-in-out cursor-pointer z-10"
            :style="getPieceStyle(piece.index)">

            <div class="w-8 h-8 sm:w-11 sm:h-11 rounded-full shadow-2xl transform transition-all duration-300" :class="[
              piece.color === 'white' ? 'bg-slate-100 shadow-white/10' : 'bg-zinc-950 border border-slate-800 shadow-black/50',
              selectedTile === piece.index ? 'scale-110 ring-4 ring-amber-500 rotate-12 z-20' : ''
            ]">
              <!-- Внутренний декор фигур -->
              <div class="w-full h-full rounded-full border-4 opacity-10"
                :class="piece.color === 'white' ? 'border-slate-400' : 'border-slate-200'"></div>
            </div>
          </div>
        </TransitionGroup>
      </div>

      <!-- Оверлей "Не ваш ход" -->
      <div v-if="gameState.turn !== playerRole && !gameState.winner"
        class="absolute -top-4 -right-4 bg-slate-900 border border-slate-700 px-3 py-1 rounded-full text-[10px] font-bold text-slate-500 z-30 shadow-xl">
        ОЖИДАНИЕ ХОДА...
      </div>
    </div>

    <!-- Модальное окно победы -->
    <Transition name="fade">
      <div v-if="gameState.winner"
        class="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center z-50 p-6">
        <div
          class="bg-slate-800 p-12 rounded-3xl text-center border border-amber-500/30 shadow-[0_0_100px_rgba(245,158,11,0.2)] max-w-sm w-full">
          <h2 class="text-5xl font-black mb-2 text-amber-500 uppercase tracking-tighter">Победа!</h2>
          <p class="text-slate-400 mb-8 font-medium italic">
            {{ gameState.winner === 'white' ? 'Армия Белых' : 'Армия Черных' }} захватила поле боя
          </p>
          <button @click="resetGame"
            class="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg active:scale-95">
            ИГРАТЬ СНОВА
          </button>
        </div>
      </div>
    </Transition>

    <!-- Счетчики -->
    <div class="mt-8 flex gap-8">
      <div class="text-center">
        <p class="text-[10px] uppercase text-slate-500 tracking-[0.2em] mb-1">Потери Черных</p>
        <div class="flex gap-1">
          <div v-for="i in (16 - counts.black)" :key="i" class="w-2 h-2 rounded-full bg-zinc-950 opacity-40"></div>
        </div>
      </div>
      <div class="text-center">
        <p class="text-[10px] uppercase text-slate-500 tracking-[0.2em] mb-1">Потери Белых</p>
        <div class="flex gap-1">
          <div v-for="i in (16 - counts.white)" :key="i" class="w-2 h-2 rounded-full bg-white opacity-40"></div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { reactive, onMounted, ref, computed } from 'vue';
import { db, auth, signInAnonymously } from './firebase';
import { ref as dbRef, onValue, set, update } from 'firebase/database';

// 1. Идентификация
const getGameId = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get('room');
  if (roomId) return roomId;
  return `petteia-${Math.random().toString(36).substring(7)}`;
};

const gameId = getGameId();
const gameRef = dbRef(db, `games/${gameId}`);
const shareLink = window.location.origin + window.location.pathname + '?room=' + gameId;
const copied = ref(false);

const playerUid = ref(null);
const playerRole = ref(null);
const selectedTile = ref(null);

const gameState = reactive({
  board: Array(64).fill(null),
  turn: 'white',
  playerWhite: "",
  playerBlack: "",
  winner: ""
});

// 2. Инициализация
onMounted(async () => {
  const userCredential = await signInAnonymously(auth);
  playerUid.value = userCredential.user.uid;

  onValue(gameRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      if (data.playerWhite === playerUid.value) playerRole.value = 'white';
      else if (data.playerBlack === playerUid.value) playerRole.value = 'black';
      else if (!data.playerBlack) {
        playerRole.value = 'black';
        update(gameRef, { playerBlack: playerUid.value });
      } else playerRole.value = 'Spectator';

      gameState.board = safeBoard(data.board);
      gameState.turn = data.turn;
      gameState.winner = data.winner;
      gameState.playerWhite = data.playerWhite;
      gameState.playerBlack = data.playerBlack;
    } else {
      resetGame();
    }
  });
});

// 3. Логика ходов
const initBoard = () => {
  const b = Array(64).fill(null);
  for (let i = 0; i < 16; i++) b[i] = 'black';
  for (let i = 48; i < 64; i++) b[i] = 'white';
  return b;
};

const isValidMove = (from, to) => {
  if (gameState.board[to]) return false;
  const r1 = Math.floor(from / 8), c1 = from % 8;
  const r2 = Math.floor(to / 8), c2 = to % 8;
  if (r1 !== r2 && c1 !== c2) return false;
  const step = r1 === r2 ? (to > from ? 1 : -1) : (to > from ? 8 : -8);
  for (let i = from + step; i !== to; i += step) if (gameState.board[i]) return false;
  return true;
};

const handleTileClick = async (i) => {
  if (playerRole.value !== gameState.turn || gameState.winner) return;

  if (gameState.board[i] === playerRole.value) {
    selectedTile.value = i;
  } else if (selectedTile.value !== null && isValidMove(selectedTile.value, i)) {
    const newBoard = JSON.parse(JSON.stringify(gameState.board));
    newBoard[i] = playerRole.value;
    newBoard[selectedTile.value] = null;

    const hasCaptured = checkCaptures(newBoard, i, playerRole.value);
    const win = checkWin(newBoard);

    await update(gameRef, {
      board: newBoard,
      turn: (hasCaptured && !win) ? playerRole.value : (playerRole.value === 'white' ? 'black' : 'white'),
      winner: win
    });
    selectedTile.value = null;
  }
};

const checkCaptures = (b, pos, color) => {
  const opponent = color === 'white' ? 'black' : 'white';
  const dirs = [1, -1, 8, -8];
  let captured = false;
  dirs.forEach(d => {
    const enemy = pos + d, ally = pos + d * 2;
    if (enemy < 0 || enemy >= 64 || ally < 0 || ally >= 64) return;
    if (Math.abs(d) === 1 && Math.floor(pos / 8) !== Math.floor(enemy / 8)) return;
    if (b[enemy] === opponent && b[ally] === color) { b[enemy] = null; captured = true; }
  });
  return captured;
};

const checkWin = (b) => {
  const counts = b.reduce((a, c) => { if (c) a[c]++; return a; }, { white: 0, black: 0 });
  if (counts.white === 0) return 'black';
  if (counts.black === 0) return 'white';
  return "";
};

const resetGame = () => {
  set(gameRef, {
    board: initBoard(),
    turn: 'white',
    playerWhite: playerUid.value,
    playerBlack: "",
    winner: ""
  });
};

// 4. Стили и Анимация
const activePieces = computed(() => {
  return gameState.board.map((color, index) => ({ color, index }))
    .filter(p => p.color)
    .map(p => ({ ...p, id: `piece-${p.index < 16 && p.color === 'black' ? 'b' : 'w'}-${p.index}` }));
});

const getPieceStyle = (i) => ({
  top: `${Math.floor(i / 8) * 12.5}%`,
  left: `${(i % 8) * 12.5}%`
});

const counts = computed(() => {
  return gameState.board.reduce((a, c) => { if (c) a[c]++; return a; }, { white: 0, black: 0 });
});

const copyLink = () => {
  navigator.clipboard.writeText(shareLink);
  copied.value = true;
  setTimeout(() => copied.value = false, 2000);
};
const safeBoard = (b) => {
  if (!Array.isArray(b)) {
    const arr = Array(64).fill(null);
    Object.entries(b).forEach(([key, value]) => {
      arr[parseInt(key)] = value;
    });
    return arr;
  }
  return b;
}
</script>

<style scoped>
/* Анимации FLIP */
.piece-move {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.piece-enter-active,
.piece-leave-active {
  transition: all 0.4s ease;
}

.piece-enter-from,
.piece-leave-to {
  opacity: 0;
  transform: scale(0) rotate(-45deg);
}

.piece-leave-active {
  position: absolute;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
