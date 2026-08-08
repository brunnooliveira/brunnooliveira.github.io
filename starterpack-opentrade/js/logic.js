/**
 * logic.js
 * Contém a lógica matemática e regras operacionais de trading:
 * determinação de cenário, cálculo de mudança, classificação e discrepâncias.
 */

/**
 * Determina se o cenário é Interno ou Externo com base nos eventos e ocorrências do calendário econômico.
 * O cenário é 'interno' somente se houver notícia de alto impacto (3 estrelas / high) do Brasil (country_id === 32)
 * agendada especificamente para o horário de abertura dos futuros (09:00 BRT).
 * 
 * @param {Object|Array} eventsOrCalendar - Objeto calendar ({ events, occurrences }) ou array de events
 * @param {Array} [occurrencesParam] - Lista de ocorrências se o 1º parâmetro for array de events
 * @returns {string} 'interno' ou 'externo'
 */
function determineActiveScenario(eventsOrCalendar, occurrencesParam) {
  let events = [];
  let occurrences = [];

  if (eventsOrCalendar && typeof eventsOrCalendar === 'object' && !Array.isArray(eventsOrCalendar)) {
    events = Array.isArray(eventsOrCalendar.events) ? eventsOrCalendar.events : [];
    occurrences = Array.isArray(eventsOrCalendar.occurrences) ? eventsOrCalendar.occurrences : [];
  } else if (Array.isArray(eventsOrCalendar)) {
    events = eventsOrCalendar;
    occurrences = Array.isArray(occurrencesParam) ? occurrencesParam : [];
  } else {
    return 'externo';
  }

  if (!events || events.length === 0) {
    return 'externo';
  }

  // Identifica IDs de eventos de alto impacto para o Brasil (country_id === 32 e importance === 'high')
  const highImpactBrazilEventIds = new Set(
    events
      .filter(e => e.country_id === 32 && e.importance === 'high')
      .map(e => e.event_id)
  );

  if (highImpactBrazilEventIds.size === 0) {
    return 'externo';
  }

  // Verifica se há alguma ocorrência correspondente exatamente às 09:00h (horário BRT)
  if (occurrences && occurrences.length > 0) {
    const has0900HighImpactEvent = occurrences.some(occ => {
      if (!highImpactBrazilEventIds.has(occ.event_id)) return false;
      if (!occ.occurrence_time) return false;

      const date = new Date(occ.occurrence_time);
      if (isNaN(date.getTime())) return false;

      const timeStr = date.toLocaleTimeString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      return timeStr === '09:00';
    });

    return has0900HighImpactEvent ? 'interno' : 'externo';
  }

  return 'externo';
}

/**
 * Calcula a variação consolidada baseada no cenário ativo e nas cotações dos ativos.
 * @param {string} scenario - 'interno' ou 'externo'
 * @param {Object} assetsData - Dicionário contendo os dados dos ativos ({ TICKER: { change: ... } })
 * @returns {number} Variação consolidada (%)
 */
function calculateChange(scenario, assetsData) {
  let total = 0;
  
  const getChangeVal = (symbol) => {
    const asset = assetsData[symbol];
    if (!asset || asset.change === null || asset.change === undefined || asset.error) {
      console.warn(`[LOGIC] Ativo ${symbol} não disponível ou possui erro. Tratando como 0.00% no cálculo.`);
      return 0;
    }
    return asset.change;
  };

  if (scenario === 'externo') {
    // Fórmula: change = -(VIX) + CL1! + FEF2!
    const vix = getChangeVal('VIX');
    const cl = getChangeVal('CL1!');
    const fef = getChangeVal('FEF2!');
    total = -vix + cl + fef;
  } else {
    // Fórmula: change = VALE + PBR + ITUB + BBD + BDORY + BOLSY
    const vale = getChangeVal('VALE');
    const pbr = getChangeVal('PBR');
    const itub = getChangeVal('ITUB');
    const bbd = getChangeVal('BBD');
    const bdory = getChangeVal('BDORY');
    const bolsy = getChangeVal('BOLSY');
    total = vale + pbr + itub + bbd + bdory + bolsy;
  }
  
  return Number(total.toFixed(4));
}

/**
 * Classifica a intensidade da variação do mercado.
 * @param {number} change - Variação consolidada (%)
 * @returns {Object} { label: string, colorClass: string }
 */
