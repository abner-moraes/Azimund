import React from 'react';

// imagem decorativa do painel da tela de login/cadastro (public/textures/slate.png)
// BASE_URL pra continuar achando a imagem se o site for publicado numa subpasta
export function HudShape() {
  return (
    <img
      className="auth-hud-image"
      src={`${import.meta.env.BASE_URL}textures/slate.png`}
      alt=""
      draggable="false"
    />
  );
}
