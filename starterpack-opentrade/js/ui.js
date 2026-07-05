/**
 * ui.js
 * Módulo responsável pela manipulação do DOM e renderização de todos os componentes da tela.
 */

// Elementos da DOM cacheáveis
const elements = {
  clock: document.getElementById('digital-clock'),
  syncStatus: document.getElementById('sync-status'),
  btnRefresh: document.getElementById('btn-refresh'),
  
  // Painel Principal
  mainChange: document.getElementById('main-change'),
  mainDirection: document.getElementById('main-direction'),
  mainDirectionArrow: document.getElementById('main-direction-arrow'),
  mainIntensity: document.getElementById('main-intensity'),
  activeScenarioTag: document.getElementById('active-scenario-tag'),
  activeScenarioReason: document.getElementById('active-scenario-reason'),
  guidanceText: document.getElementById('guidance-text'),
  discrepancyContainer: document.getElementById('discrepancy-container'),
  discrepancyList: document.getElementById('discrepancy-list'),
  
  // Listas de Dados
  calendarList: document.getElementById('calendar-list'),
  externalQuotesList: document.getElementById('external-quotes-list'),
  internalQuotesList: document.getElementById('internal-quotes-list'),
  
  // Subtotais dos Cards
  subtotalExternal: document.getElementById('subtotal-external'),
  subtotalInternal: document.getElementById('subtotal-internal'),
  
  // Container dos Cards
  cardExternal: document.getElementById('card-external'),
  cardInternal: document.getElementById('card-internal'),
  
  // Loading & Error States
  loadingOverlay: document.getElementById('loading-overlay'),
  errorOverlay: document.getElementById('error-overlay'),
  errorMessage: document.getElementById('error-message'),
  btnRetry: document.getElementById('btn-retry'),
  
  // Mock Control
  mockSelector: document.getElementById('mock-selector'),
  mockContainer: document.getElementById('mock-container')
};

/**
 * Atualiza o relógio dinâmico no topo do dashboard (BRT).
 */
function startClock() {
  const updateClock = () => {
    if (!elements.clock) return;
    const now = new Date();
    // Exibe no formato pt-BR
    const timeStr = now.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'America/Sao_Paulo'
    });
    const dateStr = now.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'America/Sao_Paulo'
    });
    elements.clock.innerHTML = `<span class="date">${dateStr}</span> | <span class="time">${timeStr} BRT</span>`;
  };
  
  updateClock();
  setInterval(updateClock, 1000);
}

/**
 * Exibe ou oculta o overlay de loading.
 */
function setLoading(isLoading) {
  if (!elements.loadingOverlay) return;
  if (isLoading) {
    elements.loadingOverlay.classList.remove('hidden');
    elements.errorOverlay.classList.add('hidden');
  } else {
    elements.loadingOverlay.classList.add('hidden');
  }
}

/**
 * Exibe a tela de erro global.
 */
function showError(message) {
  setLoading(false);
  if (!elements.errorOverlay) return;
  elements.errorMessage.innerHTML = message;
  elements.errorOverlay.classList.remove('hidden');
}

/**
 * Oculta a tela de erro.
 */
function hideError() {
  if (elements.errorOverlay) {
    elements.errorOverlay.classList.add('hidden');
  }
}

/**
 * Atualiza a tag de status de sincronização com o timestamp.
 */
function updateSyncStatus() {
  if (!elements.syncStatus) return;
  const now = new Date();
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const isMock = window.TradingAppAPI.isMockActive();
  
  if (isMock) {
    const scenario = window.localStorage.getItem('mock_scenario') || 'interno_normal';
    elements.syncStatus.innerHTML = `<span class="status-badge mock-badge">MOCK: ${scenario.toUpperCase()}</span>`;
  } else {
    elements.syncStatus.innerHTML = `<span class="status-badge live-badge">✓ DADOS REAIS SINC. ÀS ${timeStr}</span>`;
  }
}

/**
 * Formata um valor numérico de variação percentual.
 */
function formatPercent(value, forceSign = true) {
  if (value === null || value === undefined) return 'N/A';
  const prefix = (forceSign && value > 0) ? '+' : '';
  return `${prefix}${value.toFixed(2)}%`;
}

/**
 * Formata valores monetários ou numéricos do calendário econômico.
 */
function formatCalendarValue(value, unit) {
  if (value === null || value === undefined) return '—';
  
  const unitStr = unit ? ` ${unit}` : '';
  const prefix = value > 0 ? '' : '';
  return `${prefix}${value}${unitStr}`;
}

/**
 * Renderiza o Calendário Econômico na tela.
 */
