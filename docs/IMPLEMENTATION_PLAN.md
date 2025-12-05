# Plan de Implementación - tBelt Finanzas

## Versiones Planificadas

```
v1.3.0 (Actual) ─── Theming System ✅
     │
v1.4.0 ─────────── Ingresos Múltiples
     │
v1.5.0 ─────────── Préstamos Personales
     │
v1.6.0 ─────────── Créditos Avanzados
     │
v2.0.0 ─────────── Web3 Integration
```

---

## v1.4.0 - Ingresos Múltiples
**Estimado:** 1-2 semanas | **Complejidad:** Media

### Objetivo
Permitir registrar múltiples fuentes de ingreso además del salario principal.

### Features
| Feature | Descripción | Prioridad |
|---------|-------------|-----------|
| Income Streams | Crear/editar fuentes de ingreso | Alta |
| Tipos de ingreso | Salario, Freelance, Ventas, Dividendos, Rentas, Otros | Alta |
| Recurrencia | Único, Semanal, Quincenal, Mensual | Alta |
| Estado | Pendiente / Recibido / Parcial | Media |
| Dashboard | Widget de ingresos del mes | Media |
| Historial | Ver ingresos pasados por mes | Baja |

### Cambios Técnicos

#### Backend
```
models/
  └── Income.js (NUEVO)
      - id, userId, householdId
      - name: "Freelance proyecto X"
      - amount: 500
      - type: 'salary' | 'freelance' | 'sales' | 'dividends' | 'rent' | 'other'
      - recurrence: 'once' | 'weekly' | 'biweekly' | 'monthly'
      - status: 'pending' | 'received' | 'partial'
      - receivedAmount: 300 (para parciales)
      - expectedDate: Date
      - receivedDate: Date

controllers/
  └── incomeController.js (NUEVO)
      - getIncomes(month)
      - createIncome
      - updateIncome
      - deleteIncome
      - markAsReceived
```

#### Frontend
```
views/
  └── Income/
      ├── IncomeList.jsx (NUEVO)
      ├── IncomeForm.jsx (NUEVO)
      └── IncomeWidget.jsx (NUEVO - para Dashboard)

components/
  └── Dashboard/
      └── IncomeKPI.jsx (NUEVO - Total ingresos del mes)
```

#### Base de Datos
```sql
CREATE TABLE Incomes (
  id INTEGER PRIMARY KEY,
  userId INTEGER,
  householdId INTEGER,
  name VARCHAR(255),
  amount DECIMAL(10,2),
  type VARCHAR(50),
  recurrence VARCHAR(20),
  status VARCHAR(20) DEFAULT 'pending',
  receivedAmount DECIMAL(10,2) DEFAULT 0,
  expectedDate DATE,
  receivedDate DATE,
  createdAt DATETIME,
  updatedAt DATETIME
);
```

---

## v1.5.0 - Préstamos Personales
**Estimado:** 2 semanas | **Complejidad:** Media-Alta

### Objetivo
Gestionar préstamos otorgados ("me deben") y recibidos ("debo").

### Features
| Feature | Descripción | Prioridad |
|---------|-------------|-----------|
| Préstamos otorgados | Registrar dinero prestado a otros | Alta |
| Préstamos recibidos | Registrar dinero que me prestaron | Alta |
| Pagos parciales | Abonar a la deuda | Alta |
| Estados | Activo / Pagado / Vencido | Alta |
| KPI "Te deben" | Total pendiente por cobrar | Media |
| KPI "Debes" | Total pendiente por pagar | Media |
| Recordatorios | Notificaciones de vencimiento | Baja |
| Historial | Pagos realizados por préstamo | Media |

### Cambios Técnicos

#### Backend
```
models/
  └── Loan.js (NUEVO)
      - id, lenderId, borrowerId (userId o nombre externo)
      - type: 'given' | 'received'
      - personName: "Juan" (si es externo)
      - amount: 1000
      - interestRate: 0 (opcional)
      - dueDate: Date
      - status: 'active' | 'paid' | 'overdue' | 'forgiven'
      
  └── LoanPayment.js (NUEVO)
      - loanId, amount, date, note

controllers/
  └── loanController.js (NUEVO)
```

#### Frontend
```
views/
  └── Loans/
      ├── LoanList.jsx
      ├── LoanForm.jsx
      ├── LoanDetail.jsx (historial de pagos)
      └── LoanPaymentModal.jsx

components/
  └── Dashboard/
      └── LoansWidget.jsx (Te deben / Debes)
```

---

## v1.6.0 - Créditos Avanzados
**Estimado:** 2-3 semanas | **Complejidad:** Alta

### Objetivo
Gestión completa de créditos con cálculo de intereses y cuotas.

