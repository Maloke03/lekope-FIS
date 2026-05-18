const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGO_URI = process.env.LOCAL_MONGODB_URI || 'mongodb://127.0.0.1:27017/lekope-fis';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  lastLogin: Date,
  isActive: { type: Boolean, default: true }
});

const revenueSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  client: { type: String, required: true },
  type: { type: String, enum: ['Advertising', 'Sponsorship', 'Event Sponsorship', 'Digital', 'Other'], required: true },
  amount: { type: Number, required: true },
  date: { type: String, required: true },
  status: { type: String, enum: ['PENDING', 'COMPLETED', 'OVERDUE'], default: 'PENDING' },
  description: String,
  invoiceId: String,
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const expenseSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  description: { type: String, required: true },
  category: { type: String, enum: ['Salaries', 'Licensing', 'Equipment', 'Utilities', 'Marketing', 'Operations', 'Other'], required: true },
  amount: { type: Number, required: true },
  date: { type: String, required: true },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'PAID', 'REJECTED'], default: 'PENDING' },
  vendor: String,
  receipt: String,
  notes: String,
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const payrollSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  role: { type: String, required: true },
  department: { type: String, enum: ['Broadcasting', 'Sales', 'Finance', 'Technical', 'Management'], required: true },
  gross: { type: Number, required: true },
  tax: { type: Number, required: true },
  nssf: { type: Number, required: true },
  net: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Paid', 'Processing'], default: 'Pending' },
  month: { type: String, required: true },
  year: { type: Number, required: true },
  paymentDate: Date,
  bankAccount: String,
  paymentReference: String,
  notes: String,
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const bankReconciliationSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  date: { type: String, required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['CREDIT', 'DEBIT'], default: 'CREDIT' },
  status: { type: String, enum: ['UNMATCHED', 'MATCHED'], default: 'UNMATCHED' },
  matchedWith: String,
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const taxSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  type: { type: String, enum: ['PAYE (Employees)', 'VAT Return', 'NSSF Contributions', 'Corporate Tax (Est.)', 'Withholding Tax', 'SDL', 'COSOMA Licensing', 'Broadcasting Licence Fee'], required: true },
  period: { type: String, required: true },
  amount: { type: Number, required: true },
  dueDate: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Paid', 'Overdue', 'Filed', 'Review'], default: 'Pending' },
  paymentDate: Date,
  paymentReference: String,
  notes: String,
  filedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const regulationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  category: { type: String, enum: ['Tax', 'Labour', 'Broadcasting', 'Data Protection', 'Other'] },
  status: { type: String, enum: ['Compliant', 'Review', 'Non-Compliant', 'Pending'], default: 'Review' },
  lastReviewDate: Date,
  nextReviewDate: Date,
  responsibleParty: String,
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const assetSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  category: { type: String, enum: ['Studio Equipment', 'Broadcast', 'IT', 'Vehicles', 'Furniture', 'Other'], required: true },
  brand: { type: String, required: true },
  model: { type: String, required: true },
  purchaseDate: { type: String, required: true },
  cost: { type: Number, required: true },
  accumulated: { type: Number, default: 0 },
  netBook: { type: Number, required: true },
  life: { type: Number, required: true },
  serialNumber: String,
  location: String,
  condition: { type: String, enum: ['Excellent', 'Good', 'Fair', 'Poor', 'End of Life'], default: 'Good' },
  status: { type: String, enum: ['Active', 'Disposed', 'Under Repair', 'In Storage'], default: 'Active' },
  disposalDate: String,
  disposalValue: Number,
  notes: String,
  lastValuationDate: Date,
  nextValuationDate: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const advertiserSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  industry: { type: String, required: true },
  status: { type: String, enum: ['Active', 'Pending', 'Prospective', 'Completed'], default: 'Active' },
  contactEmail: String,
  contactPhone: String,
  campaigns: { type: Number, default: 0 },
  billed: { type: Number, default: 0 },
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const bookingSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  client: { type: String, required: true },
  campaign: { type: String, required: true },
  spots: { type: Number, required: true },
  due: { type: String, required: true },
  status: { type: String, enum: ['Confirmed', 'Pending', 'Delivered', 'Planned', 'Cancelled'], default: 'Pending' },
  type: { type: String, default: 'Radio Spots' },
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const adContractSchema = new mongoose.Schema({
  advertiser: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
}, { timestamps: true });

const airtimeSchema = new mongoose.Schema({
  client: { type: String, required: true },
  duration: { type: Number, required: true },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  scheduledDate: { type: Date, required: true },
}, { timestamps: true });

const invoiceSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  client: { type: String, required: true },
  clientEmail: String,
  clientPhone: String,
  issue: { type: String, required: true },
  due: { type: String, required: true },
  amount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  status: { type: String, enum: ['DRAFT', 'SENT', 'PENDING', 'PAID', 'OVERDUE', 'WRITTEN_OFF', 'PARTIAL'], default: 'DRAFT' },
  items: [{ description: String, quantity: Number, rate: Number, amount: Number }],
  payments: [{ amount: Number, method: String, reference: String, date: Date, notes: String, recordedBy: mongoose.Schema.Types.ObjectId }],
  writeOffReason: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Revenue = mongoose.model('Revenue', revenueSchema);
