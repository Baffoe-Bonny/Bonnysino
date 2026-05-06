const bcrypt = require('bcrypt');

bcrypt.hash('Bonnysino@123#', 10)
    .then(hash => {
        console.log('Hash for "Bonnysino@123#":');
        console.log(hash);
    })
    .catch(err => console.error('Error:', err));
