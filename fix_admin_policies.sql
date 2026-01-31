-- Allow Admins to update ANY profile
-- This policy checks if the requesting user has 'admin' role in their profile

CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Ensure public read access exists (usually standard, but good to verify if admin check fails)
-- If you face recursion errors, we might need a SECURITY DEFINER function, but this standard subquery usually works if read access is public.
