/* ============================================================
   PROJETO ATIVOS — SERVICE WORKER
   Faz duas coisas essenciais para o PWA:
   1) recebe notificações Web Push (mesmo com o app fechado)
   2) permite que o app seja "instalado" na tela de início
   ============================================================ */

const CACHE = "projeto-ativos-v1";

// instala e guarda o essencial para abrir offline
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(["/", "/index.html", "/manifest.json"]))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((chaves) =>
      Promise.all(chaves.filter((c) => c !== CACHE).map((c) => caches.delete(c)))
    )
  );
  self.clients.claim();
});

// rede primeiro, cache como reserva (dados de mercado precisam ser frescos)
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// ---- NOTIFICAÇÃO PUSH ----
self.addEventListener("push", (event) => {
  let dados = { title: "Projeto Ativos", body: "Novo alerta no radar." };
  try {
    if (event.data) dados = event.data.json();
  } catch (e) {
    if (event.data) dados.body = event.data.text();
  }

  const opcoes = {
    body: dados.body,
    icon: "/icons/icon-192.png",
    badge: "/icons/badge.png",
    vibrate: [120, 60, 120],
    tag: dados.tag || "alerta-mercado",
    data: { url: dados.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(dados.title, opcoes));
});

// ao tocar na notificação, abre (ou foca) o app
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destino = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((janelas) => {
      for (const j of janelas) {
        if (j.url.includes(destino) && "focus" in j) return j.focus();
      }
      if (clients.openWindow) return clients.openWindow(destino);
    })
  );
});
