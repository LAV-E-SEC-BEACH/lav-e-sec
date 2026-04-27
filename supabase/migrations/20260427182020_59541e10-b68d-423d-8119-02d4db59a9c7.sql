CREATE POLICY "Admins can delete logs"
ON public.audit_logs
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));