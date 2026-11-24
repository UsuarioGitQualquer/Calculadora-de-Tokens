CALCULADORA DE TOKENS

Sobre
-----
Extensão de navegador Manifest V3 que lê o histórico de tokens do Stripchat
em https://stripchat.com/tokens-history, percorre as páginas disponíveis e
apresenta um resumo de entradas, saídas e gastos por período, modelo e tipo.

A estimativa em dólares usa a taxa configurada de 1 token = US$ 0,05.
Os valores são estimativas baseadas nessa taxa, não uma cobrança oficial.

Instalação no Chrome ou Edge
----------------------------
1. Abra chrome://extensions no Chrome ou edge://extensions no Edge.
2. Ative o "Modo do desenvolvedor".
3. Clique em "Carregar sem compactação".
4. Selecione a pasta deste projeto.

Como usar
---------
1. Acesse https://stripchat.com/tokens-history e entre na sua conta.
2. Clique no ícone da extensão na barra do navegador.
3. No painel que aparece na página, clique em "Calcular".
4. Aguarde o processamento das páginas e consulte o relatório.

O painel também pode ser fechado pelo botão X ou ao clicar fora dele. Os
cliques automáticos usados para percorrer a paginação não fecham o painel.

O botão "Limpar" apaga o relatório guardado no armazenamento local do site.
Esse armazenamento é usado para mostrar o último resultado quando a extensão
for aberta novamente na mesma página.

Permissões
----------
- scripting: injeta o código que lê e apresenta o relatório na página.
- Acesso limitado a páginas HTTPS do Stripchat e seus subdomínios pelo manifesto.
- Para calcular, abra a página https://stripchat.com/tokens-history.

Compatibilidade
---------------
A extensão foi feita para a página https://stripchat.com/tokens-history. Ela
precisa conter a tabela de histórico e os controles de paginação esperados.
Se o Stripchat alterar a estrutura da página, a leitura poderá deixar de
funcionar corretamente.

