-- Enable RLS on stories table
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- Create policies for stories table
CREATE POLICY "Service role can bypass RLS" ON stories
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Users can read their own stories" ON stories
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stories" ON stories
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stories" ON stories
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stories" ON stories
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Enable RLS on volumes table
ALTER TABLE volumes ENABLE ROW LEVEL SECURITY;

-- Create policies for volumes table
CREATE POLICY "Service role can bypass RLS" ON volumes
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Users can read volumes of their stories" ON volumes
    FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM stories
        WHERE stories.id = volumes.story_id
        AND stories.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert volumes for their stories" ON volumes
    FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM stories
        WHERE stories.id = volumes.story_id
        AND stories.user_id = auth.uid()
    ));

CREATE POLICY "Users can update volumes of their stories" ON volumes
    FOR UPDATE
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM stories
        WHERE stories.id = volumes.story_id
        AND stories.user_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM stories
        WHERE stories.id = volumes.story_id
        AND stories.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete volumes of their stories" ON volumes
    FOR DELETE
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM stories
        WHERE stories.id = volumes.story_id
        AND stories.user_id = auth.uid()
    ));

-- Enable RLS on chapters table
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;

-- Create policies for chapters table
CREATE POLICY "Service role can bypass RLS" ON chapters
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Users can read chapters of their stories" ON chapters
    FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM volumes
        JOIN stories ON stories.id = volumes.story_id
        WHERE volumes.id = chapters.volume_id
        AND stories.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert chapters for their stories" ON chapters
    FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM volumes
        JOIN stories ON stories.id = volumes.story_id
        WHERE volumes.id = chapters.volume_id
        AND stories.user_id = auth.uid()
    ));

CREATE POLICY "Users can update chapters of their stories" ON chapters
    FOR UPDATE
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM volumes
        JOIN stories ON stories.id = volumes.story_id
        WHERE volumes.id = chapters.volume_id
        AND stories.user_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM volumes
        JOIN stories ON stories.id = volumes.story_id
        WHERE volumes.id = chapters.volume_id
        AND stories.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete chapters of their stories" ON chapters
    FOR DELETE
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM volumes
        JOIN stories ON stories.id = volumes.story_id
        WHERE volumes.id = chapters.volume_id
        AND stories.user_id = auth.uid()
    )); 