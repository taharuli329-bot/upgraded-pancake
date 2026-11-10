# ULTIMATE 3D CARROM ARENA

A mobile-friendly 3D cartoon-style carrom web-game prototype built with HTML, CSS, JavaScript and Three.js.

## Run on Android
1. Extract the ZIP.
2. Upload the folder to GitHub, or open `index.html` using a local web server app.
3. For easiest hosting, create a GitHub repository and upload `index.html`, `style.css`, and `game.js`.
4. In GitHub: Settings → Pages → Deploy from a branch → `main` → `/root`.
5. Open the published HTTPS link in Chrome.

## Controls
- Choose VS Computer, Local 1 VS 1, or Practice.
- Press Play Now.
- Touch/drag from the striker backwards to aim.
- Set shot power using the slider.
- Release to shoot, or press STRIKE after aiming.
- Reset starts a fresh board.

## Important project status
This is a playable browser prototype with a 3D board, 3D coins, touch aiming, power control, basic collision physics, pockets, score, turn switching, a simple computer shot, and practice/local modes.

It is NOT yet a production online multiplayer game. Real internet multiplayer needs a backend (for example, Node.js + WebSocket/Socket.IO), server-authoritative turns, matchmaking, accounts, anti-cheat, and persistent profiles. Tournament, shop, rewards, and leaderboards are UI/product roadmap items, not connected services in this starter build.

## Technical notes
- Three.js is loaded from jsDelivr CDN, so the first launch needs an internet connection.
- This project is original and uses generic carrom-inspired visuals; it does not include Carrom Pool's proprietary artwork, branding, or source code.
- Mobile performance depends on the phone and browser. Use a modern browser with WebGL enabled.
