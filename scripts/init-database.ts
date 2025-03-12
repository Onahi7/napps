import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
import fs from "fs"
import path from "path"

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function initDatabase() {
  console.log("Initializing database...")

  // Read SQL file
  const sqlFilePath = path.join(process.cwd(), "supabase-setup.sql")
  const sqlContent = fs.readFileSync(sqlFilePath, "utf8")

  // Execute SQL
  const { error } = await supabase.rpc("exec_sql", { sql: sqlContent })

  if (error) {
    console.error("Error executing SQL:", error)
    return
  }

  console.log("Database schema initialized successfully")

  // Create admin user if it doesn't exist
  const adminEmail = "admin@napps.org"
  const adminPassword = "admin123" // This should be changed in production

  // Check if admin exists
  const { data: existingUser } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", adminEmail)
    .eq("role", "admin")
    .single()

  if (!existingUser) {
    // Create admin user in auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
    })

    if (authError) {
      console.error("Error creating admin user:", authError)
      return
    }

    // Update profile to admin role
    if (authUser.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", authUser.user.id)

      if (profileError) {
        console.error("Error updating admin profile:", profileError)
        return
      }
    }

    console.log("Admin user created successfully")
  } else {
    console.log("Admin user already exists")
  }

  // Insert conference configuration
  const configs = [
    {
      key: "registrationAmount",
      value: 15000,
      description: "Registration fee amount in Naira",
    },
    {
      key: "conference_name",
      value: "6th Annual NAPPS North Central Zonal Education Summit 2025",
      description: "Name of the conference",
    },
    {
      key: "conference_date",
      value: "May 21-22, 2025",
      description: "Date of the conference",
    },
    {
      key: "conference_venue",
      value: "Lafia City Hall, Lafia",
      description: "Venue of the conference",
    },
    {
      key: "conference_theme",
      value: "ADVANCING INTEGRATED TECHNOLOGY FOR SUSTAINABLE PRIVATE EDUCATION PRACTICE",
      description: "Theme of the conference",
    },
  ]

  for (const config of configs) {
    const { error: configError } = await supabase.from("config").upsert(config, { onConflict: "key" })

    if (configError) {
      console.error(`Error inserting config ${config.key}:`, configError)
    }
  }

  console.log("Configuration data inserted successfully")
  console.log("Database initialization completed")
}

initDatabase()
  .catch(console.error)
  .finally(() => process.exit(0))

