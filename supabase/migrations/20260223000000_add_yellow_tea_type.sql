-- Add 'yellow' to the tea_type check constraint
ALTER TABLE teas DROP CONSTRAINT teas_tea_type_check;
ALTER TABLE teas ADD CONSTRAINT teas_tea_type_check CHECK (tea_type IN ('black', 'green', 'oolong', 'white', 'puerh', 'herbal', 'yellow'));
