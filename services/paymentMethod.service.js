const db = require('../config/db');

const PaymentMethodService = {
    getAll: async () => {
        const [rows] = await db.query('SELECT payment_method_id, name FROM payment_methods');
        return rows;
    },
    create: async (data) => {
        const { name } = data;
        const [result] = await db.query('INSERT INTO payment_methods (name) VALUES (?)', [name]);
        return { payment_method_id: result.insertId, name };
    },
    update: async (id, data) => {
        const { name } = data;
        await db.query('UPDATE payment_methods SET name = ? WHERE payment_method_id = ?', [name, id]);
        return { payment_method_id: id, name };
    },
    delete: async (id) => {
        await db.query('DELETE FROM payment_methods WHERE payment_method_id = ?', [id]);
        return true;
    }
};

module.exports = PaymentMethodService; 