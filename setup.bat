@echo off
echo.
echo  === AtendeTI — Setup inicial ===
echo.

echo [1/4] Instalando dependencias do banco de dados...
cd packages\database
call npm install
echo [1/4] OK

echo [2/4] Criando banco de dados e aplicando schema...
call npx prisma db push --skip-generate
echo [2/4] OK

echo [3/4] Populando banco com dados de demonstracao...
call npx ts-node prisma/seed.ts
echo [3/4] OK

cd ..\..

echo [4/4] Instalando dependencias do backend...
cd apps\api
call npm install
cd ..\..

echo [5/5] Instalando dependencias do frontend...
cd apps\web
call npm install
cd ..\..

echo.
echo  === Setup concluido! ===
echo.
echo  Para rodar o projeto:
echo.
echo  Terminal 1 (API):
echo    cd apps\api
echo    npm run dev
echo.
echo  Terminal 2 (Web):
echo    cd apps\web
echo    npm run dev
echo.
echo  Acesse: http://localhost:3000
echo  Login:  admin@atendeti.com / Admin@123
echo.
pause
