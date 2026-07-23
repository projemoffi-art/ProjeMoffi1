const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: users } = await supabase.auth.admin.listUsers();
  const { data: profiles } = await supabase.from("profiles").select("id, role, business_name, business_approved");
  const { data: appointments } = await supabase.from("appointments").select("*");
  
  console.log("--- USERS & PROFILES ---");
  const userMap = {};
  users.users.forEach(u => {
      const p = profiles.find(pr => pr.id === u.id) || {};
      userMap[u.id] = { email: u.email, role: p.role, business_name: p.business_name, approved: p.business_approved };
      console.log(`[${u.email}] -> Role: ${p.role}, Approved: ${p.business_approved}, BizName: ${p.business_name}, ID: ${u.id}`);
  });

  console.log("\n--- APPOINTMENTS ---");
  if (!appointments || appointments.length === 0) {
      console.log("No appointments found.");
  } else {
      appointments.forEach(a => {
          const clinicEmail = userMap[a.clinic_id]?.email || "UNKNOWN CLINIC";
          const patientEmail = userMap[a.user_id]?.email || "UNKNOWN PATIENT";
          console.log(`Appt ID ${a.id}: Patient [${patientEmail}] booked at Clinic [${clinicEmail}], Date: ${a.appointment_date}, Status: ${a.status}`);
      });
  }
}
run();
