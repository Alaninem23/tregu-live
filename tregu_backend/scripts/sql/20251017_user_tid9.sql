-- Global 9-digit Tregu ID for users
create sequence if not exists tregu.user_tid9_seq
  as bigint
  minvalue 0
  maxvalue 999999999
  start with 100000000
  increment by 1
  no cycle;

alter table tregu.users
  add column if not exists tid9 char(9);

alter table tregu.users
  alter column tid9 set default lpad(nextval('tregu.user_tid9_seq')::text, 9, '0');

update tregu.users
   set tid9 = lpad(nextval('tregu.user_tid9_seq')::text, 9, '0')
 where tid9 is null;

alter table tregu.users
  alter column tid9 set not null;

do $$
begin
  if not exists (
    select 1 from pg_indexes
     where schemaname='tregu' and indexname='uq_users_tid9'
  ) then
    execute 'create unique index uq_users_tid9 on tregu.users(tid9)';
  end if;
end$$;

alter table tregu.users
  add constraint ck_users_tid9_digits
  check (tid9 ~ '^[0-9]{9}$');
