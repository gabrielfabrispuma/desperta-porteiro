document.addEventListener('DOMContentLoaded', function () {
    // Elementos da tela de login
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
    const confirmationModal = document.getElementById('confirmationModal');

    // Modais de configurações do usuário
    const userSettingsModal = document.getElementById('userSettingsModal');
    const openUserSettingsModal = document.getElementById('openUserSettingsModal');
    const closeUserSettingsModal = document.getElementById('closeUserSettingsModal');
    const userSettingsForm = document.getElementById('userSettingsForm');

    // Campos de configuração
    const startTimeInput = document.getElementById('startTime');
    const endTimeInput = document.getElementById('endTime');
    const intervalSelect = document.getElementById('interval');
    const emailInput = document.getElementById('email');

    // URL do backend
    const backendURL = 'processar_login.php';

    let originalEmailConfig = {};
    let originalUserSettings = {};

    // Helpers Functions
    const togglePasswordVisibility = () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        togglePassword.classList.toggle('fa-eye-slash');
    };

    const displayLoginError = (message) => {
        loginError.textContent = message;
        loginError.style.display = 'block';
    };

    const hideLoginError = () => {
        loginError.style.display = 'none';
    };

    const showMainScreen = () => {
        loginScreen.style.display = 'none';
        mainScreen.style.display = 'block';
    };

    const clearEmailConfigForm = () => {
        document.getElementById('smtpHost').value = '';
        document.getElementById('smtpPort').value = '';
        document.getElementById('authorEmail').value = '';
        document.getElementById('authorPassword').value = '';
    };

    const clearUserSettingsForm = () => {
        document.getElementById('newUsername').value = '';
        document.getElementById('newEmail').value = '';
        document.getElementById('newPassword').value = '•••••';
    }

    // Funções para Status (ESP32)
    function updateStatus(isOnline) {
        const statusLed = document.getElementById('statusLed');
        const modalStatus = document.getElementById('modalStatus');
        statusLed.classList.remove('online', 'offline');
        statusLed.classList.add(isOnline ? 'online' : 'offline');
        modalStatus.textContent = isOnline ? 'Online' : 'Offline';
    }

    function checkOperatingHours(startHour, startMinute, endHour, endMinute) {
        const now = new Date();
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();

        const startTime = new Date();
        startTime.setHours(startHour, startMinute, 0, 0);

        const endTime = new Date();
        endTime.setHours(endHour, endMinute, 0, 0);

        if (startTime < endTime) {
            return currentHours >= startHour && currentMinutes >= startMinute && currentHours <= endHour && currentMinutes <= endMinute;
        } else {
            return (currentHours >= startHour && currentMinutes >= startMinute) || (currentHours <= endHour && currentMinutes <= endMinute);
        }
    }

    function loadAPIData(isRefresh = false) {
        fetch('https://api-desperta.onrender.com/config')
            .then(response => response.json())
            .then(data => {
                document.getElementById('modalDeviceId').textContent = "Desperta_Porteiro_01";

                if (data.esp32Status.timestamp) {
                    const apiTimestamp = parseInt(data.esp32Status.timestamp) * 1000;
                    const currentTimestamp = Date.now();
                    const adjustedCurrentTimestamp = currentTimestamp - 10800000;
                    const difference = adjustedCurrentTimestamp - apiTimestamp;

                    const apiDate = new Date(apiTimestamp);
                    const adjustedCurrentDate = new Date(adjustedCurrentTimestamp);

                    if (difference > 10000) {
                        updateStatus(false);
                        document.getElementById('modalIpAddress').textContent = "0.0.0.0";
                        document.getElementById('operatingStatus').textContent = "N/A";
                    } else {
                        updateStatus(true);
                        document.getElementById('modalIpAddress').textContent = data.esp32Status.ipAddress;
                        const isOperating = checkOperatingHours(data.startHour, data.startMinute, data.endHour, data.endMinute);
                        document.getElementById('operatingStatus').textContent = isOperating ? "Em horário de funcionamento" : "Fora do horário de funcionamento";
                    }

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
                    updateStatus(false);
                    document.getElementById('modalLastUpdate').textContent = "N/A";
                    document.getElementById('modalIpAddress').textContent = "0.0.0.0";
                    document.getElementById('operatingStatus').textContent = "N/A";
                }

                if (isRefresh) {
                    alert('Status atualizado com sucesso!');
                }

            })
            .catch(error => {
                console.error('Erro ao carregar dados da API:', error);
                if (isRefresh) {
                    alert('Erro ao atualizar o status. Verifique a conexão com a API.');
                }
            });
    }

    function setEmailConfigForm(data) {
        document.getElementById('smtpHost').value = data.smtp_host;
        document.getElementById('smtpPort').value = data.smtp_port;
        document.getElementById('authorEmail').value = data.author_email;
        document.getElementById('authorPassword').value = data.author_password; // Preenche a senha
    }

    function setUserSettingsForm(data){
        document.getElementById('newUsername').value = data.username;
        document.getElementById('newEmail').value = data.email;
    }

    // Event Listeners
    togglePassword.addEventListener('click', togglePasswordVisibility);

    loginForm.addEventListener('submit', function (event) {
        event.preventDefault();
        hideLoginError();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        const formData = new URLSearchParams();
        formData.append('action', 'login');
        formData.append('username', username);
        formData.append('password', password);

        fetch(backendURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showMainScreen();
                    loadConfigData();

                    if (data.config_smtp) {
                        document.getElementById('smtpHost').value = data.config_smtp.smtp_host;
                        document.getElementById('smtpPort').value = data.config_smtp.smtp_port;
                        document.getElementById('authorEmail').value = data.config_smtp.author_email;
                        document.getElementById('authorPassword').value = '•••••';
                    }
                } else {
                    displayLoginError(data.message);
                }
            })
            .catch(error => {
                console.error('Erro na requisição:', error);
                displayLoginError('Erro ao comunicar com o servidor.');
            });
    });

    // Abre o modal de configurações de e-mail
    openEmailConfigModal.addEventListener('click', function () {
        fetch(backendURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `action=carregar_config_smtp`
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                setEmailConfigForm(data.config_smtp);
                originalEmailConfig = {...data.config_smtp};
            } else {
                alert('Erro ao carregar configurações de e-mail: ' + data.message);
            }
            emailConfigModal.style.display = 'flex';
            document.getElementById('authorPassword').value = '•••••';

        })
        .catch(error => {
            console.error('Erro na requisição:', error);
            alert('Erro ao comunicar com o servidor.');
        });

    });

    // Fecha o modal de configurações de e-mail
    closeEmailConfigModal.addEventListener('click', function () {
        setEmailConfigForm(originalEmailConfig); // Restaura os valores originais
        emailConfigModal.style.display = 'none';
        document.getElementById('authorPassword').value = '•••••'; // Mantém a exibição da senha mascarada
    });

    // Abre o modal de configurações do usuário
    openUserSettingsModal.addEventListener('click', function () {

        fetch(backendURL, {
             method: 'POST',
             headers: {
                 'Content-Type': 'application/x-www-form-urlencoded'
             },
             body: `action=carregar_config_usuario`
         })
        .then(response => response.json())
        .then(data => {
             if (data.success) {
                 setUserSettingsForm(data.config_usuario);
                 originalUserSettings = {...data.config_usuario};
             } else {
                 alert('Erro ao carregar configurações de usuário: ' + data.message);
             }
             userSettingsModal.style.display = 'flex';
             document.getElementById('newPassword').value = '•••••';
        })
        .catch(error => {
             console.error('Erro na requisição:', error);
             alert('Erro ao comunicar com o servidor.');
        });

    });

     // Fecha o modal de configurações do usuário
     closeUserSettingsModal.addEventListener('click', function () {
        setUserSettingsForm(originalUserSettings); // Restaura os valores originais
        userSettingsModal.style.display = 'none';
        document.getElementById('newPassword').value = '•••••'; // Mantém a exibição da senha mascarada
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

    // Funções de configuração
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
        confirmationModal.style.display = 'flex';

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
                    confirmationModal.style.display = 'none';
                })
                .catch(error => {
                    console.error('Erro ao salvar configurações:', error);
                });
        };

        // Cancela e fecha o modal de confirmação
        document.getElementById('cancelBtn').onclick = function () {
            confirmationModal.style.display = 'none';
        };
    });

    // Lidar com o envio do formulário de configurações do usuário
    userSettingsForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const newUsername = document.getElementById('newUsername').value;
        const newEmail = document.getElementById('newEmail').value;
        const newPassword = document.getElementById('newPassword').value === '•••••' ? '' : document.getElementById('newPassword').value;

        const formData = new URLSearchParams();
        formData.append('action', 'salvar_config_usuario');
        formData.append('new_username', newUsername);
        formData.append('new_email', newEmail);
        formData.append('new_password', newPassword);

        fetch(backendURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Configurações de usuário salvas com sucesso!');
                    userSettingsModal.style.display = 'none';
                    clearUserSettingsForm();
                } else {
                    alert('Erro ao salvar configurações de usuário: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Erro na requisição:', error);
                alert('Erro ao comunicar com o servidor.');
            });
    });

    emailConfigForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const smtpHost = document.getElementById('smtpHost').value;
        const smtpPort = document.getElementById('smtpPort').value;
        const authorEmail = document.getElementById('authorEmail').value;
        const authorPassword = document.getElementById('authorPassword').value;

        const formData = new URLSearchParams();
        formData.append('action', 'salvar_config_smtp');
        formData.append('smtp_host', smtpHost);
        formData.append('smtp_port', smtpPort);
        formData.append('author_email', authorEmail);
        formData.append('author_password', authorPassword);

        fetch(backendURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Configurações de e-mail salvas com sucesso!');
                    emailConfigModal.style.display = 'none';
                    originalEmailConfig = {
                        smtp_host: smtpHost,
                        smtp_port: smtpPort,
                        author_email: authorEmail,
                        author_password: authorPassword
                    };
                } else {
                    alert('Erro ao salvar configurações de e-mail: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Erro na requisição:', error);
                alert('Erro ao comunicar com o servidor.');
            });
    });
});