@echo off
setlocal
:PROMPT
SET /P AREYOUSURE=You are about to deploy. Have you removed localhost from AWS's allowed origins? (Y/[N])? 
IF /I "%AREYOUSURE%" NEQ "Y" GOTO END

firebase deploy

:END
endlocal