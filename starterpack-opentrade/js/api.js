/**
 * api.js
 * Módulo responsável pela comunicação com os endpoints externos da Investing.com e TradingView,
 * além de gerenciar os dados de simulação (Mock Mode).
 */

const ASSETS_CONFIG = {
  VIX: { ticker: 'VIX', exchange: 'TVC', type: 'externo', name: 'Índice de Volatilidade S&P 500' },
  'CL1!': { ticker: 'CL1!', exchange: 'NYMEX', type: 'externo', name: 'Futuros de Petróleo Crú' },
  VALE: { ticker: 'VALE', exchange: 'NYSE', type: 'interno', name: 'Vale S.A. ADR' },
  PBR: { ticker: 'PBR', exchange: 'NYSE', type: 'interno', name: 'Petrobras S.A. ADR' },
  ITUB: { ticker: 'ITUB', exchange: 'NYSE', type: 'interno', name: 'Itaú Unibanco ADR' },
  BBD: { ticker: 'BBD', exchange: 'NYSE', type: 'interno', name: 'Bradesco ADR' },
  BDORY: { ticker: 'BDORY', exchange: 'OTC', type: 'interno', name: 'Banco do Brasil ADR' },
  BOLSY: { ticker: 'BOLSY', exchange: 'OTC', type: 'interno', name: 'B3 S.A. ADR' }
};

// Dados simulados para o Mock Mode
const MOCK_DATA_SCENARIOS = {
  // Cenário Interno sem discrepâncias
  interno_normal: {
    calendar: {
      events: [
        { event_id: 1342, short_name: "Superávit Orçamentário", source: "Ministério da Fazenda", country_id: 32, importance: "high" },
        { event_id: 1523, short_name: "Evolução de Emprego CAGED", source: "MTE", country_id: 32, importance: "high" },
        { event_id: 2008, short_name: "Dívida Bruta/PIB", source: "Banco Central", country_id: 32, importance: "high" }
      ],
      occurrences: [
        { event_id: 2008, occurrence_time: new Date().toISOString(), actual: 81.1, forecast: 80.5, previous: 80.2, unit: "%", actual_to_forecast: "positive" },
        { event_id: 1342, occurrence_time: new Date().toISOString(), actual: -56.1, forecast: -60.0, previous: 24.6, unit: "B", actual_to_forecast: "positive" },
        { event_id: 1523, occurrence_time: new Date().toISOString(), actual: 72.9, forecast: 115.0, previous: 85.8, unit: "K", actual_to_forecast: "negative" }
      ]
    },
    assets: {
      VIX: -1.20,
      'CL1!': 0.80,
      'FEF2!': { symbol: 'SGX:FEFN2026', change: 1.10 },
      VALE: 0.85,
      PBR: 1.20,
      ITUB: 0.60,
      BBD: 0.40,
      BDORY: 0.70,
      BOLSY: 0.50
    }
  },
  // Cenário Externo normal
  externo_normal: {
    calendar: { events: [], occurrences: [] },
    assets: {
      VIX: 1.85,    // VIX sobe (negativo para o cálculo)
      'CL1!': 0.50,  // Petróleo sobe pouco
      'FEF2!': { symbol: 'SGX:FEFN2026', change: -0.90 }, // Minério cai
      VALE: -0.20,
      PBR: -0.15,
      ITUB: 0.05,
      BBD: -0.10,
      BDORY: -0.05,
      BOLSY: -0.12
    }
  },
  // Discrepância 1: Um único ativo puxa muito forte
  discrepancia_isolado: {
    calendar: {
      events: [
        { event_id: 2008, short_name: "Dívida Bruta/PIB", source: "Banco Central", country_id: 32, importance: "high" }
      ],
      occurrences: [
        { event_id: 2008, occurrence_time: new Date().toISOString(), actual: 81.1, forecast: 80.5, previous: 80.2, unit: "%", actual_to_forecast: "positive" }
      ]
    },
    assets: {
      VIX: -0.50,
      'CL1!': 0.20,
      'FEF2!': { symbol: 'SGX:FEFN2026', change: 0.30 },
      VALE: 3.80,   // Vale sobe muito forte isolada (> 2% e > 60% do total)
      PBR: 0.10,
      ITUB: 0.05,
      BBD: -0.05,
      BDORY: 0.10,
      BOLSY: 0.00
    }
  },
  // Discrepância 2: Ativos em direções opostas
  discrepancia_opostas: {
    calendar: {
      events: [
        { event_id: 2008, short_name: "Dívida Bruta/PIB", source: "Banco Central", country_id: 32, importance: "high" }
      ],
      occurrences: [
        { event_id: 2008, occurrence_time: new Date().toISOString(), actual: 81.1, forecast: 80.5, previous: 80.2, unit: "%", actual_to_forecast: "positive" }
      ]
    },
    assets: {
      VIX: -0.50,
      'CL1!': 0.20,
      'FEF2!': { symbol: 'SGX:FEFN2026', change: 0.30 },
      VALE: 2.50,   // Forte alta (> 2%)
      PBR: -2.80,   // Forte queda (> -2%)
      ITUB: 0.10,
      BBD: -0.20,
      BDORY: 0.05,
      BOLSY: -0.15
    }
  }
};

