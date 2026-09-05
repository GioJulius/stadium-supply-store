@echo off
REM Windows entry point for the dev server.
REM
REM `npm run dev` sets NODE_ENV with POSIX syntax (`NODE_ENV=development tsx ...`),
REM which cmd.exe cannot parse — it fails with "'NODE_ENV' is not recognized".
REM The npm script is left alone because CI and Vercel both run it on Linux;
REM this wrapper is the Windows-only path to the same server.
cd /d "%~dp0.."
set NODE_ENV=development
call npx tsx watch server/_core/index.ts
