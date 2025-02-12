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

    const emailConfigModal = document.getElementById('emailConfigModal');
    const openEmailConfigModal = document.getElementById('openEmailConfigModal');
    const closeEmailConfigModal = document.getElementById('closeEmailConfigModal');
    const emailConfigForm = document.getElementById('emailConfigForm');

    // Campos de configuração
    const startTimeInput = document.getElementById('startTime');
    const endTimeInput = document.getElementById('endTime');
    const intervalSelect = document.getElementById('interval');
    const emailInput = document.getElementById('email');


    // Credenciais válidas
    const validUsername = "gabriel.marcal";
    const validPassword = "@Fabrispuma01";

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
            loadConfigData(); // Carrega os dados de configuração no carregamento da tela principal
            //loadAPIData(); // Carrega os dados da API

            // Inicia a atualização automática do status a cada 40 segundos
            // if (statusUpdateInterval) {
            //     clearInterval(statusUpdateInterval); // Limpa o intervalo anterior, se existir
            // }
            // statusUpdateInterval = setInterval(loadAPIData, 30000); // 30 segundos
        } else {
            loginError.style.display = 'block';
        }
    });

    // Função para carregar os dados de configuração e preencher os campos
    function loadConfigData() {
        fetch('https://api-desperta.onrender.com/config')
            .then(response => response.json())
            .then(data => {
                startTimeInput.value = `${String(data.startHour).padStart(2, '0')}:${String(data.startMinute).padStart(2, '0')}`;
                endTimeInput.value = `${String(data.endHour).padStart(2, '0')}:${String(data.endMinute).padStart(2, '0')}`;
                intervalSelect.value = data.interval;
                emailInput.value = data.email1;
            })
            .catch(error => {
                console.error('Erro ao carregar dados de configuração:', error);
                alert('Erro ao carregar dados de configuração. Verifique a conexão com a API.');
            });
    }


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
                //document.getElementById('startTime').value = `${String(data.startHour).padStart(2, '0')}:${String(data.startMinute).padStart(2, '0')}`;
                //document.getElementById('endTime').value = `${String(data.endHour).padStart(2, '0')}:${String(data.endMinute).padStart(2, '0')}`;
                //document.getElementById('interval').value = data.interval;
                //document.getElementById('email').value = data.email1;

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

                    // Se a diferença for maior que 10 segundos, define o status como offline
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
                    document.getElementById('modalLastUpdate').textContent = apiDate.toLocaleString('pt-BR', {
                        timeZone: 'UTC',
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    });
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
        // Inicia a atualização automática do status a cada 30 segundos
        if (statusUpdateInterval) {
            clearInterval(statusUpdateInterval); // Limpa o intervalo anterior, se existir
        }
        statusUpdateInterval = setInterval(loadAPIData, 30000); // 30 segundos
    });

    // Fecha o modal de status
    closeStatusModal.addEventListener('click', function () {
        statusModal.style.display = 'none';
        clearInterval(statusUpdateInterval); // Limpa o intervalo quando o modal é fechado
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

    // Abre o modal de configurações de e-mail
    openEmailConfigModal.addEventListener('click', function () {
        // Carrega as configurações de e-mail da API antes de abrir o modal
        fetch('https://api-desperta.onrender.com/config')
            .then(response => response.json())
            .then(data => {
                if (data.configSmtp) {
                    document.getElementById('smtpHost').value = data.configSmtp.smtpHost;
                    document.getElementById('smtpPort').value = data.configSmtp.smtpPort;
                    document.getElementById('authorEmail').value = data.configSmtp.authorEmail;
                    document.getElementById('authorPassword').value = data.configSmtp.authorPassword;
                }
                emailConfigModal.style.display = 'flex'; // Abre o modal
            })
            .catch(error => {
                console.error('Erro ao carregar configurações de e-mail:', error);
                alert('Erro ao carregar configurações de e-mail. Verifique a conexão com a API.');
            });
    });

    // Fecha o modal de configurações de e-mail
    closeEmailConfigModal.addEventListener('click', function () {
        emailConfigModal.style.display = 'none';
    });

    // Envia o formulário de configurações de e-mail
emailConfigForm.addEventListener('submit', function (event) {
    event.preventDefault();

    const smtpHost = document.getElementById('smtpHost').value;
    const smtpPort = document.getElementById('smtpPort').value;
    const authorEmail = document.getElementById('authorEmail').value;
    const authorPassword = document.getElementById('authorPassword').value;

    const configSmtp = {
        smtpHost: smtpHost,
        smtpPort: parseInt(smtpPort),
        authorEmail: authorEmail,
        authorPassword: authorPassword
    };

    // Primeiro, buscar a configuração atual
    fetch('https://api-desperta.onrender.com/config')
        .then(response => response.json())
        .then(currentConfig => {
            // Combinar a configuração atual com a nova configuração SMTP
            const updatedConfig = {
                ...currentConfig, // Manter a configuração atual
                configSmtp: configSmtp // Sobrescrever/adicionar configSmtp
            };

            // Remover campos que não devem ser enviados de volta
            delete updatedConfig._id;
            delete updatedConfig.__v;
            delete updatedConfig.esp32Status;

            // Enviar os dados combinados para a API
            fetch('https://api-desperta.onrender.com/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedConfig)
            })
                .then(response => response.json())
                .then(data => {
                    alert('Configurações de e-mail salvas com sucesso!');
                    emailConfigModal.style.display = 'none'; // Fecha o modal após salvar
                })
                .catch(error => {
                    console.error('Erro ao salvar configurações de e-mail:', error);
                    alert('Erro ao salvar configurações de e-mail. Verifique a conexão com a API.');
                });
        })
        .catch(error => {
            console.error('Erro ao buscar configurações atuais:', error);
            alert('Erro ao buscar configurações atuais. Verifique a conexão com a API.');
        });
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