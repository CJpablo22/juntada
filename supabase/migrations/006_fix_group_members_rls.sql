-- Fix: la policy anterior era auto-referencial y fallaba al LEER membresías.
-- Resultado: grupos se creaban pero al recargar / al sincronizar desaparecían.

drop policy if exists "members_select_same_group" on public.group_members;

-- Podés ver tu propia fila siempre; y las de compañeros del mismo grupo
create policy "members_select_own_or_peers"
  on public.group_members for select to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1
      from public.group_members mine
      where mine.group_id = group_members.group_id
        and mine.user_id = auth.uid()
    )
  );

-- Asegurar que el creador siempre pueda verse a sí mismo al insertar
drop policy if exists "members_insert_self_or_creator" on public.group_members;
create policy "members_insert_self"
  on public.group_members for insert to authenticated
  with check (user_id = auth.uid());
