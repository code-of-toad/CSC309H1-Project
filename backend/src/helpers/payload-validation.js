function checkExtraFields(expectedFields, reqBody) {
    const receivedFields = Object.keys(reqBody);
    return receivedFields.filter((f) => !expectedFields.includes(f));
}

function isString(field) {
    return typeof field === 'string';
}

function isBool(field) {
    return typeof field === 'boolean';
}

function isNum(field) {
    return typeof field === 'number';
}

function isValidName(name) {
    return 1 <= name.length && name.length <= 50;
}

function isValidEmail(email) {
    const arr = email.split('@');
    return (
        arr.length === 2 &&
        ['mail.utoronto.ca', 'utoronto.ca', 'alumni.utoronto.ca', 'toronto.edu'].includes(arr[1]) &&
        !!arr[0]
    );
    // return arr.length === 2 && arr[1] === 'mail.utoronto.ca' && !!arr[0];
}

function isValidPassword(password) {
    //   (?=.*[a-z])  ->  at least one lowercase letter
    //   (?=.*[A-Z])  ->  at least one uppercase letter
    //   (?=.*\d)     ->  at least one number
    //   (?=.*[^w\s]) ->  at least one special character
    //   .{8,20}      ->  total length between 8 and 20 characters
    //
    // Examples:
    // ---------
    // console.log(validatePassword('Abcdef1!'))  ->  true
    // console.log(validatePassword('abcdef1!'))  ->  false
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,20}$/;
    return regex.test(password);
}

function isValidBirthday(birthday) {
    // Check format: Exactly 4 digits, dash, 2 digits, dash, 2 digits
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthday)) return false;

    const [year, month, day] = birthday.split('-').map(Number);
    const date = new Date(birthday);

    // Check that Date object is valid and matches components exactly
    // I.e., Check for a real, valid calendar date
    return (
        date instanceof Date &&
        !isNaN(date) &&
        date.getUTCFullYear() === year &&
        date.getUTCMonth() + 1 === month &&
        date.getUTCDate() === day
    );
}

function isValidUtoridLength(utorid) {
    return utorid.length === 7 || utorid.length === 8;
}

function isValidDollarAmount(amount) {
    // `Number.isInteger(amount * 100)` checks that `amount` has at most two decimal places
    // return (
    //     typeof amount === 'number' &&
    //     isFinite(amount) &&
    //     Math.floor(amount * 100) === amount * 100
    // );
    if (typeof amount !== 'number' || !Number.isFinite(amount)) return false;
    const cents = Math.round(amount * 100);
    return Math.abs(amount - cents / 100) < 1e-9; // allows up to 2 decimals only
}

function isQueryValidBool(query) {
    return query === 'true' || query === 'false';
}

function isQueryValidInt(query) {
    return /^\d+$/.test(query); // query must be composed only of integers
}

module.exports = {
    checkExtraFields,
    isString,
    isBool,
    isValidName,
    isValidEmail,
    isValidPassword,
    isValidBirthday,
    isValidUtoridLength,
    isValidDollarAmount,
    isQueryValidBool,
    isQueryValidInt,
};
