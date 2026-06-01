import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // 🔥 Adicionado

// Suas credenciais oficiais do Firebase
export const firebaseConfig = {
  apiKey: "AIzaSyCIuapKGogC5NkkME4REZkGLjYPO9i6oSw",
  authDomain: "inventario-ti-app.firebaseapp.com",
  projectId: "inventario-ti-app",
  storageBucket: "inventario-ti-app.firebasestorage.app",
  messagingSenderId: "1061345214193",
  appId: "1:1061345214193:web:79704bee9f3aa8a3a0b350"
};

// Inicializa o Firebase App
const app = initializeApp(firebaseConfig);

// Exporta as instâncias prontas para o resto do aplicativo usar
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); // 🔥 Exportado para uso com fotos
