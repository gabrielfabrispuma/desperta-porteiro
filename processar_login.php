<?php
session_start();
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
error_log("Iniciando o script processar_login.php");

// Configurações do banco de dados
$servername = "mysql873.umbler.com:41890";
$username_db = "sistemaenvio";
$password_db = "fabrispuma01";
$dbname = "controleenvio";

// Função para conectar ao banco de dados
function connect_db() {
    global $servername, $username_db, $password_db, $dbname;
    $conn = new mysqli($servername, $username_db, $password_db, $dbname);
    if ($conn->connect_error) {
        die("Erro na conexão com o banco de dados: " . $conn->connect_error);
    }
    $conn->set_charset("utf8"); // Define o charset para UTF-8
    return $conn;
}

// Função para autenticar o usuário
function autenticar_usuario($username, $password) {
    $conn = connect_db();
    $username = $conn->real_escape_string($username);
    $query = "SELECT id, username, password FROM desperta_porteiro_usu WHERE username = '$username'";
    $result = $conn->query($query);

    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        if (password_verify($password, $row['password'])) {
            $conn->close();
            return $row['id'];  // Retorna o ID do usuário
        }
    }
    $conn->close();
    return false; // Autenticação falhou
}

// Função para obter as configurações SMTP globais
function obter_configuracoes_smtp_globais() {
    $conn = connect_db();
    $query = "SELECT smtp_host, smtp_port, author_email, author_password FROM desperta_porteiro_smtp WHERE id = 1";
    $result = $conn->query($query);

    if ($result->num_rows > 0) {
        $configuracoes = $result->fetch_assoc();
        $conn->close();
        return $configuracoes;
    }
    $conn->close();
    return false; // Configurações não encontradas
}

// Função para salvar as configurações SMTP globais
function salvar_configuracoes_smtp_globais($smtp_host, $smtp_port, $author_email, $author_password = null) {
    $conn = connect_db();
    $query = "UPDATE desperta_porteiro_smtp SET smtp_host = ?, smtp_port = ?, author_email = ?, author_password = ? WHERE id = 1";
    $stmt = $conn->prepare($query);

    if ($stmt) {
        $stmt->bind_param("ssss", $smtp_host, $smtp_port, $author_email, $author_password);

        if ($stmt->execute()) {
            $stmt->close();
            $conn->close();
            return true;
        } else {
            error_log("Erro ao executar a declaração preparada: " . $stmt->error);
            $stmt->close();
            $conn->close();
            return false;
        }
    } else {
        error_log("Erro ao preparar a declaração: " . $conn->error);
        $conn->close();
        return false;
    }
}

// Função para buscar os dados da API
function obter_configuracoes_api() {
    $url = 'https://api-desperta.onrender.com/config';

    $curl = curl_init($url);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);

    $response = curl_exec($curl);

    if ($response === false) {
        error_log('Erro ao acessar a API: ' . curl_error($curl));
        curl_close($curl);
        return false;
    }

    $http_code = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    if ($http_code != 200) {
        error_log('Erro HTTP: ' . $http_code);
        curl_close($curl);
        return false;
    }

    curl_close($curl);

    $data = json_decode($response, true);
    return $data;
}

// Função para obter as configurações do usuário
function obter_configuracoes_usuario($usuario_id) {
    $conn = connect_db();
    $query = "SELECT username, email FROM desperta_porteiro_usu WHERE id = ?";
    $stmt = $conn->prepare($query);

    if ($stmt) {
        $stmt->bind_param("i", $usuario_id);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            $configuracoes = $result->fetch_assoc();
            $stmt->close();
            $conn->close();
            return $configuracoes;
        }
        $stmt->close();
    }
    $conn->close();
    return false; // Configurações não encontradas
}

// Função para salvar as configurações do usuário
function salvar_configuracoes_usuario($usuario_id, $new_username, $new_email, $new_password) {
    $conn = connect_db();
    $updates = [];
    $types = '';
    $values = [];

    if (!empty($new_username)) {
        $updates[] = "username = ?";
        $types .= 's';
        $values[] = $new_username;
    }

    if (!empty($new_email)) {
        $updates[] = "email = ?";
        $types .= 's';
        $values[] = $new_email;
    }

    if (!empty($new_password)) {
        $hashedPassword = password_hash($new_password, PASSWORD_DEFAULT);
        $updates[] = "password = ?";
        $types .= 's';
        $values[] = $hashedPassword;
    }

    if (empty($updates)) {
        $conn->close();
        return true; // Nada para atualizar
    }

    $sql = "UPDATE desperta_porteiro_usu SET " . implode(", ", $updates) . " WHERE id = ?";
    $stmt = $conn->prepare($sql);

    if ($stmt) {
        $types .= 'i'; // Tipo para o ID do usuário

        $bindParams = [];
        $bindParams[0] = &$stmt;
        $bindParams[1] = &$types;

        for ($i = 0; $i < count($values); $i++) {
            $bindParams[] = &$values[$i];
            $types .= "s";
        }
         $bindParams[] = &$usuario_id;
        $types .= "i";
       
        $stmt->bind_param($types, ...$bindParams);

        if ($stmt->execute()) {
            $stmt->close();
            $conn->close();
            return true;
        } else {
            error_log("Erro ao executar a declaração preparada: " . $stmt->error);
            $stmt->close();
            $conn->close();
            return false;
        }
    } else {
        error_log("Erro ao preparar a declaração: " . $conn->error);
        $conn->close();
        return false;
    }
}