function classifyIntensity(change) {
  const absVal = Math.abs(change);
  
  if (absVal < 1.5) {
    return { label: 'Lateral', colorClass: 'intensity-lateral' };
  } else if (absVal >= 1.5 && absVal < 2.5) {
    return { label: 'Fraca', colorClass: 'intensity-fraca' };
  } else if (absVal >= 2.5 && absVal < 4.5) {
    return { label: 'Moderada', colorClass: 'intensity-moderada' };
  } else {
    return { label: 'Forte', colorClass: 'intensity-forte' };
  }
}

/**
 * Classifica a direção de abertura do mercado e a respectiva orientação.
 * @param {number} change - Variação consolidada (%)
 * @returns {Object} { label: string, orientation: string, colorClass: string, arrow: string }
 */
function classifyDirection(change) {
  const absVal = Math.abs(change);
  
  if (absVal < 1.5) {
    return {
      label: 'Extremidades',
      orientation: 'Compra suporte, vende resistência, alvo curto',
      colorClass: 'direction-lateral',
      arrow: '↔'
    };
  } else if (change > 0) {
    return {
      label: 'Abertura Compradora',
      orientation: 'Buscar regiões de trava abaixo da abertura',
      colorClass: 'direction-up',
      arrow: '↑'
    };
  } else {
    return {
      label: 'Abertura Vendedora',
      orientation: 'Buscar regiões de trava acima da abertura',
      colorClass: 'direction-down',
      arrow: '↓'
    };
  }
}

/**
 * Detecta discrepâncias nos ativos do cenário ativo.
 * @param {string} scenario - 'interno' ou 'externo'
 * @param {Object} assetsData - Dicionário contendo os dados dos ativos
 * @param {number} totalChange - Variação consolidada (%)
 * @returns {Array} Array de mensagens de discrepâncias encontradas
 */
function detectDiscrepancies(scenario, assetsData, totalChange) {
  const alerts = [];
  const activeTickers = scenario === 'externo' 
    ? ['VIX', 'CL1!', 'FEF2!'] 
    : ['VALE', 'PBR', 'ITUB', 'BBD', 'BDORY', 'BOLSY'];

  // Coleta dados dos ativos válidos
  const activeAssets = activeTickers
    .map(ticker => {
      const asset = assetsData[ticker];
      return asset && asset.change !== null && asset.change !== undefined && !asset.error
        ? { ticker, change: asset.change }
        : null;
    })
    .filter(Boolean);

  if (activeAssets.length === 0) return alerts;

  // 1. Um ativo puxando forte isolado:
  // Variação individual > 2% em valor absoluto, responsável por > 60% do change total
  const absTotalChange = Math.abs(totalChange);
  
  if (absTotalChange > 0) {
    activeAssets.forEach(asset => {
      const absAssetChange = Math.abs(asset.change);
      if (absAssetChange > 2) {
        const contributionRatio = absAssetChange / absTotalChange;
        if (contributionRatio > 0.60) {
          const pctContrib = Math.round(contributionRatio * 100);
          alerts.push({
            type: 'isolated',
            message: `<strong>Discrepância - Ativo Isolado Forte:</strong> O ativo <strong>${asset.ticker}</strong> tem variação individual de ${asset.change > 0 ? '+' : ''}${asset.change.toFixed(2)}% e é responsável por <strong>${pctContrib}%</strong> do change consolidado.`
          });
        }
      }
    });
  }

  // 2. Ativos em direções opostas:
  // Um ou mais ativos puxando forte (> 2%) para um lado enquanto outros puxam forte para o lado oposto
  const strongPositives = activeAssets.filter(asset => asset.change > 2);
  const strongNegatives = activeAssets.filter(asset => asset.change < -2);

  if (strongPositives.length > 0 && strongNegatives.length > 0) {
    const posList = strongPositives.map(a => `${a.ticker} (+${a.change.toFixed(2)}%)`).join(', ');
    const negList = strongNegatives.map(a => `${a.ticker} (${a.change.toFixed(2)}%)`).join(', ');
    alerts.push({
      type: 'opposing',
      message: `<strong>Discrepância - Forças Opostas:</strong> Há ativos puxando forte em sentidos contrários. Alta: ${posList} | Queda: ${negList}.`
    });
  }

  return alerts;
}

// Exportações das funções globais (através de escopo global no browser)
window.TradingAppLogic = {
  determineActiveScenario,
  calculateChange,
  classifyIntensity,
  classifyDirection,
  detectDiscrepancies
};
