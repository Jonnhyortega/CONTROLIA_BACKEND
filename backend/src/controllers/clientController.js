import Client from "../models/Client.js";

export const createClient = async (req, res) => {
  try {
    const ownerId = req.user.createdBy || req.user._id;
    const client = await Client.create({ ...req.body, user: ownerId });
    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getClients = async (req, res) => {
  try {
    const ownerId = req.user.createdBy || req.user._id;
    const clients = await Client.find({ user: ownerId }).sort({ createdAt: -1 });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateClient = async (req, res) => {
  try {
    const ownerId = req.user.createdBy || req.user._id;
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, user: ownerId },
      req.body,
      { new: true }
    );
    if (!client) return res.status(404).json({ message: "Cliente no encontrado" });
    res.json(client);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteClient = async (req, res) => {
  try {
    const ownerId = req.user.createdBy || req.user._id;
    const client = await Client.findOne({ _id: req.params.id, user: ownerId });
    if (!client) return res.status(404).json({ message: "Cliente no encontrado" });
    
    await client.deleteOne();
    res.json({ message: "Cliente eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};