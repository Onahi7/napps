INSERT INTO \
Config\ (id, key, value, description, \createdAt\, \updatedAt\) VALUES ('reg-amount', 'registrationAmount', '20000', 'Conference registration fee', NOW(), NOW()) ON CONFLICT (key) DO UPDATE SET value = '20000', \updatedAt\ = NOW();
