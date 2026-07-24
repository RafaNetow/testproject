-- Lets clients collaborate on the board and log decisions, rather than only
-- ever viewing what Axel puts there. Board cards: any accepted member of the
-- project's org can create/move/edit cards. Decisions: restricted to the
-- 'owner' role (the client-side point of contact), matching the existing
-- pattern where only owners can invite teammates. Decision participants:
-- any accepted member can be recorded as a participant on a decision.

drop policy if exists "members create board_cards on own project" on board_cards;
create policy "members create board_cards on own project" on board_cards
  for insert with check (project_org_id(project_id) in (select my_org_ids()));

drop policy if exists "members update board_cards on own project" on board_cards;
create policy "members update board_cards on own project" on board_cards
  for update using (project_org_id(project_id) in (select my_org_ids()));

drop policy if exists "owners log decisions on own project" on decisions;
create policy "owners log decisions on own project" on decisions
  for insert with check (my_org_role(project_org_id(project_id)) = 'owner');

drop policy if exists "members add decision_participants on own project" on decision_participants;
create policy "members add decision_participants on own project" on decision_participants
  for insert with check (
    project_org_id((select project_id from decisions where id = decision_id)) in (select my_org_ids())
  );
