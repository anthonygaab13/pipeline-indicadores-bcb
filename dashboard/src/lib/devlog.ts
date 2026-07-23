// "Diário de bordo" do projeto (página /bastidores) — não é changelog técnico (isso o README
// já cobre), é o PORQUÊ por trás de cada decisão, contado em primeira pessoa, na ordem em que
// aconteceu de verdade (datas batendo com o histórico real do repositório). Pra adicionar uma
// entrada nova: só um objeto a mais no topo do array (mais recente primeiro).

export interface DevlogEntry {
  date: string; // "AAAA-MM-DD"
  tag: string;
  title: string;
  body: string;
}

export const devlog: DevlogEntry[] = [
  {
    date: "2026-07-23",
    tag: "Identidade",
    title: "Coloquei a cara no projeto",
    body: "Até aqui o dashboard era 100% sobre o dado, sem nada sobre quem construiu. Recebi o toque de que faltava isso — que o projeto tava ficando bem arquitetado, mas sem identidade. Adicionei a seção Sobre e esse diário de bordo: a ideia não é só mostrar código pronto, é documentar o processo mesmo, decisão por decisão.",
  },
  {
    date: "2026-07-23",
    tag: "Design",
    title: "\"Amador\" foi a palavra que usei",
    body: "Depois de publicar a primeira versão, olhei de novo e senti que estava genérico — funcional, mas sem nenhum impacto. Em vez de sair mexendo direto, comparei três direções de design bem diferentes lado a lado (uma mais fintech/glow, uma mais terminal denso, uma mais editorial sóbria) usando os mesmos dados reais do projeto. Escolhi a mais \"premium\" das três — foi a que realmente pareceu profissional o suficiente pra eu mostrar com orgulho.",
  },
  {
    date: "2026-07-23",
    tag: "Confiança",
    title: "Número sem fonte não serve pra nada",
    body: "Um dashboard bonito com números soltos não ajuda ninguém que precisa confiar no dado no trabalho. Adicionei leituras automáticas (juro real, IPCA vs. meta, etc.), uma calculadora com cotação ao vivo do Banco Central, e uma página de metodologia onde cada número linka pra série oficial e pra fórmula exata usada. Se alguém for citar isso com um cliente, precisa conseguir defender de onde veio.",
  },
  {
    date: "2026-07-22",
    tag: "Arquitetura",
    title: "Gráfico sem biblioteca pronta",
    body: "Podia ter usado uma lib de gráfico e economizado um dia de trabalho. Preferi construir os gráficos em SVG puro — dá mais controle sobre crosshair, tooltip e a paleta de cores (validada contra daltonismo/contraste antes de usar), e eu entendo cada linha do que está rodando, em vez de depender de uma caixa-preta.",
  },
  {
    date: "2026-07-22",
    tag: "Debug",
    title: "A API do Banco Central me bloqueou duas vezes",
    body: "Primeiro erro: 406, a API rejeitando o User-Agent padrão de requisição — resolvido simulando um navegador de verdade. Segundo erro, mais escondido: séries diárias (câmbio, Selic) não aceitam consulta sem um intervalo de datas de no máximo 10 anos — sem isso, a API simplesmente recusa. Os dois só apareceram testando de verdade, nenhum dos dois estava óbvio na documentação.",
  },
  {
    date: "2026-07-22",
    tag: "Stack",
    title: "Por que não usei Spark",
    body: "Dava pra usar PySpark e parecer mais \"enterprise\" no currículo. Mas o dataset é uma série temporal de poucos milhares de linhas — Spark ali seria over-engineering puro, e ainda exigiria instalar Java só pra isso. Fui de DuckDB + Polars + Delta Lake: faz o mesmo trabalho, de forma mais leve, e o formato de tabela continua sendo de verdade (ACID, versionado).",
  },
];
