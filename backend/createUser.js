import dotenv from "dotenv";
import connectDB from "./src/config/db_temp.js";
import User from "./src/models/User.js";

dotenv.config();

await connectDB();

try {
  // Borramos usuarios anteriores (opcional)
  await User.deleteMany({ email: "jonathan@controlia.com" });

  // Creamos uno nuevo (bcrypt se encarga del hash automáticamente)
  const user = await User.create({
    name: "Jonathan Ortega",
    email: "jonathan@controlia.com",
    password: "123456",
    role: "admin",
  });

  // console.log("✅ Usuario creado correctamente:");
  // console.log(user);
  process.exit();
} catch (error) {
  console.error("❌ Error creando usuario:", error);
  process.exit(1);
}
