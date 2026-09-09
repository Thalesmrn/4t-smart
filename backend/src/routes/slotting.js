const express = require('express');

module.exports = function(db) {
  const router = express.Router();

  router.get('/', (req, res) => {
    res.json({
      sugestoes: [],
      ocupacao: []
    });
  });

  return router;
};
