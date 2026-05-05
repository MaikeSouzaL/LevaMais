const mongoose = require('mongoose');

class Database {
  constructor() {
    this.connection = null;
  }

  async connect() {
    try {
      const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/leva-mais';
      
      this.connection = await mongoose.connect(mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      console.log('📦 Conectando ao MongoDB...');
      return this.connection;
    } catch (error) {
      console.error('❌ Erro na conexão com MongoDB:', error.message);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.connection) {
        await mongoose.disconnect();
        console.log('🔌 Desconectado do MongoDB');
      }
    } catch (error) {
      console.error('❌ Erro ao desconectar do MongoDB:', error.message);
      throw error;
    }
  }

  getConnection() {
    return this.connection;
  }
}

const database = new Database();

module.exports = database;

