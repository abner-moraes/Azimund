# contrato front ↔ back-end (Spring + MySQL)

o front so fala com o servidor quando roda com `VITE_API_MODE=http` (e `VITE_API_BASE_URL` apontando pro Spring). todas as chamadas usam `credentials: 'include'`, então o servidor acha o usuário pela sessão (cookie).

## deletar conta

`POST /api/usuarios/deletar`

```json
{ "idUsuario": "123" }
```

- `idUsuario` é o usuário logado (Usuario.id_usuario, em string por causa do BIGINT)
- o servidor tem que conferir se o `idUsuario` é o mesmo da sessão antes de apagar
- resposta: `200` ou `204` se deu certo; em erro, `{ "codigo": "...", "mensagem": "..." }`
- depois de deletar, o front sai da conta sozinho

## Projeto.propriedades (JSON)

cor do marcador e âncora juntas, ver [`propriedades.json`](./propriedades.json).

- `POST /api/projetos` (criar) manda `{ "propriedades": { cor, ancora } }`
- `PUT /api/projetos/{id}` manda `{ "json": { ..., "propriedades": {...} }, "geojson": {...} }` (sem `cor`/`ancora` soltos)
- nas listagens e no `GET /api/projetos/{id}/json` o servidor devolve `propriedades` do mesmo jeito; o front desmonta sozinho

## Tentativa.respostas (JSON)

acertos e erros juntos, uma entrada por questão, ver [`respostas.json`](./respostas.json).

`POST /api/projetos/{id}/tentativas`

```json
{ "respostas": { "acertos": 1, "total": 2, "questoes": [ ... ] } }
```
