-- ============================================================
-- What a file is: analytical technique or document kind
-- ============================================================
--
-- Files are lab data, not anonymous attachments. `technique` holds the
-- analytical technique that produced a file (NMR, FTIR…) or its document
-- kind (Formulation, Process log, Report, Literature). The app detects it
-- from the filename on upload (src/lib/techniques.ts) and the admin can
-- correct it. Existing rows are backfilled with the same rules here.

alter table files add column technique text;

-- Postgres regex: \y is a word boundary; underscores and dots count as
-- separators, like in the TypeScript detector.
with names as (
  select id, regexp_replace(regexp_replace(filename, '\.[A-Za-z0-9]+$', ''), '[_.]+', ' ', 'g') as n
  from files
  where technique is null
)
update files f
set technique = case
  when names.n ~* '\y(1h-?|13c-?)?nmr\y' then 'NMR'
  when names.n ~* '\y(ft-?ir|atr-?ir|infrared)\y' then 'FTIR'
  when names.n ~* '\ydsc\y|\ythermograms?\y' then 'DSC'
  when names.n ~* '\ytga\y|\ythermogravimetr' then 'TGA'
  when names.n ~* '\ygc-?ms\y' then 'GC-MS'
  when names.n ~* '\yhplc\y' then 'HPLC'
  when names.n ~* '\yxrd\y|\yx-?ray\y' then 'XRD'
  when names.n ~* '\ysem\y|\ymicrograph' then 'SEM'
  when names.n ~* '\ydma\y' then 'DMA'
  when names.n ~* '\yrheolog' then 'Rheology'
  when names.n ~* '\yformulations?\y|\yrecipes?\y' then 'Formulation'
  when names.n ~* '\ylogs?\y|\ybatch-?records?\y|\yprocess\y' then 'Process log'
  when names.n ~* '\yreports?\y|\yproposal\y|\yfindings\y|\ydata-?package\y' then 'Report'
  when names.n ~* '\yliterature\y|\ypapers?\y|\yreferences?\y|\ynotes\y' then 'Literature'
end
from names
where f.id = names.id;
