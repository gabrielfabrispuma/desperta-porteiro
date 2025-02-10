document.addEventListener('DOMContentLoaded', function() {
    const loginScreen = document.getElementById('loginScreen');
    const mainScreen = document.getElementById('mainScreen');
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');

    // Credenciais válidas
    const validUsername = "gabriel.marcal";
    const validPassword = "@Fabrispuma01";

    // Verifica o login
    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (username === validUsername && password === validPassword) {
            loginScreen.style.display = 'none';
            mainScreen.style.display = 'block';
            loadAPIData(); // Carrega os dados da API
        } else {
            loginError.style.display = 'block';
        }
    });

    // Carrega os dados da API
    function loadAPIData() {
        fetch('https://api-desperta.onrender.com/config')
            .then(response => response.json())
            .then(data => {
                document.getElementById('startTime').value = `${String(data.startHour).padStart(2, '0')}:${String(data.startMinute).padStart(2, '0')}`;
                document.getElementById('endTime').value = `${String(data.endHour).padStart(2, '0')}:${String(data.endMinute).padStart(2, '0')}`;
                document.getElementById('interval').value = data.interval;
                document.getElementById('email').value = data.email1;
            })
            .catch(error => {
                console.error('Erro ao carregar dados da API:', error);
            });
    }

    // Envia o formulário de configuração
    document.getElementById('configForm').addEventListener('submit', function(event) {
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

        // Exibe os dados formatados no modal
        document.getElementById('modalContent').innerHTML = `
            <p><strong>Horário de Início:</strong> ${startTime}</p>
            <p><strong>Horário de Fim:</strong> ${endTime}</p>
            <p><strong>Intervalo entre Marcações:</strong> ${interval} minutos</p>
            <p><strong>E-mail:</strong> ${email}</p>
        `;
        document.getElementById('confirmationModal').style.display = 'flex';

        // Confirma e envia os dados para a API
        document.getElementById('confirmBtn').onclick = function() {
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

        // Cancela e fecha o modal
        document.getElementById('cancelBtn').onclick = function() {
            document.getElementById('confirmationModal').style.display = 'none';
        };
    });
});