/**
 * Retorna se o Mock Mode está ativado de acordo com a URL ou estado.
 */
function isMockActive() {
  const params = new URLSearchParams(window.location.search);
  return params.get('mock') === 'true' || window.localStorage.getItem('mock_active') === 'true';
}

/**
 * Retorna o cenário de mock selecionado atualmente.
 */
function getActiveMockScenario() {
  const stored = window.localStorage.getItem('mock_scenario');
  if (stored && MOCK_DATA_SCENARIOS[stored]) {
    return MOCK_DATA_SCENARIOS[stored];
  }
  return MOCK_DATA_SCENARIOS.interno_normal;
}

/**
 * Busca ocorrências do Calendário Econômico da Investing.com.
 */
async function fetchEconomicCalendar(startDate, endDate) {
  if (isMockActive()) {
    console.log('[API] Mock Mode: Retornando calendário do cenário ativo.');
    return getActiveMockScenario().calendar;
  }

  const url = `https://endpoints.investing.com/pd-instruments/v1/calendars/economic/events/occurrences?domain_id=30&limit=200&start_date=${startDate}&end_date=${endDate}&country_ids=32&importance=high`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('[API] Erro ao buscar calendário econômico:', error);
    throw error;
  }
}

/**
 * Busca a variação percentual dos ativos simples.
 */
async function fetchAssetChange(symbolKey) {
  const config = ASSETS_CONFIG[symbolKey];
  if (!config) throw new Error(`Símbolo não configurado: ${symbolKey}`);
  
  const url = `https://scanner.tradingview.com/symbol?symbol=${config.exchange}:${config.ticker}&fields=change&no_404=true&label-product=symbols-performance`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    const data = await response.json();
    return {
      symbol: symbolKey,
      change: data.change !== undefined && data.change !== null ? Number(data.change) : null,
      name: config.name,
      type: config.type,
      ticker: config.ticker,
      exchange: config.exchange
    };
  } catch (error) {
    console.error(`[API] Erro ao buscar cotação de ${symbolKey}:`, error);
    return {
      symbol: symbolKey,
      change: null,
      name: config.name,
      type: config.type,
      ticker: config.ticker,
      exchange: config.exchange,
      error: true
    };
  }
}

/**
 * Busca as cotações de todos os ativos simples de forma paralela.
 */
async function fetchSimpleAssets() {
  const promises = Object.keys(ASSETS_CONFIG).map(symbol => fetchAssetChange(symbol));
  const results = await Promise.all(promises);
  
  // Transforma array em um mapa indexado pelo símbolo
  const assetsMap = {};
  results.forEach(res => {
    assetsMap[res.symbol] = res;
  });
  return assetsMap;
}

/**
 * Passo 1 para FEF2! - Descobrir o contrato ativo de minério de ferro.
 */
