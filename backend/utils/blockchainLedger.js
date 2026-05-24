const crypto = require('crypto');

const GENESIS_HASH = '0'.repeat(64);
const ALGORITHM = 'SHA-256';
const PAYLOAD_VERSION = 'payment-ledger-v1';

const normalizeValue = (value) => {
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value.toString === 'function' && value._bsontype === 'ObjectID') {
    return value.toString();
  }
  if (Array.isArray(value)) return value.map(normalizeValue);
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((normalized, key) => {
        if (value[key] !== undefined) normalized[key] = normalizeValue(value[key]);
        return normalized;
      }, {});
  }
  return value;
};

const hashPayload = (payload) => {
  const canonicalPayload = JSON.stringify(normalizeValue(payload));
  return crypto.createHash('sha256').update(canonicalPayload).digest('hex');
};

const buildPaymentPayload = ({ invoice, payment, proof }) => ({
  payloadVersion: PAYLOAD_VERSION,
  invoice: {
    id: invoice.id,
    client: invoice.client,
    amount: Number(invoice.amount),
  },
  payment: {
    amount: Number(payment.amount),
    method: payment.method,
    reference: payment.reference || '',
    date: payment.date,
    notes: payment.notes || '',
    recordedBy: payment.recordedBy ? payment.recordedBy.toString() : '',
  },
  block: {
    blockIndex: proof.blockIndex,
    previousHash: proof.previousHash,
    blockTimestamp: proof.blockTimestamp,
  },
});

const getLatestPaymentHash = (invoice) => {
  const payments = Array.isArray(invoice.payments) ? invoice.payments : [];
  const latestAnchoredPayment = [...payments].reverse().find((payment) => payment.blockchainProof?.blockHash);
  return latestAnchoredPayment?.blockchainProof?.blockHash || invoice.blockchainLedgerTip || GENESIS_HASH;
};

const createPaymentProof = ({ invoice, payment }) => {
  const proof = {
    algorithm: ALGORITHM,
    payloadVersion: PAYLOAD_VERSION,
    blockIndex: Array.isArray(invoice.payments) ? invoice.payments.length : 0,
    previousHash: getLatestPaymentHash(invoice),
    blockTimestamp: new Date(),
  };

  proof.blockHash = hashPayload(buildPaymentPayload({ invoice, payment, proof }));
  return proof;
};

const verifyPaymentLedger = (invoice) => {
  let previousHash = GENESIS_HASH;

  const payments = Array.isArray(invoice.payments) ? invoice.payments : [];
  const paymentsChecked = payments.map((payment, index) => {
    const proof = payment.blockchainProof;

    if (!proof?.blockHash) {
      return {
        index,
        valid: false,
        reason: 'Missing blockchain proof',
      };
    }

    const expectedHash = hashPayload(buildPaymentPayload({ invoice, payment, proof }));
    const valid = proof.previousHash === previousHash && proof.blockHash === expectedHash;

    previousHash = proof.blockHash;

    return {
      index,
      valid,
      blockHash: proof.blockHash,
      previousHash: proof.previousHash,
      reason: valid ? 'Verified' : 'Payment data or chain link was modified',
    };
  });

  return {
    valid: paymentsChecked.every((payment) => payment.valid),
    paymentCount: paymentsChecked.length,
    ledgerTip: previousHash,
    payments: paymentsChecked,
  };
};

module.exports = {
  GENESIS_HASH,
  createPaymentProof,
  verifyPaymentLedger,
};