// ================ ROTAS ================
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    if (isset($_POST["action"])) {
        $action = $_POST["action"];

        // Rota de login
        if ($action == "login") {
            $username = $_POST["username"];
            $password = $_POST["password"];

            $usuario_id = autenticar_usuario($username, $password);

            if ($usuario_id) {
                $_SESSION['usuario_id'] = $usuario_id; // Salva o ID na sessão
                $config_smtp = obter_configuracoes_smtp_globais();
                $config_api = obter_configuracoes_api();

                if ($config_smtp && $config_api) {
                    echo json_encode([
                        'success' => true,
                        'message' => 'Login realizado com sucesso!',
                        'config_smtp' => $config_smtp,
                        'config_api' => $config_api
                    ]);
                } else {
                    echo json_encode([
                        'success' => true,
                        'message' => 'Login realizado com sucesso!',
                        'config_smtp' => null,
                        'config_api' => null
                    ]);
                }
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => 'Usuário ou senha incorretos.'
                ]);
            }
        }

        // Rota para salvar configurações SMTP
        elseif ($action == "salvar_config_smtp") {
            if (!isset($_SESSION['usuario_id'])) {
                echo json_encode([
                    'success' => false,
                    'message' => 'Usuário não autenticado.'
                ]);
                exit;
            }

            $smtp_host = $_POST["smtp_host"];
            $smtp_port = $_POST["smtp_port"];
            $author_email = $_POST["author_email"];
            $author_password = $_POST["author_password"];

            if (salvar_configuracoes_smtp_globais($smtp_host, $smtp_port, $author_email, $author_password)) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Configurações SMTP salvas com sucesso!'
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => 'Erro ao salvar as configurações SMTP.'
                ]);
            }
        }

        // Rota para carregar configurações SMTP
        elseif ($action == "carregar_config_smtp") {
            if (!isset($_SESSION['usuario_id'])) {
                echo json_encode([
                    'success' => false,
                    'message' => 'Usuário não autenticado.'
                ]);
                exit;
            }

            $config_smtp = obter_configuracoes_smtp_globais();

            if ($config_smtp) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Configurações SMTP carregadas com sucesso!',
                    'config_smtp' => $config_smtp
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => 'Erro ao carregar as configurações SMTP.'
                ]);
            }
        }

        // Rota para salvar configurações do usuário
        elseif ($action == "salvar_config_usuario") {
            if (!isset($_SESSION['usuario_id'])) {
                echo json_encode([
                    'success' => false,
                    'message' => 'Usuário não autenticado.'
                ]);
                exit;
            }

            $usuario_id = $_SESSION['usuario_id'];
            $new_username = $_POST["new_username"];
            $new_email = $_POST["new_email"];
            $new_password = $_POST["new_password"] !== '' ? $_POST["new_password"] : null;

            if (salvar_configuracoes_usuario($usuario_id, $new_username, $new_email, $new_password)) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Configurações de usuário salvas com sucesso!'
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => 'Erro ao salvar as configurações de usuário.'
                ]);
            }
        }

        // Rota para carregar configurações do usuário
        elseif ($action == "carregar_config_usuario") {
            if (!isset($_SESSION['usuario_id'])) {
                echo json_encode([
                    'success' => false,
                    'message' => 'Usuário não autenticado.'
                ]);
                exit;
            }

            $usuario_id = $_SESSION['usuario_id'];
            $config_usuario = obter_configuracoes_usuario($usuario_id);

            if ($config_usuario) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Configurações de usuário carregadas com sucesso!',
                    'config_usuario' => $config_usuario
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => 'Erro ao carregar as configurações de usuário.'
                ]);
            }
        }

        // Rota inválida
        else {
            echo json_encode([
                'success' => false,
                'message' => 'Ação inválida.'
            ]);
        }
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Ação não especificada.'
        ]);
    }
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Acesso inválido.'
    ]);
}
?>