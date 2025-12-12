function formatTransactionManager(trx) {
    const base = {
        id: trx.id,
        utorid: trx.utorid,
        type: trx.type,
        promotionIds: trx.promotions.map((p) => p.id),
        remark: trx.remark,
        createdBy: trx.createdBy,
    };
    // Conditionally attach fields depending on transaction type
    if (trx.type === 'purchase') {
        base.suspicious = trx.suspicious;
        base.amount = trx.amount;
        base.spent = trx.spent;
    }
    if (trx.type === 'redemption') {
        base.suspicious = trx.suspicious;
        base.relatedId = trx.relatedId;
        base.redeemed = trx.redeemed;
        base.amount = trx.amount;
    }
    if (trx.type === 'adjustment') {
        base.suspicious = trx.suspicious;
        base.amount = trx.amount;
        base.relatedId = trx.relatedId;
    }
    // COME BACK TO THIS ONEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
    if (trx.type === 'transfer') {
        base.suspicious = trx.suspicious;
        base.amount = trx.amount;
        base.relatedId = trx.relatedId;
    }
    // COME BACK TO THIS ONEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
    if (trx.type === 'event') {
        base.suspicious = trx.suspicious;
        base.relatedId = trx.relatedId;
    }
    return base;
}

function formatTransactionRegular(trx) {
    const base = {
        id: trx.id,
        type: trx.type,
        promotionIds: trx.promotions.map((p) => p.id),
        remark: trx.remark,
        createdBy: trx.createdBy,
    };
    // Conditionally attach fields depending on transaction type
    if (trx.type === 'purchase') {
        base.spent = trx.spent;
        base.amount = trx.amount;
    }
    if (trx.type === 'redemption') {
        base.amount = trx.amount;
        base.relatedId = trx.relatedId;
        base.redeemed = trx.redeemed;
    }
    if (trx.type === 'adjustment') {
        base.amount = trx.amount;
        base.relatedId = trx.relatedId;
    }
    // COME BACK TO THIS ONEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
    if (trx.type === 'transfer') {
        base.amount = trx.amount;
        base.relatedId = trx.relatedId;
    }
    // COME BACK TO THIS ONEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
    if (trx.type === 'event') {
        base.relatedId = trx.relatedId;
    }
    return base;
}

module.exports = {
    formatTransactionManager,
    formatTransactionRegular,
};
