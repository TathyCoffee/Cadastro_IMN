const express = require("express");
const path = require("path");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");
const fs = require("fs");
const session = require("express-session");
const bcrypt = require("bcrypt");
const usuarios = require("./usuarios"); // Arquivo usuarios.js

const app = express();
const PORT = process.env.PORT || 3001; // Se não tiver ambiente, use 3001

// Sessão
app.use(session({
  secret: "segredo-super-seguro",
  resave: false,
  saveUninitialized: false
}));

// EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Middleware de autenticação
function verificarAutenticacao(req, res, next) {
  if (!req.session.usuario) {
    return res.redirect("/login");
  }
  next();
}

// Rota raiz
app.get("/", (req, res) => {
  res.redirect("/apresentacao");
});

// Página pública
app.get("/apresentacao", (req, res) => {
  res.render("apresentacao");
});

// Login
app.get("/login", (req, res) => {
  res.render("login", { erro: null });
});

app.post("/login", (req, res) => {
  const { usuario, senha } = req.body;
  const usuarioEncontrado = usuarios.find(u => u.usuario === usuario);

  if (usuarioEncontrado && bcrypt.compareSync(senha, usuarioEncontrado.senha)) {
    req.session.usuario = usuario;
    req.session.perfil = usuarioEncontrado.perfil;
    res.redirect("/cadastro");
  } else {
    res.render("login", { erro: "Usuário ou senha incorretos" });
  }
});

// Trocar senha
app.get("/trocar-senha", verificarAutenticacao, (req, res) => {
  res.render("trocar-senha", { erro: null });
});

app.post("/trocar-senha", verificarAutenticacao, (req, res) => {
  const { senhaAntiga, novaSenha, confirmarSenha, usuarioSelecionado } = req.body;
  const usuarioLogado = req.session.usuario;
  const perfilLogado = req.session.perfil;

  let usuario;
  if (perfilLogado === "admin" && usuarioSelecionado) {
    usuario = usuarios.find(u => u.usuario === usuarioSelecionado);
  } else {
    usuario = usuarios.find(u => u.usuario === usuarioLogado);
  }

  if (!usuario) {
    return res.render("trocar-senha", { erro: "Usuário não encontrado" });
  }

  if (perfilLogado !== "admin" && !bcrypt.compareSync(senhaAntiga, usuario.senha)) {
    return res.render("trocar-senha", { erro: "Senha antiga incorreta" });
  }

  if (novaSenha !== confirmarSenha) {
    return res.render("trocar-senha", { erro: "As novas senhas não coincidem" });
  }

  usuario.senha = bcrypt.hashSync(novaSenha, 10);
  const novoConteudo = gerarCodigoUsuarios(usuarios);
  fs.writeFileSync("./usuarios.js", novoConteudo);

  res.redirect("/cadastro");
});

function gerarCodigoUsuarios(lista) {
  const linhas = lista.map(u =>
    `  { usuario: "${u.usuario}", senha: "${u.senha}", perfil: "${u.perfil}" }`
  );
  return `const bcrypt = require('bcrypt');\n\nmodule.exports = [\n${linhas.join(",\n")}\n];\n`;
}

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

// Simulação de banco
let beneficiarios = [
  {
    id: 1,
    nome: "João Silva",
    modalidades: ["Judô", "Teatro"],
    nascimento: "2005-08-20",
    cadNis: "123456789",
    tipoDeficiencia: "Nenhuma",
    contato: "joao@example.com",
    enderecoResponsavel: "Rua A, 123",
    renda: "1000",
    termoImagem: true
  },
  {
    id: 2,
    nome: "Maria Oliveira",
    modalidades: ["Ballet", "Muay Thai"],
    nascimento: "2004-02-15",
    cadNis: "987654321",
    tipoDeficiencia: "Auditiva",
    contato: "maria@example.com",
    enderecoResponsavel: "Rua B, 456",
    renda: "1200",
    termoImagem: false
  }
];

