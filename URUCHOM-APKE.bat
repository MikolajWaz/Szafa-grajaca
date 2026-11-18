@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ===== Szafa grajaca: strona dla gosci =====
echo.
if not exist node_modules (
  echo Pierwsze uruchomienie: instaluje potrzebne elementy, to potrwa chwile...
  call npm install
)
echo Przygotowuje strone...
call npm run build
if errorlevel 1 (
  echo.
  echo Cos poszlo nie tak przy przygotowaniu strony. Sprawdz plik .env.local i napisz do mnie, co widzisz powyzej.
  pause
  exit /b 1
)
echo.
echo ============================================================
echo Goscie wpisuja w przegladarce: http://TWOJ-ADRES:3000
echo Twoj adres to liczba z linijki "IPv4" ponizej (np. 192.168.1.25):
ipconfig | findstr /i "IPv4"
echo.
echo Nie zamykaj tego okna, dopoki szafa ma dzialac dla gosci.
echo Szafe wlaczasz i wylaczasz w Panelu DJ-a.
echo ============================================================
echo.
call npm start
if errorlevel 1 (
  echo.
  echo ===== STRONA ZATRZYMALA SIE Z BLEDEM =====
  echo Przepisz albo sfotografuj komunikat powyzej. Linijki zaczynajace sie od BLAD pokazuja, co poszlo nie tak przy glosowaniu lub wyszukiwaniu.
)
pause
