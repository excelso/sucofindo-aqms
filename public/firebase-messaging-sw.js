importScripts('https://www.gstatic.com/firebasejs/8.2.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.2.0/firebase-messaging.js');

firebase.initializeApp({
    apiKey: "AIzaSyCiWzilxK0LfC-NfzoaiUt6Fh5-fguQCpE",
    authDomain: "sparingberau.firebaseapp.com",
    projectId: "sparingberau",
    storageBucket: "sparingberau.firebasestorage.app",
    messagingSenderId: "340771933723",
    appId: "1:340771933723:web:692ba915d2a922a3f972be",
    measurementId: "G-2Y1631LCHJ"
})
const messaging = firebase.messaging();
messaging.onBackgroundMessage(function(payload) {
    self.clients.matchAll({includeUncontrolled: true}).then(clients => {
        clients.forEach(client => {
            client.postMessage(payload)
        })
    })
});
