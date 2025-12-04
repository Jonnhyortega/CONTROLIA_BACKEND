import bcrypt from "bcryptjs";

async function generate() {
  const newPassword = "1234";
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(newPassword, salt);

  console.log("Nuevo hash generado:");
  console.log(hash);
}
generate();
