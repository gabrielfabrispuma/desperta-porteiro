document.addEventListener('DOMContentLoaded', function () {
    const loginScreen = document.getElementById('loginScreen');
    const mainScreen = document.getElementById('mainScreen');
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    // Modais
    const statusModal = document.getElementById('statusModal');
    const openStatusModal = document.getElementById('openStatusModal');
    const closeStatusModal = document.getElementById('closeStatusModal');

    // Credenciais válidas
    const validUsername = "gabriel.marcal";
    const validPassword = "fabri01";

    // Variável para armazenar o intervalo de atualização
    let statusUpdateInterval;

    // Função para mostrar/esconder a senha
    togglePassword.addEventListener('click', function (e) {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.classList.toggle('fa-eye-slash');
    });

    // Verifica o login
    loginForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (username === validUsername && password === validPassword) {
            loginScreen.style.display = 'none';
            mainScreen.style.display = 'block';
            loadAPIData(); // Carrega os dados da API

            // Inicia a atualização automática do status a cada 40 segundos
            if (statusUpdateInterval) {
                clearInterval(statusUpdateInterval); // Limpa o intervalo anterior, se existir
            }
            statusUpdateInterval = setInterval(loadAPIData, 20000); // 40 segundos
        } else {
            loginError.style.display = 'block';
        }
    });

    // Função para atualizar o status na página e no modal
    function updateStatus(isOnline) {
        const statusLed = document.getElementById('statusLed');
        const modalStatus = document.getElementById('modalStatus');

        // Remove classes existentes
        statusLed.classList.remove('online', 'offline');

        // Adiciona a classe correta e define o texto
        if (isOnline) {
            statusLed.classList.add('online');
            modalStatus.textContent = 'Online';
        } else {
            statusLed.classList.add('offline');
            modalStatus.textContent = 'Offline';
        }
    }

    // Carrega os dados da API e exibe no modal
function loadAPIData(isRefresh = false) {
    fetch('https://api-desperta.onrender.com/config')
        .then(response => response.json())
        .then(data => {
            document.getElementById('startTime').value = `${String(data.startHour).padStart(2, '0')}:${String(data.startMinute).padStart(2, '0')}`;
            document.getElementById('endTime').value = `${String(data.endHour).padStart(2, '0')}:${String(data.endMinute).padStart(2, '0')}`;
            document.getElementById('interval').value = data.interval;
            document.getElementById('email').value = data.email1;

            // Exibe o status do ESP32 no modal
            document.getElementById('modalDeviceId').textContent = "Desperta_Porteiro_01"; // ID fixo

            // Verifica se o timestamp é válido
            if (data.esp32Status.timestamp) {
                const apiTimestamp = parseInt(data.esp32Status.timestamp) * 1000; // Converte para milissegundos
                const currentTimestamp = Date.now(); // Timestamp atual em milissegundos

                // Ajusta o horário atual subtraindo 3 horas (10800000 ms = 3 horas)
                const adjustedCurrentTimestamp = currentTimestamp - 10800000;

                const difference = adjustedCurrentTimestamp - apiTimestamp; // Diferença em milissegundos

                // Exibe os horários comparados no console
                const apiDate = new Date(apiTimestamp);
                const adjustedCurrentDate = new Date(adjustedCurrentTimestamp);
                console.log('Horário da última atualização da API (UTC):', apiDate.toISOString());
                console.log('Horário atual ajustado (UTC-3):', adjustedCurrentDate.toISOString());
                console.log('Diferença (ms):', difference);

                // Se a diferença for maior que 40 segundos, define o status como offline
                if (difference > 10000) {
                    console.log('Status: Offline (diferença > 10 segundos)');
                    updateStatus(false); // Offline
                    document.getElementById('modalIpAddress').textContent = "0.0.0.0"; // Define o IP como 0.0.0.0
                    document.getElementById('operatingStatus').textContent = "N/A"; // Define o status de funcionamento como N/A
                } else {
                    console.log('Status: Online (diferença <= 10 segundos)');
                    updateStatus(true); // Online
                    document.getElementById('modalIpAddress').textContent = data.esp32Status.ipAddress; // Carrega o IP da API

                    // Verifica se está em horário de funcionamento
                    const isOperating = checkOperatingHours(data.startHour, data.startMinute, data.endHour, data.endMinute);
                    document.getElementById('operatingStatus').textContent = isOperating ? "Em horário de funcionamento" : "Fora do horário de funcionamento";
                }

                // Formata a data de última atualização no formato local, ajustado para o fuso horário UTC
                document.getElementById('modalLastUpdate').textContent = apiDate.toLocaleString('pt-BR', { timeZone: 'UTC' });
            } else {
                // Se não houver timestamp, define o status como offline
                console.log('Status: Offline (sem timestamp)');
                updateStatus(false); // Offline
                document.getElementById('modalLastUpdate').textContent = "N/A";
                document.getElementById('modalIpAddress').textContent = "0.0.0.0"; // Define o IP como 0.0.0.0
                document.getElementById('operatingStatus').textContent = "N/A"; // Define o status de funcionamento como N/A
            }

            // Feedback de sucesso
            if (isRefresh) {
                alert('Status atualizado com sucesso!');
            }

        })
        .catch(error => {
            console.error('Erro ao carregar dados da API:', error);
            // Feedback de erro
            if (isRefresh) {
                alert('Erro ao atualizar o status. Verifique a conexão com a API.');
            }
        });
}

