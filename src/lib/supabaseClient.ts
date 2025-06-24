import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nqnnxdcrymlgfekbhsnh.supabase.co'
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xbm54ZGNyeW1sZ2Zla2Joc25oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MTM4OTgsImV4cCI6MjA2NDk4OTg5OH0.4zyZq7SyZhbY1Vb_q9HZhUyvWqDyf5zBAd731bvkC4Y'

export const supabase = createClient(supabaseUrl, supabaseKey)