### Features
| Feature | Descripción | Prioridad |
|---------|-------------|-----------|
| Tipos de crédito | Tarjeta, Auto, Hipoteca, Personal | Alta |
| Cuotas | X de Y pagadas | Alta |
| Calculadora | Intereses, saldo, proyección | Alta |
| Progress bar | Visualización de progreso | Media |
| Simulador | "Si pagas extra, ahorras X" | Media |
| Alertas | Cuotas próximas a vencer | Baja |
| Tarjetas de crédito | Límite, corte, pago mínimo | Media |

### Cambios Técnicos

#### Backend
```
models/
  └── Credit.js (NUEVO)
      - id, userId, householdId
      - name: "Crédito Auto"
      - type: 'card' | 'vehicle' | 'mortgage' | 'personal' | 'other'
      - originalAmount: 50000
      - interestRate: 12.5 (anual)
      - monthlyPayment: 1500
      - totalInstallments: 48
      - paidInstallments: 12
      - startDate: Date
      - status: 'active' | 'paid'
      
  └── CreditPayment.js (NUEVO)
      - creditId, amount, date, installmentNumber

controllers/
  └── creditController.js (NUEVO)
      - calculateAmortization()
      - simulateExtraPayment()
      - getProjectedEndDate()
```

#### Frontend
```
views/
  └── Credits/
      ├── CreditList.jsx
      ├── CreditForm.jsx
      ├── CreditDetail.jsx
      ├── AmortizationTable.jsx
      └── PaymentSimulator.jsx

components/
  └── Dashboard/
      └── CreditsWidget.jsx (Deuda total, próxima cuota)
```

### Fórmulas de Cálculo
```javascript
// Cuota mensual (sistema francés)
cuota = P * (r * (1+r)^n) / ((1+r)^n - 1)

// Donde:
// P = Principal (monto del préstamo)
// r = Tasa mensual (tasa anual / 12)
// n = Número de cuotas

// Saldo restante después de k cuotas
saldo = P * ((1+r)^n - (1+r)^k) / ((1+r)^n - 1)
```

---

## v2.0.0 - Web3 Integration
**Estimado:** 1-2 meses | **Complejidad:** Muy Alta

### Objetivo
Integrar wallets crypto y tracking de activos digitales.

### Features por Fase

#### Fase 1: Wallet Connect (2 semanas)
| Feature | Descripción |
|---------|-------------|
| MetaMask | Conectar wallet |
| WalletConnect | Soporte multi-wallet |
| Balance ETH | Ver saldo en ETH |
| Conversión | ETH → Moneda local |

#### Fase 2: Multi-token (2 semanas)
| Feature | Descripción |
|---------|-------------|
| ERC-20 tokens | USDT, USDC, etc. |
| Token list | Lista de tokens conocidos |
| Portfolio value | Valor total en USD |

#### Fase 3: Multi-chain (2 semanas)
| Feature | Descripción |
|---------|-------------|
| Polygon | Red alternativa |
| BSC | Binance Smart Chain |
| Arbitrum | L2 Ethereum |
| Base | L2 Coinbase |

#### Fase 4: DeFi Tracking (3-4 semanas)
| Feature | Descripción |
|---------|-------------|
| Staking | Ver posiciones staked |
| LP tokens | Liquidity provider |
| Yield tracking | APY y recompensas |
| Protocolos | Aave, Compound, Uniswap |

### Cambios Técnicos

#### Dependencias
```json
{
  "wagmi": "^2.x",
  "viem": "^2.x",
  "@rainbow-me/rainbowkit": "^2.x",
  "ethers": "^6.x"
}
```

#### Backend (opcional - para cache)
```
services/
  └── web3/
      ├── priceService.js (CoinGecko API)
      ├── balanceService.js
      └── defiService.js
```

#### Frontend
```
views/
  └── Web3/
      ├── WalletConnect.jsx
      ├── Portfolio.jsx
      ├── TokenList.jsx
      └── DeFiDashboard.jsx

context/
  └── Web3Context.jsx (wagmi provider)
```

---

## Cronograma Sugerido

```
Diciembre 2024
├── Semana 1-2: v1.4.0 Ingresos Múltiples
└── Semana 3-4: v1.5.0 Préstamos Personales (inicio)

Enero 2025
├── Semana 1: v1.5.0 Préstamos Personales (finalizar)
├── Semana 2-3: v1.6.0 Créditos Avanzados
└── Semana 4: Testing y polish

Febrero 2025
├── Semana 1-2: v2.0.0 Web3 Fase 1-2
└── Semana 3-4: v2.0.0 Web3 Fase 3-4
```

---

## Prioridad de Implementación

1. **v1.4.0 Ingresos** - Más solicitado, base para flujo de caja
2. **v1.5.0 Préstamos** - Complementa gestión de dinero
3. **v1.6.0 Créditos** - Más complejo, pero muy útil
4. **v2.0.0 Web3** - Diferenciador, público específico

---

*Documento actualizado: 2025-12-05*
*¿Comenzamos con v1.4.0?*
