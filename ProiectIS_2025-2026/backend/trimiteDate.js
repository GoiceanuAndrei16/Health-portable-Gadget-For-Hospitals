const axios = require('axios');

const dateSimulate = {
  // INLOCUIESTE CU ID-UL REAL AL PACIENTULUI TAU DIN MONGODB
  id_pacient: "69d7c393cb0cfd869913b80a",
  puls_mediu: 82,
  temperatura_medie: 37.1
};
// Date catre serverul LIVE de pe Render
axios.post('https://beckend-medical.onrender.com/api/senzori', dateSimulate)
  .then(() => console.log("✅ Date trimise cu succes catre serverul LIVE (Render)!"))
  .catch(err => console.log("❌ Eroare:", err.message));