// Função para verificar se está em horário de funcionamento
function checkOperatingHours(startHour, startMinute, endHour, endMinute) {
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();

    // Cria objetos Date para o horário de início e fim
    const startTime = new Date();
    startTime.setHours(startHour, startMinute, 0, 0);

    const endTime = new Date();
    endTime.setHours(endHour, endMinute, 0, 0);

    // Verifica se o horário de início é menor que o horário de fim (funcionamento no mesmo dia)
    if (startTime < endTime) {
        return currentHours >= startHour && currentMinutes >= startMinute && currentHours <= endHour && currentMinutes <= endMinute;
    } else {
        // Caso o horário de início seja maior que o horário de fim (funcionamento que atravessa a meia-noite)
        return (currentHours >= startHour && currentMinutes >= startMinute) || (currentHours <= endHour && currentMinutes <= endMinute);
    }
}

    // Abre o modal de status
    openStatusModal.addEventListener('click', function () {
        loadAPIData(); // Carrega os dados antes de abrir
        statusModal.style.display = 'flex';
    });

    // Fecha o modal de status
    closeStatusModal.addEventListener('click', function () {
        statusModal.style.display = 'none';
    });

    // Atualiza o status (recarrega os dados)
    document.getElementById('refreshStatus').addEventListener('click', function () {
        loadAPIData(true); // Indica que a função foi chamada por um refresh
    });

    // Envia o formulário de configuração
    document.getElementById('configForm').addEventListener('submit', function (event) {
        event.preventDefault();

        const startTime = document.getElementById('startTime').value;
        const endTime = document.getElementById('endTime').value;
        const interval = document.getElementById('interval').value;
        const email = document.getElementById('email').value;

        const [startHour, startMinute] = startTime.split(':');
        const [endHour, endMinute] = endTime.split(':');

        const config = {
            startHour: parseInt(startHour),
            startMinute: parseInt(startMinute),
            endHour: parseInt(endHour),
            endMinute: parseInt(endMinute),
            interval: parseInt(interval),
            email1: email
        };

        // Exibe os dados formatados no modal de confirmação
        document.getElementById('modalContent').innerHTML = `
            <p><strong>Horário de Início:</strong> ${startTime}</p>
            <p><strong>Horário de Fim:</strong> ${endTime}</p>
            <p><strong>Intervalo entre Marcações:</strong> ${interval} minutos</p>
            <p><strong>E-mail:</strong> ${email}</p>
        `;
        document.getElementById('confirmationModal').style.display = 'flex';

        // Confirma e envia os dados para a API
        document.getElementById('confirmBtn').onclick = function () {
            fetch('https://api-desperta.onrender.com/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(config)
            })
                .then(response => response.json())
                .then(data => {
                    alert('Configurações salvas com sucesso!');
                    document.getElementById('confirmationModal').style.display = 'none';
                })
                .catch(error => {
                    console.error('Erro ao salvar configurações:', error);
                });
        };

        // Cancela e fecha o modal de confirmação
        document.getElementById('cancelBtn').onclick = function () {
            document.getElementById('confirmationModal').style.display = 'none';
        };
    });

    // Adiciona o ano atual no rodapé
    document.getElementById('currentYear').textContent = new Date().getFullYear();

    // Recuperar Senha (Simulação)
    const recoverPasswordLink = document.getElementById('recoverPasswordLink');

    recoverPasswordLink.addEventListener('click', function (event) {
        event.preventDefault();
        // Simulação de envio de e-mail (exibir mensagem)
        alert('Para recuperar sua senha, entre em contato com o suporte através do e-mail ti@fabrispuma.com.br.');
    });
});