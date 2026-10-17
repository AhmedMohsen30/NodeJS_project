const cron = require('node-cron');
const seedSlots = require('../seeds/slots');

module.exports = function startSlotMaintenance() {
  const refresh = () => {
    seedSlots().catch((error) => console.error('[maintainSlots] error:', error.message));
  };

  refresh();
  cron.schedule('0 0 * * *', refresh, { timezone: 'Africa/Cairo' });
};
