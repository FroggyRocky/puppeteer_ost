const express = require('express'),
    router = express.Router();

const run = require('./controllers/run');

router.post('/run', run.run);
router.post('/run-bulk', run.bulk);

module.exports = router;