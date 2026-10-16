-- ============================================================
-- Sign contracts inside the portal
-- ============================================================
--
-- Besides the Documenso e-mail flow, the admin can send an unsigned PDF to be
-- signed in the portal: the workspace owner reviews it, types their full name
-- and confirms. The server then stamps a certificate page onto the PDF (who,
-- when, from where, and the SHA-256 of the original) and files it as the signed
-- copy. The owner can't write to the contracts table directly, so the final
-- status change goes through complete_portal_signature(), which checks that
-- the caller is that workspace's owner and the contract is waiting for them.

alter table contracts
  add column unsigned_pdf_storage_path text,
  add column signing_method text check (signing_method in ('portal', 'documenso', 'uploaded')),
  add column signer_name text,
  add column signer_user_id uuid references profiles (id),
  add column signed_at timestamptz,
  add column signature_hash text,
  add column signature_meta jsonb;

-- Existing rows keep working: infer how they were handled.
update contracts set signing_method = 'documenso' where documenso_document_id is not null and signing_method is null;
update contracts set signing_method = 'uploaded' where signing_method is null and signed_pdf_storage_path is not null;

create or replace function complete_portal_signature(
  p_contract uuid,
  p_signer_name text,
  p_hash text,
  p_signed_path text,
  p_meta jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_status text;
  v_method text;
begin
  select org_id, signing_status, signing_method
    into v_org, v_status, v_method
  from contracts where id = p_contract;

  if v_org is null then
    raise exception 'Contract not found';
  end if;
  if my_org_role(v_org) is distinct from 'owner' then
    raise exception 'Only the workspace owner can sign this contract';
  end if;
  if v_status <> 'sent' or v_method is distinct from 'portal' then
    raise exception 'This contract is not waiting for a signature';
  end if;
  if length(btrim(p_signer_name)) < 3 then
    raise exception 'Type your full name to sign';
  end if;

  update contracts
  set signing_status = 'signed',
      signer_name = btrim(p_signer_name),
      signer_user_id = auth.uid(),
      signed_at = now(),
      signature_hash = p_hash,
      signature_meta = p_meta,
      signed_pdf_storage_path = p_signed_path
  where id = p_contract;
end;
$$;

revoke all on function complete_portal_signature(uuid, text, text, text, jsonb) from public, anon;
grant execute on function complete_portal_signature(uuid, text, text, text, jsonb) to authenticated;
