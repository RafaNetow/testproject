-- Single-level reply threading on board card comments.
alter table board_card_comments
  add column parent_comment_id uuid references board_card_comments (id) on delete cascade;
create index board_card_comments_parent_idx on board_card_comments (parent_comment_id);
