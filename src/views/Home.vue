<template>
    <div class="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div class="max-w-md w-full bg-slate-800 p-8 rounded-2xl shadow-2xl text-center border border-slate-700">
        <h1 class="text-4xl font-black text-amber-500 mb-2 uppercase tracking-tighter">Petteia</h1>
        <p class="text-slate-400 mb-8 text-sm">Древнегреческая стратегия в реальном времени</p>
        
        <button @click="createNewGame" 
                class="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-4 rounded-xl transition-all transform active:scale-95 shadow-lg shadow-amber-900/20">
          СОЗДАТЬ НОВУЮ ИГРУ
        </button>
  
        <div class="mt-6 pt-6 border-t border-slate-700">
          <p class="text-xs text-slate-500 italic">
            Создайте комнату и отправьте ссылку другу, чтобы начать битву.
          </p>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { useRouter } from 'vue-router';
  
  const router = useRouter();
  
  const createNewGame = () => {
    // Генерация короткого ID (например: xk3-92j)
    const gameId = Math.random().toString(36).substring(2, 5) + '-' + Math.random().toString(36).substring(2, 5);
    router.push(`/game/${gameId}`);
  };
  </script>
  