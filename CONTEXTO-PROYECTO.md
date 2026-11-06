# Proyecto: Mazmorra cooperativa (videojuego HTML)

Pega este documento como instrucciones del proyecto (o como primer mensaje) en la nueva cuenta y sube los dos archivos HTML como archivos del proyecto.

## Qué es
Videojuego de navegador en HTML: acción cooperativa con vista semicenital (tres cuartos), de sala en sala con encuentros aleatorios estilo roguelike, multijugador local para hasta 4 personas a la vez.

## Decisiones tomadas
- Multijugador **local** (no online): una sola pantalla, todos en la misma sala; las puertas se abren al limpiar la sala.
- Se empezó con un prototipo mínimo con formas gráficas simples (sin sprites).
- Todo está en un único archivo HTML con Canvas 2D programado a mano, sin motor.
- Flujo de trabajo: pedir ajustes y features en el chat, publicar como artifact y probar al momento en el móvil.

## Archivos
1. **mazmorra-coop.html**: el prototipo jugable (≈257 kB).
   - 8 personajes en 4 roles: Ceniza (tanque defensor), Musgo (tanque mago), Escarcha (ágil, escarcha), Coral (ágil, ráfaga), Brasa (brawler ejecutor), Ámbar (brawler ninja), Marea (tirador, rebote), Ciruela (tirador, torreta).
   - Enemigos por tiers: mite y slime (T1), charger y shooter (T2), golem y splitter (T3), guardián del piso (T4).
   - Sistemas: vida y estamina de enemigos, aturdimiento y ejecuciones, lanzar enemigos por los aires y rematarlos (juggle), bloqueo con bloqueo perfecto, hitstop/hitstun, búfer de entrada, rescate de compañeros caídos (fantasma si se agota el tiempo), aliado IA, habilidades 1 y 2 y ataques cargados.
   - Entradas: Teclado A, Teclado B, táctil y hasta 4 mandos (Gamepad API). Menú de pausa con guía de controles y modo de prueba.
   - Ajustes recientes: enemigos con ×4,4 de vida y ×2 de estamina; en partidas con varios humanos, cada jugador extra suma un 50 % de vida a los enemigos (MULTI_HP_MUL = 0.5) para premiar combos (lanzar, rematar en el aire, ejecutar). El modo «1 + IA» cuenta como un jugador.
   - Las constantes de balance están agrupadas al principio del script (ENEMY, AB, CHARGED, BASE_STATS, REVIVE…).
2. **laboratorio-coop.html**: banco de pruebas con 8 mecánicas coop jugables (levantar al caído, cuerda de energía, congelar y romper, placas simultáneas, escudo y tirador, lanzar al compañero, cámara compartida, golpe sincronizado), con notas de diseño de cada una.

## Siguiente paso que se estaba valorando
- Seguir en web pero con más estructura: **Phaser 3** (recomendado), primero dentro de un solo HTML cargado desde CDN para mantener el flujo rápido de probar en el móvil; cuando el archivo pese demasiado, pasar a **Claude Code** con un proyecto Vite + TypeScript conectado a GitHub y desplegado en GitHub Pages/Netlify/Vercel.
- Alternativa considerada: Godot (editor visual, exporta a web).
- Para 4 jugadores locales hacen falta mandos (el teclado compartido da para 2). En el móvil se pueden emparejar mandos Bluetooth.
- Pendiente de decidir: portar el laboratorio a Phaser o arrancar directamente con una primera sala jugable.
