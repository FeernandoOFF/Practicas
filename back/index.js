const cors = require('cors');
const express = require('express');
const mysql = require('mysql2');
const mqtt = require('mqtt');

const app = express();
const client = mqtt.connect('mqtt://localhost');
app.use(cors());

client.on('connect', function () {
  client.subscribe('accesa/banos/#', function (err) {
    if (!err) {
      client.publish('accesa/conexiones/servidor', 'Servidor conectado');
    }
  });
});

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'test',
  password: 'test',
  database: 'dana',
});

//-----------------------------------HTTP   ---------------------------------------

app.get('/entradas', async (req, res) => {
  const entradas = await viewLogs('entradas');

  res.json(entradas);
});

app.get('/salidas', async (datos, res) => {
  const salidas = await viewLogs('salidas');
  res.json(salidas);
});

app.listen(3000);

//-----------------------------------MYSQL   ---------------------------------------

function crateRow({ usuario }) {
  return (query = {
    id: `${Math.floor(Math.random() * (1000 - 10 + 1) + 10)}`,
    nombre: `${usuario}`,
    hora: `${new Date()}`,
  });
}

function insertRow(query, table) {
  connection.query(
    `INSERT INTO ${table} SET ?`,
    query,
    (error, results, fields) => {
      if (error) throw error;
      console.log('The solution is: ', results);
    }
  );
}

function viewLogs(table) {
  return new Promise((resolve, reject) => {
    connection.query(`SELECT * FROM ${table}`, (error, results, fields) => {
      if (error) reject(error);
      console.log('Los logs de la tabla:', table, ' son: ', results);
      resolve(results);
    });
  });
}

//-----------------------------------MQTT   ---------------------------------------
client.on('message', (topic, message) => {
  const msg = JSON.parse(message.toString());
  let data = JSON.parse(msg);

  const query = crateRow(data);

  if (topic === 'accesa/banos/entrada') {
    console.log('Entrada: ', msg);
    insertRow(query, 'entradas');
  }

  if (topic === 'accesa/banos/salida') {
    console.log('SALIDA: ', msg);
    insertRow(query, 'salidas');
  }
});
