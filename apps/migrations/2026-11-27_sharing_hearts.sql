-- sharing_discussions 적용 후 실행. 기존 캐릭터 반응은 사용자당 하트 하나로 유지한다.
ALTER TABLE sharing_reactions DROP CONSTRAINT IF EXISTS sharing_reactions_reaction_key_check;
UPDATE sharing_reactions SET reaction_key = 'heart' WHERE reaction_key <> 'heart';
ALTER TABLE sharing_reactions ADD CONSTRAINT sharing_reactions_reaction_key_check CHECK (reaction_key = 'heart');
