import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import './style.css'
import Home from './views/Home.vue';
import GameRoom from './components/GameRoom.vue'
import App from './App.vue'

const routes = [
    { path: '/', component: Home }, // Главная для создания игры
    { path: '/game/:id', component: GameRoom, props: true }
];
const router = createRouter({
    history: createWebHistory(),
    routes,
})

createApp(App).use(router).mount('#app')