async function getIronOreActiveContract() {
  const url = 'https://scanner.tradingview.com/futures/scan';
  const body = {
    columns: ['name', 'expiration'],
    filter: [
      { left: 'close', operation: 'nempty' },
      { left: 'expiration', operation: 'nempty' }
    ],
    sort: { sortBy: 'expiration', sortOrder: 'asc' },
    index_filters: [
      { name: 'root', values: ['SGX:FEF'] }
    ]
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Erro ao consultar contratos de minério de ferro: ${response.status}`);
  }

  const result = await response.json();
  if (!result.data || result.data.length < 2) {
    throw new Error('Contrato ativo de minério não encontrado (dados insuficientes).');
  }

  // data[1].s é o contrato ativo futuro de maior liquidez (o próximo contrato ativo)
  return result.data[1].s;
}

/**
 * Passo 2 para FEF2! - Buscar a variação do contrato descoberto.
 */
async function fetchIronOreChange(activeContract) {
  const url = 'https://scanner.tradingview.com/futures/scan';
  const body = {
    symbols: { tickers: [activeContract] },
    columns: ['name', 'close', 'change']
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Erro ao obter variação de minério de ferro: ${response.status}`);
  }

  const result = await response.json();
  if (!result.data || result.data.length === 0) {
    throw new Error('Dados do contrato ativo de minério indisponíveis.');
  }

  // data[0].d[2] é a variação percentual (change)
  const dataRow = result.data[0];
  return {
    symbol: 'FEF2!',
    contractSymbol: dataRow.s,
    change: dataRow.d && dataRow.d[2] !== undefined ? Number(dataRow.d[2]) : null,
    name: 'SGX Iron Ore Futures',
    type: 'externo',
    ticker: dataRow.d ? dataRow.d[0] : 'FEF2!',
    exchange: 'SGX'
  };
}

/**
 * Resolve a busca de minério de ferro englobando os dois passos.
 */
async function fetchIronOre() {
  if (isMockActive()) {
    console.log('[API] Mock Mode: Retornando Minério de Ferro do cenário ativo.');
    const mockVal = getActiveMockScenario().assets['FEF2!'];
    return {
      symbol: 'FEF2!',
      contractSymbol: mockVal.symbol,
      change: mockVal.change,
      name: 'SGX Iron Ore Futures',
      type: 'externo',
      ticker: mockVal.symbol.split(':')[1] || 'FEF2!',
      exchange: 'SGX'
    };
  }

  try {
    const activeContract = await getIronOreActiveContract();
    return await fetchIronOreChange(activeContract);
  } catch (error) {
    console.error('[API] Erro no fluxo de buscar minério de ferro:', error);
    return {
      symbol: 'FEF2!',
      contractSymbol: null,
      change: null,
      name: 'SGX Iron Ore Futures',
      type: 'externo',
      ticker: 'FEF2!',
      exchange: 'SGX',
      error: true
    };
  }
}

/**
 * Função unificada que carrega todos os dados
 */
async function loadAllDashboardData() {
  if (isMockActive()) {
    // Carregamento simulado rápido
    await new Promise(resolve => setTimeout(resolve, 800));
    const scenario = getActiveMockScenario();
    
    // Converte os assets do mock para a estrutura padronizada
    const assetsResult = {};
    for (const key of Object.keys(ASSETS_CONFIG)) {
      assetsResult[key] = {
        symbol: key,
        change: scenario.assets[key],
        name: ASSETS_CONFIG[key].name,
        type: ASSETS_CONFIG[key].type,
        ticker: ASSETS_CONFIG[key].ticker,
        exchange: ASSETS_CONFIG[key].exchange
      };
    }
    
    const fefMock = scenario.assets['FEF2!'];
    assetsResult['FEF2!'] = {
      symbol: 'FEF2!',
      contractSymbol: fefMock.symbol,
      change: fefMock.change,
      name: 'SGX Iron Ore Futures',
      type: 'externo',
      ticker: fefMock.symbol.split(':')[1] || 'FEF2!',
      exchange: 'SGX'
    };

    return {
      calendar: scenario.calendar,
      assets: assetsResult
    };
  }

  // Gera datas BRT dinamicamente (YYYY-MM-DD)
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const localDateStr = `${year}-${month}-${day}`;
  const startDate = `${localDateStr}T00:00:00.000-03:00`;
  const endDate = `${localDateStr}T23:59:59.999-03:00`;

  // Dispara buscas paralelas
  const calendarPromise = fetchEconomicCalendar(startDate, endDate);
  const simpleAssetsPromise = fetchSimpleAssets();
  const ironOrePromise = fetchIronOre();

  const [calendarData, simpleAssetsData, ironOreData] = await Promise.all([
    calendarPromise,
    simpleAssetsPromise,
    ironOrePromise
  ]);

  // Junta todas as cotações em um único mapa
  const allAssets = {
    ...simpleAssetsData,
    'FEF2!': ironOreData
  };

  return {
    calendar: calendarData,
    assets: allAssets
  };
}

// Exportações das funções globais (através de escopo global no browser)
window.TradingAppAPI = {
  isMockActive,
  getActiveMockScenario,
  loadAllDashboardData,
  ASSETS_CONFIG,
  MOCK_DATA_SCENARIOS
};