const Expense = mongoose.model('Expense', expenseSchema);
const Payroll = mongoose.model('Payroll', payrollSchema);
const BankReconciliation = mongoose.model('BankReconciliation', bankReconciliationSchema);
const Tax = mongoose.model('Tax', taxSchema);
const Regulation = mongoose.model('Regulation', regulationSchema);
const Asset = mongoose.model('Asset', assetSchema);
const Advertiser = mongoose.model('Advertiser', advertiserSchema);
const Booking = mongoose.model('Booking', bookingSchema);
const AdContract = mongoose.model('AdContract', adContractSchema);
const Airtime = mongoose.model('Airtime', airtimeSchema);
const Invoice = mongoose.model('Invoice', invoiceSchema);

const hashPassword = async (password) => bcrypt.hash(password, 10);

const sampleUsers = [
  { name: 'Mpho Motsumi', email: 'mpho.manager@example.com', password: 'Finance123!', role: 'STATION_MANAGER' },
  { name: 'Teboho Sekhau', email: 'teboho.finance@example.com', password: 'Finance123!', role: 'FINANCE_OFFICER' },
  { name: 'Lerato Lekhooa', email: 'lerato.marketing@example.com', password: 'Finance123!', role: 'MARKETING_OFFICER' },
  { name: 'Nthabiseng Senyatso', email: 'nthabiseng.staff@example.com', password: 'Finance123!', role: 'STAFF' },
  { name: 'Kabelo Khama', email: 'kabelo.auditor@example.com', password: 'Finance123!', role: 'AUDITOR' },
  { name: 'Rethabile Mokoena', email: 'rethabile.staff@example.com', password: 'Finance123!', role: 'STAFF' },
  { name: 'Lesedi Ramaila', email: 'lesedi.finance@example.com', password: 'Finance123!', role: 'FINANCE_OFFICER' },
  { name: 'Pula Nkoana', email: 'pula.sales@example.com', password: 'Finance123!', role: 'MARKETING_OFFICER' },
  { name: "Masechaba Khuts'oane", email: 'masechaba.advertiser@example.com', password: 'Finance123!', role: 'STAFF' },
  { name: 'Sipho Mahlangu', email: 'sipho.auditor@example.com', password: 'Finance123!', role: 'AUDITOR' }
];

const sampleRegulations = [
  { name: 'Income Tax Act, 1993 (Lesotho)', description: 'Governs PAYE, corporate income tax, and withholding taxes on payments.', status: 'Compliant', category: 'Tax' },
  { name: 'Value Added Tax Order, 2001', description: 'VAT registration and quarterly filing obligations for revenue above threshold.', status: 'Compliant', category: 'Tax' },
  { name: 'National Social Security Fund Act', description: 'Mandatory employer and employee NSSF contributions at statutory rates.', status: 'Compliant', category: 'Tax' },
  { name: 'Communications Authority of Lesotho', description: 'Broadcasting licence, spectrum allocation, and frequency fee compliance.', status: 'Compliant', category: 'Broadcasting' },
  { name: 'COSOMA Music Licensing', description: 'Music rights and performance licensing — required for commercial broadcast.', status: 'Compliant', category: 'Broadcasting' },
  { name: 'Labour Code Order, 1992', description: 'Employment contracts, minimum wage, leave entitlements, and termination rules.', status: 'Compliant', category: 'Labour' },
  { name: 'Data Protection Act (Lesotho)', description: 'Listener data and advertiser data protection and privacy practices.', status: 'Review', category: 'Data Protection' }
];

