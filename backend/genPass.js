import bcrypt from "bcryptjs";

const generate = async () => {
  const plain = "Controlia123"; // ← tu nueva password
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(plain, salt);

  console.log("Hash listo:");
  console.log(hash);
};

generate();
