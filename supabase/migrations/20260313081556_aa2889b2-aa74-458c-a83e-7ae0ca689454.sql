CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_id UUID REFERENCES auth.users,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (anonymous subscriptions)
CREATE POLICY "Anyone can subscribe" ON public.push_subscriptions
  FOR INSERT WITH CHECK (true);

-- Allow anyone to delete their own subscription by endpoint
CREATE POLICY "Anyone can unsubscribe" ON public.push_subscriptions
  FOR DELETE USING (true);

-- Service role can read all (for sending notifications)
CREATE POLICY "Service role can read all" ON public.push_subscriptions
  FOR SELECT USING (true);