const RECOVERED_CATEGORIES = [
    { id: 'cat_creditos', name: 'Créditos y Deudas', color: 'rose' },
    { id: 'cat_vivienda', name: 'Vivienda', color: 'blue' },
    { id: 'cat_servicios', name: 'Servicios Públicos', color: 'cyan' },
    { id: 'cat_educacion', name: 'Educación', color: 'indigo' },
    { id: 'cat_varios', name: 'Varios / Otros', color: 'slate' }
];

const RECOVERED_EXPENSES = [
    { id: 1, name: "Crédito Consumo 7528 Bancolombia", amount: 1957868, type: "Fijo", categoryId: "cat_creditos", paid: 0 },
    { id: 9, name: "Crediágil 3690", amount: 99597, type: "Fijo", categoryId: "cat_creditos", paid: 0 },
    { id: 10, name: "Crediágil 4023", amount: 52313, type: "Fijo", categoryId: "cat_creditos", paid: 0 },
    { id: 11, name: "Crediágil 4051", amount: 31034, type: "Fijo", categoryId: "cat_creditos", paid: 0 },
    { id: 12, name: "Crediágil 4105", amount: 112268, type: "Fijo", categoryId: "cat_creditos", paid: 0 },
    { id: 13, name: "Crediágil 7043", amount: 16619, type: "Fijo", categoryId: "cat_creditos", paid: 0 },
    { id: 2, name: "Davivienda", amount: 1000000, type: "Fijo", categoryId: "cat_creditos", paid: 0 },
    { id: 3, name: "Falabella", amount: 1500000, type: "Fijo", categoryId: "cat_creditos", paid: 0 },
    { id: 4, name: "AvVillas", amount: 160000, type: "Fijo", categoryId: "cat_creditos", paid: 0 },
    { id: 5, name: "Banco W", amount: 232956, type: "Fijo", categoryId: "cat_creditos", paid: 0 },
    { id: 6, name: "Bancolombia Diana", amount: 1000000, type: "Fijo", categoryId: "cat_creditos", paid: 0 },
    { id: 7, name: "Sistecrédito", amount: 160100, type: "Fijo", categoryId: "cat_creditos", paid: 0 },
    { id: 8, name: "Coprocenva", amount: 70700, type: "Fijo", categoryId: "cat_creditos", paid: 0 },
    { id: 14, name: "Arriendo", amount: 548000, type: "Fijo", categoryId: "cat_vivienda", paid: 0 },
    { id: 15, name: "Administración", amount: 247500, type: "Fijo", categoryId: "cat_vivienda", paid: 0 },
    { id: 20, name: "Poda", amount: 60000, type: "Fijo", categoryId: "cat_vivienda", paid: 0 },
    { id: 16, name: "Colegio niñas", amount: 249850, type: "Fijo", categoryId: "cat_educacion", paid: 0 },
    { id: 18, name: "Internet", amount: 203390, type: "Fijo", categoryId: "cat_servicios", paid: 0 },
    { id: 17, name: "Cuota de manejo Bancolombia", amount: 25000, type: "Fijo", categoryId: "cat_varios", paid: 0 },
    { id: 19, name: "Cooemtulua Diana", amount: 80000, type: "Fijo", categoryId: "cat_varios", paid: 0 }
];

module.exports = { RECOVERED_CATEGORIES, RECOVERED_EXPENSES };
