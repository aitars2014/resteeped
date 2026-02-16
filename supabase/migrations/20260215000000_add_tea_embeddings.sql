-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to teas table
ALTER TABLE teas ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create index for similarity search
CREATE INDEX IF NOT EXISTS teas_embedding_idx ON teas USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create match_teas function for similarity search
CREATE OR REPLACE FUNCTION match_teas(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  name text,
  brand_name text,
  tea_type text,
  description text,
  flavor_notes text[],
  origin text,
  image_url text,
  avg_rating decimal,
  rating_count integer,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    teas.id, teas.name, teas.brand_name, teas.tea_type, teas.description,
    teas.flavor_notes, teas.origin, teas.image_url, teas.avg_rating, teas.rating_count,
    1 - (teas.embedding <=> query_embedding) as similarity
  FROM teas
  WHERE 1 - (teas.embedding <=> query_embedding) > match_threshold
  ORDER BY teas.embedding <=> query_embedding
  LIMIT match_count;
$$;
