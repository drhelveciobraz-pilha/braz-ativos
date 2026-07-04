# Braz Ativos — Frontend (PWA) — Pacote pronto

Estrutura Vite + React já com manifest corrigido e ícones. Faltam só 2 arquivos seus.

## O que JÁ está pronto neste pacote
- index.html, package.json, vite.config.js
- src/main.jsx
- public/manifest.json  (nome "Braz Ativos", acentos corretos)
- public/icons/icon-192.png e icon-512.png  (ícone Braz Ativos)

## O que VOCÊ precisa encaixar (2 arquivos)

1. **App:** copie seu `06_app_projeto-ativos.jsx`, renomeie para **App.jsx**
   e coloque em **src/App.jsx**.

2. **Service worker:** copie seu `08_service-worker.js`, renomeie para
   **service-worker.js** e coloque em **public/service-worker.js**.

(O 07_manifest.json antigo NÃO precisa — já usamos o corrigido.)

## Estrutura final

```
braz-ativos/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.jsx
│   └── App.jsx              <-- seu 06 renomeado
└── public/
    ├── manifest.json        (pronto)
    ├── service-worker.js    <-- seu 08 renomeado
    └── icons/
        ├── icon-192.png     (pronto)
        └── icon-512.png     (pronto)
```

## NUNCA colocar aqui (segurança — repo é público)
- chaves.env
- vapid_keys.json
- arquivos do backend (02_backend..., .bat)

## Publicar na Vercel
- Framework: Vite
- Build command: npm run build
- Output directory: dist
