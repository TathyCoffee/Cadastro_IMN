const express = require("express");
const path = require("path");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");
const fs = require("fs");

const app = express();
const PORT = 3000;

// Banco de dados simulado com todos os campos
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

// Configuração do EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Rota de cadastro
app.get("/", (req, res) => {
  res.render("index", { beneficiario: null });
});

// Rota de listagem
app.get("/lista", (req, res) => {
  res.render("lista", { beneficiarios });
});

// Rota para salvar novo beneficiário
app.post("/cadastro", (req, res) => {
  const {
    nome,
    nascimento,
    modalidades,
    cadNis,
    tipoDeficiencia,
    contato,
    enderecoResponsavel,
    renda,
    termoImagem
  } = req.body;

  const novoBeneficiario = {
    id: beneficiarios.length + 1,
    nome,
    nascimento,
    modalidades: modalidades
      ? Array.isArray(modalidades)
        ? modalidades
        : [modalidades]
      : [],
    cadNis,
    tipoDeficiencia,
    contato,
    enderecoResponsavel,
    renda,
    termoImagem: termoImagem === "on"
  };

  beneficiarios.push(novoBeneficiario);
  res.redirect("/lista");
});

// Rota de edição
app.get("/editar/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const beneficiario = beneficiarios.find(b => b.id === id);

  if (!beneficiario) {
    return res.status(404).send("Beneficiário não encontrado");
  }

  res.render("index", { beneficiario });
});

// Rota para processar edição
app.post("/editar/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const { nome, nascimento, modalidades } = req.body;

  const beneficiario = beneficiarios.find(b => b.id === id);

  if (!beneficiario) {
    return res.status(404).send("Beneficiário não encontrado");
  }

  beneficiario.nome = nome;
  beneficiario.nascimento = nascimento;
  beneficiario.modalidades = modalidades
    ? Array.isArray(modalidades)
      ? modalidades
      : [modalidades]
    : [];

  res.redirect("/lista");
});

// Rota de exclusão
app.get("/excluir/:id", (req, res) => {
  const id = parseInt(req.params.id);
  beneficiarios = beneficiarios.filter(b => b.id !== id);
  res.redirect("/lista");
});

// Exportar para PDF
app.get("/exportar-pdf", (req, res) => {
  const doc = new PDFDocument();
  const filename = "beneficiarios.pdf";

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

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

// Exportar para Excel
app.get("/exportar-excel", async (req, res) => {
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

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", "attachment; filename=beneficiarios.xlsx");

  await workbook.xlsx.write(res);
});

// Rota para exibir o Termo de Uso de Imagem
app.get("/termo", (req, res) => {
  res.render("termo"); // Certifique-se de que views/termo.ejs existe
});

// Rota para baixar o PDF do Termo de Uso
app.get("/termo-pdf", (req, res) => {
  const termoPath = path.join(__dirname, "public", "docs", "termo-uso-imagem.pdf");
  if (fs.existsSync(termoPath)) {
    res.sendFile(termoPath);
  } else {
    res.status(404).send("Arquivo do termo não encontrado.");
  }
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
