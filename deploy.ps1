(Get-Content src/db.js) -replace 'db-dev.mjs', 'db-prod.mjs' | Out-File -encoding ASCII src/db.js
firebase deploy
(Get-Content src/db.js) -replace 'db-prod.mjs', 'db-dev.mjs' | Out-File -encoding ASCII src/db.js
