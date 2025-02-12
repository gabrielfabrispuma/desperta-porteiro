document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    const loginScreen = document.getElementById('loginScreen');
    const mainScreen = document.getElementById('mainScreen');
    const loginError = document.getElementById('loginError');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const currentYear = document.getElementById('currentYear');
    const recoverPasswordLink = document.getElementById('recoverPasswordLink');
    const openStatusModalBtn = document.getElementById('openStatusModal');
    const statusModal = document.getElementById('statusModal');
    const closeStatusModalBtn = document.getElementById('closeStatusModal');
    const openEmailConfigModalBtn = document.getElementById('openEmailConfigModal');
    const emailConfigModal = document.getElementById('emailConfigModal');
    const closeEmailConfigModalBtn = document.getElementById('closeEmailConfigModal');
    const emailConfigForm = document.getElementById('emailConfigForm');
    const smtpHostInput = document.getElementById('smtpHost');
    const smtpPortInput = document.getElementById('smtpPort');
    const authorEmailInput = document.getElementById('authorEmail');
    const authorPasswordInput = document.getElementById('authorPassword');
    const refreshStatusBtn = document.getElementById('refreshStatus');
    const statusLed = document.getElementById('statusLed');
    const modalStatus = document.getElementById('modalStatus');
    const openUserSettingsModalBtn = document.getElementById('openUserSettingsModal');
    const userSettingsModal = document.getElementById('userSettingsModal');
    const closeUserSettingsModalBtn = document.getElementById('closeUserSettingsModal');
    const userSettingsForm = document.getElementById('userSettingsForm');
    const newUsernameInput = document.getElementById('newUsername');
    const newEmailInput = document.getElementById('newEmail');
    const newPasswordInput = document.getElementById('newPassword');

    // Função para exibir mensagens de erro
    function displayError(message) {
        alert(message); // Usando alert para exibir a mensagem de erro
    }

    // Função para validar se um valor é um número inteiro positivo
    function isValidPositiveInteger(value) {
        return /^\d+$/.test(value) && Number(value) > 0;
    }

    // Função para formatar a data e hora
    function formatDateTime(date) {
        let year = date.getFullYear();
        let month = String(date.getMonth() + 1).padStart(2, '0'); // Adiciona um zero à esquerda se for necessário
        let day = String(date.getDate()).padStart(2, '0'); // Adiciona um zero à esquerda se for necessário
        let hours = String(date.getHours()).padStart(2, '0'); // Adiciona um zero à esquerda se for necessário
        let minutes = String(date.getMinutes()).padStart(2, '0'); // Adiciona um zero à esquerda se for necessário
        let seconds = String(date.getSeconds()).padStart(2, '0'); // Adiciona um zero à esquerda se for necessário

        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    }

    // Mascara para deixar somente numeros
    function onlyNumbers(event) {
        let charCode = (event.which) ? event.which : event.keyCode
        if (charCode > 31 && (charCode < 48 || charCode > 57)) {
            event.preventDefault();
        }
        return true;
    }

    // Atualiza o ano atual no rodapé
    currentYear.textContent = new Date().getFullYear();

    // Alternar a visibilidade da senha
    togglePassword.addEventListener('click', function (e) {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.classList.toggle('fa-eye-slash');
    });

    // Função para mostrar a tela principal e esconder a tela de login
    function showMainScreen() {
        loginScreen.style.display = 'none';
        mainScreen.style.display = 'block';
    }

    // Função para mostrar a tela de login e esconder a tela principal
    function showLoginScreen() {
        mainScreen.style.display = 'none';
        loginScreen.style.display = 'block';
    }

    // Função para abrir um modal
    function openModal(modal) {
        modal.style.display = 'flex';
    }

    // Função para fechar um modal
    function closeModal(modal) {
        modal.style.display = 'none';
    }

    // Evento de envio do formulário de login
    loginForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        fetch('processar_login.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=login&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    showMainScreen();
                    // Carrega as configurações SMTP e API após o login bem-sucedido
                    loadSmtpConfig();
                    loadApiData();
                } else {
                    loginError.textContent = data.message;
                    loginError.style.display = 'block';
                }
            })
            .catch(error => {
                console.error('Erro na requisição:', error);
                loginError.textContent = 'Erro ao comunicar com o servidor.';
                loginError.style.display = 'block';
            });
    });

    // Recuperar Senha
    recoverPasswordLink.addEventListener('click', function (event) {
        event.preventDefault();
        alert('Para recuperar a senha, entre em contato com o administrador do sistema.');
    });

    // MODAL DE STATUS
    openStatusModalBtn.addEventListener('click', function () {
        openModal(statusModal);
        updateStatus();
    });

    closeStatusModalBtn.addEventListener('click', function () {
        closeModal(statusModal);
    });

    // Evento para fechar o modal ao clicar fora dele
    window.addEventListener('click', function (event) {
        if (event.target == statusModal) {
            closeModal(statusModal);
        }
        if (event.target == emailConfigModal) {
            closeModal(emailConfigModal);
        }
        if (event.target == userSettingsModal) {
            closeModal(userSettingsModal);
        }
    });

    // MODAL DE CONFIGURAÇÕES DE E-MAIL
    openEmailConfigModalBtn.addEventListener('click', function () {
        openModal(emailConfigModal);
    });

    closeEmailConfigModalBtn.addEventListener('click', function () {
        closeModal(emailConfigModal);
    });

    // Salvar configurações de e-mail SMTP
    emailConfigForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const smtpHost = smtpHostInput.value;
        const smtpPort = smtpPortInput.value;
        const authorEmail = authorEmailInput.value;
        const authorPassword = authorPasswordInput.value;

        // Validações
        if (!smtpHost) {
            displayError('Por favor, preencha o campo Host SMTP.');
            return;
        }

        if (!smtpPort) {
            displayError('Por favor, preencha o campo Porta SMTP.');
            return;
        }

        if (!isValidPositiveInteger(smtpPort)) {
            displayError('A Porta SMTP deve ser um número inteiro positivo.');
            return;
        }

        if (!authorEmail) {
            displayError('Por favor, preencha o campo E-mail Remetente.');
            return;
        }

        if (!authorPassword) {
            displayError('Por favor, preencha o campo Senha do Remetente.');
            return;
        }

        fetch('processar_login.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=salvar_config_smtp&smtp_host=${encodeURIComponent(smtpHost)}&smtp_port=${encodeURIComponent(smtpPort)}&author_email=${encodeURIComponent(authorEmail)}&author_password=${encodeURIComponent(authorPassword)}`
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    alert(data.message);
                    closeModal(emailConfigModal);
                } else {
                    displayError(data.message);
                }
            })
            .catch(error => {
                console.error('Erro na requisição:', error);
                displayError('Erro ao comunicar com o servidor.');
            });
    });

    // Carregar configurações SMTP ao abrir o modal
    function loadSmtpConfig() {
        fetch('processar_login.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'action=carregar_config_smtp'
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success && data.config_smtp) {
                    smtpHostInput.value = data.config_smtp.smtp_host;
                    smtpPortInput.value = data.config_smtp.smtp_port;
                    authorEmailInput.value = data.config_smtp.author_email;
                    authorPasswordInput.value = ""; // Não exibir a senha por segurança
                } else {
                    displayError(data.message || 'Erro ao carregar as configurações SMTP.');
                }
            })
            .catch(error => {
                console.error('Erro na requisição:', error);
                displayError('Erro ao comunicar com o servidor.');
            });
    }

    // MODAL DE CONFIGURAÇÕES DO USUÁRIO
    openUserSettingsModalBtn.addEventListener('click', function () {
        openModal(userSettingsModal);
        loadUserSettings();
    });

    closeUserSettingsModalBtn.addEventListener('click', function () {
        closeModal(userSettingsModal);
    });

    // Carregar configurações do usuário
    function loadUserSettings() {
        fetch('processar_login.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'action=carregar_config_usuario'
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success && data.config_usuario) {
                    newUsernameInput.value = data.config_usuario.username;
                    newEmailInput.value = data.config_usuario.email;
                    newPasswordInput.value = ""; // Limpar o campo de senha por segurança
                } else {
                    displayError(data.message || 'Erro ao carregar as configurações do usuário.');
                }
            })
            .catch(error => {
                console.error('Erro na requisição:', error);
                displayError('Erro ao comunicar com o servidor.');
            });
    }

    // Salvar configurações do usuário
    userSettingsForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const newUsername = newUsernameInput.value;
        const newEmail = newEmailInput.value;
        const newPassword = newPasswordInput.value;

        fetch('processar_login.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=salvar_config_usuario&new_username=${encodeURIComponent(newUsername)}&new_email=${encodeURIComponent(newEmail)}&new_password=${encodeURIComponent(newPassword)}`
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    alert(data.message);
                    closeModal(userSettingsModal);
                } else {
                    displayError(data.message);
                }
            })
            .catch(error => {
                console.error('Erro na requisição:', error);
                displayError('Erro ao comunicar com o servidor.');
            });
    });

    // API
    function loadApiData() {
        fetch('processar_login.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'action=login' // Enviando uma ação genérica para acionar a rota de login no PHP
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    // Verifica se a resposta contém dados da API
                    if (data.config_api) {
                        // Manipula os dados da API conforme necessário
                        console.log('Dados da API:', data.config_api);
                        // Exemplo: Preencher campos de formulário com os dados da API
                        // document.getElementById('startTime').value = data.config_api.start_time;
                        // document.getElementById('endTime').value = data.config_api.end_time;
                        // document.getElementById('interval').value = data.config_api.interval;
                        // document.getElementById('email').value = data.config_api.email;
                    } else {
                        console.log('Nenhum dado da API retornado.');
                    }
                } else {
                    console.log('Falha ao obter dados da API:', data.message);
                }
            })
            .catch(error => {
                console.error('Erro ao obter dados da API:', error);
            });
    }

    // Status
    function updateStatus() {
        fetch('https://api-desperta.onrender.com/status')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro HTTP: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                // Verificar se a API retornou um status 200
                if (data.status === 200) {
                    // Atualizar o LED de status e a mensagem de status
                    statusLed.classList.remove('offline');
                    statusLed.classList.add('online');
                    modalStatus.textContent = 'Online';

                    // Atualizar os outros campos com os dados retornados
                    document.getElementById('modalDeviceId').textContent = data.device_id;
                    document.getElementById('modalIpAddress').textContent = data.ip_address;

                    // Formatar a data e hora da última atualização
                    let lastUpdate = new Date(data.last_update);
                    document.getElementById('modalLastUpdate').textContent = formatDateTime(lastUpdate);

                    // Lógica para o status de funcionamento
                    let operating = data.operating ? 'Em funcionamento' : 'Parado';
                    document.getElementById('operatingStatus').textContent = operating;
                } else {
                    // Se o status não for 200, atualizar o LED para offline e exibir a mensagem de erro da API
                    statusLed.classList.remove('online');
                    statusLed.classList.add('offline');
                    modalStatus.textContent = 'Offline';
                    document.getElementById('operatingStatus').textContent = 'Erro ao obter status.';
                }
            })
            .catch(error => {
                console.error('Erro ao buscar o status:', error);
                statusLed.classList.remove('online');
                statusLed.classList.add('offline');
                modalStatus.textContent = 'Offline';
                document.getElementById('operatingStatus').textContent = 'Erro ao obter status.';
            });
    }

    refreshStatusBtn.addEventListener('click', updateStatus);
});