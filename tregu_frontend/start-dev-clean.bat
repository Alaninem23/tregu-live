@echo off
setlocal
cd /d "D:\Tregu\Tregu_Starter_Kit_Lite_waitfix\tregu_frontend"
set NEXT_DIST_DIR=.next_dev_%RANDOM%
set NEXT_TELEMETRY_DISABLED=1
REM Uses .env.local for NEXT_PUBLIC_API_URL
npm run dev -- -p 3002
endlocal