const seed = async () => {
  await mongoose.connect(MONGO_URI);

  console.log(`Connected to ${MONGO_URI}`);

  await Promise.all([
    User.deleteMany({}),
    Revenue.deleteMany({}),
    Expense.deleteMany({}),
    Payroll.deleteMany({}),
    BankReconciliation.deleteMany({}),
    Tax.deleteMany({}),
    Regulation.deleteMany({}),
    Asset.deleteMany({}),
    Advertiser.deleteMany({}),
    Booking.deleteMany({}),
    AdContract.deleteMany({}),
    Airtime.deleteMany({}),
    Invoice.deleteMany({})
  ]);

  const users = [];
  for (const user of sampleUsers) {
    const hashed = await hashPassword(user.password);
    users.push({ ...user, password: hashed });
  }
  const createdUsers = await User.insertMany(users);
  const userByEmail = createdUsers.reduce((acc, user) => ({ ...acc, [user.email]: user }), {});

  const revenueDocs = [
    { id: 'REV-1001', client: 'ABC Advertising Corp', type: 'Advertising', amount: 45000, date: '2026-05-14', status: 'PENDING', description: 'Q2 digital media campaign', invoiceId: 'INV-2026-001', recordedBy: userByEmail['teboho.finance@example.com']._id },
    { id: 'REV-1002', client: 'Lesotho Broadcasting Network', type: 'Advertising', amount: 75500, date: '2026-05-12', status: 'COMPLETED', description: 'Monthly airtime contract', invoiceId: 'INV-2026-002', recordedBy: userByEmail['lesedi.finance@example.com']._id },
    { id: 'REV-1003', client: 'TechStart Solutions', type: 'Digital', amount: 32000, date: '2026-05-10', status: 'PENDING', description: 'Social media sponsorship', invoiceId: 'INV-2026-003', recordedBy: userByEmail['pula.sales@example.com']._id },
    { id: 'REV-1004', client: 'National Tourism Board', type: 'Sponsorship', amount: 120000, date: '2026-05-08', status: 'COMPLETED', description: 'May TV & radio airtime package', invoiceId: 'INV-2026-004', recordedBy: userByEmail['teboho.finance@example.com']._id },
    { id: 'REV-1005', client: 'Retail Merchants Association', type: 'Advertising', amount: 28500, date: '2026-05-14', status: 'PENDING', description: 'Weekend promo campaign', invoiceId: '', recordedBy: userByEmail['lesedi.finance@example.com']._id },
    { id: 'REV-1006', client: 'City Council Events', type: 'Event Sponsorship', amount: 89000, date: '2026-04-30', status: 'COMPLETED', description: 'Festival sponsorship package', invoiceId: 'INV-2026-005', recordedBy: userByEmail['pula.sales@example.com']._id },
    { id: 'REV-1007', client: 'Education Partners', type: 'Digital', amount: 34000, date: '2026-04-20', status: 'OVERDUE', description: 'Web advertising bundle', invoiceId: 'INV-2026-006', recordedBy: userByEmail['teboho.finance@example.com']._id },
    { id: 'REV-1008', client: 'Healthcare Group', type: 'Sponsorship', amount: 105000, date: '2026-03-15', status: 'COMPLETED', description: 'Health awareness campaign', invoiceId: 'INV-2026-007', recordedBy: userByEmail['lesedi.finance@example.com']._id },
    { id: 'REV-1009', client: 'University Media', type: 'Advertising', amount: 52000, date: '2026-02-28', status: 'COMPLETED', description: 'Student recruitment drive', invoiceId: 'INV-2026-008', recordedBy: userByEmail['pula.sales@example.com']._id },
    { id: 'REV-1010', client: 'Green Energy Initiative', type: 'Other', amount: 41000, date: '2026-01-18', status: 'COMPLETED', description: 'Corporate sustainability advert', invoiceId: 'INV-2026-009', recordedBy: userByEmail['teboho.finance@example.com']._id }
  ];

  const expenseDocs = [
    { id: 'EXP-1001', description: 'Office stationery purchase', category: 'Operations', amount: 15000, date: '2026-05-14', status: 'PENDING', vendor: 'Lesotho Office Supplies', notes: 'Pens, paper, printer cartridges', approvedBy: userByEmail['kabelo.auditor@example.com']._id, recordedBy: userByEmail['lesedi.finance@example.com']._id },
    { id: 'EXP-1002', description: 'Staff training workshop', category: 'Salaries', amount: 65000, date: '2026-05-13', status: 'PAID', vendor: 'SkillUp Training', notes: 'Customer service and finance systems', approvedBy: userByEmail['kabelo.auditor@example.com']._id, recordedBy: userByEmail['teboho.finance@example.com']._id },
    { id: 'EXP-1003', description: 'Internet service fee', category: 'Utilities', amount: 9200, date: '2026-05-11', status: 'PAID', vendor: 'Lesotho Net', notes: 'Monthly office internet', approvedBy: userByEmail['kabelo.auditor@example.com']._id, recordedBy: userByEmail['lesedi.finance@example.com']._id },
    { id: 'EXP-1004', description: 'Marketing collateral printing', category: 'Marketing', amount: 18750, date: '2026-05-09', status: 'PENDING', vendor: 'PrintWorks', notes: 'Brochures and banners', approvedBy: userByEmail['masechaba.advertiser@example.com']._id, recordedBy: userByEmail['pula.sales@example.com']._id },
    { id: 'EXP-1005', description: 'Vehicle fuel refill', category: 'Operations', amount: 22100, date: '2026-05-14', status: 'PENDING', vendor: 'Shell Lesotho', notes: 'Field visit travel', approvedBy: userByEmail['kabelo.auditor@example.com']._id, recordedBy: userByEmail['nthabiseng.staff@example.com']._id },
    { id: 'EXP-1006', description: 'Studio microphone replacement', category: 'Equipment', amount: 43000, date: '2026-04-24', status: 'APPROVED', vendor: 'AudioTech Supplies', notes: 'New broadcast mics', approvedBy: userByEmail['kabelo.auditor@example.com']._id, recordedBy: userByEmail['lerato.marketing@example.com']._id },
    { id: 'EXP-1007', description: 'Annual software licensing', category: 'Licensing', amount: 89000, date: '2026-04-10', status: 'PAID', vendor: 'SoftServe Ltd', notes: 'Finance & CRM software', approvedBy: userByEmail['kabelo.auditor@example.com']._id, recordedBy: userByEmail['lerato.marketing@example.com']._id },
    { id: 'EXP-1008', description: 'Electricity bill', category: 'Utilities', amount: 47000, date: '2026-03-30', status: 'PAID', vendor: 'LESOCO', notes: 'Monthly studio power', approvedBy: userByEmail['kabelo.auditor@example.com']._id, recordedBy: userByEmail['lesedi.finance@example.com']._id },
    { id: 'EXP-1009', description: 'Promotional event catering', category: 'Marketing', amount: 27500, date: '2026-03-18', status: 'PAID', vendor: 'TasteBuds Catering', notes: 'Launch event catering', approvedBy: userByEmail['masechaba.advertiser@example.com']._id, recordedBy: userByEmail['pula.sales@example.com']._id },
    { id: 'EXP-1010', description: 'Backup generator servicing', category: 'Operations', amount: 19800, date: '2026-02-26', status: 'APPROVED', vendor: 'PowerCare', notes: 'Generator maintenance', approvedBy: userByEmail['kabelo.auditor@example.com']._id, recordedBy: userByEmail['nthabiseng.staff@example.com']._id }
  ];

  const payrollDocs = [
    { id: 'PAY-1001', name: 'Mpho Motsumi', role: 'Station Manager', department: 'Management', gross: 120000, tax: 18000, nssf: 6000, net: 96000, status: 'Paid', month: 'May', year: 2026, paymentDate: '2026-05-05', bankAccount: 'LS123456789', paymentReference: 'PAYREF-001', notes: 'Monthly salary', recordedBy: userByEmail['lesedi.finance@example.com']._id },
    { id: 'PAY-1002', name: 'Teboho Sekhau', role: 'Finance Officer', department: 'Finance', gross: 85000, tax: 12750, nssf: 4250, net: 68000, status: 'Paid', month: 'May', year: 2026, paymentDate: '2026-05-05', bankAccount: 'LS987654321', paymentReference: 'PAYREF-002', notes: 'Monthly salary', recordedBy: userByEmail['lesedi.finance@example.com']._id },
    { id: 'PAY-1003', name: 'Lerato Lekhooa', role: 'Marketing Officer', department: 'Sales', gross: 72000, tax: 10800, nssf: 3600, net: 57600, status: 'Pending', month: 'May', year: 2026, bankAccount: 'LS112233445', notes: 'Commission pending', recordedBy: userByEmail['lesedi.finance@example.com']._id },
    { id: 'PAY-1004', name: 'Nthabiseng Senyatso', role: 'Staff', department: 'Technical', gross: 54000, tax: 8100, nssf: 2700, net: 43200, status: 'Processing', month: 'May', year: 2026, bankAccount: 'LS556677889', notes: 'Technical support pay', recordedBy: userByEmail['lesedi.finance@example.com']._id },
    { id: 'PAY-1005', name: 'Kabelo Khama', role: 'Auditor', department: 'Finance', gross: 63000, tax: 9450, nssf: 3150, net: 50400, status: 'Paid', month: 'May', year: 2026, paymentDate: '2026-05-05', bankAccount: 'LS667788990', paymentReference: 'PAYREF-005', notes: 'Audit services', recordedBy: userByEmail['lesedi.finance@example.com']._id },
    { id: 'PAY-1006', name: 'Rethabile Mokoena', role: 'Staff', department: 'Broadcasting', gross: 47000, tax: 7050, nssf: 2350, net: 37600, status: 'Pending', month: 'May', year: 2026, bankAccount: 'LS443322110', notes: 'Broadcast assistant', recordedBy: userByEmail['teboho.finance@example.com']._id },
    { id: 'PAY-1007', name: 'Lesedi Ramaila', role: 'Finance Officer', department: 'Finance', gross: 78000, tax: 11700, nssf: 3900, net: 62400, status: 'Paid', month: 'April', year: 2026, paymentDate: '2026-04-05', bankAccount: 'LS998877665', paymentReference: 'PAYREF-007', notes: 'April salary', recordedBy: userByEmail['lesedi.finance@example.com']._id },
    { id: 'PAY-1008', name: 'Pula Nkoana', role: 'Marketing Officer', department: 'Sales', gross: 69000, tax: 10350, nssf: 3450, net: 55200, status: 'Paid', month: 'April', year: 2026, paymentDate: '2026-04-05', bankAccount: 'LS111222333', paymentReference: 'PAYREF-008', notes: 'April salary', recordedBy: userByEmail['lesedi.finance@example.com']._id },
    { id: 'PAY-1009', name: 'Masechaba Khuts\'oane', role: 'Staff', department: 'Broadcasting', gross: 50000, tax: 7500, nssf: 2500, net: 40000, status: 'Paid', month: 'April', year: 2026, paymentDate: '2026-04-05', bankAccount: 'LS123123123', paymentReference: 'PAYREF-009', notes: 'April salary', recordedBy: userByEmail['lesedi.finance@example.com']._id },
    { id: 'PAY-1010', name: 'Sipho Mahlangu', role: 'Auditor', department: 'Finance', gross: 62000, tax: 9300, nssf: 3100, net: 49600, status: 'Pending', month: 'May', year: 2026, bankAccount: 'LS321321321', notes: 'Audit review', recordedBy: userByEmail['lesedi.finance@example.com']._id }
  ];

  const bankDocs = [
    { id: 'BANK-1001', date: '2026-05-14', description: 'Client payment received', amount: 75500, type: 'CREDIT', status: 'MATCHED', matchedWith: 'INV-2026-002', notes: 'Paid via bank transfer' },
    { id: 'BANK-1002', date: '2026-05-12', description: 'Office stationery supplier', amount: 15000, type: 'DEBIT', status: 'MATCHED', matchedWith: 'EXP-1001', notes: 'Stationery expense' },
    { id: 'BANK-1003', date: '2026-05-11', description: 'Internet provider payment', amount: 9200, type: 'DEBIT', status: 'MATCHED', matchedWith: 'EXP-1003', notes: 'Monthly internet' },
    { id: 'BANK-1004', date: '2026-05-09', description: 'Event sponsorship deposit', amount: 89000, type: 'CREDIT', status: 'UNMATCHED', notes: 'Sponsorship income pending match' },
    { id: 'BANK-1005', date: '2026-05-05', description: 'Payroll remittance', amount: 48500, type: 'DEBIT', status: 'MATCHED', matchedWith: 'PAY-1001', notes: 'Salaries payment' },
    { id: 'BANK-1006', date: '2026-04-28', description: 'VAT refund received', amount: 12000, type: 'CREDIT', status: 'UNMATCHED', notes: 'Pending review' },
    { id: 'BANK-1007', date: '2026-04-24', description: 'Microphone supplier payment', amount: 43000, type: 'DEBIT', status: 'MATCHED', matchedWith: 'EXP-1006', notes: 'Audio equipment' },
    { id: 'BANK-1008', date: '2026-04-20', description: 'Marketing campaign revenue', amount: 52000, type: 'CREDIT', status: 'MATCHED', matchedWith: 'REV-1009', notes: 'Campaign income' },
    { id: 'BANK-1009', date: '2026-03-30', description: 'Electricity payment', amount: 47000, type: 'DEBIT', status: 'MATCHED', matchedWith: 'EXP-1008', notes: 'Utility expense' },
    { id: 'BANK-1010', date: '2026-03-15', description: 'Health sponsorship payment', amount: 105000, type: 'CREDIT', status: 'MATCHED', matchedWith: 'REV-1008', notes: 'Sponsorship income' }
  ];

  const taxDocs = [
    { id: 'TAX-1001', type: 'PAYE (Employees)', period: 'May 2026', amount: 38250, dueDate: '2026-06-10', status: 'Pending', paymentReference: '', notes: 'Monthly PAYE remittance', filedBy: userByEmail['teboho.finance@example.com']._id },
    { id: 'TAX-1002', type: 'VAT Return', period: 'Q1 2026', amount: 54000, dueDate: '2026-04-15', status: 'Paid', paymentDate: '2026-04-12', paymentReference: 'VAT-REF-001', notes: 'Quarterly VAT filing', filedBy: userByEmail['lesedi.finance@example.com']._id },
    { id: 'TAX-1003', type: 'NSSF Contributions', period: 'April 2026', amount: 15000, dueDate: '2026-05-15', status: 'Paid', paymentDate: '2026-05-13', paymentReference: 'NSSF-REF-001', notes: 'Employer NSSF', filedBy: userByEmail['teboho.finance@example.com']._id },
    { id: 'TAX-1004', type: 'Corporate Tax (Est.)', period: 'FY 2025', amount: 210000, dueDate: '2026-07-31', status: 'Pending', notes: 'Estimated year-end corporate tax', filedBy: userByEmail['lesedi.finance@example.com']._id },
    { id: 'TAX-1005', type: 'Withholding Tax', period: 'May 2026', amount: 12500, dueDate: '2026-06-05', status: 'Pending', notes: 'Supplier withholding tax', filedBy: userByEmail['teboho.finance@example.com']._id },
    { id: 'TAX-1006', type: 'SDL', period: 'May 2026', amount: 9000, dueDate: '2026-06-15', status: 'Pending', notes: 'Skills development levy', filedBy: userByEmail['lesedi.finance@example.com']._id },
    { id: 'TAX-1007', type: 'COSOMA Licensing', period: 'FY 2026', amount: 47000, dueDate: '2026-08-30', status: 'Review', notes: 'Music licensing review', filedBy: userByEmail['pula.sales@example.com']._id },
    { id: 'TAX-1008', type: 'Broadcasting Licence Fee', period: 'FY 2026', amount: 98000, dueDate: '2026-09-15', status: 'Pending', notes: 'Annual broadcasting licence', filedBy: userByEmail['teboho.finance@example.com']._id },
    { id: 'TAX-1009', type: 'PAYE (Employees)', period: 'April 2026', amount: 36250, dueDate: '2026-05-10', status: 'Paid', paymentDate: '2026-05-08', paymentReference: 'PAYE-REF-002', notes: 'April PAYE payment', filedBy: userByEmail['lesedi.finance@example.com']._id },
    { id: 'TAX-1010', type: 'VAT Return', period: 'Q2 2026', amount: 62000, dueDate: '2026-07-15', status: 'Pending', notes: 'Quarterly VAT due', filedBy: userByEmail['teboho.finance@example.com']._id }
  ];

  const assetDocs = [
    { id: 'AST-1001', name: 'Broadcast Console', category: 'Broadcast', brand: 'Yamaha', model: 'MG20XU', purchaseDate: '2024-06-01', cost: 145000, accumulated: 43000, netBook: 102000, life: 5, serialNumber: 'BC-001-2024', location: 'Studio 1', condition: 'Good', status: 'Active', lastValuationDate: new Date('2025-12-15'), nextValuationDate: new Date('2026-12-15'), notes: 'Main studio mixer' },
    { id: 'AST-1002', name: 'Office Laptops', category: 'IT', brand: 'Dell', model: 'Latitude 5430', purchaseDate: '2025-01-10', cost: 320000, accumulated: 64000, netBook: 256000, life: 5, serialNumber: 'LT-002-2025', location: 'Finance Office', condition: 'Excellent', status: 'Active', lastValuationDate: new Date('2026-01-05'), nextValuationDate: new Date('2027-01-05'), notes: 'Staff laptops' },
    { id: 'AST-1003', name: 'Studio Microphones', category: 'Broadcast', brand: 'Shure', model: 'SM7B', purchaseDate: '2023-09-12', cost: 78000, accumulated: 52000, netBook: 26000, life: 7, serialNumber: 'MIC-003-2023', location: 'Studio 2', condition: 'Good', status: 'Active', notes: 'Broadcast mics' },
    { id: 'AST-1004', name: 'Station Utility Van', category: 'Vehicles', brand: 'Toyota', model: 'HiAce', purchaseDate: '2022-05-25', cost: 360000, accumulated: 225000, netBook: 135000, life: 8, serialNumber: 'VEH-004-2022', location: 'Parking Bay', condition: 'Fair', status: 'Active', notes: 'Field support van' },
    { id: 'AST-1005', name: 'Studio Chairs', category: 'Furniture', brand: 'ErgoSeat', model: 'E400', purchaseDate: '2024-11-05', cost: 45000, accumulated: 9000, netBook: 36000, life: 5, location: 'Studio 1', condition: 'Good', status: 'Active', notes: 'Workstation chairs' },
    { id: 'AST-1006', name: 'Router & Switch', category: 'IT', brand: 'Cisco', model: 'RV340', purchaseDate: '2025-03-01', cost: 26000, accumulated: 5200, netBook: 20800, life: 5, serialNumber: 'IT-006-2025', location: 'Server Room', condition: 'Excellent', status: 'Active', notes: 'Network equipment' },
    { id: 'AST-1007', name: 'LED Studio Lights', category: 'Studio Equipment', brand: 'Philips', model: 'Hue 5000', purchaseDate: '2024-08-15', cost: 31000, accumulated: 9300, netBook: 21700, life: 5, serialNumber: 'LT-007-2024', location: 'Studio 1', condition: 'Good', status: 'Active', notes: 'Lighting package' },
    { id: 'AST-1008', name: 'Backup Generator', category: 'Other', brand: 'Honda', model: 'EG6500', purchaseDate: '2023-07-20', cost: 54000, accumulated: 32400, netBook: 21600, life: 6, serialNumber: 'GEN-008-2023', location: 'Generator Shed', condition: 'Fair', status: 'Active', notes: 'Emergency backup generator' },
    { id: 'AST-1009', name: 'Executive Desk', category: 'Furniture', brand: 'OakLine', model: 'EX-90', purchaseDate: '2022-02-10', cost: 22000, accumulated: 15400, netBook: 6600, life: 5, location: 'Manager Office', condition: 'Good', status: 'Active', notes: 'Office furniture' },
    { id: 'AST-1010', name: 'Broadcast Headsets', category: 'Broadcast', brand: 'Sennheiser', model: 'HD 280 Pro', purchaseDate: '2025-02-18', cost: 18000, accumulated: 3600, netBook: 14400, life: 5, serialNumber: 'HS-010-2025', location: 'Studio 3', condition: 'Excellent', status: 'Active', notes: 'Headset set' }
  ];

  const advertiserDocs = [
    { id: 'ADV-1001', name: 'ABC Advertising Corp', industry: 'Retail', status: 'Active', contactEmail: 'contact@abcadvertising.co.ls', contactPhone: '+26612345678', campaigns: 4, billed: 235000, notes: 'Advertising agency with regular media buys' },
    { id: 'ADV-1002', name: 'Lesotho Broadcasting Network', industry: 'Media', status: 'Active', contactEmail: 'offers@lbn.co.ls', contactPhone: '+26623456789', campaigns: 6, billed: 340000, notes: 'Large broadcast partner' },
    { id: 'ADV-1003', name: 'TechStart Solutions', industry: 'Technology', status: 'Pending', contactEmail: 'sales@techstart.co.ls', contactPhone: '+26634567890', campaigns: 2, billed: 65000, notes: 'Startup marketing packages' },
    { id: 'ADV-1004', name: 'National Tourism Board', industry: 'Government', status: 'Active', contactEmail: 'tourism@lesotho.gov.ls', contactPhone: '+26698765432', campaigns: 3, billed: 180000, notes: 'Tourism promotion sponsorship' },
    { id: 'ADV-1005', name: 'Retail Merchants Association', industry: 'Retail', status: 'Prospective', contactEmail: 'info@rma.co.ls', contactPhone: '+26687654321', campaigns: 1, billed: 28500, notes: 'New promotional campaign' },
    { id: 'ADV-1006', name: 'Healthcare Group', industry: 'Healthcare', status: 'Active', contactEmail: 'health@hgroup.co.ls', contactPhone: '+26676543210', campaigns: 4, billed: 285000, notes: 'Healthcare awareness sponsorships' },
    { id: 'ADV-1007', name: 'University Media', industry: 'Education', status: 'Active', contactEmail: 'media@university.ls', contactPhone: '+26665432109', campaigns: 3, billed: 145000, notes: 'Education outreach work' },
    { id: 'ADV-1008', name: 'Green Energy Initiative', industry: 'Energy', status: 'Active', contactEmail: 'green@initiative.ls', contactPhone: '+26654321098', campaigns: 2, billed: 82000, notes: 'Sustainability campaign sponsor' },
    { id: 'ADV-1009', name: 'City Council Events', industry: 'Events', status: 'Completed', contactEmail: 'events@citycouncil.ls', contactPhone: '+26643210987', campaigns: 5, billed: 410000, notes: 'Annual event sponsorships' },
    { id: 'ADV-1010', name: 'Education Partners', industry: 'Education', status: 'Active', contactEmail: 'partners@education.ls', contactPhone: '+26632109876', campaigns: 2, billed: 87000, notes: 'Education campaign clients' }
  ];

  const bookingDocs = [
    { id: 'BOOK-1001', client: 'ABC Advertising Corp', campaign: 'Holiday Promo', spots: 10, due: '2026-05-20', status: 'Confirmed', type: 'Radio Spots', notes: 'Morning drive-time buy' },
    { id: 'BOOK-1002', client: 'National Tourism Board', campaign: 'Summer Campaign', spots: 12, due: '2026-05-25', status: 'Delivered', type: 'Radio Spots', notes: 'Tourist season advertising' },
    { id: 'BOOK-1003', client: 'TechStart Solutions', campaign: 'Startup Launch', spots: 8, due: '2026-05-30', status: 'Pending', type: 'Radio Spots', notes: 'Tech product launch' },
    { id: 'BOOK-1004', client: 'Healthcare Group', campaign: 'Health Week', spots: 15, due: '2026-04-30', status: 'Delivered', type: 'Radio Spots', notes: 'Health awareness broadcast' },
    { id: 'BOOK-1005', client: 'Retail Merchants Association', campaign: 'Weekend Sale', spots: 7, due: '2026-05-21', status: 'Planned', type: 'Radio Spots', notes: 'Weekend sale campaign' },
    { id: 'BOOK-1006', client: 'University Media', campaign: 'Enrollment Drive', spots: 9, due: '2026-03-31', status: 'Delivered', type: 'Radio Spots', notes: 'Enrollment period ads' },
    { id: 'BOOK-1007', client: 'Green Energy Initiative', campaign: 'Eco Message', spots: 13, due: '2026-04-10', status: 'Confirmed', type: 'Radio Spots', notes: 'Green energy awareness' },
    { id: 'BOOK-1008', client: 'City Council Events', campaign: 'Festival Promo', spots: 20, due: '2026-05-01', status: 'Delivered', type: 'Radio Spots', notes: 'City festival advertising' },
    { id: 'BOOK-1009', client: 'Education Partners', campaign: 'Scholarship Drive', spots: 11, due: '2026-05-06', status: 'Confirmed', type: 'Radio Spots', notes: 'Scholarship announcement' },
    { id: 'BOOK-1010', client: 'Lesotho Broadcasting Network', campaign: 'Partner Broadcast', spots: 14, due: '2026-04-22', status: 'Cancelled', type: 'Radio Spots', notes: 'Partner station slots' }
  ];

  const adContractDocs = [
    { advertiser: 'ABC Advertising Corp', amount: 135000, status: 'APPROVED', startDate: new Date('2026-05-01'), endDate: new Date('2026-07-30') },
    { advertiser: 'Lesotho Broadcasting Network', amount: 210000, status: 'PENDING', startDate: new Date('2026-06-01'), endDate: new Date('2026-08-31') },
    { advertiser: 'TechStart Solutions', amount: 78000, status: 'APPROVED', startDate: new Date('2026-04-15'), endDate: new Date('2026-06-15') },
    { advertiser: 'National Tourism Board', amount: 160000, status: 'APPROVED', startDate: new Date('2026-03-10'), endDate: new Date('2026-09-10') },
    { advertiser: 'Healthcare Group', amount: 195000, status: 'PENDING', startDate: new Date('2026-05-20'), endDate: new Date('2026-11-20') }
  ];

  const airtimeDocs = [
    { client: 'Retail Merchants Association', duration: 30, status: 'PENDING', scheduledDate: new Date('2026-05-22') },
    { client: 'City Council Events', duration: 60, status: 'APPROVED', scheduledDate: new Date('2026-05-05') },
    { client: 'University Media', duration: 45, status: 'APPROVED', scheduledDate: new Date('2026-04-12') },
    { client: 'Green Energy Initiative', duration: 50, status: 'PENDING', scheduledDate: new Date('2026-05-18') },
    { client: 'Healthcare Group', duration: 80, status: 'REJECTED', scheduledDate: new Date('2026-05-01') }
  ];

  const invoiceDocs = [
    { id: 'INV-2026-001', client: 'ABC Advertising Corp', clientEmail: 'client1@abcadvertising.co.ls', clientPhone: '+26612345678', issue: '2026-05-14', due: '2026-06-14', amount: 45000, paidAmount: 0, status: 'PENDING', items: [{ description: 'Digital campaign setup', quantity: 1, rate: 45000, amount: 45000 }], payments: [], createdBy: userByEmail['teboho.finance@example.com']._id },
    { id: 'INV-2026-002', client: 'Lesotho Broadcasting Network', clientEmail: 'sales@lbn.co.ls', clientPhone: '+26623456789', issue: '2026-05-12', due: '2026-06-12', amount: 75500, paidAmount: 75500, status: 'PAID', items: [{ description: 'Monthly airtime package', quantity: 1, rate: 75500, amount: 75500 }], payments: [{ amount: 75500, method: 'BANK_TRANSFER', reference: 'BT-2026-002', date: new Date('2026-05-12'), notes: 'Paid in full', recordedBy: userByEmail['teboho.finance@example.com']._id }], createdBy: userByEmail['teboho.finance@example.com']._id },
    { id: 'INV-2026-003', client: 'TechStart Solutions', clientEmail: 'hello@techstart.co.ls', clientPhone: '+26634567890', issue: '2026-05-10', due: '2026-06-10', amount: 32000, paidAmount: 0, status: 'SENT', items: [{ description: 'Social media sponsorship', quantity: 1, rate: 32000, amount: 32000 }], payments: [], createdBy: userByEmail['pula.sales@example.com']._id },
    { id: 'INV-2026-004', client: 'National Tourism Board', clientEmail: 'info@lesotho.gov.ls', clientPhone: '+26698765432', issue: '2026-05-08', due: '2026-06-08', amount: 120000, paidAmount: 120000, status: 'PAID', items: [{ description: 'TV & radio airtime package', quantity: 1, rate: 120000, amount: 120000 }], payments: [{ amount: 120000, method: 'CASH', reference: 'CASH-2026-004', date: new Date('2026-05-08'), notes: 'Paid on receipt', recordedBy: userByEmail['teboho.finance@example.com']._id }], createdBy: userByEmail['lesedi.finance@example.com']._id },
    { id: 'INV-2026-005', client: 'City Council Events', clientEmail: 'events@citycouncil.ls', clientPhone: '+26643210987', issue: '2026-04-30', due: '2026-05-30', amount: 89000, paidAmount: 0, status: 'PENDING', items: [{ description: 'Festival sponsorship deposit', quantity: 1, rate: 89000, amount: 89000 }], payments: [], createdBy: userByEmail['pula.sales@example.com']._id },
    { id: 'INV-2026-006', client: 'Education Partners', clientEmail: 'partners@education.ls', clientPhone: '+26632109876', issue: '2026-04-20', due: '2026-05-20', amount: 34000, paidAmount: 0, status: 'SENT', items: [{ description: 'Education marketing bundle', quantity: 1, rate: 34000, amount: 34000 }], payments: [], createdBy: userByEmail['teboho.finance@example.com']._id },
    { id: 'INV-2026-007', client: 'Healthcare Group', clientEmail: 'health@hgroup.co.ls', clientPhone: '+26676543210', issue: '2026-03-15', due: '2026-04-15', amount: 105000, paidAmount: 105000, status: 'PAID', items: [{ description: 'Health awareness campaign', quantity: 1, rate: 105000, amount: 105000 }], payments: [{ amount: 105000, method: 'CHEQUE', reference: 'CHQ-2026-007', date: new Date('2026-03-15'), notes: 'Paid by cheque', recordedBy: userByEmail['teboho.finance@example.com']._id }], createdBy: userByEmail['lesedi.finance@example.com']._id },
    { id: 'INV-2026-008', client: 'University Media', clientEmail: 'media@university.ls', clientPhone: '+26665432109', issue: '2026-02-28', due: '2026-03-30', amount: 52000, paidAmount: 52000, status: 'PAID', items: [{ description: 'Student recruitment radio ads', quantity: 1, rate: 52000, amount: 52000 }], payments: [{ amount: 52000, method: 'MOMO', reference: 'MOMO-2026-008', date: new Date('2026-02-28'), notes: 'Paid by mobile money', recordedBy: userByEmail['teboho.finance@example.com']._id }], createdBy: userByEmail['pula.sales@example.com']._id },
    { id: 'INV-2026-009', client: 'Green Energy Initiative', clientEmail: 'green@initiative.ls', clientPhone: '+26654321098', issue: '2026-01-18', due: '2026-02-18', amount: 41000, paidAmount: 41000, status: 'PAID', items: [{ description: 'Sustainability advert', quantity: 1, rate: 41000, amount: 41000 }], payments: [{ amount: 41000, method: 'BANK_TRANSFER', reference: 'BT-2026-009', date: new Date('2026-01-18'), notes: 'Paid in full', recordedBy: userByEmail['teboho.finance@example.com']._id }], createdBy: userByEmail['teboho.finance@example.com']._id },
    { id: 'INV-2026-010', client: 'Retail Merchants Association', clientEmail: 'retail@rma.co.ls', clientPhone: '+26687654321', issue: '2026-05-14', due: '2026-06-14', amount: 28500, paidAmount: 0, status: 'SENT', items: [{ description: 'Weekend promo ads', quantity: 1, rate: 28500, amount: 28500 }], payments: [], createdBy: userByEmail['pula.sales@example.com']._id }
  ];

  await Promise.all([
    Revenue.insertMany(revenueDocs),
    Expense.insertMany(expenseDocs),
    Payroll.insertMany(payrollDocs),
    BankReconciliation.insertMany(bankDocs),
    Tax.insertMany(taxDocs),
    Regulation.insertMany(sampleRegulations),
    Asset.insertMany(assetDocs),
    Advertiser.insertMany(advertiserDocs),
    Booking.insertMany(bookingDocs),
    AdContract.insertMany(adContractDocs),
    Airtime.insertMany(airtimeDocs),
    Invoice.insertMany(invoiceDocs)
  ]);

  console.log('✅ Seed data inserted successfully');
  await mongoose.disconnect();
};

seed().catch((error) => {
  console.error('Seed failed:', error);
  mongoose.disconnect();
  process.exit(1);
});
