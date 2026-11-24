const statusPopup = document.getElementById("status");

window.addEventListener("DOMContentLoaded", async () => {
  statusPopup.textContent = "Iniciando análise na página...";
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) throw new Error("Não foi possível identificar a aba.");
    if (!tab.url) throw new Error("Abra uma página do Stripchat.");
    const pagina = new URL(tab.url);
    const dominioValido = pagina.hostname === "stripchat.com" || pagina.hostname.endsWith(".stripchat.com");
    if (pagina.protocol !== "https:" || !dominioValido) {
      throw new Error("A extensão funciona somente no site do Stripchat.");
    }
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: calcularTokensNaPagina });
    statusPopup.textContent = "Painel aberto. Clique em Calcular no painel.";
  } catch (e) {
    console.error(e);
    statusPopup.textContent = "Erro: " + e.message;
  }
});

async function calcularTokensNaPagina() {
  // Evita múltiplas instâncias na mesma página
  const painelExistente = document.getElementById("calculadora-tokens-painel");
  if (painelExistente) {
    painelExistente.style.display = "block";
    return;
  }

  const tabelaSelector = ".user-tokens-history-table";
  const proximoSelector = ".pagination .page-button-next";

  function criarPainel() {
    let painel = document.createElement("div");
    painel.id = "calculadora-tokens-painel";
    painel.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 2147483647;
      width: min(480px, calc(100vw - 40px));
      max-height: 88vh;
      overflow-y: auto;
      box-sizing: border-box;
      background: #0d1322;
      color: #f1f5f9;
      border: 1px solid #1e293b;
      border-radius: 16px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05);
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 14px;
      line-height: 1.5;
    `;
    document.body.appendChild(painel);
   
    // Fecha apenas se clicar estritamente fora do painel e após 2 segundos de estabilidade
    let permitirFechar = false;
    setTimeout(() => { permitirFechar = true; }, 2000);

    document.addEventListener("click", (evento) => {
      if (!permitirFechar || !evento.isTrusted) return;
      const painelAtual = document.getElementById("calculadora-tokens-painel");
      if (painelAtual && painelAtual.style.display !== "none") {       
        if (!painelAtual.contains(evento.target)) {
          painelAtual.style.display = "none";
        }
      }
    });

    return painel;
  }

  const painel = criarPainel();

  painel.innerHTML = `
    <style>
      #calculadora-tokens-painel::-webkit-scrollbar { width: 6px; }
      #calculadora-tokens-painel::-webkit-scrollbar-track { background: #0d1322; border-radius: 8px; }
      #calculadora-tokens-painel::-webkit-scrollbar-thumb { background: #334155; border-radius: 8px; }
      .ct-card { background: #131c2e; border: 1px solid #1e293b; border-radius: 12px; padding: 14px 16px; margin-top: 12px; }
      .ct-card-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; display: flex; align-items: center; gap: 6px; }
      .ct-value-huge { font-size: 28px; font-weight: 800; color: #f8fafc; margin: 4px 0 2px 0; letter-spacing: -0.5px; }
      .ct-value-sub { font-size: 18px; font-weight: 700; color: #10b981; }
      .ct-meta { font-size: 12px; color: #94a3b8; margin-top: 6px; line-height: 1.4; }
      .ct-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 12px; }
      .ct-stat-box { background: #090e1a; padding: 10px 12px; border-radius: 10px; border: 1px solid #1e293b; }
      .ct-progress-bar { width: 100%; height: 6px; background: #1e293b; border-radius: 4px; overflow: hidden; margin-top: 8px; }
      .ct-progress-fill { height: 100%; background: linear-gradient(90deg, #2563eb, #3b82f6); transition: width 0.3s ease; }
      .ct-action-btn { justify-content: center; width: 50%; border: 0; border-radius: 8px; background: #2563eb; color: white; padding: 8px 12px; cursor: pointer; font-weight: 600; font-size: 12px; transition: background 0.2s; display: inline-flex; align-items: center; gap: 4px; }
      .ct-action-btn:hover { background: #1d4ed8; }
      .ct-danger-btn { background: #dc2626; }
      .ct-danger-btn:hover { background: #b91c1c; }
      .ct-close-btn { border: 0; border-radius: 8px; background: #1e293b; color: #94a3b8; font-size: 16px; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
      .ct-close-btn:hover { background: #334155; color: #fff; }
      .ct-list-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #1e293b; }
      .ct-list-item:last-child { border-bottom: none; }
      h3.ct-section-header { font-size: 15px; font-weight: 700; color: #f1f5f9; margin: 22px 0 8px 0; display: flex; align-items: center; gap: 6px; }
    </style>

    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-size:20px">📊</span>
        <div>
          <div style="font-size:16px;font-weight:700;color:#fff;line-height:1.2">Calculadora de Tokens <span style="font-size:11px;color:#64748b;font-weight:400">v1.6.7</span></div>
        </div>
      </div>
      <button id="tokens-fechar" class="ct-close-btn" title="Fechar painel" aria-label="Fechar painel">✕</button>
    </div>

    <div style="display:flex; gap:8px; margin-bottom:12px;">
      <button id="tokens-btn-calcular" class="ct-action-btn">🔄 Calcular</button>
      <button id="tokens-btn-limpar" class="ct-action-btn ct-danger-btn">🗑️ Limpar</button>
    </div>

    <div id="tokens-periodo" style="padding:10px 12px;background:#131c2e;border:1px solid #1e293b;border-radius:10px;font-size:13px;color:#cbd5e1">
      <strong>Período calculado:</strong> aguardando início do cálculo
    </div>

    <div id="tokens-status" style="font-size:12px;color:#94a3b8;margin-top:8px">Clique em "Calcular" para iniciar a varredura das páginas.</div>
    <div class="ct-progress-bar"><div id="tokens-progress-fill" class="ct-progress-fill" style="width:0%"></div></div>

    <div id="tokens-resultado" style="margin-top:14px"></div>
  `;

  painel.querySelector("#tokens-fechar").addEventListener("click", () => {
    painel.style.display = "none";
  });

  const status = painel.querySelector("#tokens-status");
  const progressFill = painel.querySelector("#tokens-progress-fill");
  const periodoEl = painel.querySelector("#tokens-periodo");
  const resultado = painel.querySelector("#tokens-resultado");

  painel.querySelector("#tokens-btn-calcular").addEventListener("click", () => {
    executarCalculoCompleto();
  });

  painel.querySelector("#tokens-btn-limpar").addEventListener("click", () => {
    if (confirm("Deseja realmente limpar os dados salvos no localStorage?")) {
      localStorage.removeItem("__calc_tokens_ultimo_resultado");
      resultado.innerHTML = '<div style="color:#94a3b8;padding:10px 0;text-align:center;">Dados limpos com sucesso. Clique em "Calcular".</div>';
      periodoEl.innerHTML = "<strong>Período calculado:</strong> nenhum dado armazenado";
      status.textContent = "Cache limpo. Aguardando novo cálculo.";
    }
  });

  // Carrega do cache se houver
  const dadosSalvos = localStorage.getItem("__calc_tokens_ultimo_resultado");
  if (dadosSalvos) {
    try {
      const parsed = JSON.parse(dadosSalvos);
      status.textContent = `Mostrando dados salvos da última execução (${parsed.dataExecucao || "recente"}). Clique em "Calcular" para atualizar.`;
      resultado.innerHTML = parsed.html;
      if (parsed.periodoTexto) periodoEl.innerHTML = parsed.periodoTexto;
    } catch(e) { console.error(e); }
  }

  let executandoRodando = false;

  async function executarCalculoCompleto() {
    if (executandoRodando) return;
    executandoRodando = true;

    resultado.innerHTML = "";
    status.textContent = "Iniciando varredura nas páginas...";
    progressFill.style.width = "0%";

    let paginas = 0, registros = 0, total = 0, totalEntradas = 0, totalSaidas = 0;
    const porModeloGasto = {}, utilizacoesPorModelo = {}, porTipoGasto = {}, gastosPorMes = {}, gastosPorDia = {};
    const primeiroAcessoPorModelo = {};
    const paginasProcessadas = new Set();
    const datasValidas = [];
    let maiorGorjeta = null;
    let maiorGastoLancamento = null;
    let primeiraDoacaoPeriodo = null;

    function numero(texto) {
      if (!texto) return 0;
      const limpo = String(texto).replace(/[^0-9+-]/g, "");
      const n = Number(limpo);
      return Number.isFinite(n) ? n : 0;
    }
    function obterPaginaAtual() {
      const ativo = document.querySelector(".pagination .page-button-page.active");
      return ativo ? ativo.textContent.trim() : "?";
    }
    function obterTotalPaginas() {
      const nums = Array.from(document.querySelectorAll(".pagination .page-button-page"))
        .map(el => Number(el.textContent.trim())).filter(n => Number.isInteger(n) && n > 0);
      return nums.length ? Math.max(...nums) : 1;
    }
    function assinaturaTabela() {
      const tabela = document.querySelector(tabelaSelector);
      return tabela ? Array.from(tabela.querySelectorAll("tbody tr")).map(l => l.innerText.trim()).join("||") : "";
    }
    function escapar(texto) {
      return String(texto ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
    }
    function formatar(n) { return new Intl.NumberFormat("pt-BR").format(n); }
    function formatarUSD(tokens) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "USD" }).format(tokens * 0.05); }

    function dataInfo(texto) {
      const s = String(texto || "").trim();
      let ano, mes, dia, m;
      let hora = 0, minuto = 0, segundo = 0;

      if ((m = s.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/))) {
        dia = Number(m[1]); mes = Number(m[2]); ano = Number(m[3]);
        hora = Number(m[4] || 0); minuto = Number(m[5] || 0); segundo = Number(m[6] || 0);
      } else if ((m = s.match(/^(\d{4})[/.\-](\d{1,2})[/.\-](\d{1,2})(?:[T\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/))) {
        ano = Number(m[1]); mes = Number(m[2]); dia = Number(m[3]);
        hora = Number(m[4] || 0); minuto = Number(m[5] || 0); segundo = Number(m[6] || 0);
      } else if ((m = s.match(/^(\d{1,2})\s+de\s+([a-zç]+)\s+de\s+(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/i))) {
        const mesesPt = { janeiro:1, fevereiro:2, marco:3, março:3, abril:4, maio:5, junho:6, julho:7, agosto:8, setembro:9, outubro:10, novembro:11, dezembro:12 };
        dia = Number(m[1]);
        mes = mesesPt[m[2].toLocaleLowerCase('pt-BR')];
        ano = Number(m[3]);
        hora = Number(m[4] || 0); minuto = Number(m[5] || 0); segundo = Number(m[6] || 0);
        if (!mes) return null;
      } else {
        const parsed = Date.parse(s);
        if (!Number.isFinite(parsed)) return null;
        const d = new Date(parsed); ano = d.getFullYear(); mes = d.getMonth()+1; dia = d.getDate();
        hora = d.getHours(); minuto = d.getMinutes(); segundo = d.getSeconds();
      }
      const d = new Date(ano, mes-1, dia, hora, minuto, segundo);
      if (d.getFullYear() !== ano || d.getMonth() !== mes-1 || d.getDate() !== dia) return null;
      return {
        date: d,
        timestamp: d.getTime(),
        key: `${ano}-${String(mes).padStart(2,"0")}`,
        dayKey: `${ano}-${String(mes).padStart(2,"0")}-${String(dia).padStart(2,"0")}`,
        label: `${String(dia).padStart(2,"0")}/${String(mes).padStart(2,"0")}/${ano} às ${String(hora).padStart(2,"0")}:${String(minuto).padStart(2,"0")}`
      };
    }

    function formatarData(d) { return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`; }
    
    function atualizarPeriodo() {
      if (!datasValidas.length) { periodoEl.innerHTML = "<strong>Período calculado:</strong> as datas ainda não foram identificadas"; return; }
      const ordenadas = [...datasValidas].sort((a,b)=>a-b);
      periodoEl.innerHTML = `<strong>Período calculado:</strong> ${formatarData(ordenadas[0])} a ${formatarData(ordenadas[ordenadas.length-1])}`;
    }

    async function esperar(ms) { await new Promise(resolve => setTimeout(resolve, ms)); }
    async function esperarMudanca(assinaturaAnterior) {
      const inicio = Date.now();
      while (Date.now() - inicio < 15000) {
        await esperar(250);
        const atual = assinaturaTabela();
        if (atual && atual !== assinaturaAnterior) return true;
      }
      return false;
    }

    function processarTabela() {
      const tabela = document.querySelector(tabelaSelector);
      if (!tabela) throw new Error("Tabela de tokens não encontrada nesta página. Abra o histórico de tokens.");
      let registrosDaPagina = 0;
      for (const linha of tabela.querySelectorAll("tbody tr")) {
        const celulas = linha.querySelectorAll("td");
        if (celulas.length < 4) continue;
        const data = celulas[0].innerText.trim();
        
        const celulaModelo = celulas[1];
        const linkModelo = celulaModelo.querySelector("a[href*='/model/']");
        let modelo = "";
        if (linkModelo) {
          modelo = linkModelo.innerText.trim() || linkModelo.getAttribute("href").split("/").pop();
        } else {
          modelo = celulaModelo.innerText.trim();
        }

        const tipo = celulas[2].innerText.trim();
        const celulaTokens = celulas[3];
        const elementoTokens = celulaTokens.querySelector(".user-tokens-history-tokens-plus, .user-tokens-history-tokens-minus");
        const textoTokens = (elementoTokens ? elementoTokens.innerText : celulaTokens.innerText).trim();
        const valor = Math.abs(numero(textoTokens));
        const negativo = !!celulaTokens.querySelector(".user-tokens-history-tokens-minus") || /^\s*-/.test(textoTokens);
        const positivo = !!celulaTokens.querySelector(".user-tokens-history-tokens-plus") || /^\s*\+/.test(textoTokens);
        if (!negativo && !positivo) continue;

        registros++; registrosDaPagina++;
        const infoData = dataInfo(data);
        const dataFormatada = infoData ? infoData.label : data;
        if (infoData) {
          datasValidas.push(infoData.date);
          if (negativo) {
            gastosPorMes[infoData.key] = (gastosPorMes[infoData.key] || 0) + valor;
            gastosPorDia[infoData.dayKey] = (gastosPorDia[infoData.dayKey] || 0) + valor;
          }
        }
        
        if (modelo && modelo !== "Paymentico" && infoData && negativo) {
          if (!primeiroAcessoPorModelo[modelo] || infoData.timestamp < primeiroAcessoPorModelo[modelo].timestamp) {
            primeiroAcessoPorModelo[modelo] = { timestamp: infoData.timestamp, dataStr: dataFormatada, tipo };
          }
          if (!primeiraDoacaoPeriodo || infoData.timestamp < primeiraDoacaoPeriodo.timestamp) {
            primeiraDoacaoPeriodo = { timestamp: infoData.timestamp, dataStr: dataFormatada, modelo, tipo };
          }
        }

        if (negativo) {
          if (!maiorGastoLancamento || valor > maiorGastoLancamento.valor) {
            maiorGastoLancamento = { valor, data: dataFormatada, tipo, modelo };
          }
          totalSaidas += valor; total -= valor;
          porModeloGasto[modelo] = (porModeloGasto[modelo] || 0) + valor;
          utilizacoesPorModelo[modelo] = (utilizacoesPorModelo[modelo] || 0) + 1;
          porTipoGasto[tipo] = (porTipoGasto[tipo] || 0) + valor;
        } else if (positivo) {
          totalEntradas += valor; total += valor;
          if (!maiorGorjeta || valor > maiorGorjeta.valor) maiorGorjeta = { valor, data: dataFormatada, tipo, modelo };
        }
      }
      atualizarPeriodo();
      return registrosDaPagina;
    }

    try {
      const totalPaginasEstimado = obterTotalPaginas();
      while (true) {
        const pagina = obterPaginaAtual();
        if (!paginasProcessadas.has(pagina)) {
          paginasProcessadas.add(pagina);
          const qtd = processarTabela(); paginas++;
          const pct = Math.min(100, Math.round((paginas / Math.max(totalPaginasEstimado, paginas)) * 100));
          progressFill.style.width = pct + "%";
          status.textContent = `Processando página ${pagina}... (${qtd} lançamentos)`;
        }
        const proximo = document.querySelector(proximoSelector);
        if (!proximo) break;
        const desabilitado = proximo.hasAttribute("disabled") || proximo.getAttribute("aria-disabled") === "true" || proximo.classList.contains("disabled");
        if (desabilitado) break;
        const assinaturaAnterior = assinaturaTabela();
        proximo.click();
        if (!await esperarMudanca(assinaturaAnterior)) break;
        if (obterPaginaAtual() === pagina && assinaturaTabela() === assinaturaAnterior) break;
      }

      // Feedback visual nítido de conclusão e geração
      status.textContent = "⌛ Última página alcançada! Gerando relatório completo...";
      progressFill.style.width = "100%";
      await esperar(600);

      const modelos = Object.entries(porModeloGasto).sort((a,b)=>b[1]-a[1]);
      const tipos = Object.entries(porTipoGasto).sort((a,b)=>b[1]-a[1]);
      const meses = Object.entries(gastosPorMes).sort((a,b)=>a[0].localeCompare(b[0]));
      const dias = Object.entries(gastosPorDia).sort((a,b)=>b[1]-a[1]);
      const maiorGastoDia = dias.length ? dias[0] : null;

      const linhasModelos = modelos.map(([modelo,gasto]) => {
        const qtd = utilizacoesPorModelo[modelo] || 0;
        const percentual = totalSaidas > 0 ? ((gasto/totalSaidas)*100).toFixed(1) : "0.0";
        const infoPrimeiraDoacao = primeiroAcessoPorModelo[modelo];
        const textoPrimeiroDia = infoPrimeiraDoacao 
          ? `<div style="margin-top:4px;color:#38bdf8;font-size:12px">📅 Primeira doação do período: <strong>${escapar(infoPrimeiraDoacao.dataStr)}</strong></div>`
          : "";
        return `
          <div class="ct-list-item">
            <div style="flex:1;padding-right:10px">
              <div style="font-weight:600;color:#f8fafc;font-size:14px;word-break:break-word">${escapar(modelo)}</div>
              <div style="margin-top:2px;color:#94a3b8;font-size:12px">${qtd} utilização(ões) · ${percentual}% do gasto</div>
              ${textoPrimeiroDia}
            </div>
            <div style="text-align:right">
              <div style="font-weight:700;color:#f8fafc">${formatar(gasto)} tokens</div>
              <div style="font-size:12px;color:#10b981;font-weight:600">${formatarUSD(gasto)}</div>
            </div>
          </div>`;
      }).join("");

      const linhasTipos = tipos.map(([tipo,gasto]) => `
        <div class="ct-list-item">
          <span style="color:#cbd5e1">${escapar(tipo)}</span>
          <div style="text-align:right">
            <span style="font-weight:700;color:#f8fafc">${formatar(gasto)} tokens</span>
            <div style="font-size:11px;color:#10b981">${formatarUSD(gasto)}</div>
          </div>
        </div>
      `).join("");

      const linhasMeses = meses.map(([mes,gasto]) => {
        const [ano,numMes] = mes.split("-");
        const label = new Date(Number(ano), Number(numMes)-1, 1).toLocaleDateString("pt-BR", {month:"long",year:"numeric"});
        return `
          <div class="ct-list-item">
            <span style="text-transform:capitalize;color:#cbd5e1">${escapar(label)}</span>
            <div style="text-align:right">
              <span style="font-weight:700;color:#f8fafc">${formatar(gasto)} tokens</span>
              <div style="font-size:11px;color:#10b981">${formatarUSD(gasto)}</div>
            </div>
          </div>`;
      }).join("");

      let dataMaiorGasto = "";
      if (maiorGastoDia) {
        const partesData = maiorGastoDia[0].split("-").map(Number);
        dataMaiorGasto = formatarData(new Date(partesData[0], partesData[1] - 1, partesData[2]));
      }

      const maiorGastoDiaHtml = maiorGastoDia
        ? `
          <div class="ct-card" style="border-left: 4px solid #ef4444">
            <div class="ct-card-title" style="color:#fca5a5">🔥 Dia de Maior Gasto no Período</div>
            <div class="ct-value-huge">${formatar(maiorGastoDia[1])} <span style="font-size:14px;font-weight:500;color:#94a3b8">tokens</span></div>
            <div class="ct-value-sub">${formatarUSD(maiorGastoDia[1])}</div>
            <div class="ct-meta">Data do pico: <strong>${escapar(dataMaiorGasto)}</strong></div>
          </div>
        ` : "";

      const maiorGorjetaHtml = maiorGorjeta
        ? `
          <div class="ct-card" style="border-left: 4px solid #f59e0b">
            <div class="ct-card-title" style="color:#fcd34d">🛍️ Maior Pacote comprado no Período</div>
            <div class="ct-value-huge" style="color:#fcd34d">+${formatar(maiorGorjeta.valor)} <span style="font-size:14px;font-weight:500;color:#94a3b8">tokens</span></div>
            <div class="ct-value-sub">${formatarUSD(maiorGorjeta.valor)}</div>
            <div class="ct-meta">Data: <strong>${escapar(maiorGorjeta.data || "não identificada")}</strong> · Método: ${escapar(maiorGorjeta.tipo)}</div>
          </div>
        ` : "";

      const primeiraDoacaoHtml = primeiraDoacaoPeriodo
        ? `
          <div class="ct-card" style="border-left: 4px solid #10b981">
            <div class="ct-card-title" style="color:#6ee7b7">✨ Primeira doação do período</div>
            <div class="ct-value-huge" style="font-size:20px;color:#6ee7b7;margin:6px 0">${escapar(primeiraDoacaoPeriodo.dataStr)}</div>
            <div class="ct-meta">Modelo: <strong style="color:#fff">${escapar(primeiraDoacaoPeriodo.modelo)}</strong> · Interação: ${escapar(primeiraDoacaoPeriodo.tipo)}</div>
          </div>
        ` : "";

      const maiorGastoHtml = maiorGastoLancamento
        ? `
          <div class="ct-card" style="border-left: 4px solid #58b433">
            <div class="ct-card-title" style="color:#58b433">💸 Maior Gorjeta Doada no Período</div>
            <div class="ct-value-huge" style="color:#58b433">${formatar(maiorGastoLancamento.valor)} <span style="font-size:14px;font-weight:500;color:#94a3b8">tokens</span></div>
            <div class="ct-value-sub">${formatarUSD(maiorGastoLancamento.valor)}</div>
            <div class="ct-meta">Data: <strong>${escapar(maiorGastoLancamento.data || "não identificada")}</strong> · Modelo: ${escapar(maiorGastoLancamento.modelo)} · Tipo: ${escapar(maiorGastoLancamento.tipo)}</div>
          </div>
        ` : "";

      status.textContent = `Relatório concluído com sucesso! (${paginas} página(s), ${registros} lançamento(s))`;

      const corSaldo = total >= 0 ? "#10b981" : "#ef4444";
      const sinalSaldo = total >= 0 ? "+" : "";

      const htmlResultadoFinal = `
        <div class="ct-card" style="background: linear-gradient(135deg, #131c2e 0%, #0d1322 100%); border-color: #2563eb;">
          <div class="ct-card-title" style="color:#93c5fd">💸 RESUMO GERAL DO PERÍODO</div>
          
          <div class="ct-grid">
            <div class="ct-stat-box">
              <div style="font-size:11px;color:#94a3b8;font-weight:600">ENTRADAS/CRÉDITOS</div>
              <div style="font-weight:700;color:#10b981;font-size:15px;margin-top:2px">+${formatar(totalEntradas)}</div>
              <div style="font-size:11px;color:#64748b">${formatarUSD(totalEntradas)}</div>
            </div>
            <div class="ct-stat-box">
              <div style="font-size:11px;color:#94a3b8;font-weight:600">SAÍDAS/GASTOS</div>
              <div style="font-weight:700;color:#f87171;font-size:15px;margin-top:2px">-${formatar(totalSaidas)}</div>
              <div style="font-size:11px;color:#64748b">${formatarUSD(totalSaidas)}</div>
            </div>
          </div>

          <div class="ct-stat-box" style="margin-top:10px">
            <div style="font-size:11px;color:#94a3b8;font-weight:600;text-align: center;">SALDO LÍQUIDO</div>
            <div style="font-weight:800;color:${corSaldo};font-size:18px;margin-top:2px;text-align: center;">${sinalSaldo}${formatar(total)}</div>
            <div style="font-size:12px;color:#64748b;text-align: center;">${formatarUSD(total)}</div>
          </div>

          <div style="font-size:11px;color:#64748b;margin-top:10px;text-align:right">Conversão estimada: 1 token = US$ 0,05</div>
        </div>

        ${primeiraDoacaoHtml}
        ${maiorGorjetaHtml}
        ${maiorGastoHtml}
        ${maiorGastoDiaHtml}

        <h3 class="ct-section-header">📅 Referência de Gasto por Mês</h3>
        <div class="ct-card" style="margin-top:6px;padding:6px 16px">
          ${linhasMeses || '<div style="color:#94a3b8;padding:10px 0">Não foi possível agrupar gastos por mês.</div>'}
        </div>

        <h3 class="ct-section-header">💰 Gasto por Modelo</h3>
        <div class="ct-card" style="margin-top:6px;padding:6px 16px">
          ${linhasModelos || '<div style="color:#94a3b8;padding:10px 0">Nenhum consumo identificado.</div>'}
        </div>

        <h3 class="ct-section-header">🏷️ Por Tipo de Gasto</h3>
        <div class="ct-card" style="margin-top:6px;padding:6px 16px">
          ${linhasTipos || '<div style="color:#94a3b8;padding:10px 0">Nenhum gasto identificado.</div>'}
        </div>

        <div style="margin-top:16px;text-align:center;color:#64748b;font-size:11px">
          Processadas ${paginas} páginas e ${registros} lançamentos.
        </div>
      `;

      resultado.innerHTML = htmlResultadoFinal;

      const agora = new Date();
      const dataHoraFormatada = `${String(agora.getDate()).padStart(2,"0")}/${String(agora.getMonth()+1).padStart(2,"0")}/${agora.getFullYear()} às ${String(agora.getHours()).padStart(2,"0")}:${String(agora.getMinutes()).padStart(2,"0")}`;
      localStorage.setItem("__calc_tokens_ultimo_resultado", JSON.stringify({
        html: htmlResultadoFinal,
        periodoTexto: periodoEl.innerHTML,
        dataExecucao: dataHoraFormatada
      }));

    } catch (e) {
      console.error(e);
      status.textContent = "Erro: " + e.message;
    } finally {
      executandoRodando = false;
    }
  }
}