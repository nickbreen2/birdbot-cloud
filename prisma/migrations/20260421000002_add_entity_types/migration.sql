-- Add entity types required by P2 extraction pipeline.
-- The P1 enum had: person, project, tool, concept, decision, event, other
-- Missing: file, task, technology, goal (goal is critical for P2-04 confidence gate)
ALTER TYPE "EntityType" ADD VALUE IF NOT EXISTS 'file';
ALTER TYPE "EntityType" ADD VALUE IF NOT EXISTS 'task';
ALTER TYPE "EntityType" ADD VALUE IF NOT EXISTS 'technology';
ALTER TYPE "EntityType" ADD VALUE IF NOT EXISTS 'goal';
