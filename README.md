# Azimund

uma plataforma de ensino interativa a geografia, que permite criar e realizar atividades em um globo 3D
professores e autores marcam lugares no mapa, desenham objetos e montam páginas e questões, e os alunos abrem a atividade pelo globo ou por um código de 6 dígitos e a percorrem página por página

## como rodar
requer Node.js 22.12 ou alem
npm install
npm run dev
azimund abre em `http://127.0.0.1:5173`

## tecnologias utilizadas

React, Vite, MapLibre GL, Terra Draw (desenho), Three.js (modelos 3D experimentais), PMTiles e fflate.

## estrutura

```
js/api/      dados, validação, adaptadores (local/http) e pacote .azmd
js/config/   estilo do mapa, cores, limites e preferências
js/core/     efeitos do espaço e camada de modelos 3D
js/editor/   motor de desenho, histórico e salvamento automático
js/ui/       interface: menus, painéis, jogador de atividades e editor
css/         estilos (tokens de cor em css/vars.css)
public/      atividades publicadas, marcadores e modelos 3D
```
