-- Stores the Documenso signing URL returned when a contract is sent for
-- e-signature, so the client can sign directly from the portal instead of
-- only via the email Documenso sends.

alter table contracts add column if not exists documenso_signing_url text;
