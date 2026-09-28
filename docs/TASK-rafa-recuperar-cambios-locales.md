# Tarea para Rafa: recuperar cambios locales después del rewrite de main

Reescribí el historial de main para sacar el trailer de Claude de 6 commits
y hice force-push. Tu copia local de main quedó basada en el historial
viejo. Si tenés cambios o commits locales sin pushear, NO hagas un
`git reset --hard origin/main` directo — los perdés. Seguí esto:

1. Primero, sin tocar nada, mirá qué tenés:
   ```
   git status
   git log --oneline origin/main..HEAD
   ```
   (esto todavía compara contra tu copia vieja de origin/main, antes de fetchear)

2. Si `git status` muestra cambios sin commitear que querés conservar:
   ```
   git stash push -u -m "cambios antes del rewrite"
   ```

3. Si `git log --oneline origin/main..HEAD` lista commits tuyos (locales,
   nunca pusheados), guardá una rama de respaldo apuntando a tu HEAD actual
   antes de tocar nada más:
   ```
   git branch rafa-backup-antes-del-rewrite
   ```

4. Ahora sí, traé el nuevo historial:
   ```
   git fetch origin
   ```

5. Si en el paso 3 tenías commits propios sin pushear, reaplicalos sobre el
   main nuevo con rebase (usa la rama de respaldo del paso 3, y el commit
   donde estaba parado tu HEAD ANTES del fetch — que es lo mismo que
   `rafa-backup-antes-del-rewrite`, y el punto donde tu main viejo divergía
   de main, que es el merge-base entre tu backup y el main nuevo):
   ```
   git rebase --onto origin/main $(git merge-base rafa-backup-antes-del-rewrite origin/main) rafa-backup-antes-del-rewrite
   ```
   Esto reaplica SOLO tus commits propios (los que no estaban ya en el main
   viejo) encima del main nuevo. Si no tenías commits propios sin pushear,
   saltate este paso.

6. Resolvé conflictos si aparecen (rebase te va a ir parando commit por
   commit). Cuando termine, verificá con `git log --oneline -10` que tus
   commits están ahí arriba del nuevo historial.

7. Actualizá tu rama main local para que apunte a este resultado:
   ```
   git branch -f main HEAD
   git checkout main
   ```
   (o si estabas directo en main durante el rebase, ya está listo)

8. Si guardaste un stash en el paso 2, recuperalo:
   ```
   git stash pop
   ```

9. Verificá que todo compila/corre antes de seguir laburando. Una vez que
   confirmes que está todo bien, podés borrar la rama de respaldo:
   ```
   git branch -D rafa-backup-antes-del-rewrite
   ```

Si en el paso 1 no tenías nada sin commitear NI commits locales sin pushear
(o sea, tu main local estaba igual al origin/main viejo), entonces es más
simple: saltate los pasos 3, 5, 6 y 7, y andá directo a `git fetch origin`
seguido de `git reset --hard origin/main`.

Ante la duda, avisame antes de forzar nada.
