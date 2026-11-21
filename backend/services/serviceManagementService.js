const serviceModel = require('../models/serviceModel');

function toPublicService(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    imageUrl: row.imagePath,
    available: Boolean(row.available),
  };
}

async function listServices() {
  return (await serviceModel.findAll()).map(toPublicService);
}

module.exports = {
  listServices,
};