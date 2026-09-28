# Tarea para Rafa: sacar "Co-Authored-By: Claude" de 6 commits

Tengo 6 commits míos en el repo Kinetix (main) que traen el trailer
"Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>" en el mensaje,
por eso GitHub muestra a Claude como colaborador. Quiero sacarlos.

Los commits son (hashes actuales, van a cambiar tras el rebase):
- 8fd636f4e9d7f3cb4b3d8ab1636965e3a0bef846
- a4bd7b377063b7e7b13bdc01c3fe6b0a1583ebad
- c812fce52978e058dfbdeda0b563f5bed169273b
- 2b1df2e28cfd5bb6699f290e3896a4baa2a09ef1
- f08b83cea9a5b7463277ede1de46f2c5afb37911
- cda5df166f99ce942d31a088cfdfa9ea1216fcd4

El más viejo (8fd636f) está casi al principio del historial de main, así que
esto va a reescribir todos los commits desde ahí hasta HEAD (hashes van a
cambiar para ~30 commits, incluidos los que no son míos).

Necesito que:
1. Antes de tocar nada, confirmes conmigo el estado de git (git status) y
   verifiques que no tengo cambios sin commitear ni ramas locales con trabajo
   basado en el main actual que se puedan perder.
2. Hagas un rebase interactivo desde el padre de 8fd636f4e9d7f3cb4b3d8ab1636965e3a0bef846
   hasta HEAD, y en cada uno de esos 6 commits saques únicamente la línea
   "Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>" del mensaje
   (dejando el resto del mensaje intacto).
3. Verifiques que el diff de contenido de cada commit no cambió (solo el
   mensaje), y que el resto de los commits (los que no tienen ese trailer)
   quedaron con el mismo contenido, solo con hash nuevo por el efecto cascada.
4. Me muestres el resultado (git log) antes de pushear nada.
5. Una vez que confirme, hagas git push --force-with-lease a origin/main.

Después de esto le voy a avisar a mi compañero Tomás para que resetee su
copia local (el historial de main cambió). No hagas el force-push sin mi
confirmación explícita en el paso 4.