// Cadastro
app.get("/cadastro", verificarAutenticacao, (req, res) => {
  res.render("index", {
    beneficiario: null,
    sucesso: false,
    erro: null,
    usuario: req.session.usuario
  });
});

app.post("/cadastro", verificarAutenticacao, (req, res) => {
  const {
    nome, nascimento, modalidades, cadNis, tipoDeficiencia,
    contato, enderecoResponsavel, renda, termoImagem
  } = req.body;

  const novoBeneficiario = {
    id: beneficiarios.length + 1,
    nome,
    nascimento,
    modalidades: modalidades
      ? Array.isArray(modalidades) ? modalidades : [modalidades]
      : [],
    cadNis,
    tipoDeficiencia,
    contato,
    enderecoResponsavel,
    renda,
    termoImagem: termoImagem === "on"
  };

  beneficiarios.push(novoBeneficiario);

  res.render("index", {
    beneficiario: null,
    sucesso: "Beneficiário cadastrado com sucesso!",
    erro: null,
    usuario: req.session.usuario
  });
});

// Lista
app.get("/lista", verificarAutenticacao, (req, res) => {
  res.render("lista", {
    beneficiarios,
    usuario: req.session.usuario
  });
});

// Editar
app.get("/editar/:id", verificarAutenticacao, (req, res) => {
  const id = parseInt(req.params.id);
  const beneficiario = beneficiarios.find(b => b.id === id);

  if (!beneficiario) return res.status(404).send("Beneficiário não encontrado");

  res.render("index", {
    beneficiario,
    sucesso: false,
    erro: null,
    usuario: req.session.usuario
  });
});

app.post("/editar/:id", verificarAutenticacao, (req, res) => {
  const id = parseInt(req.params.id);
  const { nome, nascimento, modalidades } = req.body;
  const beneficiario = beneficiarios.find(b => b.id === id);

  if (!beneficiario) return res.status(404).send("Beneficiário não encontrado");

  beneficiario.nome = nome;
  beneficiario.nascimento = nascimento;
  beneficiario.modalidades = modalidades
    ? Array.isArray(modalidades) ? modalidades : [modalidades]
    : [];

  res.redirect("/lista");
});

// Excluir
app.get("/excluir/:id", verificarAutenticacao, (req, res) => {
  const id = parseInt(req.params.id);
  beneficiarios = beneficiarios.filter(b => b.id !== id);
  res.redirect("/lista");
});

// Exportar PDF
app.get("/exportar-pdf", verificarAutenticacao, (req, res) => {
  const doc = new PDFDocument();
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=beneficiarios.pdf");

  doc.pipe(res);
  doc.fontSize(20).text("Lista de Beneficiários", { align: "center" }).moveDown();

  beneficiarios.forEach((b, i) => {
    doc
      .fontSize(12)
      .text(`${i + 1}. Nome: ${b.nome}`)
      .text(`   Modalidades: ${b.modalidades.join(", ")}`)
      .text(`   Nascimento: ${b.nascimento}`)
      .moveDown();
  });

  doc.end();
});

// Exportar Excel
app.get("/exportar-excel", verificarAutenticacao, async (req, res) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Beneficiários");

  sheet.columns = [
    { header: "Nome", key: "nome", width: 30 },
    { header: "Modalidades", key: "modalidades", width: 30 },
    { header: "Nascimento", key: "nascimento", width: 15 }
  ];

  beneficiarios.forEach(b => {
    sheet.addRow({
      nome: b.nome,
      modalidades: b.modalidades.join(", "),
      nascimento: b.nascimento
    });
  });

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", "attachment; filename=beneficiarios.xlsx");

  await workbook.xlsx.write(res);
  res.end();
});

// Termo visual e PDF
app.get("/termo", (req, res) => {
  res.render("termo");
});

app.get("/termo-pdf", (req, res) => {
  const termoPath = path.join(__dirname, "public", "docs", "termo-uso-imagem.pdf");
  if (fs.existsSync(termoPath)) {
    res.sendFile(termoPath);
  } else {
    res.status(404).send("Arquivo não encontrado");
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
