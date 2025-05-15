const bcrypt = require('bcrypt');

module.exports = [
  {
    usuario: "admin",
    senha: bcrypt.hashSync("123", 10),
    perfil: "admin"
  },
  {
    usuario: "gestor",
    senha: bcrypt.hashSync("456", 10),
    perfil: "gestor"
  },
  {
    usuario: "voluntario",
    senha: bcrypt.hashSync("789", 10),
    perfil: "voluntario"
  }
];
