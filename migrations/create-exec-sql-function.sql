-- Create function to execute SQL statements with admin privileges
CREATE OR REPLACE FUNCTION exec_sql_statement(statement text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE statement;
END;
$$;