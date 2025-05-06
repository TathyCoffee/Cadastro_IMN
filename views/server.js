const express = require('express');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Sessões
app.use(session({
  secret: 'segredo-super-seguro',
  resave: false,
  saveUninitialized: true,
}));

// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Dados simulados
let beneficiarios = [];
let usuarios = [
  { usuario: 'admin', senha: '1234' },
  { usuario: 'user1', senha: 'abcd' }
];

// Rota de login
app.get('/login', (req, res) => {
  res.render('login', { erro: null });
});

app.post('/login', (req, res) => {
  const { usuario, senha } = req.body;
  const autenticado = usuarios.find(u => u.usuario === usuario && u.senha === senha);
  if (autenticado) {
    req.session.usuario = usuario;
    res.redirect('/cadastro'); // Redireciona para o formulário de cadastro após login
  } else {
    res.render('login', { erro: 'Usuário ou senha inválidos' });
  }
});

// Rota de logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// Middleware de proteção
function autenticado(req, res, next) {
  if (!req.session.usuario) {
    return res.redirect('/login');
  }
  next();
}

// Rota de apresentação pública
app.get('/', (req, res) => {
  res.render('apresentacao'); // Página pública de apresentação
});

// Página de cadastro (protegida)
app.get('/cadastro', autenticado, (req, res) => {
  res.render('index', { usuario: req.session.usuario, beneficiario: null });
});

// Enviar dados do formulário
app.post('/cadastro', autenticado, (req, res) => {
  const novo = {
    id: Date.now().toString(),
    ...req.body,
    modalidades: Array.isArray(req.body.modalidades)
      ? req.body.modalidades
      : [req.body.modalidades].filter(Boolean)
  };
  beneficiarios.push(novo);
  res.redirect('/lista');
});

// Página de edição
app.get('/editar/:id', autenticado, (req, res) => {
  const beneficiario = beneficiarios.find(b => b.id === req.params.id);
  if (!beneficiario) return res.send("Beneficiário não encontrado");
  res.render('index', { usuario: req.session.usuario, beneficiario });
});

app.post('/editar/:id', autenticado, (req, res) => {
  const i = beneficiarios.findIndex(b => b.id === req.params.id);
  if (i >= 0) {
    beneficiarios[i] = {
      id: req.params.id,
      ...req.body,
      modalidades: Array.isArray(req.body.modalidades)
        ? req.body.modalidades
        : [req.body.modalidades].filter(Boolean)
    };
  }
  res.redirect('/lista');
});

// Lista de beneficiários (protegida)
app.get('/lista', autenticado, (req, res) => {
  res.render('lista', { usuario: req.session.usuario, beneficiarios });
});

// Página do termo
app.get('/termo', (req, res) => {
  res.render('termo');
});

// Rota para exibir o formulário de troca de senha
app.get('/trocar-senha', autenticado, (req, res) => {
  res.render('trocar-senha'); // Exibe o formulário de troca de senha
});

// Rota para processar a troca de senha
app.post('/trocar-senha', autenticado, (req, res) => {
  const { senhaAntiga, novaSenha, confirmarSenha } = req.body;
  const usuario = usuarios.find(u => u.usuario === req.session.usuario);

  // Verificar se as senhas nova e de confirmação coincidem
  if (novaSenha !== confirmarSenha) {
    return res.render('trocar-senha', { erro: 'As senhas não coincidem.' });
  }

  // Verificar se a senha antiga está correta
  if (usuario.senha !== senhaAntiga) {
    return res.render('trocar-senha', { erro: 'Senha antiga incorreta.' });
  }

  // Atualizar a senha
  usuario.senha = novaSenha;
  res.redirect('/perfil'); // Redireciona para a página de perfil após a troca
});

// Rota de perfil (página simples após login)
app.get('/perfil', autenticado, (req, res) => {
  res.render('perfil', { usuario: req.session.usuario });
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
