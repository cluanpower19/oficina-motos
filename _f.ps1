Set-Location C:\Users\iaras\oficina-moto
Remove-Item _s.ps1,_b.ps1,_login_desk.png,_login_mob.png -ErrorAction SilentlyContinue
$u = New-Object System.Text.UTF8Encoding($false)
$t = [IO.File]::ReadAllText("$PWD\PROJETO.md")
$t = $t.Replace("`n`n## 15.", "`n| 23/11/2026 | Visual cinematográfico (Etapa 10c): tema garagem à noite (asfalto, aço, tungstênio, sombra azulada), fontes Barlow/Barlow Condensed, granulado e vinheta, tela de entrada com farol e faixas de cinema, menu com ícones SVG. As telas antigas foram remapeadas por CSS em `src/index.css` (classes bg-white, text-gray-* etc. viram tema escuro). |`n`n## 15.")
[IO.File]::WriteAllText("$PWD\PROJETO.md", $t, $u)
git add -A
git commit -q -m "Etapa 10c: visual cinematografico"
git tag etapa-10c
git push --follow-tags 2>&1 | Select-Object -Last 1
'ok'
