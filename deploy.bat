@echo off
setlocal
:PROMPT
SET /P AREYOUSURE=You are about to deploy. Have you changed all IS_DEVELOPMENT variables to false? (Y/[N])? 
IF /I "%AREYOUSURE%" NEQ "Y" GOTO END

firebase deploy

:END
endlocal