function renderEconomicCalendar(calendarData) {
  if (!elements.calendarList) return;
  elements.calendarList.innerHTML = '';

  const { events, occurrences } = calendarData;

  // Se não houver ocorrências, exibe placeholder
  if (!occurrences || occurrences.length === 0) {
    elements.calendarList.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">🔔</span>
        Sem notícias de alto impacto hoje para o Brasil.
      </div>
    `;
    return;
  }

  // Mapeia eventos por event_id
  const eventsMap = {};
  events.forEach(e => {
    eventsMap[e.event_id] = e;
  });

  // Ordena ocorrências por horário
  const sortedOccurrences = [...occurrences].sort((a, b) => new Date(a.occurrence_time) - new Date(b.occurrence_time));

  sortedOccurrences.forEach(occ => {
    const event = eventsMap[occ.event_id] || { short_name: 'Evento Econômico', source: 'N/A' };
    const date = new Date(occ.occurrence_time);
    const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
    
    // Define a classe CSS para o valor atual
    let actualClass = '';
    if (occ.actual_to_forecast === 'positive') {
      actualClass = 'text-green font-bold';
    } else if (occ.actual_to_forecast === 'negative') {
      actualClass = 'text-red font-bold';
    }

    const row = document.createElement('div');
    row.className = 'calendar-row';
    row.innerHTML = `
      <div class="calendar-time">${timeStr}</div>
      <div class="calendar-info">
        <div class="calendar-title">${event.short_name}</div>
        <div class="calendar-source">${event.source || 'Investing.com'}</div>
      </div>
      <div class="calendar-values">
        <div class="value-item"><span class="val-label">Atual:</span> <span class="${actualClass}">${formatCalendarValue(occ.actual, occ.unit)}</span></div>
        <div class="value-item"><span class="val-label">Previsto:</span> <span>${formatCalendarValue(occ.forecast, occ.unit)}</span></div>
        <div class="value-item"><span class="val-label">Anterior:</span> <span>${formatCalendarValue(occ.previous, occ.unit)}</span></div>
      </div>
    `;
    elements.calendarList.appendChild(row);
  });
}

/**
 * Renderiza uma linha de cotação de ativo.
 */
function createQuoteRowHTML(asset) {
  if (asset.error) {
    return `
      <div class="quote-row quote-error">
        <div class="quote-symbol-info">
          <span class="quote-ticker">${asset.symbol}</span>
          <span class="quote-name">${asset.name}</span>
        </div>
        <div class="quote-value text-red">ERRO/CORS</div>
      </div>
    `;
  }

  const change = asset.change;
  const isUp = change > 0;
  const isDown = change < 0;
  const colorClass = isUp ? 'text-green' : isDown ? 'text-red' : 'text-gray';
  const valFormatted = formatPercent(change);

  return `
    <div class="quote-row">
      <div class="quote-symbol-info">
        <span class="quote-ticker">${asset.symbol}</span>
        <span class="quote-name">${asset.name} ${asset.contractSymbol ? `(${asset.contractSymbol.split(':')[1] || asset.contractSymbol})` : ''}</span>
      </div>
      <div class="quote-value ${colorClass}">${valFormatted}</div>
    </div>
  `;
}

/**
 * Renderiza os cards das cotações.
 */
function renderQuotes(assetsData, activeScenario) {
  if (!elements.externalQuotesList || !elements.internalQuotesList) return;

  elements.externalQuotesList.innerHTML = '';
  elements.internalQuotesList.innerHTML = '';

  const externalSymbols = ['VIX', 'CL1!', 'FEF2!'];
  const internalSymbols = ['VALE', 'PBR', 'ITUB', 'BBD', 'BDORY', 'BOLSY'];

  // Renderiza Externos
  externalSymbols.forEach(sym => {
    const asset = assetsData[sym];
    if (asset) {
      elements.externalQuotesList.innerHTML += createQuoteRowHTML(asset);
    }
  });

  // Renderiza Internos
  internalSymbols.forEach(sym => {
    const asset = assetsData[sym];
    if (asset) {
      elements.internalQuotesList.innerHTML += createQuoteRowHTML(asset);
    }
  });

  // Calcula subtotais isoladamente para a tela de cada bloco
  const subtotalExtVal = window.TradingAppLogic.calculateChange('externo', assetsData);
  const subtotalIntVal = window.TradingAppLogic.calculateChange('interno', assetsData);

  elements.subtotalExternal.innerHTML = `Subtotal: <span class="${subtotalExtVal > 0 ? 'text-green' : subtotalExtVal < 0 ? 'text-red' : ''}">${formatPercent(subtotalExtVal)}</span>`;
  elements.subtotalInternal.innerHTML = `Subtotal: <span class="${subtotalIntVal > 0 ? 'text-green' : subtotalIntVal < 0 ? 'text-red' : ''}">${formatPercent(subtotalIntVal)}</span>`;

  // Destaca o card ativo e reduz a opacidade do inativo
  if (activeScenario === 'interno') {
    elements.cardInternal.className = 'card card-active';
    elements.cardExternal.className = 'card card-inactive';
  } else {
    elements.cardExternal.className = 'card card-active';
    elements.cardInternal.className = 'card card-inactive';
  }
}

/**
 * Renderiza o Painel Principal de Abertura.
 */
function renderMainPanel(activeScenario, change, direction, intensity) {
  if (!elements.mainChange || !elements.mainDirection || !elements.mainIntensity) return;

  // Valor do Change Principal
  elements.mainChange.innerHTML = formatPercent(change);
  elements.mainChange.className = `change-value ${change > 0 ? 'text-green' : change < 0 ? 'text-red' : 'text-gray'}`;

  // Direção e Seta
  elements.mainDirection.innerHTML = direction.label;
  elements.mainDirectionArrow.innerHTML = direction.arrow;
  
  // Ajuste visual no painel principal dependendo do sinal
  const headerCard = document.getElementById('main-decision-card');
  headerCard.className = `decision-card ${direction.colorClass}`;

  // Intensidade
  elements.mainIntensity.innerHTML = intensity.label;
  elements.mainIntensity.className = `badge badge-intensity ${intensity.colorClass}`;

  // Motivo do Cenário Ativo
  elements.activeScenarioTag.innerHTML = activeScenario.toUpperCase();
  if (activeScenario === 'interno') {
    elements.activeScenarioReason.innerHTML = 'Existe notícia econômica de alto impacto (3 estrelas) hoje no Brasil.';
  } else {
    elements.activeScenarioReason.innerHTML = 'Nenhuma notícia econômica de alto impacto agendada para o Brasil hoje.';
  }

  // Orientação Operacional
  elements.guidanceText.innerHTML = direction.orientation;
}

/**
 * Renderiza os Alertas de Discrepância.
 */
function renderDiscrepancies(discrepancies) {
  if (!elements.discrepancyContainer || !elements.discrepancyList) return;

  elements.discrepancyList.innerHTML = '';
  
  // Atualiza também o checklist operacional para alertar no item correspondente
  const chkDiscrepancy = document.getElementById('chk-discrepancy-status');
  const discrepancyLabel = document.getElementById('label-discrepancy-status');

  if (!discrepancies || discrepancies.length === 0) {
    elements.discrepancyContainer.classList.add('hidden');
    
    // Atualiza checklist para OK
    if (chkDiscrepancy) {
      chkDiscrepancy.checked = true;
      discrepancyLabel.innerHTML = 'Filtro: Sem discrepâncias detectadas';
      discrepancyLabel.className = 'text-green';
    }
    return;
  }

  elements.discrepancyContainer.classList.remove('hidden');
  
  // Atualiza checklist para FALHA/ALERTA
  if (chkDiscrepancy) {
    chkDiscrepancy.checked = false;
    discrepancyLabel.innerHTML = 'Filtro: ALERTA DE DISCREPÂNCIA!';
    discrepancyLabel.className = 'text-yellow font-bold';
  }

  discrepancies.forEach(disc => {
    const li = document.createElement('li');
    li.innerHTML = `<span class="warning-icon">⚠</span> <span class="warning-text">${disc.message}</span>`;
    elements.discrepancyList.appendChild(li);
  });
}

/**
 * Configura os controles do painel de Mock no footer/widget.
 */
function setupMockControls(onReloadCallback) {
  const isMock = window.TradingAppAPI.isMockActive();
  const activeScenario = window.localStorage.getItem('mock_scenario') || 'interno_normal';

  // Cria o widget se ele não existir
  if (elements.mockContainer) {
    elements.mockContainer.innerHTML = `
      <div class="mock-widget">
        <div class="mock-header">
          <span class="mock-title">⚙ CONSOLE DE SIMULAÇÃO (TESTES)</span>
          <label class="switch">
            <input type="checkbox" id="mock-enable-toggle" ${isMock ? 'checked' : ''}>
            <span class="slider round"></span>
          </label>
        </div>
        <div class="mock-body ${isMock ? '' : 'disabled-area'}">
          <label for="mock-scenario-select">Cenário a Simular:</label>
          <select id="mock-scenario-select" ${isMock ? '' : 'disabled'}>
            <option value="interno_normal" ${activeScenario === 'interno_normal' ? 'selected' : ''}>Abertura Interna (Normal - Sem Discrepâncias)</option>
            <option value="externo_normal" ${activeScenario === 'externo_normal' ? 'selected' : ''}>Abertura Externa (Normal)</option>
            <option value="discrepancia_isolado" ${activeScenario === 'discrepancia_isolado' ? 'selected' : ''}>Discrepância: Ativo Isolado Forte (>60% do total)</option>
            <option value="discrepancia_opostas" ${activeScenario === 'discrepancia_opostas' ? 'selected' : ''}>Discrepância: Forças Opostas (>2% e <-2%)</option>
          </select>
        </div>
      </div>
    `;

    // Vincula Event Listeners
    const toggle = document.getElementById('mock-enable-toggle');
    const select = document.getElementById('mock-scenario-select');

    toggle.addEventListener('change', (e) => {
      window.localStorage.setItem('mock_active', e.target.checked ? 'true' : 'false');
      if (select) select.disabled = !e.target.checked;
      document.querySelector('.mock-body').classList.toggle('disabled-area', !e.target.checked);
      onReloadCallback();
    });

    if (select) {
      select.addEventListener('change', (e) => {
        window.localStorage.setItem('mock_scenario', e.target.value);
        onReloadCallback();
      });
    }
  }
}

// Exportações das funções de renderização
window.TradingAppUI = {
  startClock,
  setLoading,
  showError,
  hideError,
  updateSyncStatus,
  renderEconomicCalendar,
  renderQuotes,
  renderMainPanel,
  renderDiscrepancies,
  setupMockControls
};
