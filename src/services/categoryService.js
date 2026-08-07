const categoryRepository = require('../repositories/categoryRepository');

async function getCategories(params) {
    return categoryRepository.getCategories()
}


module.exports = {getCategories}