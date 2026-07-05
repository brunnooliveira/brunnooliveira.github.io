/**
 * app.js
 * Orquestrador principal da aplicação. Inicializa os relógios,
 * carrega os dados em paralelo e coordena os componentes de lógica e UI.
 */

/**
 * Função principal para buscar dados e atualizar toda a interface.
 */
async function refreshDashboard() {
  window.TradingAppUI.setLoading(true);
  window.TradingAppUI.hideError();

  try {
    // 1. Carrega todos os dados (Investings + TradingView cotações)
    const dashboardData = await window.TradingAppAPI.loadAllDashboardData();
    
    // 2. Extrai calendário e cotações
    const { calendar, assets } = dashboardData;
    
    // 3. Determina o Cenário (Interno se houver notícias high no Brasil, senão Externo)
    const activeScenario = window.TradingAppLogic.determineActiveScenario(calendar.events);
    
    // 4. Calcula o Change Consolidado do Cenário Ativo
    const totalChange = window.TradingAppLogic.calculateChange(activeScenario, assets);
    
    // 5. Classifica Intensidade e Direção
    const intensity = window.TradingAppLogic.classifyIntensity(totalChange);
    const direction = window.TradingAppLogic.classifyDirection(totalChange);
    
    // 6. Detecta Discrepâncias Operacionais
    const discrepancies = window.TradingAppLogic.detectDiscrepancies(activeScenario, assets, totalChange);
    
    // 7. Renderiza os Componentes da UI
    window.TradingAppUI.renderMainPanel(activeScenario, totalChange, direction, intensity);
    window.TradingAppUI.renderEconomicCalendar(calendar);
    window.TradingAppUI.renderQuotes(assets, activeScenario);
    window.TradingAppUI.renderDiscrepancies(discrepancies);
    
    // 8. Finaliza
    window.TradingAppUI.updateSyncStatus();
    window.TradingAppUI.setLoading(false);
  } catch (error) {
    console.error('[APP] Falha ao atualizar o painel:', error);
    
    // Tratamento de erros customizados (CORS ou falhas de rede)
    let errMessage = 'Erro ao processar as requisições das APIs externas.';
    if (error.message && error.message.includes('Failed to fetch')) {
      errMessage = `
        <strong>Erro de Conexão ou CORS Detectado</strong><br><br>
        O navegador bloqueou as requisições para as APIs externas da Investing.com ou TradingView por restrições de CORS.<br><br>
        <strong>Solução:</strong> Por favor, ative a extensão de browser para desbloqueio de CORS (ex: <em>CORS Unblock</em> ou <em>Allow CORS</em>) e tente novamente.
      `;
    } else {
      errMessage = `
        <strong>Erro Operacional:</strong> ${error.message || 'Falha desconhecida no carregamento dos dados.'}<br><br>
        Verifique sua conexão ou tente recarregar o painel.
      `;
    }
    
    window.TradingAppUI.showError(errMessage);
  }
}

// Inicializa a aplicação ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
  // Inicia relógio dinâmico (BRT)
  window.TradingAppUI.startClock();
  
  // Vincula botões de recarregamento
  const btnRefresh = document.getElementById('btn-refresh');
  const btnRetry = document.getElementById('btn-retry');
  
  if (btnRefresh) {
    btnRefresh.addEventListener('click', refreshDashboard);
  }
  if (btnRetry) {
    btnRetry.addEventListener('click', refreshDashboard);
  }

  // Configura e exibe o console de Mock/Simulação
  window.TradingAppUI.setupMockControls(refreshDashboard);

  // Primeiro carregamento
  refreshDashboard();
});
