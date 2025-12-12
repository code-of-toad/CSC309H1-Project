function calcPoints(spent, rate = 4) {
    return Math.ceil(spent * rate);
}

function redeemPoints(points) {
    const discountedAmount = points * 0.01;
    return discountedAmount;
}

module.exports = {
    calcPoints,
    redeemPoints,
};
