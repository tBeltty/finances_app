import Dexie from 'dexie';

export const db = new Dexie('FinancesDB');

db.version(1).stores({
    expenses: '++id, name, amount, type, categoryId, month, date, paid, userId, [month+userId]', // Compound index for filtering
    categories: 'id, name, color, userId'
});
